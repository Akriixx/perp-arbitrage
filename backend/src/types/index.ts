/**
 * Core Types for Perp Arbitrage Scanner
 */

/**
 * Exchange price data (bid/ask)
 */
export interface ExchangePrice {
    bid: number;
    ask: number;
}

/**
 * Market pair with prices from all exchanges
 */
export interface Pair {
    symbol: string;
    vest: ExchangePrice;
    lighter: ExchangePrice;
    paradex: ExchangePrice;

    // Calculated fields (after calculateSpreads)
    bestBid?: number;
    bestBidEx?: ExchangeName;
    bestAsk?: number;
    bestAskEx?: ExchangeName;
    realSpread?: number;
    potentialProfit?: number;
}

/**
 * Price cache - map of symbol to pair data
 */
export interface PriceCache {
    [symbol: string]: Pair;
}

/**
 * Exchange names
 */
export type ExchangeName = 'VEST' | 'LIGHTER' | 'PARADEX';

/**
 * API response from /api/scans
 */
export interface ScansResponse {
    pairs: Pair[];
}

/**
 * Raw market data from exchange API
 */
export interface RawMarketData {
    symbol: string;
    bid: number;
    ask: number;
}

/**
 * Configuration constants
 */
export interface Config {
    PORT: number;
    UPDATE_INTERVAL: number;
    DB_SAVE_INTERVAL: number;
    CONCURRENCY: number;
    REQUEST_TIMEOUT: number;
    COMMON_HEADERS: Record<string, string>;
}
