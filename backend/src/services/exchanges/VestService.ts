/**
 * Vest Hybrid Exchange Service
 * WebSocket-primary with REST fallback
 * 
 * WebSocket API: wss://ws-prod.hz.vestmarkets.com/ws-api?version=1.0
 * Channels: {symbol}@depth, {symbol}@trades
 */

import WebSocket from 'ws';
import axios from 'axios';
import { HybridExchangeService, HybridConfig } from './HybridExchangeService';
import { MarketData } from './BaseExchangeService';
import { logger } from '../../utils/app-logger';
import { API_ENDPOINTS, isCrypto } from '../../config/exchanges';
import { ALLOWED_SYMBOLS, COMMON_HEADERS, REQUEST_TIMEOUT, CONCURRENCY } from '../../config';
import { sleep } from '../../utils/app-sleep';

const TAG = 'Vest';

const WS_URL = API_ENDPOINTS.VEST_WS || 'wss://ws-prod.hz.vestmarkets.com/ws-api?version=1.0';
const WS_TIMEOUT = 15000;
const STALE_THRESHOLD = 30000;

class VestService extends HybridExchangeService {
    readonly name = 'VEST';

    private ws: WebSocket | null = null;
    private pingInterval: NodeJS.Timeout | null = null;
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts = 5;
    private readonly reconnectDelay = 5000;
    private wsDisabled: boolean = false;
    private subscriptionId: number = 1;

    // Symbol mapping: base symbol -> Vest format (e.g., BTC -> BTC-PERP)
    private symbolMap: Record<string, string> = {};

    constructor() {
        const config: HybridConfig = {
            name: 'VEST',
            wsUrl: WS_URL,
            wsTimeout: WS_TIMEOUT,
            staleThreshold: STALE_THRESHOLD
        };
        super(config);
    }

    async start(): Promise<void> {
        logger.info(TAG, 'Starting Vest Hybrid service (WS primary, REST fallback)');

        // Fetch available symbols first
        await this.fetchAvailableSymbols();

        // Do initial REST fetch for immediate data
        await this.doFallbackFetch();

        // Connect WebSocket (primary)
        await this.connectWebSocket();

        // Start watchdog for fallback detection
        this.startWatchdog();
    }

    // ==================== Symbol Discovery ====================

    private async fetchAvailableSymbols(): Promise<void> {
        try {
            const res = await axios.get(API_ENDPOINTS.VEST_TICKER, {
                headers: COMMON_HEADERS,
                timeout: REQUEST_TIMEOUT
            });

            const tickers = res.data.tickers || [];
            tickers.forEach((t: any) => {
                if (t.symbol.endsWith('-PERP')) {
                    const baseSymbol = t.symbol.split('-')[0];
                    if (ALLOWED_SYMBOLS.includes(baseSymbol)) {
                        this.symbolMap[baseSymbol] = t.symbol;
                    }
                }
            });

            logger.info(TAG, `Mapped ${Object.keys(this.symbolMap).length} symbols from Vest`);
        } catch (error: any) {
            logger.error(TAG, `Failed to fetch symbols: ${error.message}`);
        }
    }

    // ==================== WebSocket Implementation ====================

