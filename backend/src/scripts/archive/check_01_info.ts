
import axios from 'axios';
const baseUrl = 'https://zo-mainnet.n1.xyz';

async function checkInfo() {
    try {
        const res = await axios.get(`${baseUrl}/info`);
        console.log('INFO SUCCESS:', JSON.stringify(res.data).substring(0, 1000));

        if (res.data.markets) {
            console.log('Markets count:', res.data.markets.length);
            console.log('First market:', res.data.markets[0]);
        }
    } catch (e: any) {
        console.log('INFO FAIL:', e.message);
    }
}
checkInfo();
