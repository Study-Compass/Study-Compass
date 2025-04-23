/*
Study Compass lacks a little in its administration capabilities, this ticket is in an 
effort to make these systems more robust. Make sure to add ‘admin’ to your roles in mongo.
*/

// Refer to oie-route for example how it is used

//All i have to do is call roles as a mod would
const express = require('mongoose');
const router= express.Router();
const { verifyToken, authorizeRoles } = require('../middlewares/verifyToken');
const getModels = require('../services/getModelService');


//NEED TO ADD BANNED IN USER AND ALSO CHECK IF THIS WORKS
/*
provided a userID or a username (never both), ban a user 
(don’t delete the user document, I’ll leave it up to you in deciding how to effectively ‘ban’ a user, do some research
*/
async function findUser(identifier) {
    const { User } = await getModels();
    if (identifier.userId) {
      return await User.findById(identifier.userId);
    } else if (identifier.username) {
      return await User.findOne({ username: identifier.username });
    }
    return null;
}


route.post('/ban',verifyToken, authorizationRole('admin'), async(req, res)=>{
    try {
        const user = await findUser(req.body);
        if (!user) return res.status(404).json({ message: 'User not found' });
    
        user.banned = true;
        await user.save();
    
        return res.status(200).json({ message: 'User has been banned' });
      } catch (error) {
        return res.status(500).json({ message: 'Internal server error', error: error.message });
      }
//If not admin- Action Forbidden: you dont have these permissions
//Research on how to store the user information but cut access, maybe create a schema


});
route.post('/unban',verifyToken, authorizationRole('admin'), async(req, res)=>{

    //If not admin- Action Forbidden: you dont have these permissions
    /*
    POST /unban - self explanatory, keep this in mind when writing the ban route
    */

    try {
        const user = await findUser(req.body);
        if (!user) return res.status(404).json({ message: 'User not found' });
    
        user.banned = false;
        await user.save();
    
        return res.status(200).json({ message: 'User has been unbanned' });
      } catch (err) {
        return res.status(500).json({ message: 'Internal server error', error: err.message });
      }
    
});

route.post('/role',verifyToken, authorizationRole('admin'), async(req, res)=>{

    //Will add or remove a role to/from their document 
    //Action: Add, Remove
    try {
        const { userId, username, roles, action } = req.body;
        const adminUser = req.user;
    
        // Extra check: make sure caller has 'admin'
        if (!adminUser.roles.includes('admin')) {
          return res.status(403).json({ message: 'Action Forbidden: you don’t have these permissions' });
        }
    
        const user = await findUser({ userId, username });
        if (!user) return res.status(404).json({ message: 'User not found' });
    
        if (action === 'add') {
          user.roles = Array.from(new Set([...user.roles, ...roles]));
        } else if (action === 'remove') {
          user.roles = user.roles.filter(role => !roles.includes(role));
        } else {
          return res.status(400).json({ message: 'Invalid action, use "add" or "remove"' });
        }
    
        await user.save();
        return res.status(200).json({ message: `Roles ${action}ed successfully`, roles: user.roles });
    
      } catch (err) {
        return res.status(500).json({ message: 'Internal server error', error: err.message });
      }

    //If not admin- Action Forbidden: you dont have these permissions
    /*
POST /role - provided a userId or a username and an array of roles, as well as 
an action (add or remove), add or remove these roles to/from their user document

note that this route is extremely sensitive and should only be able to be called by 
users with the ‘admin’ role. make sure to include the authorizeRoles middleware for ‘admin’,
as well as doing an extra level of authorization (get the user document and make sure they have admin in their roles

    */
});

module.exports = router;