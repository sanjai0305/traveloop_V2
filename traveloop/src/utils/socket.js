import { io } from "socket.io-client";
import { getApiUrl } from "./api";

const getSocketUrl = () => {
  // getApiUrl("") returns e.g. "import.meta.env.VITE_API_URL/api/" or "http://65.2.84.40:5000/api/"
  const apiUrl = getApiUrl("");
  return apiUrl.replace(/\/api\/?$/, ""); // strip "/api" and any trailing slash
};

const socketUrl = getSocketUrl();
console.log("[Socket.io] Connecting Traveler App to:", socketUrl);

export const socket = io(socketUrl, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: ["websocket", "polling"],
});

export default socket;
