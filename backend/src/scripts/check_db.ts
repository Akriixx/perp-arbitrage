
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../market_data.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT * FROM spread_history WHERE symbol = 'SOL-USD' ORDER BY timestamp DESC LIMIT 5", (err, rows) => {
    if (err) console.error(err);
    else console.log(JSON.stringify(rows, null, 2));
    db.close();
});
