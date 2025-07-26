// hooks/useChatSocket.ts
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

interface ChatSocketOptions {
  chatGroupName: string;
  onMessage: (data: any) => void;
}

const SOCKET_URL=import.meta.env.VITE_SOCKET_URL;

export const useChatSocket = ({ chatGroupName, onMessage }: ChatSocketOptions) => {
  const socketRef = useRef<WebSocket | null>(null);

  const accessToken = localStorage.getItem("accessToken")!

  useEffect(() => {
    const socketUrl = `ws:${SOCKET_URL}/ws/chat/${chatGroupName}/?token=${accessToken}`;
    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('✅ Connected to server');
      toast.success('Chat Socket Connected');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("useChatSocket, parsed data",data);
      
      console.log("Received: ", data);
      onMessage(data);
    };

    socket.onerror = (err) => {
      console.error('❌ WebSocket error', err);
    };

    socket.onclose = () => {
      console.log("🩻 WebSocket closed");
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