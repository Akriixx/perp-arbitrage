/**
 * Scans Controller
 * Handles API requests for market scan data
 */

const { getPriceCache } = require('../services/aggregator.service');

/**
 * GET /api/scans
 * Returns all pairs with current prices
 */
function getScans(req, res) {
    const pairs = Object.values(getPriceCache());
    res.json({ pairs });
}

module.exports = { getScans };
