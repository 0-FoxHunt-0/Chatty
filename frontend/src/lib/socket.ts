import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (token?: string): Socket => {
  if (!socket) {
    // Use window.location.origin for same-origin connection
    const socketURL = import.meta.env.PROD
      ? window.location.origin
      : "http://localhost:5001";

    socket = io(socketURL, {
      auth: {
        // Prefer an explicitly provided token (useful for non-cookie auth).
        // If undefined, backend auth middleware can fall back to cookies (withCredentials: true).
        token: token,
      },
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      // In production, start with polling then upgrade to websocket.
      // This prevents the "WebSocket closed before established" error on platforms like Render
      // where reverse proxy may interfere with immediate WebSocket connections.
      transports: import.meta.env.PROD ? ["polling", "websocket"] : ["websocket", "polling"],
      // Increase timeouts for production environment
      timeout: 20000,
      // Force new connection on reconnect to avoid stale state
      forceNew: false,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Note: auth cookie is httpOnly, so we intentionally do NOT read it from `document.cookie`.
