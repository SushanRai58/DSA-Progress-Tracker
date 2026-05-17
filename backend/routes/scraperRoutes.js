const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { scrapeLeetCode } = require('../controllers/scraperController');

// Require auth so the scraper can't be used as an open proxy
router.post('/leetcode', protect, scrapeLeetCode);

module.exports = router;
