/**
 * Vest WebSocket Service
 * Connects to Vest Exchange WebSocket for real-time orderbook depth data
 */

const WebSocket = require('ws');
const EventEmitter = require('events');
const { ALLOWED_SYMBOLS } = require('../config');

const WS_BASE_URL = 'wss://wsprod.vest.exchange/ws-api?version=1.0';

class VestWebSocketService extends EventEmitter {
    constructor() {
        super();
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 20;
        this.reconnectDelay = 3000;
        this.pingInterval = null;
        this.subscribedSymbols = new Set();
    }

    /**
     * Connect to Vest WebSocket
     */
    async connect() {
        try {
            // Requirement: xwebsocketserver=restserver
            const url = `${WS_BASE_URL}&xwebsocketserver=restserver`;
            console.log(`[VestWS] Connecting to ${url}...`);

            this.ws = new WebSocket(url);

            this.ws.on('open', () => {
                console.log('[VestWS] Connected successfully');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.startPing();
                this.subscribeToAllowedMarkets();
            });

            this.ws.on('message', (data) => {
                this.handleMessage(data);
            });

            this.ws.on('error', (error) => {
                console.error('[VestWS] WebSocket error:', error.message);
            });

            this.ws.on('close', () => {
                console.log('[VestWS] Connection closed');
                this.isConnected = false;
                this.stopPing();
                this.scheduleReconnect();
            });

        } catch (error) {
            console.error('[VestWS] Connection error:', error.message);
            this.scheduleReconnect();
        }
    }

    subscribeToAllowedMarkets() {
        const params = ALLOWED_SYMBOLS.map(symbol => `${symbol}-PERP@depth`);
        console.log(`[VestWS] Subscribing to: ${params.join(', ')}`);

        const msg = {
            method: 'SUBSCRIBE',
            params: params,
            id: Date.now()
        };

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(msg));
        }
    }

    handleMessage(data) {
        try {
            const msg = JSON.parse(data.toString());

            // Handle depth updates
            // Format: { "channel": "BTC-PERP@depth", "data": { "bids": [[price, qty]], "asks": [[price, qty]] } }
            if (msg.channel && msg.channel.endsWith('@depth') && msg.data) {
                const symbol = msg.channel.split('-')[0];
                const { bids, asks } = msg.data;

                const bid = bids && bids.length > 0 ? parseFloat(bids[0][0]) : 0;
                const ask = asks && asks.length > 0 ? parseFloat(asks[0][0]) : 0;

                if (bid > 0 || ask > 0) {
                    this.emit('update', {
                        symbol,
                        bid,
                        ask
                    });
                }
            }
        } catch (error) {
            // Ignore parse errors
        }
    }

    startPing() {
        this.pingInterval = setInterval(() => {
            if (this.ws && this.isConnected) {
                try {
                    // Vest ping format
                    this.ws.send(JSON.stringify({
                        method: 'PING',
                        params: [],
                        id: 0
                    }));
                } catch (e) { }
            }
        }, 30000);
    }

    stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5);
            console.log(`[VestWS] Reconnecting in ${delay}ms...`);
            setTimeout(() => this.connect(), delay);
        } else {
            console.error('[VestWS] Max reconnection attempts reached.');
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

module.exports = new VestWebSocketService();
