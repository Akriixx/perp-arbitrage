/**
 * Lighter Exchange Service
 * Fetches perpetual futures data from Lighter API
 */

const axios = require('axios');
const { API_ENDPOINTS, isCrypto } = require('../config/exchanges');
const { REQUEST_TIMEOUT } = require('../config');

/**
 * Fetch all perp markets from Lighter
 * Uses last_trade_price as approximate bid/ask
 * @returns {Promise<Array>} Array of { symbol, bid, ask }
 */
async function fetchLighterMarkets() {
    try {
        const res = await axios.get(API_ENDPOINTS.LIGHTER, { timeout: REQUEST_TIMEOUT });
        const markets = res.data.order_book_details || [];
        const results = [];

        markets.forEach(m => {
            if (m.market_type === 'perp' && m.status === 'active') {
                const symbol = m.symbol.split('-')[0];

                if (!isCrypto(symbol)) return;

                const lastPrice = parseFloat(m.last_trade_price || 0);
                if (lastPrice > 0) {
                    results.push({
                        symbol,
                        bid: lastPrice,
                        ask: lastPrice
                    });
                }
            }
        });

        return results;
    } catch (error) {
        console.error('[Lighter] Error:', error.message);
        return [];
    }
}

module.exports = { fetchLighterMarkets };
