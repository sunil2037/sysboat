import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from './ServerURL';
import { storage } from '../../hooks/useEncodedUserData';

const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [reconnectTrigger, setReconnectTrigger] = useState(0);
    const socketRef = useRef(null);

    const reconnectSocket = useCallback(() => {
        setReconnectTrigger(prev => prev + 1);
    }, []);

    const disconnectSocket = useCallback(() => {

        if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        setSocket(null);
        setIsConnected(false);
    }, []);


    useEffect(() => {
        const socketclearnup = async () => {
            const token = await storage.getString('token');

            if (!token || !API_BASE_URL) {
                console.warn(
                    'SocketProvider: token or API_BASE_URL is missing, socket not connecting.'
                );
                if (socketRef.current) {
                    socketRef.current.disconnect();
                    socketRef.current = null;
                    setSocket(null);
                    setIsConnected(false);
                }
                return;
            }

            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }


            const newSocket = io(API_BASE_URL, {
                auth: {
                    token: token,
                },
                transports: ['websocket'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
                forceNew: true,
            });

            newSocket.on('connect', () => {
                setIsConnected(true);
            });

            newSocket.on('disconnect', (reason) => {
                setIsConnected(false);
            });

            newSocket.on('connect_error', (err) => {
                setIsConnected(false);
            });

            newSocket.on('reconnect', (attemptNumber) => {
                setIsConnected(true);
            });

            socketRef.current = newSocket;
            setSocket(newSocket);

            return () => {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                    socketRef.current = null;
                }
                setIsConnected(false);
            };
        }
        socketclearnup();
    }, [reconnectTrigger]);

    const contextValue = {
        socket,
        isConnected,
        reconnectSocket,
        disconnectSocket,
        connected: socket?.connected || false,
        id: socket?.id
    };

    return (
        <SocketContext.Provider value={contextValue}>
            {children}
        </SocketContext.Provider>
    );
};