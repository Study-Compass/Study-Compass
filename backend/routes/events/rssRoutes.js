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
        data: rssFeed
    });
});

router.get('/get-rss-feeds', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    const { RssFeed } = getModels(req, 'RssFeed');
    const rssFeeds = await RssFeed.find({});
    return res.status(200).json({
        success: true,
        data: rssFeeds
    });
});

router.delete('/delete-rss-feed', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    const { RssFeed } = getModels(req, 'RssFeed');
    const { id } = req.body;
    await RssFeed.findByIdAndDelete(id);
    return res.status(200).json({
        success: true,
        message: 'Rss feed deleted successfully'
    });
});

router.put('/update-rss-feed', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    const { RssFeed } = getModels(req, 'RssFeed');
    const { id, name, url } = req.body;
    await RssFeed.findByIdAndUpdate(id, { name, url });
    return res.status(200).json({
        success: true,
        message: 'Rss feed updated successfully'
    });
});

module.exports = router;
