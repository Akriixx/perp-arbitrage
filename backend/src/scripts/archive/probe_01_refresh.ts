
import axios from 'axios';

const mId = 0; // BTCUSD
const url = `https://zo-mainnet.n1.xyz/orderbook?marketId=${mId}`;

async function probe() {
    console.log(`--- Probing ${url} for 10 iterations (1s gap) ---`);
    for (let i = 0; i < 10; i++) {
        try {
            const start = Date.now();
            const res = await axios.get(url);
            const dur = Date.now() - start;
            const bestBid = res.data.bids?.[0]?.[0];
            const bestAsk = res.data.asks?.[0]?.[0];
            console.log(`[${i}] ${bestBid} / ${bestAsk} (Latency: ${dur}ms)`);
        } catch (e: any) {
            console.log(`[${i}] Error: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 1000));
    }
}

probe();
