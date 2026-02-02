/**
 * Market Data Aggregator Service (V2 - Full WebSocket/Hybrid)
 * Orchestrates data collection from all exchanges and broadcasting
 * Refactored to TypeScript
 */

import { getAllExchanges, nadoService, vestService, lighterService, paradexService, extendedService } from './exchanges';
import { TimestampedPrice } from './exchanges/HybridExchangeService';
import { ALLOWED_SYMBOLS } from '../config';
import { logger } from '../utils/app-logger';

import { calculateSpreads } from './spread.service';
import { saveSpread } from '../db/database';
import { saveAlert } from './alert.service';

const TAG = 'Aggregator';

// Constants
const ALERT_THRESHOLD = 0.5; // Log alerts for spreads > 0.5%
const STALE_THRESHOLD = 30000; // 30 seconds - data older than this is invalid

// Types
interface ExchangePrice {
    bid: number;
    ask: number;
    timestamp: number;
    source: string;
}

export interface AggregatedPair {
    symbol: string;
    vest: ExchangePrice;
    lighter: ExchangePrice;
    paradex: ExchangePrice;
    extended: ExchangePrice;
    nado: ExchangePrice;
    zeroone: ExchangePrice;

    // Calculated fields
    bestBid: number;
    bestAsk: number;
    bestBidEx?: string;
    bestAskEx?: string;
    realSpread: number;
    potentialProfit?: number;
}

// Global price cache
let PRICE_CACHE: Record<string, AggregatedPair> = {};

// WebSocket broadcaster
type Broadcaster = (data: any) => void;
let wsBroadcaster: Broadcaster | null = null;

// Track last DB save per symbol
const lastDbSave = new Map<string, number>();
const DB_SAVE_THROTTLE = 5000;

// Throttled broadcast state
let lastBroadcastTime = 0;
const BROADCAST_THROTTLE = 1000;
let broadcastPending = false;

/**
 * Create empty pair structure
 */
function createPair(symbol: string): AggregatedPair {
    const pair: any = {
        symbol,
        bestBid: 0,
        bestAsk: 0,
        realSpread: 0
    };

    // Initialize all registered exchanges
    getAllExchanges().forEach(ex => {
        pair[ex.name.toLowerCase()] = { bid: 0, ask: 0, timestamp: 0, source: 'none' };
    });

    return pair as AggregatedPair;
}

/**
 * Ensure pair exists in cache
 */
function ensurePair(symbol: string): AggregatedPair | null {
    if (!ALLOWED_SYMBOLS.includes(symbol)) return null;

    if (!PRICE_CACHE[symbol]) {
        PRICE_CACHE[symbol] = createPair(symbol);
    }
    return PRICE_CACHE[symbol];
}

/**
 * Check if data is fresh
 */
function isFresh(timestamp: number): boolean {
    return timestamp > 0 && (Date.now() - timestamp) <= STALE_THRESHOLD;
}

/**
 * Throttled broadcast to clients
 */
function throttledBroadcast() {
    if (broadcastPending) return;

    const now = Date.now();
    const timeSinceLast = now - lastBroadcastTime;

    if (timeSinceLast >= BROADCAST_THROTTLE) {
        performBroadcast();
    } else {
        broadcastPending = true;
        setTimeout(() => {
            performBroadcast();
            broadcastPending = false;
        }, BROADCAST_THROTTLE - timeSinceLast);
    }
}

function performBroadcast() {
    if (wsBroadcaster) {
        const dataToBroadcast = getPriceCache();
        if (Object.keys(dataToBroadcast).length > 0) {
            wsBroadcaster(dataToBroadcast);
            lastBroadcastTime = Date.now();
        }
    }
}

/**
 * Update cache and recalculate spreads
 */
