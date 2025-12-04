// Optimized SocketChatWindow.tsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import MsgCard from "./MsgCard";
import { ActiveChatInfo, ChatMessage } from "../../types/chat";
import { useMessageStore } from "../../store/messageStore";
import { useSocketStore } from '../../store/socketStore';
import { RiCloseFill } from "react-icons/ri";
import MemberDropdown from "./MemberDropdown";
import { Members } from "../../store/chatStore";
import TypingIndicator from "./TypingIndicator";
import { useTypingEmitter } from "../../hooks/useTypingEmitter";

interface Props {
  activeChatInfo: ActiveChatInfo;
  chatName?: string;
  groupMembers: Members[] | null;
}

const SocketChatWindow: React.FC<Props> = ({ activeChatInfo, groupMembers }) => {
  const { sendJson, isConnected, typingStatus } = useSocketStore();
  const messages = useMessageStore(state => state.messages);

  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendMsgInputRef = useRef<HTMLInputElement>(null);

  const meUser = useMemo(() => JSON.parse(localStorage.getItem("meUser")!), []);
  const meId = meUser?.id;
  const meUsername = meUser?.username;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    sendMsgInputRef.current?.focus();
  }, [replyTo]);

  useEffect(() => {
    setInput("");
    setReplyTo(null);
  }, [activeChatInfo?.chatId]);

  const onTyping = useTypingEmitter(
    useCallback((isTyping: boolean) => {
      sendJson({
        type: "typing",
        is_typing: isTyping,
      });
    }, [sendJson])
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    if (val.trim()) onTyping();
  }, [onTyping]);

  const sendMessage = useCallback(() => {
    if (!input.trim()) return;

    //     {
    //   "type": "send_message",
    //   "message_type": "file",
    //   "receiver_id": 5,
    //   "content": "Please check all these documents",
    //   "files": [
    //     "data:application/pdf;base64,JVBERi0xLjMKJc...",
    //     "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    //     "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBBQABg..."
    //   ]
    // }

    const sendData = {
      type: "send_message",
      message_type: "file",
      content: input.trim(),
      group_id: activeChatInfo?.chatType === "group" ? activeChatInfo?.chatId : null,
      receiver_id: activeChatInfo?.chatType === "personal" ? activeChatInfo?.chatId : null,
      parent_id: replyTo?.id || null,
      latitude: 21.28459945,
      longitude: 72.9640772,
      files: [
        "C:/Users/ParthivParmar/Downloads/Images/free-photo-of-geisha-in-kyoto-streets-at-night.jpeg"
        // "data:application/pdf;base64,JVBERi0xLjMKJc...",
        // "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
        // "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBBQABg..."
      ]
    };
    sendJson(sendData);
    setInput("");
    setReplyTo(null);
  }, [input, activeChatInfo, replyTo, sendJson]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e?.key === 'Enter') sendMessage();
  };

  const renderMessages = useMemo(() => (
    messages.map(msg => (
      <MsgCard
        key={msg?.id}
        activeChatInfo={activeChatInfo}
        meUserId={meId}
        msgId={msg?.id}
        replyMsg={setReplyTo}
      />
    ))
  ), [messages, activeChatInfo, meId]);

  return (
    <div className="flex flex-col h-[80vh] w-full">
      <div className="pl-12 p-4 flex h-17 items-center justify-between bg-cowberry-cream-500">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-yellow-800 truncate">{activeChatInfo?.chatName || "No User?"}</h2>
          <TypingIndicator typingUsers={typingStatus} currentUser={meUsername} />
        </div>
        <div className="flex items-center gap-2">
          {activeChatInfo?.chatType === "group" && <MemberDropdown members={groupMembers!} />}
          <p className="text-lg font-bold text-yellow-800">{isConnected ? '🟢' : '🔴'}</p>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 p-4 overflow-y-auto space-y-2">
        {renderMessages}
        <div ref={bottomRef} className="pt-10" />
      </div>

      {replyTo && (
        <div className="relative p-1 bg-cowberry-cream-500 rounded-tl-xl rounded-tr-xl">
          <div className="w-full bg-brand-500 p-2 rounded-lg border-l-5 border-brand-400 text-gray-200">
            <h4 className="text-xs capitalize font-bold text-cowberry-cream-500">
              {replyTo?.sender === meId ? `${replyTo?.sender_username} (You)` : replyTo?.sender_username}
            </h4>
            <p>{replyTo?.content}</p>
            <button
              type="button"
              className="absolute top-2 right-2 text-xl text-gray-200"
              onClick={() => setReplyTo(null)}>
              <RiCloseFill />
            </button>
          </div>
        </div>
      )}

      <div className="w-full p-4 bg-cowberry-cream-500 flex gap-2">

        <input
          className="flex-1 text-yellow-800 outline-none border-none rounded px-3 py-2"
          type="text"
          ref={sendMsgInputRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} className="bg-brand-500 text-white px-4 py-2 rounded">
          Send
        </button>
      </div>
    </div>
  );
};

export default React.memo(SocketChatWindow);