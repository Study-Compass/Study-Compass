const express = require('express');
const router = express.Router();
const { verifyToken, verifyTokenOptional } = require('../middlewares/verifyToken.js');
const mongoose = require('mongoose');
const User = require('../schemas/user.js');
const Org = require('../schemas/org.js');
const Follower = require('../schemas/orgFollower.js');
const Member = require('../schemas/orgMember.js');
const { clean, isProfane } = require('../services/profanityFilterService.js');


//Route to get a specific org by name
router.get("/get-org/:id", verifyToken, async(req,res)=>{
//May eventually change login permissions

try{
    const orgId= req.params.id;
    
    //Find the Org 
    const org= await Org.find({_id: orgId});

    if(org !== null){
        // If the org exists, return it
        console.log(`GET: /get-org/${orgId}`);
        res.json({ success: true, message: "Org found", org: org});

    } else{
        // If not found, return a 404 with a message
        return res.status(404).json({ success: false, message: 'Org not found' });
    }

   } catch(error){
    // Handle any errors that occur during the process
        console.log(`GET: /get-org failed`, error);
        return res.status(500).json({ success: false, message: 'Error retrieving org data', error: error.message });
   }
});

router.get("/get-org-by-name/:name", verifyToken, async(req,res)=>{
    try{
        const orgName= req.params.name;
        
        const org= await Org.findOne({org_name: orgName});

        if(!org){
            return res.status(404).json({ success: false, message: 'Org not found' });
        }
        
        const orgMembers = await Member.find({org_id: org._id}).populate('user_id');
        const orgFollowers = await Follower.find({org_id: org._id}).populate('user_id');

        // If the org exists, return it
        console.log(`GET: /get-org-by-name/${orgName}`);
        res.json({ success: true, message: "Org found", org: {
            overview: org,
            members: orgMembers,
            followers: orgFollowers
        }});
    
       } catch(error){
        // Handle any errors that occur during the process
            console.log(`GET: /get-org-by-name failed`, error);
            return res.status(500).json({ success: false, message: 'Error retrieving org data', error: error.message });
       }
    }
);

router.post("/create-org", verifyToken, async(req,res)=>{

    const{ org_name, org_profile_image, org_description, positions, weekly_meeting } = req.body;

    try {
        
        //Verify user and have their orgs saved under them
        const userId = req.user.userId;
        const user = await User.findById({_id: userId});
        console.log(user);
        if(!user){
            return res.status(404).json({ success: false, message: 'User not found' });
        }
    
        const orgExist = await Org.findOne({org_name: org_name }); 
        //Check to verify if the org already exists
        if (orgExist){
            return res.status(400).json({ success: false, message: 'Org name already exists'});
        }
        if (isProfane(req.body.org_name)) { //Check if Bad Words
            return res.status(400).json({ success: false, message: 'Org name contains inappropriate language' });
        }

        const cleanOrgName = clean(org_name); // Sanitize org name and description verify this right
        if (isProfane(org_description)) { //Check if Bad Words
            return res.status(400).json({ success: false, message: 'Description contains inappropriate language' });
        }

        const cleanOrgDescription = clean(org_description);

        const newOrg = new Org({
            org_name: cleanOrgName,
            org_profile_image: org_profile_image,
            org_description: cleanOrgDescription,
            positions: positions || ['chair', 'officer', 'regular'],
            weekly_meeting: weekly_meeting || null,
            //Owner is the user
            owner: userId
        });
        
        const newMember = new Member({ //add new member to the org
            org_id: newOrg._id,
            user_id: userId,
            status: 0,
        });

        await newMember.save(); 

        user.clubAssociations.push(newOrg._id);
        await user.save();
        
        const saveOrg = await newOrg.save(); //Save the org
        console.log(`POST: /create-org`);
        return res.status(200).json({ success: true, message: "Org created successfully", org: saveOrg });

    } catch(error){
        // Handle any errors that occur during the process
        console.log(`POST: /create-org failed`, error);
        return res.status(500).json({ success: false, message: 'Error creating org', error: error.message });
    }
});


