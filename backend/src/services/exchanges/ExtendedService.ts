/**
 * Extended Exchange Service
 * Hybrid implementation: WebSocket primary with REST fallback
 * API Docs: https://api.docs.extended.exchange/#public-rest-api
 */

import WebSocket from 'ws';
import axios from 'axios';
import { HybridExchangeService, HybridConfig } from './HybridExchangeService';
import { MarketData } from './BaseExchangeService';
import { logger } from '../../utils/app-logger';
import { API_ENDPOINTS } from '../../config/exchanges';
import { ALLOWED_SYMBOLS, COMMON_HEADERS, REQUEST_TIMEOUT } from '../../config';

const TAG = 'Extended';

// WebSocket Configuration
// Docs: Public WebSocket streams -> Order book stream
// URL pattern: wss://api.starknet.extended.exchange/stream.extended.exchange/v1/orderbooks?depth=1
const WS_URL = 'wss://api.starknet.extended.exchange/stream.extended.exchange/v1/orderbooks?depth=1';
const WS_TIMEOUT = 15000;
const STALE_THRESHOLD = 30000;

class ExtendedService extends HybridExchangeService {
    readonly name = 'EXTENDED';

    private ws: WebSocket | null = null;
    private pingInterval: NodeJS.Timeout | null = null;
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts = 5;
    private readonly reconnectDelay = 3000;

    constructor() {
        const config: HybridConfig = {
            name: 'EXTENDED',
            wsUrl: WS_URL,
            wsTimeout: WS_TIMEOUT,
            staleThreshold: STALE_THRESHOLD
        };
        super(config);
        logger.info(TAG, `Initializing ExtendedService with WS URL: ${WS_URL}`);
    }

    // ==================== WebSocket Implementation ====================

    protected async connectWebSocket(): Promise<void> {
        return new Promise((resolve) => {
            try {
                logger.info(TAG, `Connecting to WebSocket: ${this.wsUrl}`);
                this.ws = new WebSocket(this.wsUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Origin': 'https://extended.exchange',
                        'Host': 'api.starknet.extended.exchange'
                    }
                });

                this.ws.on('open', () => {
                    logger.info(TAG, '✅ WebSocket: CONNECTED');
                    this.isWsConnected = true;
                    this.reconnectAttempts = 0;
                    this.lastWsMessage = Date.now();
                    this.startPing();
                    // Subscription is handled by the URL query params for this specific API
                    // this.subscribeToMarkets(); 

                    if (this.fallbackActive) {
                        this.stopFallback();
                    }
                    resolve();
                });

                this.ws.on('message', (data: WebSocket.Data) => {
                    this.handleWsMessage(data);
                });

                this.ws.on('error', (error: Error) => {
                    logger.error(TAG, 'WebSocket error', error as any);
                    if (!this.fallbackActive) {
                        this.startFallback();
                    }
                });

                this.ws.on('close', () => {
                    logger.info(TAG, 'WebSocket closed');
                    this.isWsConnected = false;
                    this.stopPing();
                    this.scheduleReconnect();
                });

            } catch (error: any) {
                logger.error(TAG, 'WebSocket connection failed', error);
                this.scheduleReconnect();
                resolve();
            }
        });
    }

    protected disconnectWebSocket(): void {
        this.stopPing();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isWsConnected = false;
    }

    protected subscribeToMarkets(): void {
        // No-op: Subscription is done via connection URL parameters
    }

    private handleWsMessage(data: WebSocket.Data): void {
        try {
            const raw = data.toString();

            // Handle Pong or system messages if any
            if (raw.trim() === 'pong') { // Hypothetical
                return;
            }

            const message = JSON.parse(raw);

            // Response example:
            // { "ts": 1701563440000, "type": "SNAPSHOT", "data": { "m": "BTC-USD", "b": [ { "p": "25670", "q": "0.1" } ], "a": [ ... ] }, "seq": 1 }

            if (message.type === 'SNAPSHOT' || message.type === 'DELTA') {
                const marketData = message.data;
                if (!marketData || !marketData.m) return;

                const marketName = marketData.m; // e.g., "BTC-USD"
                const symbol = marketName.split('-')[0];

                if (!ALLOWED_SYMBOLS.includes(symbol)) return;

                // Extract best bid/ask
                // The structure is b: [{p: "price", q: "qty"}, ...]
                const bids = marketData.b || [];
                const asks = marketData.a || [];

                if (bids.length > 0 && asks.length > 0) {
                    const bestBid = parseFloat(bids[0].p);
                    const bestAsk = parseFloat(asks[0].p);

                    if (bestBid > 0 && bestAsk > 0) {
                        this.onWsUpdate(symbol, bestBid, bestAsk);
                    }
                }
            }
        } catch (error) {
            // Some messages might not be JSON (e.g. "pong")
            // logger.debug(TAG, `Failed to parse WS message: ${data.toString()}`);
        }
    }

    private startPing(): void {
        // Docs say: "The server sends pings every 15 seconds... client ... will respond with a pong"
        // Usually browser/ws client handles ping/pong frames automatically.
        // But some exchanges use applicative pings.
        // Docs: "Although the server does not require pings from the client, it will respond with a pong if one is received."
        // Let's send a ping periodically to keep connection alive if needed.
        this.pingInterval = setInterval(() => {
            if (this.ws && this.isWsConnected) {
                try {
                    this.ws.ping(); // Frame level ping
                } catch (e) { }
            }
        }, 10000);
    }

    private stopPing(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    private scheduleReconnect(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
            logger.info(TAG, `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

            setTimeout(() => {
                this.connectWebSocket();
            }, delay);
        } else {
            logger.error(TAG, 'Max reconnection attempts reached');
            if (!this.fallbackActive) {
                this.startFallback();
            }
        }
    }

    // ==================== REST Fallback Implementation ====================

    /**
     * Fetch markets via REST API
     * Used for fallback or initial data
     */
    async fetchMarkets(): Promise<MarketData[]> {
        const results: MarketData[] = [];

        try {
            const res = await axios.get(API_ENDPOINTS.EXTENDED_MARKETS, {
                headers: COMMON_HEADERS,
                timeout: REQUEST_TIMEOUT
            });

            if (!res.data || res.data.status?.toLowerCase() !== 'ok' || !Array.isArray(res.data.data)) {
                return results;
            }

            const markets = res.data.data;

            markets.forEach((market: any) => {
                // Extended format: "BTC-USD", "ETH-USD"
                const marketName = market.name;
                if (!marketName || !marketName.includes('-')) return;

                const baseSymbol = marketName.split('-')[0];

                if (!ALLOWED_SYMBOLS.includes(baseSymbol)) return;
                if (market.active !== true || market.status !== 'ACTIVE') return;

                const stats = market.marketStats;
                if (!stats || !stats.bidPrice || !stats.askPrice) return;

                const bid = parseFloat(stats.bidPrice || 0);
                const ask = parseFloat(stats.askPrice || 0);

                if (bid > 0 && ask > 0) {
                    results.push({ symbol: baseSymbol, bid, ask });
                }
            });
        } catch (error: any) {
            logger.error(TAG, `REST fetch failed: ${error.message}`);
        }

        return results;
    }
}

// Export singleton
export const extendedService = new ExtendedService();
export { ExtendedService };
