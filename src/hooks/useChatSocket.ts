// hooks/useChatSocket.ts
import { useEffect, useRef } from "react";

interface ChatSocketOptions {
  chatGroupName: string;
  onMessage: (data: any) => void;
}

export const useChatSocket = ({ chatGroupName, onMessage }: ChatSocketOptions) => {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socketUrl = `ws://localhost:8000/ws/chat/${chatGroupName}/`;
    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("useChatSocket, parsed data",data)
      console.log("Received: ", data);
      onMessage(data);
    };

    socket.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => {
      socket.close();
    };
  }, [chatGroupName]);

  const sendJson = (payload: any) => {
    console.log("useChatSocket, payload : ", payload)
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    }
  };

  return {
    sendJson,
  };
};