router.post("/edit-org", verifyToken, async (req, res) => {
    try {
        const { orgId, org_profile_image, org_description, positions, weekly_meeting, org_name } = req.body;
        const userId = req.user?.userId;

        // Validate that the essential fields are present
        if (!orgId) {
            return res.status(400).json({ success: false, message: "Org ID is required" });
        }

        const org = await Org.findById(orgId);

        // Check if the org exists
        console.log
        if (!org) {
            return res.status(404).json({ success: false, message: "Org not found" });
        }

        // Check if the user is authorized to edit the org
        if (org.owner.toString() !== userId) {
            return res.status(400).json({ success: false, message: "You are not authorized to edit this org" });
        }

        // If org_name is provided, clean it and check for inappropriate language
        if (org_name) {

            const cleanOrgName = clean(org_name);
            
            if (isProfane(org_name)) {
                return res.status(400).json({ success: false, message: "Org name contains inappropriate language" });
            }

            // Check if a org with the cleaned name already exists, excluding the current org
            const orgExist = await Org.findOne({ org_name: cleanOrgName });
            if (orgExist && orgExist._id.toString() !== orgId) {
                return res.status(400).json({ success: false, message: "Org name already taken" });
            }

            // Update the org name with the clean version
            org.org_name = cleanOrgName;
        }

        // If org_description is provided, clean it
        if (org_description) {
            const cleanOrgDescription = clean(org_description);

            if (isProfane(org_description)) {
                return res.status(400).json({ success: false, message: "Description contains inappropriate language" });
            }
            org.org_description = cleanOrgDescription;
        }

        // Update other fields only if they are provided
        if (org_profile_image) {
            org.org_profile_image = org_profile_image;
        }
        if (positions) {
            org.positions = positions;
        }
        if (weekly_meeting) {
            org.weekly_meeting = weekly_meeting;
        }

        // Save the updated org
        await org.save();

        // Send success response
        console.log(`POST: /edit-org`);
        res.json({ success: true, message: "Org updated successfully", org });

    } catch (error) {
        // Handle any errors that occur during the process
        console.log(`POST: /edit-org failed`, error);
        return res.status(500).json({ success: false, message: "Error updating org", error: error.message });
    }
});



router.delete("/delete-org/:orgId", verifyToken, async(req,res)=>{
try {
    const { orgId } = req.params;
    const userId = req.user.userId;

    const org = await Org.findById(orgId);

    //Check if the org exists
    if (!org) {
       return res.status(404).json({ success: false, message: "Org not found" });
    }

    // Verify that the user is the owner of the org
    if (org.owner.toString() !== userId) {
        return res.status(400).json({ success: false, message: "You are not authorized to delete this org" });
    }

    // Delete the org
    await Org.findByIdAndDelete(orgId);

    console.log(`DELETE: /delete-org`);
    res.json({ success: true, message: "Org deleted successfully" });

} catch (error) {
    console.log(`DELETE: /delete-org failed`, error);
    return res.status(500).json({ success: false, message: "Error deleting org", error: error.message });
}
});

router.post("/follow-org/:orgId", verifyToken, async(req,res)=>{
    try {
        const { orgId } = req.params;
        const userId = req.user.userId;
    
        const org = await Org.findById(orgId);
        
        //Check if the org exists
        if (!org) {
            return res.status(404).json({ success: false, message: "Org not found" });
        }
       
        const alreadyFollowing = await Follower.findOne({ user_id: userId, org_id: orgId }); //Check if the user is already following the org
        if (alreadyFollowing) {
            return res.status(400).json({ success: false, message: "You are already following this org" });
        }

        const newFollower = new Follower({
            user_id: userId,
            org_id: orgId
        });
        await newFollower.save();

        console.log(`POST: /follow-org`);
        res.json({ success: true, message: "Org followed successfully" });
        
    } catch (error) {
        console.log(`POST: /follow-org failed`, error);
        return res.status(500).json({ success: false, message: "Error following org", error: error.message });
    }
});

router.post("/unfollow-org/:orgId", verifyToken, async(req,res)=>{
    try {
        const { orgId } = req.params;
        const userId = req.user.userId;
    
        const org = await Org.findById(orgId);
        
        //Check if the org exists
        if (!org) {
            return res.status(404).json({ success: false, message: "Org not found" });
        }

        const follower = await Follower.findOne({ user_id: userId, org_id: orgId }); //Check if the user is already following the org
        if (!follower) {
            return res.status(400).json({ success: false, message: "You are not following this org" });
        }

        await Follower.findByIdAndDelete(follower._id);

        console.log(`POST: /unfollow-org`);
        res.json({ success: true, message: "Org unfollowed successfully" });

    } catch (error) {
        console.log(`POST: /unfollow-org failed`, error);
        return res.status(500).json({ success: false, message: "Error unfollowing org", error: error.message });
    }
});

router.get("/get-followed-orgs", verifyToken, async(req,res)=>{
    try {
        const userId = req.user.userId;
    
        const followedOrgs = await Follower.find({ user_id: userId }).populate('org_id');
        console.log(`GET: /get-followed-orgs`);
        res.json({ success: true, message: "Followed orgs retrieved successfully", orgs: followedOrgs });

    } catch (error) {
        console.log(`GET: /get-followed-orgs failed`, error);
        return res.status(500).json({ success: false, message: "Error retrieving followed orgs", error: error.message });
    }
});

