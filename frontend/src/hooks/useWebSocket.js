import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket(url, onMessage) {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const ws = useRef(null);
    const reconnectTimeout = useRef(null);

    const connect = useCallback(() => {
        if (ws.current?.readyState === WebSocket.OPEN) return;

        console.log('[WebSocket] Connecting to:', url);
        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
            console.log('[WebSocket] Connected');
            setIsConnected(true);
            setError(null);
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (onMessage) onMessage(data);
            } catch (err) {
                console.error('[WebSocket] Failed to parse message:', err);
            }
        };

        ws.current.onclose = () => {
            console.log('[WebSocket] Disconnected');
            setIsConnected(false);
            // Reconnect after 3 seconds
            reconnectTimeout.current = setTimeout(connect, 3000);
        };

        ws.current.onerror = (err) => {
            console.error('[WebSocket] Error:', err);
            setError('Connection error');
            ws.current.close();
        };
    }, [url, onMessage]);

    useEffect(() => {
        connect();
        return () => {
            if (ws.current) {
                ws.current.onclose = null; // Prevent reconnect on manual close
                ws.current.close();
            }
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        };
    }, [connect]);

    const sendMessage = useCallback((msg) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(msg));
        }
    }, []);

    return { isConnected, error, sendMessage };
}

export default useWebSocket;
