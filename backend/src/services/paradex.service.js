/**
 * Paradex Exchange Service
 * Fetches perpetual futures data from Paradex API
 */

const axios = require('axios');
const { API_ENDPOINTS, isCrypto } = require('../config/exchanges');
const { COMMON_HEADERS, REQUEST_TIMEOUT } = require('../config');

/**
 * Fetch all perp markets from Paradex
 * @returns {Promise<Array>} Array of { symbol, bid, ask }
 */
async function fetchParadexMarkets() {
    try {
        const res = await axios.get(API_ENDPOINTS.PARADEX, {
            headers: COMMON_HEADERS,
            timeout: REQUEST_TIMEOUT
        });

        const markets = res.data.results || [];
        const result = [];

        markets.forEach(m => {
            if (m.symbol?.endsWith('-USD-PERP')) {
                const symbol = m.symbol.split('-')[0];

                if (!isCrypto(symbol)) return;

                const bid = parseFloat(m.bid || 0);
                const ask = parseFloat(m.ask || 0);

                if (bid > 0 && ask > 0) {
                    result.push({ symbol, bid, ask });
                }
            }
        });

        return result;
    } catch (error) {
        console.error('[Paradex] Error:', error.message);
        return [];
    }
}

module.exports = { fetchParadexMarkets };
