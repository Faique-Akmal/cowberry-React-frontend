// components/SocketChatWindow.tsx
import React, { useEffect, useRef, useState } from "react";
import MsgCard from "./MsgCard";
import { ActiveChatInfo, ChatMessage } from "../../types/chat";
import { useMessageStore } from "../../store/messageStore";
import { useSocketStore } from '../../store/socketStore';
import { RiCloseFill } from "react-icons/ri";
import MemberDropdown from "./MemberDropdown";
import {Members} from "../../store/chatStore"

interface Props {
  activeChatInfo: ActiveChatInfo;
  chatName?: string;
  groupMembers: Members[] | null;
}

 const SocketChatWindow: React.FC<Props> = ({ activeChatInfo, groupMembers }) => {
  const { sendJson, isConnected } = useSocketStore();
  const messages = useMessageStore((state) => state.messages);
  
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const sendMsgInputRef = useRef<HTMLInputElement | null>(null);

  const localMeData = localStorage.getItem("meUser")!;
  const { id } = JSON.parse(localMeData!);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]); // Triggers scroll on new messages

  useEffect(() => {
    if (sendMsgInputRef?.current) {
      sendMsgInputRef?.current.focus();
    }
  }, [replyTo]);

  const sendMessage = () => {
    try {
      if (input?.trim()) {
        const sendData = {
          type: "send_message",
          content: input.trim(),
          group_id: activeChatInfo?.chatType === "group" ? activeChatInfo.chatId : null,
          receiver_id: activeChatInfo?.chatType === "personal" ? activeChatInfo.chatId : null,
          parent_id: replyTo?.id || null,
        };

        console.log("React sendData : ", sendData);

        sendJson(sendData!);

        setInput("");
        setReplyTo(null);
      }
    } catch (error) {
      console.error("message sendind error : ", error);
      // toast.error('Failed to reply message');
    }

   
  };

  // console.count("SocketChatWindow.tsx rendered");
console.log(activeChatInfo)

  return (
    <div className="flex flex-col h-[80vh] w-full">
      <div className="pl-12 p-4 lg:p-4 flex h-17 items-center justify-between bg-cowberry-cream-500">
        <h2 className="text-lg font-bold text-yellow-800 truncate w-1/3"> 
          {activeChatInfo?.chatName || "No User?"}
        </h2>
        <div className="flex items-center gap-2"> 
          {(activeChatInfo?.chatType === "group") && <MemberDropdown members={groupMembers!} />}
        <p className="text-lg font-bold text-yellow-800">
          {isConnected ? '🟢' : '🔴'}
        </p>
        </div>
      </div>
      <div className="custom-scrollbar flex-1 p-4 overflow-y-auto space-y-2">
        {messages?.map((msg) => (
          
          <MsgCard 
          key={msg?.id}
          activeChatInfo={activeChatInfo} meUserId={id!} msgId={msg?.id} replyMsg={(reMsg)=> setReplyTo(reMsg)} />
        ))}
        
        <div ref={bottomRef} className="pt-10" />
      </div>
      {!!replyTo && (
        <div className="relative p-1 bg-cowberry-cream-500 rounded-tl-xl rounded-tr-xl">
          <div className="w-full bg-brand-500 p-2 rounded-lg border-l-5 border-brand-400 text-gray-200">
            <h4 className="text-xs capitalize font-bold text-cowberry-cream-500">
                {replyTo?.sender == id! ? `${replyTo?.sender_username} (You)` : replyTo?.sender_username}
            </h4>
            <p>
              {replyTo?.content}
            </p>
            <button
              type="button"
              className="absolute top-2 right-2 border-none text-xl text-gray-200" 
              onClick={() => setReplyTo(null)}>
              <RiCloseFill />
            </button>
          </div>
          {/* <strong>{replyTo.sender_username}</strong> — {replyTo.content} */}
        </div>
      )}

      <div className="w-full p-4 bg-cowberry-cream-500 flex gap-2">
        <input
          className="flex-1 text-yellow-800 outline-none border-none rounded px-3 py-2"
          type="text"
          ref={sendMsgInputRef}
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