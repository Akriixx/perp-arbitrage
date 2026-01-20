/**
 * Arbitrage Scanner Server
 * Fetches prices from Paradex, Vest, and Lighter exchanges
 * Calculates arbitrage opportunities and serves data via API
 */

const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = 3000;
const UPDATE_INTERVAL = 20000; // 20 seconds
const DB_SAVE_INTERVAL = 60000; // 1 minute
const CONCURRENCY = 5; // Max parallel requests
const REQUEST_TIMEOUT = 10000;

const COMMON_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
};

// API Endpoints
const API = {
    PARADEX: 'https://api.prod.paradex.trade/v1/markets/summary?market=ALL',
    VEST_TICKER: 'https://server-prod.hz.vestmarkets.com/v2/ticker/24hr',
    VEST_DEPTH: 'https://server-prod.hz.vestmarkets.com/v2/depth',
    LIGHTER: 'https://mainnet.zklighter.elliot.ai/api/v1/orderBookDetails'
};

// Blacklist: Stock tickers, FX pairs, indices (not crypto)
const NON_CRYPTO_SYMBOLS = new Set([
    // Stocks
    'AAPL', 'AMD', 'AMZN', 'ARM', 'ASTS', 'BA', 'BABA', 'BITF', 'BMNR', 'CAT',
    'CC', 'CIFR', 'CLSK', 'COAI', 'COIN', 'CRCL', 'CRML', 'CVS', 'GLXY', 'GM',
    'GME', 'GOOG', 'HOOD', 'HRZN', 'IBIT', 'INTC', 'IONQ', 'JOBY', 'JPM',
    'KO', 'LCID', 'LLY', 'LUNR', 'MA', 'MARA', 'MCD', 'META', 'MSTR', 'NDAQ',
    'NKE', 'NVDA', 'PLTR', 'PYPL', 'QQQ', 'RDDT', 'REMX', 'RIOT', 'RKLB',
    'ROKU', 'SHOP', 'SLV', 'SMCI', 'SNAP', 'SOFI', 'SPX', 'SPY', 'SQ', 'SVMH',
    'TIGR', 'TSLA', 'TSM', 'UBER', 'UNH', 'V', 'VZ', 'WMT', 'XOM', 'ZG',
    // FX pairs
    'AUD', 'AUDUSD', 'CAD', 'CHF', 'EUR', 'EURUSD', 'GBP', 'GBPUSD', 'JPY',
    'NZD', 'USD', 'USDJPY', 'USDCAD', 'USDCHF',
    // Indices
    'DXY', 'SPX', 'NDX', 'VIX'
]);

// Check if symbol is crypto (not in blacklist)
const isCrypto = (symbol) => !NON_CRYPTO_SYMBOLS.has(symbol.toUpperCase());

// ============================================================================
// DATABASE SETUP
// ============================================================================

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.run(`CREATE TABLE IF NOT EXISTS price_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER,
    symbol TEXT,
    vest_bid REAL,
    vest_ask REAL,
    lighter_bid REAL,
    lighter_ask REAL,
    paradex_bid REAL,
    paradex_ask REAL,
    best_bid_exchange TEXT,
    best_ask_exchange TEXT,
    real_spread REAL,
    potential_profit REAL
)`);

// ============================================================================
// GLOBAL STATE
// ============================================================================

let PRICE_CACHE = {};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================================
// API FETCHERS
// ============================================================================

/**
 * Fetch orderbook depth from Vest exchange
 */
async function fetchVestDepth(symbol) {
    try {
        const url = `${API.VEST_DEPTH}?symbol=${symbol}&limit=5`;
        const res = await axios.get(url, { headers: COMMON_HEADERS, timeout: 3000 });

        if (res.data?.bids?.length && res.data?.asks?.length) {
            return {
                bid: parseFloat(res.data.bids[0][0] || 0),
                ask: parseFloat(res.data.asks[0][0] || 0)
            };
        }
    } catch (e) { /* Silent fail, return null */ }
    return null;
}

/**
 * Fetch all market data from all exchanges
 */
