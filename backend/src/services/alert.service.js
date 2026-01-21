const { db } = require('../db/connection');

// Cache to prevent duplicate alerts in a short time window (e.g. 1 minute)
const alertCache = new Map();
const CACHE_TTL = 60000; // 1 minute

const saveAlert = (opportunity) => {
    return new Promise((resolve, reject) => {
        const { symbol, realSpread, bestAskEx, bestBidEx, bestAsk, bestBid } = opportunity;

        // Simple deduplication
        const lastAlertTime = alertCache.get(symbol);
        const now = Date.now();
        if (lastAlertTime && (now - lastAlertTime < CACHE_TTL)) {
            return resolve(null); // Too soon
        }

        const query = `
            INSERT INTO alerts (timestamp, symbol, spread, exchange_buy, exchange_sell, price_buy, price_sell)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(query, [now, symbol, realSpread, bestAskEx, bestBidEx, bestAsk, bestBid], function (err) {
            if (err) {
                console.error("Error saving alert:", err);
                return reject(err);
            }
            // Update cache
            alertCache.set(symbol, now);
            resolve(this.lastID);
        });
    });
};

const getRecentAlerts = (limit = 50) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ?`;
        db.all(query, [limit], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

module.exports = {
    saveAlert,
    getRecentAlerts
};
