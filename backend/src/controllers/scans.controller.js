/**
 * Scans Controller
 * Handles API requests for market scan data
 */

const { getPriceCache, updateMarketData } = require('../services/aggregator.service');

/**
 * GET /api/scans
 * Returns all pairs with current prices
 */
function getScans(req, res) {
    const pairs = Object.values(getPriceCache());
    res.json({ pairs });
}

/**
 * POST /api/refresh
 * Forces an immediate update from exchanges
 */
async function refreshScans(req, res) {
    try {
        console.log('[API] Hard refresh requested');
        const cache = await updateMarketData();
        const pairs = Object.values(cache);
        res.json({ pairs });
    } catch (err) {
        console.error('[API] Refresh failed:', err);
        res.status(500).json({ error: 'Failed to refresh market data' });
    }
}

module.exports = { getScans, refreshScans };
