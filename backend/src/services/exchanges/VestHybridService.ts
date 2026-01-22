/**
 * Vest REST-Only Exchange Service
 * WebSocket disabled due to Cloudflare 530 errors
 * Uses REST polling exclusively for price data
 */

import axios from 'axios';
import { EventEmitter } from 'events';
import { MarketData } from './BaseExchangeService';
import { TimestampedPrice } from './HybridExchangeService';
import { logger } from '../../utils/logger';
import { API_ENDPOINTS } from '../../config/exchanges';
import { ALLOWED_SYMBOLS, COMMON_HEADERS, REQUEST_TIMEOUT, CONCURRENCY } from '../../config';
import { sleep } from '../../utils/sleep';

const TAG = 'Vest';

// REST polling interval (2 seconds)
const REST_POLL_INTERVAL = 2000;
const STALE_THRESHOLD = 30000;

class VestHybridService extends EventEmitter {
    readonly name = 'VEST';

    private priceCache: Map<string, TimestampedPrice> = new Map();
    private pollInterval: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;

    constructor() {
        super();
    }

    /**
     * Start REST-only service
     */
    async start(): Promise<void> {
        logger.info(TAG, '📡 Mode: REST ONLY (WS Disabled to avoid 530 errors)');

        // Do initial fetch
        await this.fetchAndUpdate();

        // Start polling
        this.isRunning = true;
        this.pollInterval = setInterval(() => {
            this.fetchAndUpdate();
        }, REST_POLL_INTERVAL);
    }

    /**
     * Stop the service
     */
    stop(): void {
        this.isRunning = false;
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        logger.info(TAG, 'Service stopped');
    }

    /**
     * Fetch prices via REST and emit updates
     */
    private async fetchAndUpdate(): Promise<void> {
        try {
            const markets = await this.fetchMarkets();
            const now = Date.now();

            markets.forEach(m => {
                const price: TimestampedPrice = {
                    symbol: m.symbol,
                    bid: m.bid,
                    ask: m.ask,
                    timestamp: now,
                    source: 'rest'
                };

                this.priceCache.set(m.symbol, price);
                this.emit('update', price);
            });

            // logger.debug(TAG, `REST update: ${markets.length} prices`);
        } catch (error: any) {
            logger.error(TAG, `REST fetch failed: ${error.message}`);
        }
    }

    /**
     * Get current market data
     */
    getMarkets(): MarketData[] {
        const now = Date.now();
        const valid: MarketData[] = [];

        this.priceCache.forEach((price) => {
            if (now - price.timestamp <= STALE_THRESHOLD) {
                valid.push({
                    symbol: price.symbol,
                    bid: price.bid,
                    ask: price.ask
                });
            }
        });

        return valid;
    }

    /**
     * Check if data is fresh
     */
    isDataFresh(symbol: string): boolean {
        const price = this.priceCache.get(symbol);
        if (!price) return false;
        return (Date.now() - price.timestamp) <= STALE_THRESHOLD;
    }

    /**
     * Get service stats
     */
    getStats() {
        const now = Date.now();
        let fresh = 0;
        let stale = 0;

        this.priceCache.forEach(price => {
            if (now - price.timestamp <= STALE_THRESHOLD) fresh++;
            else stale++;
        });

        return {
            fresh,
            stale,
            wsActive: false,  // WS is permanently disabled
            fallbackActive: true
        };
    }

    /**
     * Fetch markets via REST API
     */
    async fetchMarkets(): Promise<MarketData[]> {
        const results: MarketData[] = [];

        try {
            const res = await axios.get(API_ENDPOINTS.VEST_TICKER, {
                headers: COMMON_HEADERS,
                timeout: REQUEST_TIMEOUT
            });

            const tickers = res.data.tickers || [];
            const symbolsToFetch: { base: string; querySym: string }[] = [];

            tickers.forEach((t: any) => {
                if (t.symbol.endsWith('-PERP')) {
                    const baseSymbol = t.symbol.split('-')[0];
                    if (ALLOWED_SYMBOLS.includes(baseSymbol)) {
                        symbolsToFetch.push({ base: baseSymbol, querySym: t.symbol });
                    }
                }
            });

            // Fetch depth for each symbol in batches
            for (let i = 0; i < symbolsToFetch.length; i += CONCURRENCY) {
                const batch = symbolsToFetch.slice(i, i + CONCURRENCY);
                const batchResults = await Promise.all(
                    batch.map(item => this.fetchDepth(item.querySym).then(data => ({ base: item.base, data })))
                );

                batchResults.forEach(({ base, data }) => {
                    if (data && data.bid > 0 && data.ask > 0) {
                        results.push({ symbol: base, bid: data.bid, ask: data.ask });
                    }
                });

                await sleep(100);
            }
        } catch (error: any) {
            logger.error(TAG, `REST fetch failed: ${error.message}`);
        }

        return results;
    }

    private async fetchDepth(symbol: string): Promise<{ bid: number; ask: number } | null> {
        try {
            const url = `${API_ENDPOINTS.VEST_DEPTH}?symbol=${symbol}&limit=5`;
            const res = await axios.get(url, { headers: COMMON_HEADERS, timeout: 3000 });

            if (res.data?.bids?.length && res.data?.asks?.length) {
                return {
                    bid: parseFloat(res.data.bids[0][0] || 0),
                    ask: parseFloat(res.data.asks[0][0] || 0)
                };
            }
        } catch (e) { }
        return null;
    }
}

// Export singleton
export const vestHybridService = new VestHybridService();
export { VestHybridService };
