/**
 * Application Configuration
 */

module.exports = {
    PORT: process.env.PORT || 3000,
    UPDATE_INTERVAL: 20000,      // 20 seconds
    DB_SAVE_INTERVAL: 60000,     // 1 minute
    CONCURRENCY: 5,              // Max parallel API requests
    REQUEST_TIMEOUT: 10000,      // 10 seconds

    COMMON_HEADERS: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
};
