/**
 * Market Data Aggregator Service
 * Combines data from all exchanges and manages the price cache
 */

const { fetchParadexMarkets } = require('./paradex.service');
const { fetchVestMarkets } = require('./vest.service');
const { fetchLighterMarkets } = require('./lighter.service');
const { calculateSpreads } = require('./spread.service');
const { UPDATE_INTERVAL } = require('../config');

// Global price cache
let PRICE_CACHE = {};
let updateInterval = null;

/**
 * Create empty pair structure
 */
function createPair(symbol) {
    return {
        symbol,
        vest: { bid: 0, ask: 0 },
        lighter: { bid: 0, ask: 0 },
        paradex: { bid: 0, ask: 0 }
    };
}

/**
 * Fetch data from all exchanges and merge into cache
 */
async function updateMarketData() {
    console.log('[Aggregator] Fetching market data...');

    const cache = {};
    const getPair = (symbol) => {
        if (!cache[symbol]) {
            cache[symbol] = createPair(symbol);
        }
        return cache[symbol];
    };

    // Fetch from all exchanges in parallel
    const [lighterData, vestData, paradexData] = await Promise.all([
        fetchLighterMarkets(),
        fetchVestMarkets(),
        fetchParadexMarkets()
    ]);

    // Merge Lighter data
    lighterData.forEach(({ symbol, bid, ask }) => {
        const pair = getPair(symbol);
        pair.lighter.bid = bid;
        pair.lighter.ask = ask;
    });

    // Merge Vest data
    vestData.forEach(({ symbol, bid, ask }) => {
        const pair = getPair(symbol);
        pair.vest.bid = bid;
        pair.vest.ask = ask;
    });

    // Merge Paradex data
    paradexData.forEach(({ symbol, bid, ask }) => {
        const pair = getPair(symbol);
        pair.paradex.bid = bid;
        pair.paradex.ask = ask;
    });

    // Calculate spreads
    calculateSpreads(cache);

    // Update global cache
    PRICE_CACHE = cache;
    console.log(`[Aggregator] Completed. ${Object.keys(PRICE_CACHE).length} pairs.`);

    return cache;
}

/**
 * Get current price cache
 */
function getPriceCache() {
    return PRICE_CACHE;
}

/**
 * Start the automatic update scheduler
 */
function startScheduler() {
    // Initial update
    updateMarketData();

    // Schedule periodic updates
    updateInterval = setInterval(updateMarketData, UPDATE_INTERVAL);
    console.log(`[Aggregator] Scheduler started (interval: ${UPDATE_INTERVAL}ms)`);
}

/**
 * Stop the update scheduler
 */
function stopScheduler() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
}

module.exports = {
    updateMarketData,
    getPriceCache,
    startScheduler,
    stopScheduler
};
