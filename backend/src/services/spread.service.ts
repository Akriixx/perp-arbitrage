/**
 * Spread Calculation Service
 * Calculates arbitrage opportunities between exchanges
 */

import { PriceCache, Pair, ExchangeName } from '../types';

const EXCHANGES: string[] = ['vest', 'lighter', 'paradex'];

/**
 * Calculate spread and profit for all pairs
 * @param cache - Price cache with all pairs
 * @returns Cache with spread calculations added
 */
export function calculateSpreads(cache: PriceCache): PriceCache {
    Object.values(cache).forEach((item: Pair) => {
        let maxBid = 0;
        let maxBidEx: ExchangeName | null = null;
        let minAsk = Infinity;
        let minAskEx: ExchangeName | null = null;

        // Find best bid (highest) and best ask (lowest)
        EXCHANGES.forEach((ex) => {
            // @ts-ignore
            const exchangeData = item[ex];
            const bid = exchangeData?.bid || 0;
            const ask = exchangeData?.ask || 0;

            if (bid > maxBid) {
                maxBid = bid;
                maxBidEx = ex.toUpperCase() as ExchangeName;
            }
            if (ask > 0 && ask < minAsk) {
                minAsk = ask;
                minAskEx = ex.toUpperCase() as ExchangeName;
            }
        });

        item.bestBid = maxBid;
        item.bestBidEx = maxBidEx || undefined;
        item.bestAsk = minAsk === Infinity ? 0 : minAsk;
        item.bestAskEx = minAskEx || undefined;

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
