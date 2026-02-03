
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../market_data.db');
const verboseSqlite = sqlite3.verbose();
const db = new verboseSqlite.Database(dbPath);

console.log("Checking for negative spreads...");

// Check for any negative spread
db.all("SELECT * FROM spread_history WHERE spread < 0 LIMIT 5", (err, rows) => {
    if (err) console.error("Error:", err);
    else {
        console.log(`Found ${rows.length} negative spreads examples:`);
        console.log(JSON.stringify(rows, null, 2));
    }

    // Check specific pair stats
    db.get("SELECT COUNT(*) as count, MIN(spread) as min_spread, MAX(spread) as max_spread FROM spread_history WHERE bid_exchange='VEST' AND ask_exchange='PARADEX'", (err, row) => {
        if (err) console.error(err);
        else console.log("Stats for VEST->PARADEX:", row);

        db.get("SELECT COUNT(*) as count, MIN(spread) as min_spread, MAX(spread) as max_spread FROM spread_history WHERE bid_exchange='PARADEX' AND ask_exchange='VEST'", (err, row) => {
            if (err) console.error(err);
            else console.log("Stats for PARADEX->VEST:", row);
            db.close();
        });
    });
});
