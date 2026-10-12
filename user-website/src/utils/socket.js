import { io } from "socket.io-client";
import { getSocketUrl } from "./api";

const socketUrl = getSocketUrl();
console.log("[Socket.io] Connecting Traveler App to:", socketUrl);

export const socket = io(socketUrl, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: ["websocket", "polling"],
  withCredentials: true,
});

export default socket;
