import { io, Socket } from 'socket.io-client';

const getSocketUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean.slice(0, -4) : clean;
  }
  return 'https://traveloopv2.duckdns.org';
};

const socketUrl = getSocketUrl();
console.log('[Socket.io] Connecting Driver App to:', socketUrl);

export const socket: Socket = io(socketUrl, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: ['polling', 'websocket'],
});

export default socket;
