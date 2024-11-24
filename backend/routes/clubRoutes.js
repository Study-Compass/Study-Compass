const express = require('express');
const router = express.Router();
const { verifyToken, verifyTokenOptional } = require('../middlewares/verifyToken');
const mongoose = require('mongoose');
const User = require('../schemas/user.js');
const Club = require('../schemas/club.js');
const Follower = require('../schemas/clubFollowers.js');
const Member = require('../schemas/clubMember.js');
const { cloudiot_v1 } = require('googleapis');
const { clean, isProfane } = require('../services/profanityFilterService');


//Route to get a specific club by name
router.get("/get-club/:id", verifyToken, async(req,res)=>{
//May eventually change login permissions

try{
    const clubId= req.params.id;
    
    //Find the Club 
    const club= await Club.find({_id: clubId});

    if(club !== null){
        // If the club exists, return it
        console.log(`GET: /get-club/${clubId}`);
        res.json({ success: true, message: "Club found", club: club});

    } else{
        // If not found, return a 404 with a message
        return res.status(404).json({ success: false, message: 'Club not found' });
    }

   } catch(error){
    // Handle any errors that occur during the process
        console.log(`GET: /get-club failed`, error);
        return res.status(500).json({ success: false, message: 'Error retrieving club data', error: error.message });
   }
});


// Create a new club and store it into database
router.post("/create-club", verifyToken, async(req,res)=>{

    const{ club_name, club_profile_image, club_description, positions, weekly_meeting } = req.body;

    try {
        
        //Verify user and have their clubs saved under them
        const userId = req.user.userId;
        const user = await User.findById({_id: userId});
        console.log(user);
        if(!user){
            return res.status(404).json({ success: false, message: 'User not found' });
        }
    
        const clubExist = await Club.findOne({club_name: club_name }); 
        //Check to verify if the club already exists
        if (clubExist){
            return res.status(400).json({ success: false, message: 'Club name already exists'});
        }
        if (isProfane(req.body.club_name)) { //Check if Bad Words
            return res.status(400).json({ success: false, message: 'Club name contains inappropriate language' });
        }

        const cleanClubName = clean(club_name); // Sanitize club name and description verify this right
        if (isProfane(club_description)) { //Check if Bad Words
            return res.status(400).json({ success: false, message: 'Description contains inappropriate language' });
        }

        const cleanClubDescription = clean(club_description);

        const newClub = new Club({
            club_name: cleanClubName,
            club_profile_image: club_profile_image,
            club_description: cleanClubDescription,
            positions: positions || ['chair', 'officer', 'regular'],
            weekly_meeting: weekly_meeting || null,
            //Owner is the user
            owner: userId
        });
        
        const newMember = new Member({ //add new member to the club
            club_id: newClub._id,
            user_id: userId,
            status: 0,
        });

        await newMember.save(); 

        user.clubAssociations.push(newClub._id);
        await user.save();
        
        const saveClub = await newClub.save(); //Save the club
        console.log(`POST: /create-club`);
        return res.status(200).json({ success: true, message: "Club created successfully", club: saveClub });

    } catch(error){
        // Handle any errors that occur during the process
        console.log(`POST: /create-club failed`, error);
        return res.status(500).json({ success: false, message: 'Error creating club', error: error.message });
    }
});


