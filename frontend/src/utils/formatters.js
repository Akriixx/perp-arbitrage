/**
 * Formatting Utilities
 */

import { SPREAD_THRESHOLDS } from './constants';

/**
 * Format price for display
 */
export function formatPrice(price) {
    if (price === null || price === undefined) return '-';
    // Handle string inputs safely
    if (typeof price === 'string') {
        const num = parseFloat(price);
        if (isNaN(num)) return price;
        price = num;
    }

    if (price === 0) return '0.00';
    if (price < 0.01) return price.toPrecision(4);
    if (price < 1) return price.toFixed(4);
    if (price < 100) return price.toFixed(3);
    return price.toFixed(2);
}

/**
 * Format spread percentage
 */
export function formatSpread(spread) {
    if (spread === null || spread === undefined || spread < -900) return '-';
    return `${spread.toFixed(3)}%`;
}

/**
 * Get spread color class based on value
 */
export function getSpreadColor(spread) {
    if (spread >= SPREAD_THRESHOLDS.HIGH) return 'text-green-500';
    if (spread >= SPREAD_THRESHOLDS.MEDIUM) return 'text-yellow-500';
    if (spread >= SPREAD_THRESHOLDS.LOW) return 'text-gray-400';
    return 'text-red-500';
}

/**
 * Get spread background class
 */
export function getSpreadBg(spread) {
    if (spread >= SPREAD_THRESHOLDS.HIGH) return 'bg-green-500/10';
    if (spread >= SPREAD_THRESHOLDS.MEDIUM) return 'bg-yellow-500/10';
    return 'bg-transparent';
}

/**
 * Format time for display
 */
export function formatTime(date) {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}
