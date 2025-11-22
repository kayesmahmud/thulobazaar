/**
 * useSocket Hook
 * Manages Socket.IO connection lifecycle and provides socket instance
 */

import { useEffect, useRef, useState } from 'react';
import { SocketService, SocketServiceConfig } from '../services/socketService';

interface UseSocketOptions {
  autoConnect?: boolean;
}

interface UseSocketReturn {
  socket: SocketService | null;
  isConnected: boolean;
  connect: (config: SocketServiceConfig) => void;
  disconnect: () => void;
}

/**
 * Hook to manage Socket.IO connection
 *
 * @example
 * const { socket, isConnected, connect, disconnect } = useSocket();
 *
 * useEffect(() => {
 *   if (token) {
 *     connect({
 *       backendUrl: 'http://localhost:5000',
 *       token,
 *     });
 *   }
 *   return () => disconnect();
 * }, [token]);
 */
export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { autoConnect = false } = options;
  const socketRef = useRef<SocketService | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create socket service instance
    socketRef.current = new SocketService();

    // Setup connection listeners
    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const connect = (config: SocketServiceConfig) => {
    if (socketRef.current) {
      socketRef.current.connect(config);
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      setIsConnected(false);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
  };
}
