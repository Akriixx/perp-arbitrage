import { Request, Response } from 'express';
import { getSpreadHistory } from '../db/database';
import { logger } from '../utils/app-logger';

const TAG = 'History';

export async function getSpreadHistoryController(req: Request, res: Response) {
    const { pair, period = '24h', bidEx, askEx } = req.query;

    if (!pair) {
        return res.status(400).json({ error: 'Pair is required' });
    }

    try {
        const periodStr = period as string;
        // MAPPING FIX: Frontend sends '01.XYZ', DB has 'ZEROONE'
        let bidExStr = bidEx as string | undefined;
        let askExStr = askEx as string | undefined;

        if (bidExStr === '01.XYZ' || bidExStr === '01.xyz') bidExStr = 'ZEROONE';
        if (askExStr === '01.XYZ' || askExStr === '01.xyz') askExStr = 'ZEROONE';

        logger.debug(TAG, `Fetching history for ${pair} (${periodStr}) [${bidExStr || '*'} -> ${askExStr || '*'}]`);
        const rows = await getSpreadHistory(pair as string, periodStr, bidExStr, askExStr);

        // --- ADAPTIVE GRANULARITY CONFIG ---
        // --- ADAPTIVE GRANULARITY CONFIG (User Requested) ---
        let interval = 2; // default: 2 min for 24h (High Precision)
        if (periodStr === '7d') interval = 15; // 15 min for 7d
        else if (periodStr === '14d' || periodStr === 'all') interval = 30; // 30 min for 14d

        // --- DOWNSAMPLING LOGIC (Peak Preservation) ---
        // Instead of averaging (which smooths out volatility), we pick the "extreme" point
        // in each bucket (max absolute spread) to preserve visual spikes.
        function downsampleData(rawData: any[], intervalMinutes: number) {
            const buckets: Record<string, any[]> = {};
            const intervalMs = intervalMinutes * 60 * 1000;

            rawData.forEach(point => {
                // SQLite returns YYYY-MM-DD HH:MM:SS (UTC)
                const timeString = point.timestamp.includes(' ') ? point.timestamp.replace(' ', 'T') + 'Z' : point.timestamp;
                const ts = new Date(timeString).getTime();

                if (isNaN(ts)) return;

                // Floor to nearest bucket
                const bucketTime = Math.floor(ts / intervalMs) * intervalMs;
                const key = bucketTime.toString();

                if (!buckets[key]) {
                    buckets[key] = [];
                }

                // Store full object to keep correlation between spread and prices
                buckets[key].push({
                    spread: point.spread,
                    best_ask: point.best_ask,
                    best_bid: point.best_bid
                });
            });

            return Object.entries(buckets)
                .sort(([tsA], [tsB]) => Number(tsA) - Number(tsB))
                .map(([timestamp, points]) => {
                    // Calculate Average for the bucket
                    const sum = points.reduce((acc, p) => acc + p.spread, 0);
                    const avg = sum / points.length;

                    // Find Peak (max absolute deviation from zero)
                    const peakPoint = points.reduce((prev, current) => {
                        return Math.abs(current.spread) > Math.abs(prev.spread) ? current : prev;
                    });

                    // Hybrid Selection: Use Peak ONLY if it deviates significantly (> 0.15%)
                    // AND persists for a minimum duration (approx 20-30s)

                    // 1. Identify all points in this bucket that qualify as "spikes"
                    const spikeCandidates = points.filter(p => Math.abs(p.spread - avg) > 0.15);

                    // 2. Check duration (Approx 1 point = 1 second via polling)
                    // limit to 20 points (~20-30s) to be safe against missed polls while filtering 7s flashes
                    const hasSustainedDuration = spikeCandidates.length >= 20;

                    // 3. Final Decision
                    const finalSpread = hasSustainedDuration ? peakPoint.spread : avg;

                    // For context (prices), match the selection
                    // If we show peak spread, we must show peak prices to match
                    const finalAsk = hasSustainedDuration ? peakPoint.best_ask : (points.reduce((acc, p) => acc + (p.best_ask || 0), 0) / points.length);
                    const finalBid = hasSustainedDuration ? peakPoint.best_bid : (points.reduce((acc, p) => acc + (p.best_bid || 0), 0) / points.length);

                    return {
                        timestamp: new Date(Number(timestamp)).toISOString(),
                        spread: parseFloat(finalSpread.toFixed(4)),
                        lighter_price: parseFloat(finalAsk?.toFixed(2) || 0),
                        vest_price: parseFloat(finalBid?.toFixed(2) || 0)
                    };
                });
        }

        const data = downsampleData(rows, interval);

        // Calculate stats using ALL raw data for accuracy
        const fullSpreads = rows.map(r => r.spread).filter(s => s !== null && !isNaN(s));

        let stats = { current: 0, average: 0, min: 0, max: 0, percentile: 0 };

        if (fullSpreads.length > 0) {
            const current = fullSpreads[fullSpreads.length - 1];
            const min = Math.min(...fullSpreads);
            const max = Math.max(...fullSpreads);
            const average = fullSpreads.reduce((a: number, b: number) => a + b, 0) / fullSpreads.length;

            const sorted = [...fullSpreads].sort((a, b) => a - b);
            const rank = sorted.filter(v => v < current).length;
            const percentile = Math.round((rank / fullSpreads.length) * 100);

            stats = {
                current: parseFloat(current.toFixed(4)),
                average: parseFloat(average.toFixed(4)),
                min: parseFloat(min.toFixed(4)),
                max: parseFloat(max.toFixed(4)),
                percentile
            };
        }

        res.json({
            pair,
            period: periodStr,
            interval: `${interval}min`,
            dataPoints: data.length,
            data,
            stats
        });

    } catch (error) {
        logger.error(TAG, 'Error fetching history', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
}
