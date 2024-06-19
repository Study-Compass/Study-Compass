const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();
const { verifyToken } = require('./middlewares/verifyToken');

const Friendship = require('./schemas/friendship');
const User = require('./schemas/user');

router.post('/friend-request/:friendUsername', verifyToken, async (req, res) => {
    const { friendUsername } = req.params;
    const requester = req.user.userId;
    let friendId;



    try{
        const friend = await User.findOne({ username: friendUsername });
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
        requester: requester,
        recipient: friendId
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
                message: 'Friend already exists.'
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
    const recipient = req.user._id;

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
                message: 'You are not authorized to accept this request.'
            });
        }

        friendship.status = 'accepted';
        await friendship.save();
        res.status(200).send({
            success: true,
            message: 'Friend request accepted.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.post('/friend-request/reject/:friendshipId', verifyToken, async (req, res) => {
    const { friendshipId } = req.params;
    const recipient = req.user._id;

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

        friendship.status = 'rejected';
        await friendship.save();
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

router.get('/friends', verifyToken, async (req, res) => {
    const userId = req.user._id; // Assuming you have user authentication

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

        res.json({
            success: true,
            message: 'Friends found',
            data: friends
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
});

router.get('/friend-requests', verifyToken, async (req, res) => {
    const userId = req.user._id;

    try {
        const requests = await Friendship.find({
            recipient: userId,
            status: 'pending'
        }).populate('requester', 'username');

        res.json({
            success: true,
            message: 'Friend requests found',
            data: requests
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;