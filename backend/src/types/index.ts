/**
 * Core Types for Perp Arbitrage Scanner
 * V2: Added timestamps for stale data detection
 */

/**
 * Exchange price data (bid/ask) with optional timestamp
 */
export interface ExchangePrice {
    bid: number;
    ask: number;
    timestamp?: number;  // V2: When this data was received
    source?: 'ws' | 'rest' | 'none';  // V2: Data source
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

/**
 * V2: Timestamped price data
 */
export interface TimestampedPrice {
    symbol: string;
    bid: number;
    ask: number;
    timestamp: number;
    source: 'ws' | 'rest';
}

/**
 * V2: Service statistics
 */
export interface ServiceStats {
    fresh: number;
    stale: number;
    wsActive: boolean;
    fallbackActive: boolean;
}
