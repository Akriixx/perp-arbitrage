/**
 * API Routes
 */

const express = require('express');
const router = express.Router();

const { getScans } = require('../controllers/scans.controller');
const { getSpreadHistory } = require('../controllers/history.controller');

// Market scans
router.get('/scans', getScans);

// Spread history
router.get('/spread-history', getSpreadHistory);

module.exports = router;
