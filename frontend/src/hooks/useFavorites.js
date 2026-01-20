/**
 * useFavorites Hook
 * Manages favorite pairs with localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'arbi_favorites';

export function useFavorites() {
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }, [favorites]);

    const toggleFavorite = useCallback((symbol) => {
        setFavorites(prev =>
            prev.includes(symbol)
                ? prev.filter(s => s !== symbol)
                : [...prev, symbol]
        );
    }, []);

    const isFavorite = useCallback((symbol) => {
        return favorites.includes(symbol);
    }, [favorites]);

    const toggleShowFavorites = useCallback(() => {
        setShowFavoritesOnly(prev => !prev);
    }, []);

    return {
        favorites,
        showFavoritesOnly,
        toggleFavorite,
        isFavorite,
        toggleShowFavorites,
        favoritesCount: favorites.length
    };
}

export default useFavorites;
