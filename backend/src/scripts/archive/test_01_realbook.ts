
import WebSocket from 'ws';

const symbol = 'ETHUSD';
const url = `wss://zo-mainnet.n1.xyz/ws/orderbook@${symbol}`;

console.log(`Connecting to ${url}...`);
const ws = new WebSocket(url);

ws.on('open', () => {
    console.log('Connected!');

    // Some Serum-based WS need a subscribe message even on specific paths
    const subMsg = {
        op: "subscribe",
        args: [`orderbook@${symbol}`]
    };
    ws.send(JSON.stringify(subMsg));
    console.log('Sent sub msg:', JSON.stringify(subMsg));
});

ws.on('message', (data) => {
    console.log('RCV:', data.toString().substring(0, 1000));
});

ws.on('error', (err) => console.error('ERR:', err));
ws.on('close', () => console.log('CLOSED'));

setTimeout(() => {
    console.log('Timeout - closing.');
    ws.terminate();
}, 60000); // 60s to be sure
