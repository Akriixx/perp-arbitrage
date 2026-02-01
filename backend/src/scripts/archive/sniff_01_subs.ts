
import WebSocket from 'ws';

const symbol = 'ETHUSD';
const url = 'wss://zo-mainnet.n1.xyz/ws';

console.log(`Connecting to ${url}...`);
const ws = new WebSocket(url);

ws.on('open', () => {
    console.log('Connected! Sending subscriptions...');

    // Test common subscription patterns
    const patterns = [
        { method: 'subscribe', stream: 'ticker', symbol: symbol },
        { op: 'subscribe', args: [`ticker@${symbol}`] },
        { type: 'subscribe', channels: [{ name: 'ticker', symbols: [symbol] }] },
        { action: 'sub', channel: 'ticker', symbol: symbol },
        { method: 'SUBSCRIBE', params: [`ticker@${symbol}`] }
    ];

    patterns.forEach(msg => {
        console.log('SND:', JSON.stringify(msg));
        ws.send(JSON.stringify(msg));
    });
});

ws.on('message', (data) => {
    console.log('RCV:', data.toString().substring(0, 500));
});

ws.on('error', (err) => console.error('ERR:', err));
ws.on('close', () => console.log('CLOSED'));

setTimeout(() => {
    console.log('Timeout - closing sniffing.');
    ws.terminate();
}, 20000);
