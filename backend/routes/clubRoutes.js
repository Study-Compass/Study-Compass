const express=require('express');
const router = express.Router();
const { verifyToken, verifyTokenOptional } = require('../middlewares/verifyToken');
const mongoose = require('mongoose');
const User = require('../schemas/user.js');
const Club = require('../schemas/club.js');
const Follower = require('../schemas/clubFollowers.js');
const Member = require('../schemas/clubMember.js');
const { cloudiot_v1 } = require('googleapis');



router.get("/get-club", verifyToken, async(req,res)=>{
//May eventually change login permissions
    const clubId= req.body.clubId
   try{
    const clubs= await Club.find();
//worked on this and now have pull request issue
   }
   catch //
});

router.post("/create-club", verifyToken, async(req,res)=>{
    

});

router.post("/edit-club", verifyToken, async(req,res)=>{

});


routear.delete("/delete-club", verifyToken, async(req,res)=>{


});

module.exports = router;
