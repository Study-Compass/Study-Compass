const getModels = require('../services/getModelService');

async function getRequiredApprovals(req, event){
    console.log(event);
    const { ApprovalFlow } = getModels(req,'ApprovalFlow');
    const approvalFlow = await ApprovalFlow.findOne();
    if(!approvalFlow.steps){
        return [];
    }
    let approvals = [];
    approvalFlow.steps.forEach(step => {
        console.log("step", step.criteria.keys());    
        step.criteria.keys().forEach(criteria => {
            console.log("criteria", criteria);
            //check if criteria is met
            switch(criteria){
                case 'location':
                    console.log("event.location", event.location);
                    console.log("step.criteria.location", step.criteria.get('location'));
                    if(event.location === step.criteria.get('location')){
                        approvals.push(step.role);
                    }
                case 'minAttendees':
                    console.log("event.expectedAttendance", event.expectedAttendance);
                    console.log("step.criteria.minAttendees", step.criteria.get('minAttendees'));
                    if(event.expectedAttendance >= step.criteria.get('minAttendees')){
                        approvals.push(step.role);
                    }   
                default:
                    return;
            }
        });
    });
    return approvals;
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
