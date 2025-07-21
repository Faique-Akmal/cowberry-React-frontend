import { useEffect, useRef } from 'react';

export default function useWebSocket() {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://192.168.0.144:8000/ws/chat/1/");

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
      ws.send(JSON.stringify({ content: "Hello from React!" }));
    };

    ws.onmessage = (e) => {
      console.log("📩 Message received:", e.data);
    };

    ws.onclose = () => {
      console.warn("❌ WebSocket closed");
    };

    ws.onerror = (e) => {
      console.error("⚠️ WebSocket error:", e);
    };

    socketRef.current = ws;

    return () => ws.close();
  }, []);

  return ;
}