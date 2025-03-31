const express = require('express');
const approvalInstanceSchema = require('../schemas/events/approvalInstance');
const approvalFlowDefinition = require('../schemas/events/approvalFlowDefinition');
const getModels = require('../services/getModelService');
const { verifyToken, verifyTokenOptional, authorizeRoles } = require('../middlewares/verifyToken');


const router = express.Router();

router.get('/get-approval-flow', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    const {ApprovalFlow} = getModels(req, 'ApprovalFlow');
    try{
        //there should only be one approval flow
        const approvalFlow = await ApprovalFlow.findOne();
        if(approvalFlow){
            return res.status(200).json({
                success: true,
                data: approvalFlow
            });
        }
        return res.status(404).json({
            success: false,
            message: 'Approval Flow not found'
        })
    } catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
});

router.post('/create-approval-flow', async (req, res) => {
    const { ApprovalFlow } = getModels(req, 'ApprovalFlow');
    const { Flow } = req.body;
    try{
        const approvalFlow = new ApprovalFlow(Flow);
        await approvalFlow.save();
        res.status(200).json({
            success: true,
            data: approvalFlow
        });
    } catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
});

router.post('/add-approval', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    const { ApprovalFlow, User, } = getModels(req,'ApprovalFlow', 'User');
    const { role, usernames } = req.body
    try{
        const approvalFlow = await ApprovalFlow.findOne();
        if(approvalFlow){
            if(approvalFlow.steps.find(step => step.role === role)){
                return res.status(400).json({
                    success: false,
                    message: 'Role already exists in approval flow'
                });
            }
            approvalFlow.steps.push({role:role});
            await approvalFlow.save();
            const users = await User.find({username: {$in: usernames}});
            users.forEach(user => {
                user.approvalRoles.push(role);
                user.save();
            });
            //add role to users
            return res.status(200).json({
                success: true,
                data: approvalFlow
            });
        }
        return res.status(404).json({
            success: false,
            message: 'Approval Flow not found'
        })
    } catch(error){
        console.log(error)
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
});

router.get('/get-approval-steps', verifyToken, authorizeRoles('admin', 'root'), async (req,res) => {
    const { ApprovalFlow, User, } = getModels(req,'ApprovalFlow', 'User');
    try{
        console.log('GET: /get-approval-steps');
        const user = await User.findById(req.user.userId);
        if(!user) return res.status(403).json({success:false, message: "User not found"});
        if(!user.approvalRoles || user.approvalRoles.length === 0) return res.status(403).json({success:false, message: "User not authorized"});

        const approvalFlow = await ApprovalFlow.find();
        if(!approvalFlow){
            return res.status(500).json({success:false, message:"Approvals not configured"});
        }
        const steps = 
            user.roles.includes('admin') || user.roles.includes('root') ? 
                approvalFlow[0].steps
                : 
                approvalFlow[0].steps.filter(step => user.approvalRoles.includes(step.role));
        console.log(approvalFlow[0].steps);

        return res.status(200).json({
            success:true,
            steps: steps
        })

    } catch(error){
        console.log(error);
    }
});


//need a route to get workflow
//need a route to add and remove workflow items
//need a route to add people to wokrflow items

module.exports = router;
