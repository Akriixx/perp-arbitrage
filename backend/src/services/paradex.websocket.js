/**
 * Paradex WebSocket Service
 * Real-time market data streaming from Paradex
 */

const WebSocket = require('ws');
const EventEmitter = require('events');
const { ALLOWED_SYMBOLS } = require('../config');

class ParadexWebSocketService extends EventEmitter {
    constructor() {
        super();
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.isConnected = false;
        this.subscribedMarkets = new Set();
    }

    /**
     * Connect to Paradex WebSocket
     */
    connect() {
        console.log('[ParadexWS] Connecting to Paradex WebSocket...');

        this.ws = new WebSocket('wss://ws.api.prod.paradex.trade/v1');

        this.ws.on('open', () => {
            console.log('[ParadexWS] Connected successfully');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.subscribeToMarkets();
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleMessage(message);
            } catch (error) {
                console.error('[ParadexWS] Error parsing message:', error);
            }
        });

        this.ws.on('error', (error) => {
            console.error('[ParadexWS] WebSocket error:', error.message);
        });

        this.ws.on('close', () => {
            console.log('[ParadexWS] Connection closed');
            this.isConnected = false;
            this.attemptReconnect();
        });

        this.ws.on('ping', () => {
            this.ws.pong();
        });
    }

    /**
     * Subscribe to all markets
     */
    subscribeToMarkets() {
        // Subscribe to markets_summary for all markets
        const subscribeMessage = {
            id: 1,
            jsonrpc: '2.0',
            method: 'subscribe',
            params: {
                channel: 'markets_summary'
            }
        };

        console.log('[ParadexWS] Subscribing to markets_summary channel...');
        this.ws.send(JSON.stringify(subscribeMessage));
    }

    /**
     * Handle incoming messages
     */
    handleMessage(message) {
        // Handle subscription confirmation
        if (message.result && message.result.channel === 'markets_summary') {
            console.log('[ParadexWS] Successfully subscribed to markets_summary');
            return;
        }

        // Handle market data updates
        if (message.params && message.params.channel === 'markets_summary') {
            const marketData = message.params.data;
            if (marketData) {
                this.processMarketData(marketData);
            }
        }
    }

    /**
     * Process market data and emit events
     */
    processMarketData(data) {
        // Paradex sometimes sends an array of market updates, sometimes a single object
        const updates = Array.isArray(data) ? data : [data];

        updates.forEach(market => {
            if (market.symbol?.endsWith('-USD-PERP')) {
                const symbol = market.symbol.split('-')[0];

                // Filter by allowed symbols
                if (ALLOWED_SYMBOLS.includes(symbol)) {
                    const bid = parseFloat(market.bid || 0);
                    const ask = parseFloat(market.ask || 0);

                    if (bid > 0 && ask > 0) {
                        // Emit single market update
                        this.emit('data', [{ symbol, bid, ask }]);
                    }
                }
            }
        });
    }

    /**
     * Attempt to reconnect
     */
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`[ParadexWS] Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay);
        } else {
            console.error('[ParadexWS] Max reconnection attempts reached');
            this.emit('error', new Error('Max reconnection attempts reached'));
        }
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

module.exports = ParadexWebSocketService;
