
import { HybridExchangeService, HybridConfig, TimestampedPrice } from './HybridExchangeService';
import { MarketData } from './BaseExchangeService';
import axios from 'axios';
import WebSocket from 'ws';
import { logger } from '../../utils/app-logger';

interface ZeroOneMarket {
    marketId: number;
    symbol: string; // e.g. "BTCUSD"
    priceDecimals: number;
    sizeDecimals: number;
}

interface ZeroOneStats {
    indexPrice: number;
    volumeBase24h: number;
}

interface ZeroOneCandle {
    res: string;
    mid: number;
    t: number;
    o: number;
    h: number;
    l: number;
    c: number;
    v?: number;
}

import { API_ENDPOINTS } from '../../config/exchanges';
import { ALLOWED_SYMBOLS } from '../../config';

export class ZeroOneService extends HybridExchangeService {
    readonly name = 'ZeroOne';
    private marketsMap: Map<string, ZeroOneMarket> = new Map(); // symbol -> info
    private idToSymbol: Map<number, string> = new Map();

    // Multi-socket management
    // 01.XYZ requires one connection per stream
    private sockets: Map<string, WebSocket> = new Map();

    constructor() {
        super({
            name: 'ZeroOne',
            wsUrl: API_ENDPOINTS.ZEROONE_WS, // Base for pattern
            wsTimeout: 20000,     // 20s before fallback (allow for slow markets)
            staleThreshold: 60000 // 60s allowed (matches 1m candle interval)
        });
    }

    // ==================== Initialization ====================

    public async fetchMarkets(): Promise<MarketData[]> {
        // Validates markets and gets initial prices via Orderbook
        try {
            // 1. Fetch Metadata
            const infoUrl = `${API_ENDPOINTS.ZEROONE_REST}/info`;
            const { data } = await axios.get<{ markets: ZeroOneMarket[] }>(infoUrl);

            this.marketsMap.clear();
            this.idToSymbol.clear();

            // 2. Map Markets (Filter by ALLOWED_SYMBOLS)
            const relevantMarkets: ZeroOneMarket[] = [];

            data.markets.forEach(m => {
                const stdSymbol = this.normalizeSymbol(m.symbol);
                // Only track allowed symbols to save resources and ensure coverage
                if (ALLOWED_SYMBOLS.includes(stdSymbol)) {
                    this.marketsMap.set(stdSymbol, m);
                    this.idToSymbol.set(m.marketId, stdSymbol);
                    relevantMarkets.push(m);
                }
            });

            logger.debug(this.name, `Mapped ${relevantMarkets.length} relevant markets (from ${data.markets.length} total)`);

            // 3. Fetch Prices (via Orderbook for each relevant market)
            const marketData: MarketData[] = [];

            // We can fetch all relevant ones since list is small (~11)
            await Promise.all(relevantMarkets.map(async (m) => {
                try {
                    // Use Orderbook for better accuracy (Bid/Ask instead of Index)
                    // Pattern: /market/{id}/orderbook
                    const obUrl = `${API_ENDPOINTS.ZEROONE_REST}/market/${m.marketId}/orderbook?cb=${Date.now()}`;
                    const res = await axios.get(obUrl, { timeout: 2000 });

                    const bids = res.data.bids;
                    const asks = res.data.asks;

                    let bestBid = 0;
                    let bestAsk = 0;

                    if (Array.isArray(bids) && bids.length > 0) bestBid = bids[0][0];
                    if (Array.isArray(asks) && asks.length > 0) bestAsk = asks[0][0];

                    if (bestBid > 0 && bestAsk > 0) {
                        marketData.push({
                            symbol: this.normalizeSymbol(m.symbol),
                            bid: bestBid,
                            ask: bestAsk
                        });
                    }
                } catch (e) {
                    // Ignore individual failures
                }
            }));

            return marketData;
        } catch (error) {
            logger.error(this.name, 'Failed to fetch REST markets', error);
            throw error;
        }
    }

    private normalizeSymbol(raw: string): string {
        // "BTCUSD" -> "BTC"
        if (raw.endsWith('USD')) return raw.replace('USD', '');
        if (raw.endsWith('USDC')) return raw.replace('USDC', '');
        return raw;
    }

    // ==================== WebSocket Overrides ====================

    // ==================== WebSocket Overrides ====================

    // Override start to initiate both WS and REST Polling
    public async start(): Promise<void> {
        logger.info(this.name, 'Starting True-Hybrid service (WS + Continuous REST Polling)');

        // 1. Connect WS for real-time (but slow) candles
        await this.connectWebSocket();

        // 2. Start REST fallback IMMEDIATELY and keeping it active
        // This ensures frequent updates every 5s regardless of WS speed
        this.startContinuousPolling();
    }

    private startContinuousPolling() {
        if (this.fallbackActive) return;
        this.fallbackActive = true;

        // Initial fetch
        this.doFallbackFetch();

        // Poll every 2 seconds to ensure we are ready for the 3s Aggregator cycle
        this.fallbackInterval = setInterval(() => {
            this.doFallbackFetch();
        }, 2000);
    }

    // Override stop to clean up
    public stop(): void {
        super.stop();
        if (this.fallbackInterval) {
            clearInterval(this.fallbackInterval);
        }
    }

    // Override onWsUpdate to NOT stop the continuous REST polling
    protected onWsUpdate(symbol: string, bid: number, ask: number): void {
        this.lastWsMessage = Date.now();

        const price: TimestampedPrice = {
            symbol,
            bid,
            ask,
            timestamp: Date.now(),
            source: 'ws'
        };

        this.priceCache.set(symbol, price);
        this.emit('update', price);

        // Note: No stopFallback() here! We want both.
    }

    // 01 has 1 socket per market.
    protected async connectWebSocket(): Promise<void> {
        // ... (rest of the method as it was)
        if (this.marketsMap.size === 0) {
            try {
                const initialMarkets = await this.fetchMarkets();
                initialMarkets.forEach(m => {
                    this.onWsUpdate(m.symbol, m.bid, m.ask);
                });
            } catch (e) {
                logger.error(this.name, 'Cannot start WS without market info');
                return;
            }
        }

        const targets = Array.from(this.marketsMap.values());
        logger.info(this.name, `Connecting ${targets.length} sockets...`);

        targets.forEach(m => {
            this.connectSingleSocket(m);
        });

        this.isWsConnected = true;
    }

    private connectSingleSocket(market: ZeroOneMarket) {
        const stdSymbol = this.normalizeSymbol(market.symbol);
        const url = `${this.wsUrl}/ws/candle@${market.symbol}:1`;

        try {
            const ws = new WebSocket(url);
            this.sockets.set(stdSymbol, ws);

            ws.on('message', (data: Buffer) => {
                try {
                    const msg = JSON.parse(data.toString()) as ZeroOneCandle;
                    // Strict validation: Only update if price is valid (> 0)
                    if (msg && typeof msg.c === 'number' && msg.c > 0) {
                        this.onWsUpdate(stdSymbol, msg.c, msg.c);
                    }
                } catch (e) { }
            });

            ws.on('error', (err) => { });
            ws.on('close', () => {
                this.sockets.delete(stdSymbol);
            });

        } catch (e) {
            logger.error(this.name, `Failed to create socket for ${market.symbol}`);
        }
    }

    protected async disconnectWebSocket(): Promise<void> {
        this.sockets.forEach(ws => ws.terminate());
        this.sockets.clear();
        this.isWsConnected = false;
    }

    protected subscribeToMarkets(): void {
        // No-op
    }
}

export const zerooneService = new ZeroOneService();
