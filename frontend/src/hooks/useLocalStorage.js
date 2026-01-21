import { useState, useEffect } from 'react';

/**
 * Custom hook for managing state synchronized with localStorage
 * @param {string} key - The key to store/retrieve data from localStorage
 * @param {any} initialValue - The initial value if no data exists
 * @returns {Array} [storedValue, setValue] - Similar to useState
 */
export function useLocalStorage(key, initialValue) {
    // Get from local storage then parse stored json or return initialValue
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue = (value) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore =
                value instanceof Function ? value(storedValue) : value;

            // Save state
            setStoredValue(valueToStore);

            // Save to local storage
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    };

    useEffect(() => {
        setStoredValue(storedValue);
    }, []);

    return [storedValue, setValue];
}
