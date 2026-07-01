import { io } from "socket.io-client";

const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/api\/?$/, "");
  }
  return "https://traveloopv2.duckdns.org";
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
