import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

let socket: Socket | null = null;

export const socketService = {
  async connect(): Promise<Socket> {
    if (socket?.connected) return socket;

    const token = await SecureStore.getItemAsync('access_token');

    socket = io(API_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
      if (token) {
        socket?.emit('join:family', token);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return socket;
  },

  disconnect(): void {
    socket?.disconnect();
    socket = null;
  },

  getSocket(): Socket | null {
    return socket;
  },
};
