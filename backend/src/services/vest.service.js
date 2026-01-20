/**
 * Vest Exchange Service
 * Fetches perpetual futures data from Vest API
 */

const axios = require('axios');
const { API_ENDPOINTS, isCrypto } = require('../config/exchanges');
const { COMMON_HEADERS, REQUEST_TIMEOUT, CONCURRENCY } = require('../config');
const { sleep } = require('../utils/sleep');

/**
 * Fetch orderbook depth for a single symbol
 */
async function fetchVestDepth(symbol) {
    try {
        const url = `${API_ENDPOINTS.VEST_DEPTH}?symbol=${symbol}&limit=5`;
        const res = await axios.get(url, { headers: COMMON_HEADERS, timeout: 3000 });

        if (res.data?.bids?.length && res.data?.asks?.length) {
            return {
                bid: parseFloat(res.data.bids[0][0] || 0),
                ask: parseFloat(res.data.asks[0][0] || 0)
            };
        }
    } catch (e) { /* Silent fail */ }
    return null;
}

/**
 * Fetch all perp markets from Vest
 * @returns {Promise<Array>} Array of { symbol, bid, ask }
 */
async function fetchVestMarkets() {
    const results = [];

    try {
        // 1. Get list of symbols from ticker
        const res = await axios.get(API_ENDPOINTS.VEST_TICKER, {
            headers: COMMON_HEADERS,
            timeout: REQUEST_TIMEOUT
        });

        const tickers = res.data.tickers || [];
        const symbolsToFetch = [];

        tickers.forEach(t => {
            if (t.symbol.endsWith('-USD-PERP') || t.symbol.endsWith('-PERP')) {
                const symbol = t.symbol.split('-')[0];
                if (isCrypto(symbol)) {
                    symbolsToFetch.push({ base: symbol, querySym: t.symbol });
                }
            }
        });

        // 2. Fetch depth for each symbol in batches
        for (let i = 0; i < symbolsToFetch.length; i += CONCURRENCY) {
            const batch = symbolsToFetch.slice(i, i + CONCURRENCY);
            const batchResults = await Promise.all(
                batch.map(item =>
                    fetchVestDepth(item.querySym).then(data => ({ base: item.base, data }))
                )
            );

            batchResults.forEach(({ base, data }) => {
                if (data && data.bid > 0 && data.ask > 0) {
                    results.push({ symbol: base, bid: data.bid, ask: data.ask });
                }
            });

            await sleep(100); // Rate limiting
        }
    } catch (error) {
        console.error('[Vest] Error:', error.message);
    }

    return results;
}

module.exports = { fetchVestMarkets, fetchVestDepth };
