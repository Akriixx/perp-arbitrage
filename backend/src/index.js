/**
 * Perp Arbitrage Scanner - Backend Server
 * Entry Point
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const routes = require('./routes');
const { PORT } = require('./config');
const { startScheduler, setWebSocketBroadcaster } = require('./services/aggregator.service');
const { startDbScheduler } = require('./db/metrics.repository');

// Initialize Express
const app = express();
const server = http.createServer(app);

// Initialize WebSocket Server
const wss = new WebSocket.Server({ server });
let wsClients = [];

wss.on('connection', (ws) => {
    console.log('[WebSocket] Client connected');
    wsClients.push(ws);

    ws.on('close', () => {
        console.log('[WebSocket] Client disconnected');
        wsClients = wsClients.filter(client => client !== ws);
    });

    ws.on('error', (error) => {
        console.error('[WebSocket] Error:', error.message);
    });
});

// Broadcast function for aggregator
function broadcastPriceUpdate(priceCache) {
    if (wsClients.length === 0) return;

    console.log(`[WebSocket] Broadcasting update to ${wsClients.length} clients. Cache size: ${Object.keys(priceCache).length}`);

    const pairs = Object.values(priceCache).map(pair => ({
        symbol: pair.symbol,
        bestBid: pair.bestBid,
        bestAsk: pair.bestAsk,
        bestBidEx: pair.bestBidEx,
        bestAskEx: pair.bestAskEx,
        realSpread: pair.realSpread,
        paradex: pair.paradex,
        lighter: pair.lighter,
        vest: pair.vest
    }));

    const message = JSON.stringify({ type: 'update', pairs });

    wsClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(message);
            } catch (error) {
                console.error('[WebSocket] Send error:', error.message);
            }
        }
    });
}

// Register broadcaster with aggregator
setWebSocketBroadcaster(broadcastPriceUpdate);

// Middleware
app.use(express.json());

// Serve static files from frontend build (production)
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// API Routes
app.use('/api', routes);

// Start data fetching scheduler
startScheduler();

// Start database persistence scheduler
startDbScheduler();

// Start server
server.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
    console.log(`WebSocket server ready on ws://localhost:${PORT}`);
});

module.exports = app;
