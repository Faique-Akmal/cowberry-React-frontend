import React, { useEffect } from "react";

const NotificationListener = () => {
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      console.warn("🚫 No token found. Skipping WebSocket connection.");
      return;
    }

    

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // should already include ws:// or wss://
    const socketUrl = `${SOCKET_URL}/ws/notifications/?token=${accessToken}`;

    const socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      console.log("✅ WebSocket connection established.");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("🔔 New Notification:", data);

      alert(`🔔 ${data.message}`);
    };

    socket.onclose = () => {
      console.warn("⚠️ WebSocket closed.");
    };

    socket.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    return () => {
      socket.close();
    };
  }, []);

  return null;
};

export default NotificationListener;
