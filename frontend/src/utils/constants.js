/**
 * Constants
 */

export const EXCHANGES = [
    { id: 'all', name: 'All Exchanges', icon: 'Layers' },
    { id: 'paradex', name: 'Paradex', icon: 'BarChart2' },
    { id: 'vest', name: 'Vest', icon: 'Activity' },
    { id: 'lighter', name: 'Lighter', icon: 'Zap' },
    { id: 'extended', name: 'Extended', icon: 'Box' },
    { id: 'nado', name: 'Nado', icon: 'Circle' }
];

// Simple list of exchange IDs for iteration
export const ACTIVE_EXCHANGES_LIST = ['vest', 'lighter', 'paradex', 'extended', 'nado'];

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
