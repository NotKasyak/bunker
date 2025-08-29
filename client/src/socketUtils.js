// This is a helper function to initialize the socket connection with Railway
import { io } from 'socket.io-client';

export const initializeSocket = async () => {
  // If we're running on the client side
  if (typeof window !== 'undefined') {
    // For production deployment (Railway)
    if (process.env.NODE_ENV === 'production') {
      // For Railway, we can connect directly to the root as the server handles Socket.IO
      const socket = io(window.location.origin);
      
      return socket;
    } else {
      // For local development
      return io('http://localhost:5000');
    }
  }
  
  return null;
};
