/**
 * Spread Calculation Service
 * Calculates arbitrage opportunities between exchanges
 */

const EXCHANGES = ['vest', 'lighter', 'paradex'];

/**
 * Calculate spread and profit for all pairs
 * @param {Object} cache - Price cache with all pairs
 * @returns {Object} Cache with spread calculations added
 */
function calculateSpreads(cache) {
    Object.values(cache).forEach(item => {
        let maxBid = 0, maxBidEx = null;
        let minAsk = Infinity, minAskEx = null;

        // Find best bid (highest) and best ask (lowest)
        EXCHANGES.forEach(ex => {
            const bid = item[ex]?.bid || 0;
            const ask = item[ex]?.ask || 0;

            if (bid > maxBid) {
                maxBid = bid;
                maxBidEx = ex.toUpperCase();
            }
            if (ask > 0 && ask < minAsk) {
                minAsk = ask;
                minAskEx = ex.toUpperCase();
            }
        });

        item.bestBid = maxBid;
        item.bestBidEx = maxBidEx;
        item.bestAsk = minAsk === Infinity ? 0 : minAsk;
        item.bestAskEx = minAskEx;

        // Calculate spread percentage
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

module.exports = { calculateSpreads };