    protected async connectWebSocket(): Promise<void> {
        if (Object.keys(this.symbolMap).length === 0) {
            await this.fetchAvailableSymbols();
        }

        return new Promise((resolve) => {
            try {
                // Add query parameter for WebSocket server
                const wsUrlWithParams = `${WS_URL}&xwebsocketserver=restserver0`;
                logger.info(TAG, `Connecting to WebSocket: ${wsUrlWithParams}`);

                this.ws = new WebSocket(wsUrlWithParams, {
                    headers: {
                        'Origin': 'https://vestmarkets.com',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                this.ws.on('open', () => {
                    logger.info(TAG, '✅ WebSocket: CONNECTED');
                    this.isWsConnected = true;
                    this.reconnectAttempts = 0;
                    this.lastWsMessage = Date.now();
                    this.startPing();
                    this.subscribeToMarkets();

                    if (this.fallbackActive) {
                        this.stopFallback();
                    }
                    resolve();
                });

                this.ws.on('message', (data: WebSocket.Data) => {
                    this.handleWsMessage(data);
                });

                this.ws.on('error', (error: Error) => {
                    logger.error(TAG, `WebSocket error: ${error.message}`);
                    if (!this.fallbackActive) {
                        logger.warn(TAG, 'WS error, activating REST fallback');
                        this.startFallback();
                    }
                });

                this.ws.on('close', (code: number, reason: Buffer) => {
                    logger.info(TAG, `WebSocket closed (code: ${code})`);
                    this.isWsConnected = false;
                    this.stopPing();

                    if (this.reconnectAttempts < this.maxReconnectAttempts && !this.wsDisabled) {
                        this.scheduleReconnect();
                    } else {
                        logger.warn(TAG, 'WS disabled after max attempts, using REST only');
                        this.wsDisabled = true;
                        if (!this.fallbackActive) {
                            this.startFallback();
                        }
                    }
                });

            } catch (error: any) {
                logger.error(TAG, 'WebSocket connection failed', error);
                this.startFallback();
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
        const symbols = Object.values(this.symbolMap);
        logger.info(TAG, `Subscribing to ${symbols.length} markets via WS`);

        // Vest subscription format: {"method": "SUBSCRIBE", "params": ["BTC-PERP@depth", ...], "id": 1}
        const channels = symbols.flatMap(sym => [`${sym}@depth`, `${sym}@trades`]);

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const subscribeMsg = JSON.stringify({
                method: 'SUBSCRIBE',
                params: channels,
                id: this.subscriptionId++
            });
            this.ws.send(subscribeMsg);
            logger.debug(TAG, `Sent subscription for ${channels.length} channels`);
        }
    }

    private handleWsMessage(data: WebSocket.Data): void {
        try {
            const msg = JSON.parse(data.toString());
            this.lastWsMessage = Date.now();

            // Handle PONG response
            if (msg.data === 'PONG') {
                return;
            }

            // Handle subscription confirmation
            if (msg.result === null && msg.id !== undefined) {
                logger.debug(TAG, `Subscription confirmed (id: ${msg.id})`);
                return;
            }

            // Handle depth updates: {"channel": "BTC-PERP@depth", "data": {"bids": [...], "asks": [...]}}
            if (msg.channel && msg.channel.endsWith('@depth') && msg.data) {
                const vestSymbol = msg.channel.replace('@depth', '');
                const baseSymbol = Object.keys(this.symbolMap).find(
                    base => this.symbolMap[base] === vestSymbol
                );

                if (!baseSymbol) return;

                const { bids, asks } = msg.data;

                if (bids?.length > 0 && asks?.length > 0) {
                    const bestBid = parseFloat(bids[0][0]);
                    const bestAsk = parseFloat(asks[0][0]);

                    if (bestBid > 0 && bestAsk > 0) {
                        this.onWsUpdate(baseSymbol, bestBid, bestAsk);
                    }
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
    }

    private startPing(): void {
        this.pingInterval = setInterval(() => {
            if (this.ws && this.isWsConnected && this.ws.readyState === WebSocket.OPEN) {
                try {
                    // Vest ping format: {"method": "PING", "params": [], "id": 0}
                    this.ws.send(JSON.stringify({ method: 'PING', params: [], id: 0 }));
                } catch (e) { }
            }
        }, 30000);
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
            logger.info(TAG, `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            // Ensure fallback is active during reconnection
            if (!this.fallbackActive) {
                this.startFallback();
            }

            setTimeout(() => this.connectWebSocket(), delay);
        }
    }

    // ==================== REST Fallback Implementation ====================

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
export const vestService = new VestService();
export { VestService };
