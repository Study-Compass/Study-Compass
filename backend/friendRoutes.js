const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();
const { verifyToken } = require('./middlewares/verifyToken');

const Friendship = require('./schemas/friendship');

router.post('/friend-request/:friendId', verifyToken, async (req, res) => {
    const { friendId } = req.params;
    const requester = req.user._id;

    const friendship = new Friendship({
        requester: requester,
        recipient: friendId,
        status: 'pending'
    });


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

module.exports = router;