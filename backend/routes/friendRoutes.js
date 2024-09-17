const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/verifyToken');

const Friendship = require('../schemas/friendship');
const User = require('../schemas/user');

router.post('/friend-request/:friendUsername', verifyToken, async (req, res) => {
    const { friendUsername } = req.params;
    const requester = req.user.userId;
    let friendId;

    try{
        //case insensitive search
        const friend = await User.findOne({ username: { $regex: new RegExp(friendUsername, 'i') } });
        if(!friend){
            console.log(`POST: /friend-request/:friendId friend not found`)
            return res.status(404).json({
                success: false,
                message: 'Friend not found.'
            });
        }
        friendId = friend._id;
        if(friendId == requester){
            console.log(`POST: /friend-request/:friendId cannot send friend request to self`)
            return res.status(400).json({
                success: false,
                message: 'Cannot send friend request to self.'
            });
        }
    } catch (error) {
        console.log(`POST: /friend-request/:friendId failed`)
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }

    const friendship = new Friendship({
        requester: requester,
        recipient: friendId,
        status: 'pending'
    });

    // check if friendship already exists
    const existingFriendship = await Friendship.findOne({
        $or: [
            { requester: requester, recipient: friendId },
            { requester: friendId, recipient: requester }
        ]
    });

    if(existingFriendship){
        if(existingFriendship.status === 'pending'){
            console.log(`POST: /friend-request/:friendId friend request already sent`)
            return res.status(400).json({
                success: false,
                message: 'Friend request already sent.'
            });
        }
        if(existingFriendship.status === 'accepted'){
            console.log(`POST: /friend-request/:friendId friend already exists`)
            return res.status(400).json({
                success: false,
                message: 'You are already friends with this user.'
            });
        }
    }

    try{
        await friendship.save();
        console.log(`POST: /friend-request/:friendId friend request sent to ${friendId}`)
        res.status(201).json({
            success: true,
            message: 'Friend request sent'
        });

    } catch (error){
        console.log(`POST: /friend-request/:friendId failed`)
        console.log(error)
        res.status(500).json({
            success: false,
            message: 'Error sending friend request'
        });
    }
});

router.post('/friend-request/accept/:friendshipId', verifyToken, async (req, res) => {
    const { friendshipId } = req.params;
    const recipient = req.user.userId;

    try {
        const friendship = await Friendship.findById(friendshipId);
        if (!friendship) {
            console.log(`POST: /friend-request/accept/:friendshipId friendship not found`)
            return res.status(404).json({
                success: false,
                message: 'Friendship not found.'
            });
        }

        if(friendship.recipient.toString() !== recipient.toString()){
            console.log(`POST: /friend-request/accept/:friendshipId not authorized to accept request`)
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to accept this request.'
            });
        }

        friendship.status = 'accepted';
        await friendship.save();
        console.log(`POST: /friend-request/accept/:friendshipId friend request accepted`)
        res.status(200).send({
            success: true,
            message: 'Friend request accepted.'
        });
    } catch (error) {
        console.log(`POST: /friend-request/accept/:friendshipId failed`)
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.post('/friend-request/reject/:friendshipId', verifyToken, async (req, res) => {
    const { friendshipId } = req.params;
    const recipient = req.user.userId;

    try {
        const friendship = await Friendship.findById(friendshipId);
        if (!friendship) {
            return res.status(404).json({
                success: false,
                message: 'Friendship not found.'
            });
        }

        if(friendship.recipient.toString() !== recipient.toString()){
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to reject this request.'
            });
        }
        //delete friendship
        await Friendship.deleteOne({ _id: friendship._id });
        res.status(200).json({
            success: true,
            message: 'Friend request'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.get('/getFriends', verifyToken, async (req, res) => {
    const userId = req.user.userId; // Assuming you have user authentication

    try {
        const friendships = await Friendship.find({
            $or: [
                { requester: userId, status: 'accepted' },
                { recipient: userId, status: 'accepted' }
            ]
        }).populate('requester recipient', 'username');


        const friends = friendships.map(friendship => {
            return friendship.requester._id.toString() === userId.toString()
                ? friendship.recipient
                : friendship.requester;
        });

        const friendIds = friends.map(friend => friend._id);

        // fetch friends objects
        const friendsObjects= await User.find({
            _id: { $in: friendIds }
        });
        
        console.log(`GET: /friends friends found`);
        res.json({
            success: true,
            message: 'Friends found',
            data: friendsObjects
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
});

router.get('/friend-requests', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    try {
        let requests = await Friendship.find({
            recipient: userId,
            status: 'pending'
        }).populate('requester', 'username');


        const requesterIds = requests.map(request => request.requester._id);

        // fetch request objects
        const requestObjects = await User.find({
            _id: { $in: requesterIds }
        });
        // add requester objects to requests
        requests = requests.map(request => {
            const requester = requestObjects.find(requestObject => requestObject._id.toString() === request.requester._id.toString());
            return {
                ...request.toObject(),
                requester
            }
        });

        console.log(`GET: /friend-requests friend requests found`);

        res.json({
            success: true,
            message: 'Friend requests found',
            data: requests
        });
    } catch (error) {
        console.log(`GET: /friend-requests failed`);
        res.json({
            success: false,
            message: error.message
        });
    }
});

// unfriend
router.post('/unfriend/:friendId', verifyToken, async (req, res) => {
    const { friendId } = req.params;
    const userId = req.user.userId;

    try {
        const friendship = await Friendship.findOne({
            $or: [
                { requester: userId, recipient: friendId },
                { requester: friendId, recipient: userId }
            ]
        });
        
        if (!friendship) {
            return res.status(404).json({
                success: false,
                message: 'Friendship not found.'
            });
        }
        
        if(friendship.status !== 'accepted'){
            return res.status(400).json({
                success: false,
                message: 'Friendship not accepted.'
            });
        }

        await Friendship.deleteOne({ _id: friendship._id });

        res.json({
            success: true,
            message: 'Friend removed'
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;