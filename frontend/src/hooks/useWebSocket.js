import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket(url, onMessage) {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const ws = useRef(null);
    const reconnectTimeout = useRef(null);

    const connect = useCallback(() => {
        if (ws.current?.readyState === WebSocket.OPEN) return;

        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
            setIsConnected(true);
            setError(null);
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (onMessage) onMessage(data);
            } catch { /* ignore parse errors */ }
        };

        ws.current.onclose = () => {
            setIsConnected(false);
            reconnectTimeout.current = setTimeout(connect, 3000);
        };

        ws.current.onerror = () => {
            setError('Connection error');
            ws.current.close();
        };
    }, [url, onMessage]);

    useEffect(() => {
        connect();
        return () => {
            if (ws.current) {
                ws.current.onclose = null;
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
