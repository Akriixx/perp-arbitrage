import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchScans, forceRefreshScans } from '../services/api';
import { useWebSocket } from './useWebSocket';

export function useMarketData() {
    const queryClient = useQueryClient();

    // Determine WS URL
    const wsUrl = useMemo(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = window.location.port === '5174' || window.location.port === '5173' ? '3000' : window.location.port;
        return `${protocol}//${host}${port ? `:${port}` : ''}`;
    }, []);

    // Throttle: Store latest data in ref, update UI at controlled interval
    const latestDataRef = useRef([]);
    const [displayedPairs, setDisplayedPairs] = useState([]);

    // Interval state with localStorage persistence
    const [refreshInterval, setRefreshIntervalState] = useState(() => {
        try {
            const saved = localStorage.getItem('vertex_refresh_interval');
            return saved ? parseInt(saved, 10) : 3000;
        } catch {
            return 3000;
        }
    });

    const setRefreshInterval = useCallback((val) => {
        setRefreshIntervalState(val);
        try {
            localStorage.setItem('vertex_refresh_interval', val);
        } catch { /* ignore */ }
    }, []);

    // Transfer data from ref to UI state
    const refreshUI = useCallback(() => {
        const data = latestDataRef.current;
        if (data && data.length > 0) {
            setDisplayedPairs([...data]);
        }
    }, []);

    // Setup throttled refresh interval
    useEffect(() => {
        refreshUI();
        const timer = setInterval(refreshUI, refreshInterval);
        return () => clearInterval(timer);
    }, [refreshInterval, refreshUI]);

    // WebSocket handler - stores in ref instantly
    const onWSMessage = useCallback((data) => {
        if (data.type === 'update' && data.pairs) {
            latestDataRef.current = data.pairs;
            queryClient.setQueryData(['scans'], data.pairs);
        }
    }, [queryClient]);

    const { isConnected: wsConnected, error: wsError } = useWebSocket(wsUrl, onWSMessage);

    // REST polling fallback
    const query = useQuery({
        queryKey: ['scans'],
        queryFn: async () => {
            const data = await fetchScans();
            const pairs = data?.pairs || [];
            latestDataRef.current = pairs;
            return pairs;
        },
        refetchInterval: wsConnected ? 30000 : 10000,
        staleTime: 1000,
        gcTime: 60000,
        refetchOnWindowFocus: true,
        retry: 3,
    });

    // Initialize from query data
    useEffect(() => {
        if (query.data && query.data.length > 0 && displayedPairs.length === 0) {
            latestDataRef.current = query.data;
            setDisplayedPairs(query.data);
        }
    }, [query.data, displayedPairs.length]);

    const hardRefresh = useCallback(async () => {
        try {
            const data = await forceRefreshScans();
            const pairs = data.pairs || [];
            latestDataRef.current = pairs;
            queryClient.setQueryData(['scans'], pairs);
            refreshUI();
        } catch { /* ignore */ }
    }, [queryClient, refreshUI]);

    return {
        pairs: displayedPairs,
        isLoading: query.isLoading && !wsConnected && displayedPairs.length === 0,
        isConnected: wsConnected || !query.error,
        error: (!wsConnected && query.isError) ? (wsError || query.error?.message) : null,
        lastUpdate: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
        refresh: refreshUI,
        hardRefresh,
        isFetching: query.isFetching,
        refreshInterval,
        setRefreshInterval,
        wsConnected,
    };
}

export default useMarketData;