router.post("/edit-club", verifyToken, async (req, res) => {
    try {
        const { clubId, club_profile_image, club_description, positions, weekly_meeting, club_name } = req.body;
        const userId = req.user?.userId;

        // Validate that the essential fields are present
        if (!clubId) {
            return res.status(400).json({ success: false, message: "Club ID is required" });
        }

        const club = await Club.findById(clubId);

        // Check if the club exists
        console.log
        if (!club) {
            return res.status(404).json({ success: false, message: "Club not found" });
        }

        // Check if the user is authorized to edit the club
        if (club.owner.toString() !== userId) {
            return res.status(400).json({ success: false, message: "You are not authorized to edit this club" });
        }

        // If club_name is provided, clean it and check for inappropriate language
        if (club_name) {

            const cleanClubName = clean(club_name);
            
            if (isProfane(club_name)) {
                return res.status(400).json({ success: false, message: "Club name contains inappropriate language" });
            }

            // Check if a club with the cleaned name already exists, excluding the current club
            const clubExist = await Club.findOne({ club_name: cleanClubName });
            if (clubExist && clubExist._id.toString() !== clubId) {
                return res.status(400).json({ success: false, message: "Club name already taken" });
            }

            // Update the club name with the clean version
            club.club_name = cleanClubName;
        }

        // If club_description is provided, clean it
        if (club_description) {
            const cleanClubDescription = clean(club_description);

            if (isProfane(club_description)) {
                return res.status(400).json({ success: false, message: "Description contains inappropriate language" });
            }
            club.club_description = cleanClubDescription;
        }

        // Update other fields only if they are provided
        if (club_profile_image) {
            club.club_profile_image = club_profile_image;
        }
        if (positions) {
            club.positions = positions;
        }
        if (weekly_meeting) {
            club.weekly_meeting = weekly_meeting;
        }

        // Save the updated club
        await club.save();

        // Send success response
        console.log(`POST: /edit-club`);
        res.json({ success: true, message: "Club updated successfully", club });

    } catch (error) {
        // Handle any errors that occur during the process
        console.log(`POST: /edit-club failed`, error);
        return res.status(500).json({ success: false, message: "Error updating club", error: error.message });
    }
});



router.delete("/delete-club/:clubId", verifyToken, async(req,res)=>{
try {
    const { clubId } = req.params;
    const userId = req.user.userId;

    const club = await Club.findById(clubId);

    //Check if the club exists
    if (!club) {
       return res.status(404).json({ success: false, message: "Club not found" });
    }

    // Verify that the user is the owner of the club
    if (club.owner.toString() !== userId) {
        return res.status(400).json({ success: false, message: "You are not authorized to delete this club" });
    }

    // Delete the club
    await Club.findByIdAndDelete(clubId);

    console.log(`DELETE: /delete-club`);
    res.json({ success: true, message: "Club deleted successfully" });

} catch (error) {
    console.log(`DELETE: /delete-club failed`, error);
    return res.status(500).json({ success: false, message: "Error deleting club", error: error.message });
}
});

router.post("/follow-club/:clubId", verifyToken, async(req,res)=>{
    try {
        const { clubId } = req.params;
        const userId = req.user.userId;
    
        const club = await Club.findById(clubId);
        
        //Check if the club exists
        if (!club) {
            return res.status(404).json({ success: false, message: "Club not found" });
        }
       
        const alreadyFollowing = await Follower.findOne({ user_id: userId, club_id: clubId }); //Check if the user is already following the club
        if (alreadyFollowing) {
            return res.status(400).json({ success: false, message: "You are already following this club" });
        }

        const newFollower = new Follower({
            user_id: userId,
            club_id: clubId
        });
        await newFollower.save();

        console.log(`POST: /follow-club`);
        res.json({ success: true, message: "Club followed successfully" });
        
    } catch (error) {
        console.log(`POST: /follow-club failed`, error);
        return res.status(500).json({ success: false, message: "Error following club", error: error.message });
    }
});

router.post("/unfollow-club/:clubId", verifyToken, async(req,res)=>{
    try {
        const { clubId } = req.params;
        const userId = req.user.userId;
    
        const club = await Club.findById(clubId);
        
        //Check if the club exists
        if (!club) {
            return res.status(404).json({ success: false, message: "Club not found" });
        }

        const follower = await Follower.findOne({ user_id: userId, club_id: clubId }); //Check if the user is already following the club
        if (!follower) {
            return res.status(400).json({ success: false, message: "You are not following this club" });
        }

        await Follower.findByIdAndDelete(follower._id);

        console.log(`POST: /unfollow-club`);
        res.json({ success: true, message: "Club unfollowed successfully" });

    } catch (error) {
        console.log(`POST: /unfollow-club failed`, error);
        return res.status(500).json({ success: false, message: "Error unfollowing club", error: error.message });
    }
});

router.get("/get-followed-clubs", verifyToken, async(req,res)=>{
    try {
        const userId = req.user.userId;
    
        const followedClubs = await Follower.find({ user_id: userId }).populate('club_id');
        console.log(`GET: /get-followed-clubs`);
        res.json({ success: true, message: "Followed clubs retrieved successfully", clubs: followedClubs });

    } catch (error) {
        console.log(`GET: /get-followed-clubs failed`, error);
        return res.status(500).json({ success: false, message: "Error retrieving followed clubs", error: error.message });
    }
});

