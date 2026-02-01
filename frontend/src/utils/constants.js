/**
 * Constants
 */

export const EXCHANGES = [
    { id: 'all', name: 'All Exchanges', icon: 'Layers' },
    { id: 'paradex', name: 'Paradex', icon: 'BarChart2' },
    { id: 'vest', name: 'Vest', icon: 'Activity' },
    { id: 'lighter', name: 'Lighter', icon: 'Zap' },
    { id: 'extended', name: 'Extended', icon: 'Box' },
    { id: 'nado', name: 'Nado', icon: 'Circle' },
    { id: 'zeroone', name: '01.XYZ', icon: 'Hash' }
];

export const EXCHANGE_COLORS = {
    vest: '#00F0FF',
    lighter: '#FFA500',
    paradex: '#00FF00',
    extended: '#FF00FF',
    nado: '#FF4444',
    zeroone: '#FFFFFF' // White for 01.XYZ
};

// Simple list of exchange IDs for iteration
export const ACTIVE_EXCHANGES_LIST = ['vest', 'lighter', 'paradex', 'extended', 'nado', 'zeroone'];

export const REFRESH_INTERVALS = [
    { value: 10000, label: '10s' },
    { value: 30000, label: '30s' },
    { value: 60000, label: '1min' },
    { value: 300000, label: '5min' },
];

export const SPREAD_THRESHOLDS = {
    HIGH: 0.3,    // Green
    MEDIUM: 0.1,  // Yellow
    LOW: 0        // Gray/Red
};

export const PAIR_LEVERAGE = {
    'BTC': 50,
    'ETH': 50,
    'SOL': 20,
    'PAXG': 10,
    'AAVE': 10,
    'SUI': 10,
    'XRP': 10,
    'GRASS': 5,
    'MYX': 3,
    'LIT': 5,
    'RESOLV': 3,
    'BERA': 5,
    'KAITO': 5
};

export const AVAILABLE_SYMBOLS = ['BTC', 'ETH', 'SOL', 'PAXG', 'RESOLV', 'BERA', 'KAITO', 'AAVE', 'SUI', 'XRP', 'GRASS'];
