/**
 * Market Data Aggregator Service (WebSocket Version)
 * Combines real-time data from WebSocket streams and manages the price cache
 */

const ParadexWebSocketService = require('./paradex.websocket');
const { fetchLighterMarkets } = require('./lighter.service');
const { fetchVestMarkets } = require('./vest.service');
const { calculateSpreads } = require('./spread.service');
const { ALLOWED_SYMBOLS } = require('../config');
const { saveSpread } = require('../db/database');
const { saveAlert } = require('./alert.service');

// Constants
const ALERT_THRESHOLD = 0.5; // Log alerts for spreads > 0.5%

// Global price cache
let PRICE_CACHE = {};

// WebSocket broadcaster (set by index.js)
let wsBroadcaster = null;

// WebSocket instances
let paradexWS = null;
let vestInterval = null;
let lighterInterval = null;

// Track last DB save per symbol to prevent bloat
const lastDbSave = new Map();
const DB_SAVE_THROTTLE = 5000; // 5 seconds (Increased for higher resolution 24h chart)


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
 * Ensure pair exists in cache
 */
function ensurePair(symbol) {
    if (!ALLOWED_SYMBOLS.includes(symbol)) return null;

    if (!PRICE_CACHE[symbol]) {
        PRICE_CACHE[symbol] = createPair(symbol);
    }
    return PRICE_CACHE[symbol];
}

/**
 * Update cache and recalculate spreads
 */
function updateAndRecalculate() {
    calculateSpreads(PRICE_CACHE);

    // Save to DB and check for alerts
    Object.values(PRICE_CACHE).forEach(pair => {
        if (pair.bestBid > 0 && pair.bestAsk > 0) {
            // Save metric (Throttled: Max once per minute per symbol)
            const now = Date.now();
            const lastSave = lastDbSave.get(pair.symbol) || 0;

            if (now - lastSave >= DB_SAVE_THROTTLE) {
                saveSpread({
                    symbol: pair.symbol,
                    spread: pair.realSpread,
                    bestBid: pair.bestBid,
                    bestAsk: pair.bestAsk,
                    bestBidEx: pair.bestBidEx,
                    bestAskEx: pair.bestAskEx
                });
                lastDbSave.set(pair.symbol, now);
            }


            // Check for Alert
            if (pair.realSpread >= ALERT_THRESHOLD) {
                saveAlert(pair).catch(err => console.error("Failed to save alert:", err));
            }
        }
    });



    // NOTE: Broadcasting is now handled by a fixed interval in startScheduler
    // to prevent flooding the frontend with micro-updates from Paradex WS
}

/**
 * Handle Paradex WebSocket data
 */
function handleParadexData(markets) {
    markets.forEach(({ symbol, bid, ask }) => {
        const pair = ensurePair(symbol);
        if (!pair) return;

        pair.paradex.bid = bid;
        pair.paradex.ask = ask;
    });

    updateAndRecalculate();
}

/**
 * Fetch Vest data (REST - poll every 1 second)
 */
async function updateVestData() {
    try {
        const vestData = await fetchVestMarkets();

        vestData.forEach(({ symbol, bid, ask }) => {
            const pair = ensurePair(symbol);
            if (!pair) return;

            pair.vest.bid = bid;
            pair.vest.ask = ask;
        });

        updateAndRecalculate();
    } catch (error) {
        console.error('[Aggregator] Error fetching Vest data:', error.message);
    }
}

/**
 * Fetch Lighter data (REST - poll every 2 seconds)
 */
async function updateLighterData() {
    try {
        const lighterData = await fetchLighterMarkets();

        lighterData.forEach(({ symbol, bid, ask }) => {
            const pair = ensurePair(symbol);
            if (!pair) return;

            pair.lighter.bid = bid;
            pair.lighter.ask = ask;
        });

        updateAndRecalculate();
    } catch (error) {
        console.error('[Aggregator] Error fetching Lighter data:', error.message);
    }
}

/**
 * Get current price cache
 */
function getPriceCache() {
    // Filter to ensure only currently allowed symbols are returned
    const filtered = {};
    ALLOWED_SYMBOLS.forEach(symbol => {
        if (PRICE_CACHE[symbol]) {
            filtered[symbol] = PRICE_CACHE[symbol];
        }
    });
    return filtered;
}

/**
 * Start WebSocket connections and schedulers
 */
function startScheduler() {
    console.log('[Aggregator] Starting services...');

    // Initialize cache with ONLY allowed symbols (Clear any previous stale data)
    PRICE_CACHE = {};
    ALLOWED_SYMBOLS.forEach(symbol => {
        PRICE_CACHE[symbol] = createPair(symbol);
    });
    console.log(`[Aggregator] Initialized cache with ${Object.keys(PRICE_CACHE).length} symbols: ${ALLOWED_SYMBOLS.join(', ')}`);


    // Start Paradex WebSocket
    paradexWS = new ParadexWebSocketService();
    paradexWS.on('data', handleParadexData);
    paradexWS.on('error', (error) => {
        console.error('[Aggregator] Paradex WebSocket error:', error.message);
    });
    paradexWS.connect();

    // Start Lighter REST polling (5 seconds interval)
    console.log('[Aggregator] Starting Lighter REST polling (5s)');
    updateLighterData(); // Initial fetch
    if (lighterInterval) clearInterval(lighterInterval);
    lighterInterval = setInterval(updateLighterData, 5000);

    // Start Vest REST polling (5 seconds interval)
    console.log('[Aggregator] Starting Vest REST polling (5s)');
    updateVestData(); // Initial fetch
    if (vestInterval) clearInterval(vestInterval);
    vestInterval = setInterval(updateVestData, 5000);

    // Start Broadcast Interval (5 seconds) - Throttling updates
    console.log('[Aggregator] Starting Broadcast Interval (5s throttle)');
    if (global.broadcastInterval) clearInterval(global.broadcastInterval);
    global.broadcastInterval = setInterval(() => {
        if (wsBroadcaster) {
            const dataToBroadcast = getPriceCache();
            if (Object.keys(dataToBroadcast).length > 0) {
                wsBroadcaster(dataToBroadcast);
            }
        }
    }, 5000);


    console.log('[Aggregator] All services started');
}

/**
 * Stop all connections and schedulers
 */
function stopScheduler() {
    console.log('[Aggregator] Stopping all connections...');

    if (paradexWS) {
        paradexWS.disconnect();
        paradexWS = null;
    }

    if (lighterInterval) {
        clearInterval(lighterInterval);
        lighterInterval = null;
    }

    if (vestInterval) {
        clearInterval(vestInterval);
        vestInterval = null;
    }

    if (global.broadcastInterval) {
        clearInterval(global.broadcastInterval);
        global.broadcastInterval = null;
    }
}

/**
 * Set WebSocket broadcaster function
 */
function setWebSocketBroadcaster(broadcaster) {
    wsBroadcaster = broadcaster;
    console.log('[Aggregator] WebSocket broadcaster registered');
}

module.exports = {
    getPriceCache,
    startScheduler,
    stopScheduler,
    setWebSocketBroadcaster,
    getScans: getPriceCache
};
