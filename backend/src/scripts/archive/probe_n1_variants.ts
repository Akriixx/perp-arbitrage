
import axios from 'axios';

// Testing potential N1/Zo API variants
const variants = [
    'https://nord-api.01.xyz',
    'https://api.zo.xyz',
    'https://api.n1.xyz',
    'https://rpc.n1.xyz',
    'https://mainnet-api.n1.xyz'
];

async function probe() {
    console.log(`--- Probing N1/Zo API Variants ---`);
    for (const v of variants) {
        try {
            console.log(`Testing: ${v}/info`);
            const res = await axios.get(`${v}/info`, { timeout: 3000 });
            console.log(`  [SUCCESS] ${v} replied with ${JSON.stringify(res.data).substring(0, 100)}`);
        } catch (e: any) {
            console.log(`  [FAIL] ${v}: ${e.message}`);
        }
    }
}

probe();
