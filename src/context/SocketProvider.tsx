// SocketContext.tsx
import React, { createContext, useContext, useEffect, useRef } from "react";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    socketRef.current = new WebSocket("wss://your-server.com/ws");

    socketRef.current.onopen = () => console.log("✅ Socket connected");
    socketRef.current.onclose = () => console.log("❌ Socket closed");

    return () => {
      // Optional: only close on full app unmount, not ChatBox unmount
      socketRef.current?.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
