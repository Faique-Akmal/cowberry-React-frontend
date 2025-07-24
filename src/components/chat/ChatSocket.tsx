// src/components/ChatSocket.tsx
import React, { useEffect, useRef, useState } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { AxiosGetGroupMsg } from "../../store/chatStore"
import Alert from '../ui/alert/Alert';

interface Props {
  groupId: number; 
  allMsg: AxiosGetGroupMsg[];
}
interface WSMessage {
  sender: string;
  message: string;
}

const SOCKET_URL=import.meta.env.VITE_SOCKET_URL;

const ChatSocket: React.FC<Props> = ({ groupId, allMsg }) => {
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [input, setInput] = useState('');
  const socketRef = useRef<ReconnectingWebSocket | null>(null);
  const [clientId, setClientId] = useState<string>('');

  const localMeData = localStorage.getItem("meUser")!
  const meUserData = JSON.parse(localMeData)!

  const accessToken = localStorage.getItem("accessToken")!


  const newMsg = allMsg?.map(({sender, content})=>({sender:`${sender}`, message:content}))
  
  useEffect(()=>{
    
    setClientId(meUserData?.id);
  }, []);
  
  useEffect(()=>{
    setMessages(newMsg);    
  }, [allMsg]);

  useEffect(() => {
    const ws = new ReconnectingWebSocket(`ws:${SOCKET_URL}/ws/chat/${groupId}/?token=${accessToken}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Connected to server');
    };

    ws.onmessage = (event) => {
      console.log("Raw event data:", event.data);

      try {
        const data = JSON.parse(event.data);
        console.log("Parsed data:", data);

        if (data.type === 'connection') {
          setClientId(data?.id || meUserData?.id);
        } else if (data.message) {
          setMessages(prev => [...prev, { sender: data.sender, message: data.message }]);
        }
      } catch (err) {
        console.warn("Failed to parse message ❌", err);
      }
    };

    
    ws.onerror = (err) => {
      console.error('❌ WebSocket error', err);
    };

    return () => {
      ws.close();
    };
  }, [groupId]);

  const sendMessage = () => {
    if (socketRef.current && input.trim() !== '') {
      const msgSchema = {  
                          content: input, 
                          sender: clientId, 
                          group_id: groupId, 
                          receiver_id: null,
                          parent_id: null,
                          msg_type:"text"
                        };
      console.log("my React obj : " ,msgSchema);
      // {
      //   message_type: 'group',
      // }

      socketRef.current.send(JSON.stringify(msgSchema));
      setMessages(prev => [...prev, { sender: clientId, message: input }]);
      setInput('');
    }
  };


  return (
    <div className='w-full'>
      <h2 className='text-dashboard-royalblue-200'>WebSocket Chat</h2>
      <h3 className='text-dashboard-royalblue-200'>group : {groupId}, sender: {clientId}</h3>

      <div className="h-[50vh] custom-scrollbar flex-1 p-4 overflow-y-auto space-y-2">
        {messages.length > 0 ? messages.map((msg, id) => (
          <div
            key={id}
            className={`max-w-xs flex flex-col p-2 rounded-lg ${
              +msg?.sender === +clientId
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
          <Alert
                variant="warning"
                title="Chat Not Found!"
                message="Try again later!"
                showLink={false}
              />
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