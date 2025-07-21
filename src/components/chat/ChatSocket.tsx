// src/components/ChatSocket.tsx
import React, { useEffect, useRef, useState } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

interface WSMessage {
  sender: string;
  message: string;
}

const SOCKET_URL=import.meta.env.VITE_SOCKET_URL;
const groupId = 1;

const ChatSocket: React.FC = () => {
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [input, setInput] = useState('');
  const socketRef = useRef<ReconnectingWebSocket | null>(null);
  const [clientId, setClientId] = useState<string>('');

  const localMeData = localStorage.getItem("meUser")!
  const meUserData = JSON.parse(localMeData)!

  // console.log("me user data : ",meUserData)
  
  useEffect(() => {
    const ws = new ReconnectingWebSocket(`ws:${SOCKET_URL}/ws/chat/${groupId}/`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Connected to server');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)!;
       console.log("data : ", data);

      if (data.type === 'connection') {
        setClientId(data.id);
      } else if (data.message) {
        setMessages(prev => [...prev, { sender: data.sender, message: data.message }]);
//         setMessages(prev => [...prev, {
//   action: "send_message",
//   message_type: "text",
//   content: "Hello via WebSocket!",
//   recipient_id: 5
// }]);
      }
    };

    
    ws.onerror = (err) => {
      console.error('❌ WebSocket error', err);
    };

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = () => {
    if (socketRef.current && input.trim() !== '') {
      socketRef.current.send(JSON.stringify({ message: input }));
      setMessages(prev => [...prev, { sender: clientId, message: input }]);
      setInput('');
    }
    // console.log("send messages",sendMessage);
  };


  return (
    <div className='w-full'>
      <h2>WebSocket Chat</h2>

      {/* <div className="space-y-1 mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded ${
              msg.sender === clientId ? 'bg-blue-100 text-right' : 'bg-gray-200 text-left'
            }`}
          >
            {msg.message}
          </div>
        ))}
      </div> */}

      <div className="h-[50vh] custom-scrollbar flex-1 p-4 overflow-y-auto space-y-2">
        {messages.length > 0 ? messages.map((msg, id) => (
          <div
            key={id}
            className={`max-w-xs flex flex-col p-2 rounded-lg ${
              clientId === msg?.sender
                ? "bg-brand-500 text-white self-end ml-auto rounded-br-none"
                : "bg-brand-400 text-white self-start rounded-bl-none"
            }`}
            >
            <h4 className="text-xs capitalize font-bold text-cowberry-cream-500">
              {`${+msg?.sender === meUserData?.id ? meUserData?.username : "other"}`}
            </h4>
            <div className="pl-2 gap-3 flex flex-col">
              <p>{msg?.message}</p>
              {/* <small className="text-xs text-end text-gray-200">{timeZone(msg?.sent_at)}</small> */}
            </div>
          </div>
        )): (
          <p className="text-center w-full text-2xl font-bold text-dashboard-brown-200">Chat Not Found!</p>
        )} 
      </div>

      <div className="w-full p-4 bg-cowberry-cream-500 flex gap-2">
        <input
          type="text"
          className="flex-1 text-yellow-800 outline-none border-none rounded px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type message"
        />
        <button onClick={sendMessage} className="bg-brand-500 text-white px-4 py-2 rounded">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatSocket;