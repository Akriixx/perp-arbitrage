
import axios from 'axios';
const baseUrl = 'https://zo-mainnet.n1.xyz';

async function testEndpoints() {
    const marketId = 0; // BTCUSD
    const symbols = ['BTCUSD', 'BTC-PERP'];

    console.log('--- Testing /orderbook Variants ---');
    const obVariants = [
        `${baseUrl}/orderbook?marketId=${marketId}`,
        `${baseUrl}/orderbook?market_id=${marketId}`,
        `${baseUrl}/orderbook/${marketId}`,
        `${baseUrl}/orderbook?symbol=BTCUSD`
    ];

    for (const url of obVariants) {
        try {
            const res = await axios.get(url, { timeout: 3000 });
            console.log(`[SUCCESS] ${url}: ${JSON.stringify(res.data).substring(0, 100)}`);
        } catch (e: any) {
            console.log(`[FAIL] ${url}: ${e.message}`);
        }
    }

    console.log('\n--- Testing /stats Variants ---');
    const statsVariants = [
        `${baseUrl}/market/${marketId}/stats`,
        `${baseUrl}/stats?marketId=${marketId}`,
        `${baseUrl}/stats/${marketId}`
    ];

    for (const url of statsVariants) {
        try {
            const res = await axios.get(url, { timeout: 3000 });
            console.log(`[SUCCESS] ${url}: ${JSON.stringify(res.data).substring(0, 100)}`);
        } catch (e: any) {
            console.log(`[FAIL] ${url}: ${e.message}`);
        }
    }
}
testEndpoints();
