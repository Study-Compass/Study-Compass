import { useEffect, useState, useCallback, useMemo } from 'react';
import io from 'socket.io-client';

const useWebSocket = (events) => {
    const [socket, setSocket] = useState(null);

    // Memoize the events object to avoid unnecessary re-renders
    const memoizedEvents = useMemo(() => events, [events]);

    useEffect(() => {
        const socketIo = io(); // Using relative URL
        setSocket(socketIo);

        // // Register event handlers
        // Object.keys(memoizedEvents).forEach(event => {
        //     socketIo.on(event, memoizedEvents[event]);
        // });

        // Heartbeat mechanism
        const heartbeatInterval = setInterval(() => {
            if (socketIo) {
                socketIo.emit('ping');
            }
        }, 25000); // Send ping every 25 seconds

        // Cleanup on unmount
        return () => {
            clearInterval(heartbeatInterval);
            Object.keys(memoizedEvents).forEach(event => {
                socketIo.off(event, memoizedEvents[event]);
            });
            socketIo.disconnect();
        };
    }, [memoizedEvents]);

    const sendMessage = useCallback((event, message) => {
        if (socket) {
            socket.emit(event, message);
        }
    }, [socket]);

    return { sendMessage, socket };
};

export default useWebSocket;
