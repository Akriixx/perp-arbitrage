import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchScans, forceRefreshScans } from '../services/api';


export function useMarketData() {
    const queryClient = useQueryClient();

    // Removed WebSocket to prevent connection errors and unstable refreshing
    const wsConnected = false;
    const wsError = null;

    // Interval State with safe LocalStorage default
    const [refreshInterval, setRefreshIntervalState] = useState(() => {
        try {
            const saved = localStorage.getItem('vertex_refresh_interval');
            // Default to 5s (5000ms) as requested by user
            return saved ? parseInt(saved, 10) : 5000;
        } catch {
            return 5000;
        }
    });

    // Safe setter that persists to LocalStorage
    const setRefreshInterval = useCallback((val) => {
        setRefreshIntervalState(val);
        try {
            localStorage.setItem('vertex_refresh_interval', val);
        } catch (e) {
            console.warn('LS Save Error', e);
        }
    }, []);

    // Pure REST polling
    const query = useQuery({
        queryKey: ['scans'],
        queryFn: async () => {
            const data = await fetchScans();
            return data?.pairs || [];
        },
        // Poll at the user-selected interval (e.g., 5s)
        refetchInterval: refreshInterval > 0 ? refreshInterval : false,
        staleTime: 1000,
        gcTime: 60000,
        refetchOnWindowFocus: true,
        retry: 3,
    });

    const hardRefresh = useCallback(async () => {
        try {
            const data = await forceRefreshScans();
            queryClient.setQueryData(['scans'], data.pairs || []);
        } catch (err) {
            console.error("Hard refresh failed", err);
        }
    }, [queryClient]);

    return {
        pairs: query.data || [],
        isLoading: query.isLoading,
        isConnected: true, // Always true for REST unless query fails
        error: query.error?.message || null,
        lastUpdate: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
        refresh: query.refetch,        // Soft Refresh (just fetch)
        hardRefresh: hardRefresh,      // Hard Refresh (force backend update)
        isFetching: query.isFetching,
        refreshInterval,
        setRefreshInterval,
        wsConnected: false,  // WebSocket disabled
    };
}

export default useMarketData;
