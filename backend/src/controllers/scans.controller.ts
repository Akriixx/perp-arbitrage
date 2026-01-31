/**
 * Scans Controller
 * Handles API requests for market scan data
 */

import { Request, Response } from 'express';
import { getPriceCache, updateMarketData } from '../services/aggregator.service';
import { logger } from '../utils/app-logger';

const TAG = 'API';

/**
 * GET /api/scans
 * Returns all pairs with current prices
 */
export function getScans(req: Request, res: Response) {
    const pairs = Object.values(getPriceCache());
    res.json({ pairs });
}

/**
 * POST /api/refresh
 * Forces an immediate update from exchanges
 */
export async function refreshScans(req: Request, res: Response) {
    try {
        logger.info(TAG, 'Hard refresh requested');
        const cache = await updateMarketData();
        const pairs = Object.values(cache);
        res.json({ pairs });
    } catch (err) {
        logger.error(TAG, 'Refresh failed', err);
        res.status(500).json({ error: 'Failed to refresh market data' });
    }
}
