/**
 * Market Data Aggregator Service (V2 - Full WebSocket/Hybrid)
 * Orchestrates data collection from all exchanges and broadcasting
 * Refactored to Class-based Singleton
 */

import { getAllExchanges } from './exchanges';
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
const DB_SAVE_THROTTLE = 5000;
const BROADCAST_THROTTLE = 1000;

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

// WebSocket broadcaster type
type Broadcaster = (data: any) => void;

class AggregatorService {
    private priceCache: Record<string, AggregatedPair> = {};
    private wsBroadcaster: Broadcaster | null = null;
    private lastDbSave = new Map<string, number>();

    // Throttled broadcast state
    private lastBroadcastTime = 0;
    private broadcastPending = false;

    constructor() {
        this.initializeCache();
    }

    /**
     * Initialize empty pair structure for all allowed symbols
     */
    private initializeCache() {
        this.priceCache = {};
        ALLOWED_SYMBOLS.forEach(symbol => {
            this.priceCache[symbol] = this.createPair(symbol);
        });
        logger.info(TAG, `Initialized cache with ${Object.keys(this.priceCache).length} symbols`);
    }

    private createPair(symbol: string): AggregatedPair {
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

    private ensurePair(symbol: string): AggregatedPair | null {
        if (!ALLOWED_SYMBOLS.includes(symbol)) return null;

        if (!this.priceCache[symbol]) {
            this.priceCache[symbol] = this.createPair(symbol);
        }
        return this.priceCache[symbol];
    }

    private isFresh(timestamp: number): boolean {
        return timestamp > 0 && (Date.now() - timestamp) <= STALE_THRESHOLD;
    }

    /**
     * Start all services
     */
    public async start() {
        logger.info(TAG, 'Starting V2 Aggregator services...');

        // Re-initialize cache to be sure
        this.initializeCache();

        const exchanges = getAllExchanges();
        logger.info(TAG, `Starting ${exchanges.length} exchange services...`);

        await Promise.all(exchanges.map(async (service) => {
            try {
                const key = service.name.toLowerCase() as keyof AggregatedPair;
                service.on('update', (data) => this.handleUpdate(key, data));
                await service.start();
            } catch (error: any) {
                logger.error(TAG, `Failed to start ${service.name} service`, error);
                // Continue despite error
            }
        }));

        logger.info(TAG, '════════════════════════════════════════════════');
        logger.info(TAG, `✓ All ${exchanges.length} services started (or attempted)`);
        logger.info(TAG, '════════════════════════════════════════════════');
    }

    /**
     * Stop all services
     */
    public stop() {
        logger.info(TAG, 'Stopping all services...');
        getAllExchanges().forEach(service => service.stop());
        logger.info(TAG, 'All services stopped');
    }

    /**
     * Set WebSocket broadcaster
     */
    public setBroadcaster(broadcaster: Broadcaster) {
        this.wsBroadcaster = broadcaster;
        logger.info(TAG, 'WebSocket broadcaster registered');
    }

    /**
     * Get current price cache
     */
    public getCache() {
        const filtered: Record<string, AggregatedPair> = {};
        ALLOWED_SYMBOLS.forEach(symbol => {
            if (this.priceCache[symbol]) {
                filtered[symbol] = this.priceCache[symbol];
            }
        });
        return filtered;
    }

    /**
     * Get service stats
     */
    public getStats() {
        const stats: Record<string, any> = {};
        getAllExchanges().forEach(ex => {
            stats[ex.name.toLowerCase()] = ex.getStats();
        });
        return stats;
    }

    /**
     * Handle update from an exchange
     */
    private handleUpdate(exchangeName: keyof AggregatedPair, data: TimestampedPrice) {
        const pair = this.ensurePair(data.symbol);
        if (!pair) return;

        const target = pair[exchangeName] as ExchangePrice;
        if (target) {
            target.bid = data.bid;
            target.ask = data.ask;
            target.timestamp = data.timestamp;
            target.source = data.source;

            this.updateAndRecalculate();
        }
    }

    /**
     * Update cache and recalculate spreads
     */
    private updateAndRecalculate() {
        try {
            const now = Date.now();

            // Calculate spreads using only fresh data
            calculateSpreads(this.priceCache, (exchange: string, data: ExchangePrice) => {
                return this.isFresh(data.timestamp);
            });

            // Save to DB and check alerts
            Object.values(this.priceCache).forEach(pair => {
                this.handlePersistence(pair, now);
            });

            this.throttledBroadcast();
        } catch (e) {
            logger.error(TAG, 'Critical error in updateAndRecalculate', e);
        }
    }

    /**
     * Handle database saving and alerting
     */
    private handlePersistence(pair: AggregatedPair, now: number) {
        const lastSave = this.lastDbSave.get(pair.symbol) || 0;
        const shouldSave = (now - lastSave >= DB_SAVE_THROTTLE);

        if (shouldSave) {
            const exchanges = getAllExchanges();
            // 1. Save ALL valid combinations
            exchanges.forEach(bidExService => {
                const bidExName = bidExService.name.toLowerCase();
                const bidData = (pair as any)[bidExName] as ExchangePrice;

                if (!bidData || bidData.bid <= 0 || !this.isFresh(bidData.timestamp)) return;

                exchanges.forEach(askExService => {
                    const askExName = askExService.name.toLowerCase();
                    if (bidExName === askExName) return;

                    const askData = (pair as any)[askExName] as ExchangePrice;
                    if (!askData || askData.ask <= 0 || !this.isFresh(askData.timestamp)) return;

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

            this.lastDbSave.set(pair.symbol, now);
        }

        // 2. Alert logic (Keep on BEST spread only to avoid spam)
        if (pair.bestBid > 0 && pair.bestAsk > 0 && pair.realSpread >= ALERT_THRESHOLD) {
            saveAlert(pair).catch((err: any) => logger.error(TAG, 'Failed to save alert', err));
        }
    }

    /**
     * Throttled broadcast to clients
     */
    private throttledBroadcast() {
        if (this.broadcastPending) return;

        const now = Date.now();
        const timeSinceLast = now - this.lastBroadcastTime;

        if (timeSinceLast >= BROADCAST_THROTTLE) {
            this.performBroadcast();
        } else {
            this.broadcastPending = true;
            setTimeout(() => {
                this.performBroadcast();
                this.broadcastPending = false;
            }, BROADCAST_THROTTLE - timeSinceLast);
        }
    }

    private performBroadcast() {
        if (this.wsBroadcaster) {
            const dataToBroadcast = this.getCache();
            if (Object.keys(dataToBroadcast).length > 0) {
                this.wsBroadcaster(dataToBroadcast);
                this.lastBroadcastTime = Date.now();
            }
        }
    }

    /**
     * Force update from all exchanges (Manual Refresh)
     */
    public async forceUpdate() {
        const services = getAllExchanges();

        await Promise.all(services.map(async (service) => {
            try {
                const markets = await service.fetchMarkets();
                markets.forEach((m: any) => {
                    this.handleUpdate(service.name.toLowerCase() as keyof AggregatedPair, {
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

        return this.getCache();
    }
}

// Export Singleton Instance
export const aggregatorService = new AggregatorService();

// Export backwards-compatible wrappers
export function startScheduler() {
    return aggregatorService.start();
}

export function stopScheduler() {
    return aggregatorService.stop();
}

export function setWebSocketBroadcaster(broadcaster: Broadcaster) {
    return aggregatorService.setBroadcaster(broadcaster);
}

export function getPriceCache() {
    return aggregatorService.getCache();
}

export function getStats() {
    return aggregatorService.getStats();
}

export const getScans = getPriceCache;

export function updateMarketData() {
    return aggregatorService.forceUpdate();
}
