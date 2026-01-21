/**
 * Spread Service Tests
 * Critical business logic tests for arbitrage calculation
 */

import { calculateSpreads } from '../../src/services/spread.service';
import { PriceCache } from '../../src/types';

describe('calculateSpreads', () => {

    describe('Best Bid/Ask Detection', () => {
        test('should find highest bid across exchanges', () => {
            const cache: PriceCache = {
                BTC: {
                    symbol: 'BTC',
                    vest: { bid: 100000, ask: 100010 },
                    lighter: { bid: 100005, ask: 100015 },
                    paradex: { bid: 99990, ask: 100020 }
                }
            };

            calculateSpreads(cache);

            expect(cache.BTC.bestBid).toBe(100005);
            expect(cache.BTC.bestBidEx).toBe('LIGHTER');
        });

        test('should find lowest ask across exchanges', () => {
            const cache: PriceCache = {
                ETH: {
                    symbol: 'ETH',
                    vest: { bid: 3000, ask: 3005 },
                    lighter: { bid: 2998, ask: 3010 },
                    paradex: { bid: 2995, ask: 3002 }
                }
            };

            calculateSpreads(cache);

            expect(cache.ETH.bestAsk).toBe(3002);
            expect(cache.ETH.bestAskEx).toBe('PARADEX');
        });
    });

    describe('Spread Calculation', () => {
        test('should calculate positive spread correctly', () => {
            const cache: PriceCache = {
                SOL: {
                    symbol: 'SOL',
                    vest: { bid: 0, ask: 100 },      // Best ask
                    lighter: { bid: 101, ask: 0 },   // Best bid
                    paradex: { bid: 0, ask: 0 }
                }
            };

            calculateSpreads(cache);

            // Spread = (101 - 100) / 100 * 100 = 1%
            expect(cache.SOL.realSpread).toBeCloseTo(1.0, 2);
        });

        test('should calculate negative spread (no arb opportunity)', () => {
            const cache: PriceCache = {
                DOGE: {
                    symbol: 'DOGE',
                    vest: { bid: 100, ask: 102 },
                    lighter: { bid: 99, ask: 101 },
                    paradex: { bid: 98, ask: 103 }
                }
            };

            calculateSpreads(cache);

            expect(cache.DOGE.realSpread).toBeLessThan(0);
        });

        test('should calculate fractional spread precisely', () => {
            const cache: PriceCache = {
                XRP: {
                    symbol: 'XRP',
                    vest: { bid: 0.5001, ask: 0.5002 },
                    lighter: { bid: 0.5003, ask: 0.5004 },
                    paradex: { bid: 0.5000, ask: 0.5005 }
                }
            };

            calculateSpreads(cache);
            expect(cache.XRP.realSpread).toBeCloseTo(0.02, 1);
        });
    });

    describe('Edge Cases', () => {
        test('should handle zero prices gracefully', () => {
            const cache: PriceCache = {
                XYZ: {
                    symbol: 'XYZ',
                    vest: { bid: 0, ask: 0 },
                    lighter: { bid: 0, ask: 0 },
                    paradex: { bid: 0, ask: 0 }
                }
            };

            calculateSpreads(cache);

            expect(cache.XYZ.realSpread).toBe(-999);
            expect(cache.XYZ.potentialProfit).toBe(0);
        });

        test('should handle single exchange with data', () => {
            const cache: PriceCache = {
                UNI: {
                    symbol: 'UNI',
                    vest: { bid: 10, ask: 11 },
                    lighter: { bid: 0, ask: 0 },
                    paradex: { bid: 0, ask: 0 }
                }
            };

            calculateSpreads(cache);

            expect(cache.UNI.bestBid).toBe(10);
            expect(cache.UNI.bestAsk).toBe(11);
        });
    });

    describe('Profit Calculation', () => {
        test('should calculate potential profit for $1000 trade', () => {
            const cache: PriceCache = {
                AVAX: {
                    symbol: 'AVAX',
                    vest: { bid: 0, ask: 40 },
                    lighter: { bid: 41, ask: 0 },
                    paradex: { bid: 0, ask: 0 }
                }
            };

            calculateSpreads(cache);

            expect(cache.AVAX.potentialProfit).toBeGreaterThan(20);
            expect(cache.AVAX.potentialProfit).toBeLessThan(25);
        });
    });
});
