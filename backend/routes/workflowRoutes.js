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

/* 

{
  "_id": {
    "$oid": "65f474445dca7aca4fb5acaf"
  },
  "username": "James",
  "email": "jbliu88@gmail.com",
  "password": "$2b$12$6zllVAdl15hpU3beK.QaZeVBuJLc.CRp9DZx/wlQVXHSYc4FMHAOy",
  "createdAt": {
    "$date": "2024-03-15T16:16:04.446Z"
  },
  "updatedAt": {
    "$date": "2025-04-08T20:26:37.876Z"
  },
  "__v": 117,
  "saved": [
    "65dd0787d6b91fde155c00c9",
    "65dd078bd6b91fde155c0179",
    "65dd0787d6b91fde155c00bd",
    "65dd078bd6b91fde155c0159",
    "65dd0789d6b91fde155c0115",
    "65dd078ad6b91fde155c0135",
    "65dd0786d6b91fde155c00a1",
    "65dd0787d6b91fde155c00d1",
    "65dd078ad6b91fde155c0153",
    "65dd078ad6b91fde155c013d"
  ],
  "admin": true,
  "visited": [],
  "partners": 11,
  "sessions": [
    0
  ],
  "hours": 0,
  "contributions": 2,
  "name": "James",
  "onboarded": true,
  "classroomPreferences": "opctw",
  "recommendationPreferences": 2,
  "tags": [
    "beta tester",
    "admin",
    "developer",
    "RCOS"
  ],
  "developer": 1,
  "parnters": 9,
  "darkModePreference": false,
  "roles": [
    "user",
    "admin",
    "oie",
    "developer"
  ],
  "clubAssociations": [
    {
      "$oid": "674cbe0c1f1a494ba8087f68"
    },
    {
      "$oid": "675ce3fd62040b678fa13986"
    },
    {
      "$oid": "675ce4871958af1a0199505e"
    },
    {
      "$oid": "675cff6b1958af1a019953c5"
    },
    {
      "$oid": "676dc8a34052dd9de0527f78"
    },
    {
      "$oid": "67eca598be787f35f5ec45f0"
    },
    {
      "$oid": "67eca73dbe787f35f5ec464f"
    }
  ],
  "conact": null,
  "approvalRoles": [
    "Approval Name 3",
    "root",
    "Rensselaer Union"
  ],
  "picture": "https://studycompass.s3.amazonaws.com/users/65f474445dca7aca4fb5acaf-1743545974398.png",
  "affiliatedEmail": "liuj43@rpi.edu",
  "affiliatedEmailVerified": true
}

*/

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
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


//need a route to get workflow
//need a route to add and remove workflow items
//need a route to add people to wokrflow items

module.exports = router;
