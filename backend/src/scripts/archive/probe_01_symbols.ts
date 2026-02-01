
import axios from 'axios';
const baseUrl = 'https://zo-mainnet.n1.xyz';

async function testSymbols() {
    const symbol = 'BTCUSD';
    const paths = [
        `/orderbook/${symbol}`,
        `/market/${symbol}/orderbook`,
        `/stats/${symbol}`,
        `/market/${symbol}/stats`,
        `/prices/${symbol}`
    ];

    for (const p of paths) {
        const url = `${baseUrl}${p}`;
        try {
            const res = await axios.get(url, { timeout: 3000 });
            console.log(`[SUCCESS] ${url}: ${JSON.stringify(res.data).substring(0, 50)}`);
        } catch (e: any) {
            console.log(`[FAIL] ${url}: ${e.message}`);
        }
    }
}
testSymbols();
