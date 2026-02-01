
import axios from 'axios';
const baseUrl = 'https://zo-mainnet.n1.xyz';

async function testFinal() {
    const mId = 0;
    const paths = [
        '/v1/orderbook',
        '/v1/market/orderbook',
        '/api/orderbook',
        '/api/v1/orderbook',
        '/market/orderbook',
        '/orderbooks'
    ];

    for (const p of paths) {
        const url = `${baseUrl}${p}?marketId=${mId}`;
        try {
            const res = await axios.get(url, { timeout: 3000 });
            console.log(`[SUCCESS] ${url}: ${JSON.stringify(res.data).substring(0, 50)}`);
        } catch (e: any) {
            console.log(`[FAIL] ${url}: ${e.message}`);
        }
    }
}
testFinal();