async function fetchAllMarketData() {
    const cache = {};

    const getPair = (symbol) => {
        if (!cache[symbol]) {
            cache[symbol] = {
                symbol,
                vest: { bid: 0, ask: 0 },
                lighter: { bid: 0, ask: 0 },
                paradex: { bid: 0, ask: 0 }
            };
        }
        return cache[symbol];
    };

    // 1. LIGHTER - Bulk fetch (use last_trade_price as estimate)
    try {
        const res = await axios.get(API.LIGHTER, { timeout: REQUEST_TIMEOUT });
        const markets = res.data.order_book_details || [];

        markets.forEach(m => {
            if (m.market_type === 'perp' && m.status === 'active') {
                const sym = m.symbol.split('-')[0];
                if (!isCrypto(sym)) return; // Skip non-crypto
                const p = getPair(sym);
                const lastPrice = parseFloat(m.last_trade_price || 0);
                if (lastPrice > 0) {
                    p.lighter.bid = lastPrice;
                    p.lighter.ask = lastPrice;
                }
            }
        });
    } catch (e) {
        console.error("[Lighter] Error:", e.message);
    }

    // 2. VEST - Get symbols first, then fetch depth
    const vestSymbols = [];
    try {
        const res = await axios.get(API.VEST_TICKER, { headers: COMMON_HEADERS, timeout: REQUEST_TIMEOUT });
        const tickers = res.data.tickers || [];

        tickers.forEach(t => {
            if (t.symbol.endsWith('-USD-PERP') || t.symbol.endsWith('-PERP')) {
                const sym = t.symbol.split('-')[0];
                if (!isCrypto(sym)) return; // Skip non-crypto
                getPair(sym);
                vestSymbols.push({ base: sym, querySym: t.symbol });
            }
        });
    } catch (e) {
        console.error("[Vest] Ticker error:", e.message);
    }

    // Fetch Vest depth in batches
    for (let i = 0; i < vestSymbols.length; i += CONCURRENCY) {
        const batch = vestSymbols.slice(i, i + CONCURRENCY);
        const results = await Promise.all(
            batch.map(item =>
                fetchVestDepth(item.querySym).then(data => ({ base: item.base, data }))
            )
        );

        results.forEach(({ base, data }) => {
            if (data && data.bid > 0 && data.ask > 0) {
                const p = getPair(base);
                p.vest.bid = data.bid;
                p.vest.ask = data.ask;
            }
        });

        await sleep(100); // Rate limiting
    }

    // 3. PARADEX - Bulk fetch
    try {
        const res = await axios.get(API.PARADEX, { headers: COMMON_HEADERS, timeout: REQUEST_TIMEOUT });
        const markets = res.data.results || [];

        markets.forEach(m => {
            if (m.symbol?.endsWith('-USD-PERP')) {
                const sym = m.symbol.split('-')[0];
                const bid = parseFloat(m.bid || 0);
                const ask = parseFloat(m.ask || 0);

                if (bid > 0 && ask > 0) {
                    const p = getPair(sym);
                    p.paradex.bid = bid;
                    p.paradex.ask = ask;
                }
            }
        });
    } catch (e) {
        console.error("[Paradex] Error:", e.message);
    }

    return cache;
}

/**
 * Calculate spread and profit for each pair
 */
function calculateSpreads(cache) {
    const exchanges = ['VEST', 'LIGHTER', 'PARADEX'];

    Object.values(cache).forEach(item => {
        // Find best bid (highest) and best ask (lowest)
        let maxBid = 0, maxBidEx = null;
        let minAsk = Infinity, minAskEx = null;

        exchanges.forEach(ex => {
            const exKey = ex.toLowerCase();
            const bid = item[exKey]?.bid || 0;
            const ask = item[exKey]?.ask || 0;

            if (bid > maxBid) { maxBid = bid; maxBidEx = ex; }
            if (ask > 0 && ask < minAsk) { minAsk = ask; minAskEx = ex; }
        });

        item.bestBid = maxBid;
        item.bestBidEx = maxBidEx;
        item.bestAsk = minAsk === Infinity ? 0 : minAsk;
        item.bestAskEx = minAskEx;

        // Calculate spread and profit
        if (item.bestBid > 0 && item.bestAsk > 0) {
            item.realSpread = ((item.bestBid - item.bestAsk) / item.bestAsk) * 100;

            // Profit calculation for $1000 trade (0.1% fee per side)
            const units = 1000 / item.bestAsk;
            const grossSale = units * item.bestBid;
            const fees = (1000 * 0.001) + (grossSale * 0.001);
            item.potentialProfit = grossSale - fees - 1000;
        } else {
            item.realSpread = -999;
            item.potentialProfit = 0;
        }
    });

    return cache;
}

/**
 * Main update loop
 */
async function updateMarketData() {
    console.log("[Update] Fetching market data...");

    const rawData = await fetchAllMarketData();
    const processedData = calculateSpreads(rawData);

    PRICE_CACHE = processedData;
    console.log(`[Update] Completed. ${Object.keys(PRICE_CACHE).length} pairs.`);
}

// ============================================================================
// DATABASE PERSISTENCE
// ============================================================================

function saveTopPairsToDb() {
    const pairs = Object.values(PRICE_CACHE)
        .filter(p => p.realSpread > -10)
        .sort((a, b) => b.realSpread - a.realSpread)
        .slice(0, 5);

    if (pairs.length === 0) return;

    const timestamp = Date.now();
    const stmt = db.prepare(`
        INSERT INTO price_metrics 
        (timestamp, symbol, vest_bid, vest_ask, lighter_bid, lighter_ask, 
         paradex_bid, paradex_ask, best_bid_exchange, best_ask_exchange, 
         real_spread, potential_profit) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    pairs.forEach(p => {
        stmt.run(
            timestamp, p.symbol,
            p.vest.bid, p.vest.ask,
            p.lighter.bid, p.lighter.ask,
            p.paradex.bid, p.paradex.ask,
            p.bestBidEx, p.bestAskEx,
            p.realSpread, p.potentialProfit
        );
    });

    stmt.finalize();
}

// ============================================================================
// EXPRESS SERVER & API ROUTES
// ============================================================================

const app = express();
app.use(express.static('public'));

// Get all current pairs with prices
app.get('/api/scans', (req, res) => {
    res.json({ pairs: Object.values(PRICE_CACHE) });
});

// Get spread history for a symbol
app.get('/api/spread-history', (req, res) => {
    const { symbol, period } = req.query;
    // TODO: Implement history retrieval from database
    res.json({ history: [] });
});

// ============================================================================
// START SERVER
// ============================================================================

// Initial data fetch
updateMarketData();

// Schedule periodic updates
setInterval(updateMarketData, UPDATE_INTERVAL);
setInterval(saveTopPairsToDb, DB_SAVE_INTERVAL);

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
