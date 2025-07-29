// components/SocketChatWindow.tsx
import React, { useEffect, useRef, useState } from "react";
import MsgCard from "./MsgCard";
import { ChatMessage } from "../../types/chat";
import { useMessageStore } from "../../store/messageStore";
import { useSocketStore } from '../../store/socketStore';

interface Props {
  groupId: string;
  chatName: string;
}

 const SocketChatWindow: React.FC<Props> = ({ groupId, chatName }) => {
  const { sendJson, isConnected } = useSocketStore();
  const messages = useMessageStore((state) => state.messages);
  
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const localMeData = localStorage.getItem("meUser")!;
  const {id} = JSON.parse(localMeData)!;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]); // Triggers scroll on new messages

  console.log("react State Array", messages);

  console.count("SocketChatWindow rendered");

  const sendMessage = () => {
    if (input.trim()) {
      sendJson({
        type: "send_message",
        content: input,
        group_id: parseInt(groupId),
        receiver_id: null,
        parent_id: replyTo?.id,
      });

      setInput("");
      setReplyTo(null);
    }
  };

  return (
    <div className="flex flex-col h-[80vh] w-full">
      <div className="pl-12 p-4 lg:p-4 flex h-17 items-center justify-between bg-cowberry-cream-500">
        <h2 className="text-lg font-bold text-yellow-800"> 
          {chatName || "No User?"}
        </h2>
        <p className="text-lg font-bold text-yellow-800">
          {isConnected ? '🟢' : '🔴'}
        </p>
        {/* <div> 
          <MemberDropdown members={group?.members || null} />
        </div> */}
      </div>
      <div className="custom-scrollbar flex-1 p-4 overflow-y-auto space-y-2">
        {messages?.map((msg) => (
          <>
          <MsgCard 
          key={msg?.id}
          chatGroupName={groupId} meUserId={id} msg={msg} />
          
          {/* // <div key={msg.id} style={{ marginBottom: "1rem" }}>
          //   <strong>{msg.sender_username}</strong>:{" "}
          //   {msg.is_deleted ? <em>Message deleted</em> : msg.content}
          //   <div>
          //     {msg.sender === currentUserId && (
            //       <>
            //         <button onClick={() => handleEdit(msg.id, prompt("Edit message:", msg.content) || msg.content)}>
            //           Edit
            //         </button>
            //         <button onClick={() => handleDelete(msg.id)}>Delete</button>
            //       </>
            //     )}
            //   </div> */}
            {/* <button onClick={() => setReplyTo(msg)}>Reply</button>
            {!!msg?.replies && (
              !!(msg?.replies?.length > 0) && (
                msg?.replies.map((r) => (
                  <div key={r.id} style={{ color:"red", marginLeft: "2rem", fontStyle: "italic" }}>
                    ↳ {r.sender_username}: {r.content}
                  </div>)))
              )} */}

              </>
          // </div>
        ))}
        
        <div ref={bottomRef} className="pt-10" />
      </div>
      {replyTo && (
        <div>
          Replying to: <strong>{replyTo.sender_username}</strong> — {replyTo.content}
          <button onClick={() => setReplyTo(null)}>Cancel</button>
        </div>
      )}

      <div className="w-full p-4 bg-cowberry-cream-500 flex gap-2">
        <input
          className="flex-1 text-yellow-800 outline-none border-none rounded px-3 py-2"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} className="bg-brand-500 text-white px-4 py-2 rounded">
          Send
        </button>
      </div>
      
    </div>
  );
};

export default SocketChatWindow;