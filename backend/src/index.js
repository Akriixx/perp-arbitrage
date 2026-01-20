/**
 * Perp Arbitrage Scanner - Backend Server
 * Entry Point
 */

const express = require('express');
const path = require('path');
const routes = require('./routes');
const { PORT } = require('./config');
const { startScheduler } = require('./services/aggregator.service');
const { startDbScheduler } = require('./db/metrics.repository');

// Initialize Express
const app = express();

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
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});

module.exports = app;
