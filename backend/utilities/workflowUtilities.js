const getModels = require('../services/getModelService');

// Helper function to evaluate a single condition
function evaluateCondition(condition, event) {
    const value = event[condition.field];
    if (value === undefined) return false;

    switch (condition.operator) {
        // String operators
        case 'equals':
            return value === condition.value;
        case 'notEquals':
            return value !== condition.value;
        case 'contains':
            return value.includes(condition.value);
        case 'notContains':
            return !value.includes(condition.value);
        case 'in':
            return condition.value.includes(value);
        case 'notIn':
            return !condition.value.includes(value);

        // Number operators
        case 'greaterThan':
            return value > condition.value;
        case 'lessThan':
            return value < condition.value;
        case 'greaterThanOrEqual':
            return value >= condition.value;
        case 'lessThanOrEqual':
            return value <= condition.value;

        // Boolean operators
        case 'equals':
            return value === condition.value;
        case 'notEquals':
            return value !== condition.value;

        // Date operators
        case 'before':
            return new Date(value) < new Date(condition.value);
        case 'after':
            return new Date(value) > new Date(condition.value);
        case 'between':
            return new Date(value) >= new Date(condition.value[0]) && 
                   new Date(value) <= new Date(condition.value[1]);

        default:
            return false;
    }
}

// Helper function to evaluate a condition group
async function evaluateConditionGroup(group, event) {
    if (!group) return false;

    // Evaluate all conditions in this group
    const conditionResults = group.conditions.map(condition => 
        evaluateCondition(condition, event)
    );

    // Evaluate all nested groups
    const groupResults = await Promise.all(
        group.groups.map(nestedGroup => 
            evaluateConditionGroup(nestedGroup, event)
        )
    );

    // Combine all results based on the logical operator
    const allResults = [...conditionResults, ...groupResults];
    
    if (group.logicalOperator === 'AND') {
        return allResults.every(result => result === true);
    } else { // OR
        return allResults.some(result => result === true);
    }
}

async function getRequiredApprovals(req, event) {
    const { ApprovalFlow } = getModels(req, 'ApprovalFlow');
    const approvalFlow = await ApprovalFlow.findOne();
    
    if (!approvalFlow?.steps) {
        return [];
    }

    const approvals = new Set(); // Use Set to avoid duplicate roles

    for (const step of approvalFlow.steps) {
        // Evaluate all condition groups for this step
        const groupResults = await Promise.all(
            step.conditionGroups.map(group => 
                evaluateConditionGroup(group, event)
            )
        );

        // If any group evaluates to true, add the role to approvals
        if (groupResults.some(result => result === true)) {
            approvals.add(step.role);
        }
    }

    return Array.from(approvals);
}

const createApprovalInstance = async (req, eventId, event) => {
    try{
        const { ApprovalInstance } = getModels(req,'ApprovalInstance');
        const approvalInstance = new ApprovalInstance({ eventId });
        const steps = await getRequiredApprovals(req, event);
        console.log("steps", steps);
        if(!steps || steps.length === 0){
            return null;
        }
        steps.forEach(step => {
            approvalInstance.approvals.push({ role: step });
        });
        await approvalInstance.save();
        return approvalInstance;
    } catch(err){
        console.error(err);
        return null;
    }
}

async function getEventsWithAuthorization(req, filterObj = {}, roleNames = [], startOfRange, endOfRange, populateFields = []) {
    try {
        const { Event } = getModels(req, 'Event');
        let matchStage = {
            start_time: { $gte: startOfRange, $lte: endOfRange },
            ...(filterObj?.type !== "all" ? filterObj : {}), 
            isDeleted: false
        };

        //if no roles, only return "approved" or "not applicable" events
        if (!roleNames || roleNames.length === 0) {
            matchStage["status"] = { $in: ["approved", "not-applicable"] };
            let query = Event.find(matchStage);
            if (populateFields.length > 0) {
                populateFields.forEach(field => query.populate(field));
            }
            return await query.lean();
        }

        //if roles are provided, allow all statuses, but check role-based approval level
        let pipeline = [
            { $match: matchStage },

            {
                $lookup: {
                    from: "approvalInstances",
                    localField: "approvalReference",
                    foreignField: "_id",
                    as: "approvalData"
                }
            },
            { $unwind: { path: "$approvalData", preserveNullAndEmptyArrays: true } },

            {
                $addFields: {
                    currentApprovalStep: {
                        $arrayElemAt: ["$approvalData.approvals", "$approvalData.currentStepIndex"]
                    }
                }
            },

            {
                $match: {
                    $or: [
                        { "status": { $in: ["approved", "not-applicable"] } },

                        {
                            "status": { $in: ["pending", "rejected"] },
                            "currentApprovalStep.role": { $in: roleNames }
                        }
                    ]
                }
            }
        ];

        populateFields.forEach(field => {
            if (field === "hostingId") {
                pipeline.push(
                    //dyanmically lookup the correct collection based on hostingType
                    {
                        $lookup: {
                            from: "users",
                            localField: "hostingId",
                            foreignField: "_id",
                            as: "userHost"
                        }
                    },
                    {
                        $lookup: {
                            from: "orgs",
                            localField: "hostingId",
                            foreignField: "_id",
                            as: "orgHost"
                        }
                    },
                    //overwrite hostingId with the correct document
                    {
                        $addFields: {
                            hostingId: {
                                $cond: {
                                    if: { $eq: ["$hostingType", "User"] },
                                    then: { $arrayElemAt: ["$userHost", 0] },
                                    else: { $arrayElemAt: ["$orgHost", 0] }
                                }
                            }
                        }
                    },
                    { $project: { userHost: 0, orgHost: 0 } }
                );
            } else {
                pipeline.push({
                    $lookup: {
                        from: field.toLowerCase() + "s", // Convert to plural collection name
                        localField: field,
                        foreignField: "_id",
                        as: field
                    }
                });
            }
        });

        pipeline.push({
            $project: {
                approvalData: 0,
                currentApprovalStep: 0
            }
        });

        return await Event.aggregate(pipeline);
    } catch (error) {
        console.error("Error fetching events with authorization:", error);
        return [];
    }
}


module.exports = {
    getRequiredApprovals,
    createApprovalInstance,
    getEventsWithAuthorization
} 
