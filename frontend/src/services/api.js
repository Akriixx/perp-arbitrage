/**
 * API Service Layer
 * Centralized API calls to backend
 */

const API_BASE = '/api';

/**
 * Fetch all market scans
 */
export async function fetchScans() {
    const response = await fetch(`${API_BASE}/scans`);
    if (!response.ok) {
        throw new Error('Failed to fetch scans');
    }
    return response.json();
}

/**
 * Fetch spread history for a symbol
 */
export async function fetchSpreadHistory(symbol, period = '24h') {
    const response = await fetch(`${API_BASE}/spread-history?symbol=${symbol}&period=${period}`);
    if (!response.ok) {
        throw new Error('Failed to fetch spread history');
    }
    return response.json();
}

export default {
    fetchScans,
    fetchSpreadHistory
};
