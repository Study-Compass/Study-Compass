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
    const ApprovalFlow = getModels(req,'ApprovalFlow');
    const { Approval } = req.body
    try{
        const approvalFlow = ApprovalFlow.findOne();
        if(approvalFlow){
            approvalFlow.steps.push(Approval);
            await approvalFlow.save();
            res.status(200).json({
                success: true,
                data: approvalFlow
            });
        }
        res.status(404).json({
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


//need a route to get workflow
//need a route to add and remove workflow items
//need a route to add people to wokrflow items

module.exports = router;
