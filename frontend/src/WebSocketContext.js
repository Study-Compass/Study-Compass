import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';

// Create a context
const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Connect to the WebSocket server
        const socketIo = io();

        setSocket(socketIo);

        socketIo.on('ping', () => {
            socketIo.emit('pong');
        });

        const heartbeatInterval = setInterval(() => {
            if (socketIo) {
                socketIo.emit('ping');
            }
        }, 25000); // Send ping every 25 seconds


        // Cleanup on unmount
        return () => {
            clearInterval(heartbeatInterval);
            socketIo.disconnect();
        };
    }, []);

    const sendMessage = useCallback((message) => {
        if (socket) {
            socket.emit('message', message);
        }
    }, [socket]);

    const registerHandler = useCallback((event, handler) => {
        if (socket) {
            socket.on(event, handler);
        }
    }, [socket]);

    const unregisterHandler = useCallback((event, handler) => {
        if (socket) {
            socket.off(event, handler);
        }
    }, [socket]);

    return (
        <WebSocketContext.Provider value={{ socket, sendMessage, registerHandler, unregisterHandler }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket1 = () => {
    return useContext(WebSocketContext);
};
