import { useState, useEffect } from 'react';

export function useAlerts() {
    // Persistent State for Global Settings
    const [minSpread, setMinSpread] = useState(() => {
        try {
            const saved = localStorage.getItem('alert_min_spread');
            // If saved value is 2.7 (user's annoying default) or missing, use 0.1
            if (saved === '2.7' || !saved) return 0.1;
            return parseFloat(saved);
        } catch (e) {
            return 0.1;
        }
    });

    const [soundEnabled, setSoundEnabled] = useState(() => {
        try {
            return localStorage.getItem('alert_sound_enabled') !== 'false';
        } catch (e) {
            return true;
        }
    });

    // Save settings
    useEffect(() => {
        try {
            localStorage.setItem('alert_min_spread', minSpread);
            localStorage.setItem('alert_sound_enabled', soundEnabled);
        } catch (e) {
            console.warn("LocalStorage access failed", e);
        }
    }, [minSpread, soundEnabled]);

    return {
        minSpread,
        setMinSpread,
        soundEnabled,
        setSoundEnabled
    };
}
