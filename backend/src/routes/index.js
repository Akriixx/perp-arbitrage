/**
 * API Routes
 */

const express = require('express');
const router = express.Router();
const { getScans } = require('../services/aggregator.service');
const { getSpreadHistory } = require('../controllers/history.controller');
const { getAlertsHistory } = require('../controllers/alert.controller');


// Existing routes
router.get('/scans', (req, res) => {
    const cache = getScans();
    const pairs = Object.values(cache);
    res.json({ pairs });
});

router.get('/spread-history', getSpreadHistory);
router.get('/alerts', getAlertsHistory);

module.exports = router;
