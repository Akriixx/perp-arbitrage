/**
 * useMarketData Hook
 * Fetches and manages real-time market data with auto-refresh
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchScans } from '../services/api';

export function useMarketData(refreshInterval = 30000) {
    const [pairs, setPairs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchScans();
            setPairs(data.pairs || []);
            setLastUpdate(new Date());
            setIsConnected(true);
            setError(null);
        } catch (err) {
            setError(err.message);
            setIsConnected(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, refreshInterval);
        return () => clearInterval(interval);
    }, [fetchData, refreshInterval]);

    return {
        pairs,
        isLoading,
        isConnected,
        error,
        lastUpdate,
        refresh: fetchData
    };
}

export default useMarketData;
