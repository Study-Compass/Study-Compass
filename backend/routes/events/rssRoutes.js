const express = require('express');
const router = express.Router();
const { verifyToken, verifyTokenOptional, authorizeRoles } = require('../../middlewares/verifyToken');
const getModels = require('../../services/getModelService');

router.post('/create-rss-feed', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    const { RssFeed } = getModels(req, 'RssFeed');
    const { name, url } = req.body;
    const rssFeed = await RssFeed.create({ name, url });
    return res.status(200).json({
        success: true,
        message: 'Rss feed created successfully',
        rssFeed
    });
});

module.exports = router;
