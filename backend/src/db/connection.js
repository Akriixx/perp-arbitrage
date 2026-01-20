/**
 * Database Connection and Setup
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

// Create tables
db.run(`CREATE TABLE IF NOT EXISTS price_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER,
    symbol TEXT,
    vest_bid REAL,
    vest_ask REAL,
    lighter_bid REAL,
    lighter_ask REAL,
    paradex_bid REAL,
    paradex_ask REAL,
    best_bid_exchange TEXT,
    best_ask_exchange TEXT,
    real_spread REAL,
    potential_profit REAL
)`);

module.exports = { db };
