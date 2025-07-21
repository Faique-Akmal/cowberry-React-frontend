// [11:50, 19/07/2025] Devendra Pandey: let ws = new WebSocket("ws://127.0.0.1:8000/ws/chat/user/5/");
// ws.onmessage = (e) => console.log("RECEIVED", e.data);
// ws.send(JSON.stringify({type: "chat.message", message: "Hello from browser!"}));
// [11:52, 19/07/2025] Devendra Pandey: import React, { useEffect, useState, useRef } from 'react';

const ChatComponent = ({ userId, token }) => {
  const [messages, setMessages] = useState([]);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(ws://127.0.0.1:8000/ws/chat/user/${userId}/);

    ws.current.onopen = () => {
      console.log("WebSocket connection opened");
    };

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      console.log("New message:", data);
      setMessages((prev) => [...prev, data]);
    };

    ws.current.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      ws.current.close();
    };
  }, [userId]);

  const sendMessage = (content) => {
    ws.current.send(JSON.stringify({
      type: "chat.message",
      message: content,
      token: token,
    }));
  };

  return (
    <div>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>{msg.sender}: {msg.message}</div>
        ))}
      </div>
      <button onClick={() => sendMessage("Hello!")}>Send Hello</button>
    </div>
  );
};

export default ChatComponent;