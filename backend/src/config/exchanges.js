/**
 * Exchange API Endpoints and Symbol Blacklist
 */

const API_ENDPOINTS = {
    PARADEX: 'https://api.prod.paradex.trade/v1/markets/summary?market=ALL',
    VEST_TICKER: 'https://server-prod.hz.vestmarkets.com/v2/ticker/24hr',
    VEST_DEPTH: 'https://server-prod.hz.vestmarkets.com/v2/depth',
    LIGHTER: 'https://mainnet.zklighter.elliot.ai/api/v1/orderBookDetails'
};

// Blacklist: Stock tickers, FX pairs, indices (not crypto)
const NON_CRYPTO_SYMBOLS = new Set([
    // Stocks
    'AAPL', 'AMD', 'AMZN', 'ARM', 'ASTS', 'BA', 'BABA', 'BITF', 'BMNR', 'CAT',
    'CC', 'CIFR', 'CLSK', 'COAI', 'COIN', 'CRCL', 'CRML', 'CVS', 'GLXY', 'GM',
    'GME', 'GOOG', 'HOOD', 'HRZN', 'IBIT', 'INTC', 'IONQ', 'JOBY', 'JPM',
    'KO', 'LCID', 'LLY', 'LUNR', 'MA', 'MARA', 'MCD', 'META', 'MSTR', 'NDAQ',
    'NKE', 'NVDA', 'PLTR', 'PYPL', 'QQQ', 'RDDT', 'REMX', 'RIOT', 'RKLB',
    'ROKU', 'SHOP', 'SLV', 'SMCI', 'SNAP', 'SOFI', 'SPX', 'SPY', 'SQ', 'SVMH',
    'TIGR', 'TSLA', 'TSM', 'UBER', 'UNH', 'V', 'VZ', 'WMT', 'XOM', 'ZG',
    // FX pairs
    'AUD', 'AUDUSD', 'CAD', 'CHF', 'EUR', 'EURUSD', 'GBP', 'GBPUSD', 'JPY',
    'NZD', 'USD', 'USDJPY', 'USDCAD', 'USDCHF',
    // Indices
    'DXY', 'SPX', 'NDX', 'VIX'
]);

const isCrypto = (symbol) => !NON_CRYPTO_SYMBOLS.has(symbol.toUpperCase());

module.exports = {
    API_ENDPOINTS,
    NON_CRYPTO_SYMBOLS,
    isCrypto
};
