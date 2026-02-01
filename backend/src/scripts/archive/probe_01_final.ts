
import axios from 'axios';

const mId = 0; // BTCUSD
const baseUrl = 'https://zo-mainnet.n1.xyz';

async function probe() {
    console.log(`--- Probing marketId ${mId} for 10s (Every 1s) ---`);
    for (let i = 0; i < 10; i++) {
        try {
            // Correct URL construction with ? before &
            const obUrl = `${baseUrl}/orderbook?marketId=${mId}&cb=${Date.now()}`;
            const statsUrl = `${baseUrl}/market/${mId}/stats?cb=${Date.now()}`;

            const [obRes, statRes] = await Promise.all([
                axios.get(obUrl, { timeout: 2000 }),
                axios.get(statsUrl, { timeout: 2000 })
            ]);

            const bid = obRes.data.bids?.[0]?.[0];
            const ask = obRes.data.asks?.[0]?.[0];
            const index = statRes.data.indexPrice;
            const mark = statRes.data.perpStats?.mark_price;

            console.log(`[${i}] OB: ${bid}/${ask} | Index: ${index} | Mark: ${mark}`);
        } catch (e: any) {
            console.log(`[${i}] Error: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 1000));
    }
}

probe();
