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

module.exports = {
    getRequiredApprovals,
    createApprovalInstance
} 
