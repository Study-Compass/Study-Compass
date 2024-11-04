const express=require('express');
const router = express.Router();
const { verifyToken, verifyTokenOptional } = require('../middlewares/verifyToken');
const mongoose = require('mongoose');
const User = require('../schemas/user.js');
const Club = require('../schemas/club.js');
const Follower = require('../schemas/clubFollowers.js');
const Member = require('../schemas/clubMember.js');
const { cloudiot_v1 } = require('googleapis');
const { clean } = require('../services/profanityFilterService');

//Route to get a specific club by name
router.get("/get-club/:id", verifyToken, async(req,res)=>{
//May eventually change login permissions

try{
    const clubId= req.params.clubId;
    //Find the Club 

    const club= await Club.findOne({_id: clubId});

    if(club){
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




router.post("/create-club", verifyToken, async(req,res)=>{
// Create a new club and store it into database
    try {

        //Verify user and have their clubs saved under them
        const userId = req.user.userId;

        //if club name exist fail to create
        const clubExist = await Club.findOne({club_name: req.body.club_name });

        //Check to verify if the club already exists
        if (clubExist){
            res.status(400).json({ success: false, message: 'Club name already exists' });
        }

        // Sanitize club name and description verify this right
        const cleanClubName = clean(req.body.club_name);
        if (!cleanClubName) {
            return res.status(400).json({ success: false, message: 'Club name contains inappropriate language' });
        }

        const cleanClubDescription = clean(req.body.club_description);

        if (!cleanclubDescription) {
            return res.status(400).json({ success: false, message: 'Contains inappropriate language' });
        }

        const newClub = new Club({

        club_name: cleanClubName,
        club_profile_image: req.body.club_profile_image,
        club_description: cleanClubDescription,
        positions: req.body.positions || ['regular', 'officer'],
        weekly_meeting: req.body.weekly_meeting,
        
        //Owner is the user
        owner: userId

        });

        //Save the club
        const saveClub= await newClub.save()
        console.log(`POST: /create-club`);
        return res.status(200).json({ success: true,message: "Club created successfully", club: savedClub });

    } catch(error){
        // Handle any errors that occur during the process
        console.log(`POST: /create-club failed`, error);
        return res.status(500).json({ success: false, message: 'Error creating club', error: error.message });
    }
});



router.post("/edit-club", verifyToken, async(req,res)=>{
try {
    const{clubId, club_profile_image, club_description, positions, weekly_meeting } = req.body;
    const userId= req.user.userId;

    const club = await Club.findById(clubId); 

    // Check if the club exists
    if (!club) {
        return res.status(404).json({ success: false, message: "Club not found" });
    }

    if (club.owner.toString() !== userId) {
        return res.status(400).json({ success: false, message: "You are not authorized to edit this club" });
    }

    //Edit the name of the club
    if(club){
         const clubExist=await Club.findOne({club_name});
         if (clubExist && clubExist._id.toString() !== clubId) {
            return res.status(400).json({ success: false, message: "Club name already taken" });
        }

         // Clean and check for profane language
         const cleanClubName = clean(club_name);
         if (!cleanClubName) {
            return res.status(400).json({ success: false, message: 'Club name contains inappropriate language' });
         }

         // Update the club name with the clean version
         club.club_name = cleanClubName;
     }

    //Check club description
    const cleanClubDescription = club_description ? clean(club_description) : club.club_description;

    if (!cleanclubDescription) {
       return res.status(400).json({ success: false, message: 'Contains inappropriate language' });
    }

    // Update the club fields
    club.club_profile_image = club_profile_image || club.club_profile_image;
    club.club_description = cleanClubDescription;
    club.positions = positions || club.positions;
    club.weekly_meeting = weekly_meeting || club.weekly_meeting;

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


module.exports = router;
