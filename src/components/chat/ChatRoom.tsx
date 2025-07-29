// src/hooks/ChatRoom.ts
import { useEffect, useRef, useState } from 'react';

type Message = {
  sender: string;
  message: string;
};

const SOCKET_URL=import.meta.env.VITE_SOCKET_URL;

// const groupId = 1

const ChatRoom = (groupId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`ws:${SOCKET_URL}/ws/chat/${groupId}/`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, { sender: data.sender, message: data.message }]);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [groupId]);

  const sendMessage = (content: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ content }));
    }
  };

  return { messages, sendMessage };
};

export default ChatRoom;