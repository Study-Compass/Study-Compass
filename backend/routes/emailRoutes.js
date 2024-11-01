const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/verifyToken');

router.post('/send-email', verifyToken, async (req, res) => {
    try {
        const { email } = req.body;

        

        res.status(200).json({ message: 'Email sent' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Error sending email' });
    }
});
