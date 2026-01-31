/**
 * NADO Exchange Service
 * Hybrid implementation: WebSocket primary for real-time data
 * API Docs: https://docs.nado.xyz/developer-resources/api
 */

import WebSocket from 'ws';
import axios from 'axios';
import { HybridExchangeService, HybridConfig } from './HybridExchangeService';
import { MarketData } from './BaseExchangeService';
import { logger } from '../../utils/app-logger';
import { API_ENDPOINTS } from '../../config/exchanges';
import { ALLOWED_SYMBOLS, COMMON_HEADERS, REQUEST_TIMEOUT } from '../../config';

const TAG = 'Nado';

const WS_TIMEOUT = 15000;
const STALE_THRESHOLD = 30000;

interface NadoSymbol {
    product_id: number;
    symbol: string;
    delisted: boolean;
    trading_status: string | null;
}

export class NadoService extends HybridExchangeService {
    readonly name = 'NADO';

    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts = 5;
    private readonly reconnectDelay = 3000;
    private productMap: Map<string, number> = new Map(); // INTERNAL_SYMBOL -> PRODUCT_ID
    private pingInterval: NodeJS.Timeout | null = null;

    constructor() {
        const config: HybridConfig = {
            name: 'NADO',
            wsUrl: API_ENDPOINTS.NADO_WS,
            wsTimeout: WS_TIMEOUT,
            staleThreshold: STALE_THRESHOLD
        };
        super(config);
    }

    // ==================== WebSocket Implementation ====================

    protected async connectWebSocket(): Promise<void> {
        // Ensure we have the product IDs before connecting (or re-connecting)
        await this.refreshProductMap();

        return new Promise((resolve) => {
            try {
                logger.info(TAG, `Connecting to WebSocket: ${this.wsUrl}`);
                this.ws = new WebSocket(this.wsUrl, {
                    headers: {
                        'User-Agent': COMMON_HEADERS['User-Agent'],
                        'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits'
                    }
                });

                this.ws.on('open', () => {
                    logger.info(TAG, '✅ WebSocket: CONNECTED');
                    this.isWsConnected = true;
                    this.reconnectAttempts = 0;
                    this.lastWsMessage = Date.now();

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
                    logger.error(TAG, 'WebSocket error', error as any);
                    if (!this.fallbackActive) {
                        this.startFallback();
                    }
                });

                this.ws.on('close', () => {
                    logger.info(TAG, 'WebSocket closed');
                    this.isWsConnected = false;
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
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isWsConnected = false;
    }

    protected subscribeToMarkets(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        logger.debug(TAG, `Subscribing to ${this.productMap.size} markets...`);
        let count = 0;

        this.productMap.forEach((productId, internalSymbol) => {
            const msg = {
                method: "subscribe",
                stream: {
                    type: "best_bid_offer",
                    product_id: productId
                },
                id: productId // Use product ID as request ID for tracking
            };
            this.ws?.send(JSON.stringify(msg));
            count++;
        });

        logger.info(TAG, `Sent subscription requests for ${count} markets`);

        // Start Ping Interval (every 30s)
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.ping(); // Send standard WS ping frame
            }
        }, 30000);
    }

    private handleWsMessage(data: WebSocket.Data): void {
        try {
            this.lastWsMessage = Date.now();
            const raw = data.toString();
            // Log for debugging - disabled for production
            // logger.debug(TAG, `Received WS Msg: ${raw}`); 
            const message = JSON.parse(raw);

            // Structure: { type: "best_bid_offer", product_id: 2, bid_price: "...", ask_price: "...", ... }
            // Note: Data is NOT nested in a 'data' field, contrary to some docs/assumptions.

            if (message.type === 'best_bid_offer' && message.product_id) {
                const { product_id, bid_price, ask_price } = message;
                const internalSymbol = this.getSymbolByProductId(product_id);

                if (internalSymbol) {
                    // Prices are in 18 decimals (Wei-like)
                    const SCALE_FACTOR = 1e18;
                    const bestBid = parseFloat(bid_price) / SCALE_FACTOR;
                    const bestAsk = parseFloat(ask_price) / SCALE_FACTOR;

                    if (bestBid > 0 && bestAsk > 0) {
                        this.onWsUpdate(internalSymbol, bestBid, bestAsk);
                    }
                }
            }
        } catch (error) {
            // Ignore parse errors or non-data messages
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

    // ==================== Helpers ====================

    private async refreshProductMap(): Promise<void> {
        try {
            // NOTE: Using REST endpoint to fetch symbols. 
            // NADO might reject requests without proper user-agent or encoding.
            const res = await axios.get(`${API_ENDPOINTS.NADO_REST}/symbols`, {
                headers: {
                    ...COMMON_HEADERS,
                    'Accept-Encoding': 'gzip, deflate'
                },
                timeout: REQUEST_TIMEOUT
            });

            const symbols = res.data as NadoSymbol[];
            this.productMap.clear();

            symbols.forEach(s => {
                // Nado format: "BTC-PERP", "ETH-PERP"
                // Map to Internal: "BTC", "ETH"
                if (!s.delisted && s.trading_status === 'live' && s.symbol.endsWith('-PERP')) {
                    const internalSymbol = s.symbol.split('-')[0];
                    if (ALLOWED_SYMBOLS.includes(internalSymbol)) {
                        this.productMap.set(internalSymbol, s.product_id);
                    }
                }
            });
            logger.info(TAG, `Mapped ${this.productMap.size} symbols from NADO`);
        } catch (error: any) {
            logger.error(TAG, `Failed to fetch NADO symbols: ${error.message}`);
        }
    }

    private getSymbolByProductId(id: number): string | undefined {
        for (const [symbol, pid] of this.productMap.entries()) {
            if (pid === id) return symbol;
        }
        return undefined;
    }

    // ==================== REST Implementation (Metadata only mostly) ====================

    async fetchMarkets(): Promise<MarketData[]> {
        // Since NADO relies heavily on WS for live data, this just ensures map is up to date
        // Real-time price fetching via REST is not standard in their docs for this use case
        await this.refreshProductMap();
        return [];
    }
}

export const nadoService = new NadoService();
