/**
 * Exchange API Endpoints and Symbol Blacklist
 */

export const API_ENDPOINTS = {
    PARADEX: process.env.API_PARADEX || 'https://api.prod.paradex.trade/v1/markets/summary?market=ALL',
    PARADEX_WS: process.env.WS_PARADEX || 'wss://ws.api.prod.paradex.trade/v1',
    VEST_TICKER: process.env.API_VEST_TICKER || 'https://server-prod.hz.vestmarkets.com/v2/ticker/24hr',
    VEST_DEPTH: process.env.API_VEST_DEPTH || 'https://server-prod.hz.vestmarkets.com/v2/depth',
    VEST_WS: process.env.WS_VEST || 'wss://ws-prod.hz.vestmarkets.com/ws-api?version=1.0',
    LIGHTER: process.env.API_LIGHTER || 'https://mainnet.zklighter.elliot.ai/api/v1/orderBookDetails',
    LIGHTER_WS: process.env.WS_LIGHTER || 'wss://mainnet.zklighter.elliot.ai/stream',
    // Extended Exchange (Starknet Mainnet)
    EXTENDED_MARKETS: process.env.API_EXTENDED_MARKETS || 'https://api.starknet.extended.exchange/api/v1/info/markets',
    // NADO Exchange
    NADO_REST: process.env.API_NADO || 'https://gateway.prod.nado.xyz/v1',
    NADO_WS: process.env.WS_NADO || 'wss://gateway.prod.nado.xyz/v1/subscribe',
    // 01.XYZ Exchange
    ZEROONE_REST: process.env.API_ZEROONE || 'https://zo-mainnet.n1.xyz',
    ZEROONE_WS: process.env.WS_ZEROONE || 'wss://zo-mainnet.n1.xyz'
};

// Whitelist: Only support BTC, ETH, SOL
export const SUPPORTED_SYMBOLS = new Set(['BTC', 'ETH', 'SOL']);

export const isCrypto = (symbol: string): boolean => SUPPORTED_SYMBOLS.has(symbol.toUpperCase());

