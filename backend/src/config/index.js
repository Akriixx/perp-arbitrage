/**
 * Application Configuration
 */

module.exports = {
    PORT: process.env.PORT || 3000,
    UPDATE_INTERVAL: 3000,       // 3 seconds (Real-time)
    DB_SAVE_INTERVAL: 60000,     // 1 minute
    CONCURRENCY: 5,              // Max parallel API requests
    REQUEST_TIMEOUT: 10000,      // 10 seconds

    COMMON_HEADERS: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'xrestservermm': 'restserver',
        'Origin': 'https://vestmarkets.com',
        'Referer': 'https://vestmarkets.com/',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site'
    },

    ALLOWED_SYMBOLS: [
        'BTC', 'ETH', 'SOL', 'PAXG', 'RESOLV', 'BERA', 'KAITO'
    ]
};
