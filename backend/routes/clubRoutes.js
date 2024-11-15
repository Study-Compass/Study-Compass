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

    try {
        const{clubId, club_profile_image, club_description, positions, weekly_meeting } = req.body;

        //Verify user and have their clubs saved under them
        const userId = req.user.userId;

        //if club name exist fail to create
        const clubExist = await Club.findOne({club_name: req.body.club_name });

        //Check to verify if the club already exists
        if (clubExist){
            return res.status(400).json({ success: false, message: 'Club name already exists'});
        }

        //Check if Bad Words
        if (isProfane(req.body.club_name)) {
            return res.status(400).json({ success: false, message: 'Club name contains inappropriate language' });
        }

        // Sanitize club name and description verify this right
        const cleanClubName = clean(req.body.club_name);

        //Check if Bad Words
        if (isProfane(req.body.club_description)) {
            return res.status(400).json({ success: false, message: 'Description contains inappropriate language' });
        }

        const cleanClubDescription = clean(req.body.club_description);

        const newClub = new Club({

        club_name: cleanClubName,
        club_profile_image: req.body.club_profile_image,
        club_description: cleanClubDescription,
        positions: req.body.positions || ['regular', 'officer'],
        weekly_meeting: req.body.weekly_meeting || null,
        //Owner is the user
        owner: userId

        });

        //Save the club
        const saveClub= await newClub.save();
        console.log(`POST: /create-club`);
        return res.status(200).json({ success: true, message: "Club created successfully", club: saveClub });

    } catch(error){
        // Handle any errors that occur during the process
        console.log(`POST: /create-club failed`, error);
        return res.status(500).json({ success: false, message: 'Error creating club', error: error.message });
    }
});


//Adjust Scalabilty 
router.post("/edit-club", verifyToken, async (req, res) => {
        const allowedFields=['club_profile_image', 'club_description', 'positions', 'weekly_meeting', 'club_name'];
        const userId = req.user?.userId;
        
    try {
        const {clubId, ...updateData}=req.body;
        // Validate that the essential fields are present
        if (!clubId) {
            return res.status(400).json({ success: false, message: "Club ID is required" });
        }

        const club = await Club.findById(clubId);

        // Check if the club exists
        if (!club) {
            return res.status(404).json({ success: false, message: "Club not found" });
        }

        // Check if the user is authorized to edit the club
        if (club.owner.toString() !== userId) {
            return res.status(400).json({ success: false, message: "You are not authorized to edit this club" });
        }

      // Loop through the allowed fields list to clean and update them as needed
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
            let value = updateData[field];

            // Check for inappropriate language in each field
            if (['club_name', 'club_description'].includes(field)) {
                if (isProfane(value)) {
                    value = clean(value);
                    return res.status(400).json({ success: false, message: `${field.replace('_', ' ')} contains inappropriate language` });
                }
                value = clean(value);
            }

            // For unique fields, perform a duplicate check
            if (field === 'club_name') {
                const cleanClubName = value;
                const clubExist = await Club.findOne({ club_name: cleanClubName });
                if (clubExist && clubExist._id.toString() !== clubId) {
                    return res.status(400).json({ success: false, message: "Club name already taken" });
                }
                club[field] = cleanClubName;
            } else {
                club[field] = value;
            }
        }
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


module.exports = router;
