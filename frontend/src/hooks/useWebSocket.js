import { useState, useEffect, useRef } from 'react';

/**
 * WebSocket Hook for Real-Time Price Updates
 * Connects to backend WebSocket server for instant price data
 */
export function useWebSocket(url = 'ws://localhost:3000') {
    const [data, setData] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

        function connect() {
            try {
                console.log('[WebSocket] Connecting to', url);
                const ws = new WebSocket(url);
                wsRef.current = ws;

                ws.onopen = () => {
                    if (!isMounted) return;
                    console.log('[WebSocket] Connected');
                    setIsConnected(true);
                    setError(null);
                };

                ws.onmessage = (event) => {
                    if (!isMounted) return;
                    try {
                        const message = JSON.parse(event.data);
                        if (message.type === 'update' || message.type === 'initial') {
                            setData(message.pairs);
                        }
                    } catch (err) {
                        console.error('[WebSocket] Parse error:', err);
                    }
                };

                ws.onerror = (err) => {
                    if (!isMounted) return;
                    console.error('[WebSocket] Error:', err);
                    setError('WebSocket connection error');
                };

                ws.onclose = () => {
                    if (!isMounted) return;
                    console.log('[WebSocket] Disconnected');
                    setIsConnected(false);

                    // Auto-reconnect after 3 seconds
                    reconnectTimeoutRef.current = setTimeout(() => {
                        if (isMounted) {
                            console.log('[WebSocket] Attempting to reconnect...');
                            connect();
                        }
                    }, 3000);
                };

            } catch (err) {
                console.error('[WebSocket] Connection error:', err);
                setError(err.message);
            }
        }

        connect();

        // Cleanup
        return () => {
            isMounted = false;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [url]);

    return {
        data,
        isConnected,
        error
    };
}

export default useWebSocket;
