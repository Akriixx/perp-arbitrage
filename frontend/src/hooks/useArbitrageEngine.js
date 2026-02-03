import { useMemo, useCallback } from 'react';
import { ACTIVE_EXCHANGES_LIST, EXCHANGES } from '../utils/constants';

export function useArbitrageEngine(pairs, enabledExchanges, pairThresholds, minSpread) {
    // Helper: Is a symbol monitored (custom threshold set)?
    const isMonitored = useCallback((symbol) => pairThresholds.hasOwnProperty(symbol), [pairThresholds]);

    // Helper: Get effective threshold (custom or global min)
    const getAlertThreshold = useCallback((symbol) => {
        return pairThresholds[symbol] !== undefined ? pairThresholds[symbol] : minSpread;
    }, [pairThresholds, minSpread]);

    // Derived: Map exchange IDs to Names
    const exchangesMap = useMemo(() => {
        return EXCHANGES.reduce((acc, ex) => ({ ...acc, [ex.id]: ex.name.toUpperCase() }), {});
    }, []);

    // Core Logic: Calculate Spreads dynamically based on enabled exchanges
    const getDynamicSpread = useCallback((pair) => {
        let maxBid = 0, maxBidEx = null;
        let minAsk = Infinity, minAskEx = null;

        ACTIVE_EXCHANGES_LIST.forEach(ex => {
            if (!enabledExchanges[ex]) return;
            const bid = pair[ex]?.bid || 0;
            const ask = pair[ex]?.ask || 0;

            if (bid > maxBid) {
                maxBid = bid;
                maxBidEx = exchangesMap[ex] || ex.toUpperCase();
            }
            if (ask > 0 && ask < minAsk) {
                minAsk = ask;
                minAskEx = exchangesMap[ex] || ex.toUpperCase();
            }
        });

        if (maxBid > 0 && minAsk !== Infinity) {
            return {
                realSpread: ((maxBid - minAsk) / minAsk) * 100,
                bestBid: maxBid,
                bestAsk: minAsk,
                bestBidEx: maxBidEx,
                bestAskEx: minAskEx
            };
        }
        return { realSpread: -999, bestBid: 0, bestAsk: 0, bestBidEx: null, bestAskEx: null };
    }, [enabledExchanges, exchangesMap]);

    // 1. Enrich pairs with dynamic spread data
    const dynamicPairs = useMemo(() => {
        return pairs.map(p => ({ ...p, ...getDynamicSpread(p) }));
    }, [pairs, getDynamicSpread]);

    // 2. Count monitored pairs
    const monitoredCount = useMemo(() => {
        return dynamicPairs.filter(p => isMonitored(p.symbol)).length;
    }, [dynamicPairs, isMonitored]);

    // 3. Sort logic: Alerting pairs first, then by spread descending
    const sortedData = useMemo(() => {
        return [...dynamicPairs].sort((a, b) => {
            const aThreshold = getAlertThreshold(a.symbol);
            const bThreshold = getAlertThreshold(b.symbol);

            const aAlerting = isMonitored(a.symbol) && a.realSpread >= aThreshold;
            const bAlerting = isMonitored(b.symbol) && b.realSpread >= bThreshold;

            if (aAlerting && !bAlerting) return -1;
            if (!aAlerting && bAlerting) return 1;

            return (b.realSpread || -999) - (a.realSpread || -999);
        });
    }, [dynamicPairs, isMonitored, getAlertThreshold]);

    return {
        dynamicPairs,
        sortedData,
        monitoredCount,
        getAlertThreshold,
        isMonitored
    };
}