function updateAndRecalculate() {
    try {
        const now = Date.now();

        // Calculate spreads using only fresh data
        // Note: calculateSpreads modifies the cache object in place
        calculateSpreads(PRICE_CACHE, (exchange: string, data: ExchangePrice) => {
            return isFresh(data.timestamp);
        });

        // Save to DB (ALL combinations) and check for alerts (Best only)
        Object.values(PRICE_CACHE).forEach(pair => {
            const lastSave = lastDbSave.get(pair.symbol) || 0;
            const shouldSave = (now - lastSave >= DB_SAVE_THROTTLE);

            if (shouldSave) {
                const exchanges = getAllExchanges();
                // 1. Save ALL valid combinations
                exchanges.forEach(bidExService => {
                    const bidExName = bidExService.name.toLowerCase();
                    const bidData = (pair as any)[bidExName] as ExchangePrice;

                    if (!bidData || bidData.bid <= 0 || !isFresh(bidData.timestamp)) return;

                    exchanges.forEach(askExService => {
                        const askExName = askExService.name.toLowerCase();
                        if (bidExName === askExName) return;

                        const askData = (pair as any)[askExName] as ExchangePrice;
                        if (!askData || askData.ask <= 0 || !isFresh(askData.timestamp)) return;

                        // Calculate spread for this specific combo
                        const spread = ((bidData.bid - askData.ask) / askData.ask) * 100;

                        // Save record
                        saveSpread({
                            symbol: pair.symbol,
                            spread: spread,
                            bestBid: bidData.bid,
                            bestAsk: askData.ask,
                            bestBidEx: bidExService.name.toUpperCase(),
                            bestAskEx: askExService.name.toUpperCase()
                        });
                    });
                });

                lastDbSave.set(pair.symbol, now);
            }

            // 2. Alert logic (Keep on BEST spread only to avoid spam)
            if (pair.bestBid > 0 && pair.bestAsk > 0 && pair.realSpread >= ALERT_THRESHOLD) {
                saveAlert(pair).catch((err: any) => logger.error(TAG, 'Failed to save alert', err));
            }
        });

        throttledBroadcast();
    } catch (e) {
        logger.error(TAG, 'Critical error in updateAndRecalculate', e);
    }
}

/**
 * Generic handler for all exchange updates
 */
function handleUpdate(exchangeName: keyof AggregatedPair, data: TimestampedPrice) {
    const pair = ensurePair(data.symbol);
    if (!pair) return;

    const target = pair[exchangeName] as ExchangePrice;
    if (target) {
        target.bid = data.bid;
        target.ask = data.ask;
        target.timestamp = data.timestamp;
        target.source = data.source;

        updateAndRecalculate();
    }
}

// ==================== Public API ====================

/**
 * Get current price cache
 */
export function getPriceCache() {
    const filtered: Record<string, AggregatedPair> = {};
    ALLOWED_SYMBOLS.forEach(symbol => {
        if (PRICE_CACHE[symbol]) {
            filtered[symbol] = PRICE_CACHE[symbol];
        }
    });
    return filtered;
}

/**
 * Get service stats
 */
export function getStats() {
    const stats: Record<string, any> = {};
    getAllExchanges().forEach(ex => {
        stats[ex.name.toLowerCase()] = ex.getStats();
    });
    return stats;
}

/**
 * Start all services
 */
export async function startScheduler() {
    logger.info(TAG, 'Starting V2 Aggregator services...');

    // Initialize cache
    PRICE_CACHE = {};
    ALLOWED_SYMBOLS.forEach(symbol => {
        PRICE_CACHE[symbol] = createPair(symbol);
    });
    logger.info(TAG, `Initialized cache with ${Object.keys(PRICE_CACHE).length} symbols`);

    // Dynamic Start
    const exchanges = getAllExchanges();
    for (const service of exchanges) {
        const key = service.name.toLowerCase() as keyof AggregatedPair; // e.g. 'vest'
        service.on('update', (data) => handleUpdate(key, data));
        await service.start();
    }

    logger.info(TAG, '════════════════════════════════════════════════');
    logger.info(TAG, `✓ All ${exchanges.length} services started`);
    logger.info(TAG, '════════════════════════════════════════════════');
}

/**
 * Stop all services
 */
export function stopScheduler() {
    logger.info(TAG, 'Stopping all services...');
    getAllExchanges().forEach(service => service.stop());
    logger.info(TAG, 'All services stopped');
}

/**
 * Set WebSocket broadcaster
 */
export function setWebSocketBroadcaster(broadcaster: Broadcaster) {
    wsBroadcaster = broadcaster;
    logger.info(TAG, 'WebSocket broadcaster registered');
}

// Alias for getPriceCache to match API expectation
export const getScans = getPriceCache;

/**
 * Force update from all exchanges (Manual Refresh)
 */
export async function updateMarketData() {
    const services = getAllExchanges();

    await Promise.all(services.map(async (service) => {
        try {
            const markets = await service.fetchMarkets();
            markets.forEach((m: any) => {
                handleUpdate(service.name.toLowerCase() as keyof AggregatedPair, {
                    symbol: m.symbol,
                    bid: m.bid,
                    ask: m.ask,
                    timestamp: Date.now(),
                    source: 'manual'
                });
            });
        } catch (e) {
            logger.error(TAG, `Manual refresh failed for ${service.name}`, e);
        }
    }));

    return getPriceCache();
}