router.get("/get-club-members/:clubId", verifyToken, async(req,res)=>{
    try {
        const { clubId } = req.params;
        const userId = req.user.userId;
    
        const club = await Club.findById(clubId);

        //Check if the club exists
        if (!club) {
            return res.status(404).json({ success: false, message: "Club not found" });
        }

        // Check if the user is a member of the club
        const member = await Member.findOne({ club_id: clubId, user_id: userId });
        if (!member) {
            return res.status(400).json({ success: false, message: "You are not a member of this club" });
        }

        const members = await Member.find({ club_id: clubId }).populate('user_id');
        console.log(`GET: /get-club-members`);
        res.json({ success: true, message: "Club members retrieved successfully", members });

    } catch (error) {
        console.log(`GET: /get-club-members failed`, error);
        return res.status(500).json({ success: false, message: "Error retrieving club members", error: error.message });
    }
});

router.post("/add-club-member/:clubId", verifyToken, async(req,res)=>{
    try {
        const { clubId } = req.params;
        const userId = req.user.userId;
        const { user_id, role } = req.body;
    
        const club = await Club.findById(clubId);

        //Check if the club exists
        if (!club) {
            return res.status(404).json({ success: false, message: "Club not found" });
        }

        // Check if the user is the owner of the club
        if (club.owner.toString() !== userId) {
            return res.status(400).json({ success: false, message: "You are not authorized to add members to this club" });
        }

        // Check if the user to be added is already a member
        const member = await Member.findOne({ club_id: clubId, user_id: user_id });
        if (member) {
            return res.status(400).json({ success: false, message: "User is already a member of this club" });
        }

        const newMember = new Member({
            club_id: clubId,
            user_id,
            role
        });
        await newMember.save();

        console.log(`POST: /add-club-member`);
        res.json({ success: true, message: "Member added successfully" });

    } catch (error) {
        console.log(`POST: /add-club-member failed`, error);
        return res.status(500).json({ success: false, message: "Error adding member", error: error.message });
    }
});

router.delete("/remove-club-member/:clubId", verifyToken, async(req,res)=>{ 
    try {
        const { clubId } = req.params;
        const userId = req.user.userId;
        const { user_id } = req.body;
    
        const club = await Club.findById(clubId);

        //Check if the club exists
        if (!club) {
            return res.status(404).json({ success: false, message: "Club not found" });
        }

        // Check if the user is the owner of the club
        if (club.owner.toString() !== userId) {
            return res.status(400).json({ success: false, message: "You are not authorized to remove members from this club" });
        }

        // Check if the user to be removed is a member
        const member = await Member.findOne({ club_id: clubId, user_id });
        if (!member) {
            return res.status(400).json({ success: false, message: "User is not a member of this club" });
        }

        await Member.findByIdAndDelete(member._id);

        console.log(`DELETE: /remove-club-member`);
        res.json({ success: true, message: "Member removed successfully" });

    } catch (error) {
        console.log(`DELETE: /remove-club-member failed`, error);
        return res.status(500).json({ success: false, message: "Error removing member", error: error.message });
    }
});

router.post("/update-club-member/:clubId", verifyToken, async(req,res)=>{
    try {
        const { clubId } = req.params;
        const userId = req.user.userId;
        const { user_id, role } = req.body;
    
        const club = await Club.findById(clubId);

        //Check if the club exists
        if (!club) {
            return res.status(404).json({ success: false, message: "Club not found" });
        }

        // Check if the user is the owner of the club
        if (club.owner.toString() !== userId) {
            return res.status(400).json({ success: false, message: "You are not authorized to update members of this club" });
        }

        // Check if the user to be updated is a member
        const member = await Member.findOne({ club_id: clubId, user_id });
        if (!member) {
            return res.status(400).json({ success: false, message: "User is not a member of this club" });
        }

        member.role = role;
        await member.save();

        console.log(`POST: /update-club-member`);
        res.json({ success: true, message: "Member updated successfully" });

    } catch (error) {
        console.log(`POST: /update-club-member failed`, error);
        return res.status(500).json({ success: false, message: "Error updating member", error: error.message });
    }
});

module.exports = router;
