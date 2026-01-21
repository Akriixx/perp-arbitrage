import { useCallback } from 'react';

/**
 * Custom hook for playing audio files
 * @param {string} url - The URL of the audio file
 * @param {number} volume - Volume level (0.0 to 1.0)
 * @returns {Function} play - Function to play the audio
 */
export function useAudio(url, volume = 0.5) {
    const play = useCallback(() => {
        if (!url) return;

        try {
            const audio = new Audio(url);
            audio.volume = volume;
            audio.play().catch(e => console.warn("Audio play failed", e));
        } catch (e) {
            console.warn("Audio initialization failed", e);
        }
    }, [url, volume]);

    return play;
}
