import { io } from "socket.io-client";

const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/api\/?$/, "");
  }
  if (import.meta.env.DEV) {
    return "http://localhost:5000";
  }
  return "http://65.2.84.40:5000";
};

const socketUrl = getSocketUrl();
console.log("[Socket.io] Connecting Agent Portal to:", socketUrl);

export const socket = io(socketUrl, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: ["websocket", "polling"],
});

export default socket;
