
import WebSocket from 'ws';

const SYMBOLS = ['BTCUSD', 'ETHUSD', 'SOLUSD'];
const CHANNELS = ['ticker', 'orderbook', 'bbo', 'depth', 'trade', 'stats'];
const WS_BASE = 'wss://zo-mainnet.n1.xyz';

console.log('--- Probing 01.XYZ WebSocket for faster channels ---');

SYMBOLS.forEach(symbol => {
    CHANNELS.forEach(channel => {
        const url = `${WS_BASE}/ws/${channel}@${symbol}`;
        const ws = new WebSocket(url);

        ws.on('open', () => {
            console.log(`[CONNECTED] ${url}`);
        });

        ws.on('message', (data) => {
            console.log(`[MESSAGE] ${url}: ${data.toString().substring(0, 100)}...`);
            ws.close();
        });

        ws.on('error', (err) => {
            // console.log(`[ERROR] ${url}: ${err.message}`);
        });

        ws.on('close', () => {
            // console.log(`[CLOSED] ${url}`);
        });

        // Timeout after 10s
        setTimeout(() => ws.terminate(), 10000);
    });
});
