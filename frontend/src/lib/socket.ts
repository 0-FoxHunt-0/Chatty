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
        token: token || getCookie("jwt"),
      },
      withCredentials: true,
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

// Helper to get cookie value
function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return undefined;
}
