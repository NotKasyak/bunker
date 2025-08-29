// This is a helper function to initialize the socket connection with Vercel
import { io } from 'socket.io-client';

export const initializeSocket = async () => {
  // If we're running on the client side
  if (typeof window !== 'undefined') {
    // For Vercel deployment, we need to make a request to initialize the socket API
    if (process.env.NODE_ENV === 'production') {
      // First, ping the API to ensure the socket server is initialized
      await fetch('/api/socket');
      
      // Then create the socket connection
      const socket = io({
        path: '/socket.io',
      });
      
      return socket;
    } else {
      // For local development
      return io('http://localhost:5000');
    }
  }
  
  return null;
};