router.get("/get-org-members/:orgId", verifyToken, async(req,res)=>{
    try {
        const { orgId } = req.params;
        const userId = req.user.userId;
    
        const org = await Org.findById(orgId);

        //Check if the org exists
        if (!org) {
            return res.status(404).json({ success: false, message: "Org not found" });
        }

        // Check if the user is a member of the org
        const member = await Member.findOne({ org_id: orgId, user_id: userId });
        if (!member) {
            return res.status(400).json({ success: false, message: "You are not a member of this org" });
        }

        const members = await Member.find({ org_id: orgId }).populate('user_id');
        console.log(`GET: /get-org-members`);
        res.json({ success: true, message: "Org members retrieved successfully", members });

    } catch (error) {
        console.log(`GET: /get-org-members failed`, error);
        return res.status(500).json({ success: false, message: "Error retrieving org members", error: error.message });
    }
});

router.post("/add-org-member/:orgId", verifyToken, async(req,res)=>{
    try {
        const { orgId } = req.params;
        const userId = req.user.userId;
        const { user_id, role } = req.body;
    
        const org = await Org.findById(orgId);

        //Check if the org exists
        if (!org) {
            return res.status(404).json({ success: false, message: "Org not found" });
        }

        // Check if the user is the owner of the org
        if (org.owner.toString() !== userId) {
            return res.status(400).json({ success: false, message: "You are not authorized to add members to this org" });
        }

        // Check if the user to be added is already a member
        const member = await Member.findOne({ org_id: orgId, user_id: user_id });
        if (member) {
            return res.status(400).json({ success: false, message: "User is already a member of this org" });
        }

        const newMember = new Member({
            org_id: orgId,
            user_id,
            role
        });
        await newMember.save();

        console.log(`POST: /add-org-member`);
        res.json({ success: true, message: "Member added successfully" });

    } catch (error) {
        console.log(`POST: /add-org-member failed`, error);
        return res.status(500).json({ success: false, message: "Error adding member", error: error.message });
    }
});

router.delete("/remove-org-member/:orgId", verifyToken, async(req,res)=>{ 
    try {
        const { orgId } = req.params;
        const userId = req.user.userId;
        const { user_id } = req.body;
    
        const org = await Org.findById(orgId);

        //Check if the org exists
        if (!org) {
            return res.status(404).json({ success: false, message: "Org not found" });
        }

        // Check if the user is the owner of the org
        if (org.owner.toString() !== userId) {
            return res.status(400).json({ success: false, message: "You are not authorized to remove members from this org" });
        }

        // Check if the user to be removed is a member
        const member = await Member.findOne({ org_id: orgId, user_id });
        if (!member) {
            return res.status(400).json({ success: false, message: "User is not a member of this org" });
        }

        await Member.findByIdAndDelete(member._id);

        console.log(`DELETE: /remove-org-member`);
        res.json({ success: true, message: "Member removed successfully" });

    } catch (error) {
        console.log(`DELETE: /remove-org-member failed`, error);
        return res.status(500).json({ success: false, message: "Error removing member", error: error.message });
    }
});

router.post("/update-org-member/:orgId", verifyToken, async(req,res)=>{
    try {
        const { orgId } = req.params;
        const userId = req.user.userId;
        const { user_id, role } = req.body;
    
        const org = await Org.findById(orgId);

        //Check if the org exists
        if (!org) {
            return res.status(404).json({ success: false, message: "Org not found" });
        }

        // Check if the user is the owner of the org
        if (org.owner.toString() !== userId) {
            return res.status(400).json({ success: false, message: "You are not authorized to update members of this org" });
        }

        // Check if the user to be updated is a member
        const member = await Member.findOne({ org_id: orgId, user_id });
        if (!member) {
            return res.status(400).json({ success: false, message: "User is not a member of this org" });
        }

        member.role = role;
        await member.save();

        console.log(`POST: /update-org-member`);
        res.json({ success: true, message: "Member updated successfully" });

    } catch (error) {
        console.log(`POST: /update-org-member failed`, error);
        return res.status(500).json({ success: false, message: "Error updating member", error: error.message });
    }
});

router.post('/check-org-name', verifyToken, async (req, res) => {
    const { orgName } = req.body;
    try{
        if(orgName.length === 0) {
            return res.status(400).json({ success: false, message: 'Org name is required' });
        }
        if (isProfane(orgName)) {
            return res.status(400).json({ success: false, message: 'Org name contains inappropriate language' });
        }
        const cleanOrgName = clean(orgName);
        const orgExist = await Org.findOne({ org_name: cleanOrgName });
        if (orgExist) {
            return res.status(402).json({ success: false, message: 'Org name already exists' });
        }
        console.log(`POST: /org-name-check`);
        return res.json({ success: true, message: 'Org name is available' });
    } catch (error){
        console.log('POST: /org-name-check failed', error);
        return res.status(500).json({ success: false, message: 'Error checking org name', error: error.message });
    }
});

module.exports = router;
