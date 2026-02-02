
import sqlite3 from 'sqlite3';
const verboseSqlite = sqlite3.verbose();
import path from 'path';

const dbPath = path.resolve(__dirname, '../../market_data.db');
const db = new verboseSqlite.Database(dbPath);

console.log("Checking DB at:", dbPath);

db.all("SELECT DISTINCT symbol FROM spread_history LIMIT 10", (err, rows) => {
    if (err) console.error("Error fetching symbols:", err);
    else console.log("Symbols:", JSON.stringify(rows, null, 2));

    db.all("SELECT * FROM spread_history LIMIT 5", (err, rows) => {
        if (err) console.error("Error fetching rows:", err);
        else console.log("Rows:", JSON.stringify(rows, null, 2));
        db.close();
    });
});
