
import axios from 'axios';
const baseUrl = 'https://zo-mainnet.n1.xyz';

async function debug400() {
    const symbol = 'BTCUSD';
    const url = `${baseUrl}/market/${symbol}/orderbook`;

    try {
        await axios.get(url, { timeout: 3000 });
    } catch (e: any) {
        if (e.response) {
            console.log(`URL: ${url}`);
            console.log(`STATUS: ${e.response.status}`);
            console.log(`DATA:`, JSON.stringify(e.response.data));
        } else {
            console.log('Error without response:', e.message);
        }
    }
}
debug400();
