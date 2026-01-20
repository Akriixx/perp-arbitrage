/**
 * useFilters Hook
 * Manages search, exchange filter, and sorting
 */

import { useState, useCallback, useMemo } from 'react';

export function useFilters(pairs, favorites, showFavoritesOnly) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedExchange, setSelectedExchange] = useState('all');
    const [sortField, setSortField] = useState('realSpread');
    const [sortDirection, setSortDirection] = useState('desc');

    // Handle sort toggle
    const handleSort = useCallback((field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    }, [sortField]);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setSearchQuery('');
        setSelectedExchange('all');
    }, []);

    // Filtered and sorted pairs
    const filteredPairs = useMemo(() => {
        return pairs
            .filter(pair => {
                // Search filter
                if (searchQuery && !pair.symbol.toLowerCase().includes(searchQuery.toLowerCase())) {
                    return false;
                }
                // Favorites filter
                if (showFavoritesOnly && !favorites.includes(pair.symbol)) {
                    return false;
                }
                // Exchange filter
                if (selectedExchange !== 'all') {
                    const exchangeData = pair[selectedExchange];
                    if (!exchangeData || (exchangeData.bid === 0 && exchangeData.ask === 0)) {
                        return false;
                    }
                }
                return true;
            })
            .sort((a, b) => {
                const aVal = a[sortField] ?? -999;
                const bVal = b[sortField] ?? -999;
                return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
            });
    }, [pairs, searchQuery, selectedExchange, showFavoritesOnly, favorites, sortField, sortDirection]);

    return {
        searchQuery,
        setSearchQuery,
        selectedExchange,
        setSelectedExchange,
        sortField,
        sortDirection,
        handleSort,
        clearFilters,
        filteredPairs
    };
}

export default useFilters;
