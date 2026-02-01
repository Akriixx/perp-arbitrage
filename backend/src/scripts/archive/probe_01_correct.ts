
import axios from 'axios';
const baseUrl = 'https://zo-mainnet.n1.xyz';

async function testCorrectPattern() {
    const marketId = 0; // BTCUSD
    const url = `${baseUrl}/market/${marketId}/orderbook`;
    const statsUrl = `${baseUrl}/market/${marketId}/stats`;

    try {
        const res = await axios.get(url, { timeout: 3000 });
        console.log(`[SUCCESS] ORDERBOOK: ${JSON.stringify(res.data).substring(0, 200)}`);

        const res2 = await axios.get(statsUrl, { timeout: 3000 });
        console.log(`[SUCCESS] STATS: ${JSON.stringify(res2.data).substring(0, 200)}`);
    } catch (e: any) {
        console.log(`[FAIL] ${e.message}`);
        if (e.response) console.log('BODY:', JSON.stringify(e.response.data));
    }
}
testCorrectPattern();
