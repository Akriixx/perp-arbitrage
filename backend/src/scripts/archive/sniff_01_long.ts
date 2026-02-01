
import WebSocket from 'ws';

const symbol = 'BTCUSD';
const channels = ['ticker', 'bbo', 'orderbook', 'depth', 'trade', 'stats', 'candle@BTCUSD:1'];
const baseUrl = 'wss://zo-mainnet.n1.xyz/ws';

async function sniff() {
    console.log(`--- Long Sniffing on zo-mainnet.n1.xyz for ${symbol} ---`);

    for (const ch of channels) {
        const url = ch.includes('@') ? `${baseUrl}/${ch}` : `${baseUrl}/${ch}@${symbol}`;
        console.log(`Testing: ${url}`);

        const ws = new WebSocket(url);
        let received = false;

        ws.on('open', () => {
            console.log(`  [OPEN] ${url}`);
            // Try standard sub message just in case
            ws.send(JSON.stringify({ op: 'subscribe', args: [ch.includes('@') ? ch : `${ch}@${symbol}`] }));
        });

        ws.on('message', (data) => {
            console.log(`  [MSG] ${url}: ${data.toString().substring(0, 200)}`);
            received = true;
        });

        ws.on('error', (err) => {
            // console.log(`  [ERR] ${url}: ${err.message}`);
        });

        // Wait 15s per channel
        await new Promise(r => setTimeout(r, 15000));
        ws.terminate();
        if (received) console.log(`  [RESULT] ${url} SENDS DATA!`);
    }
}

sniff();
