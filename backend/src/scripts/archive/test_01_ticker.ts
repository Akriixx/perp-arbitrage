
import WebSocket from 'ws';

const url = 'wss://zo-mainnet.n1.xyz/ws/ticker@BTCUSD';
const ws = new WebSocket(url);

console.log(`Connecting to ${url}...`);

ws.on('open', () => {
    console.log('Connected!');
});

ws.on('message', (data) => {
    console.log('RECEIVED:', data.toString());
});

ws.on('error', (err) => console.error('ERROR:', err));
ws.on('close', () => console.log('CLOSED'));

setTimeout(() => {
    console.log('Timing out after 30s');
    ws.terminate();
}, 30000);
