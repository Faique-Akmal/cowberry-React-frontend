// Optimized SocketChatWindow.tsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import MsgCard from "./MsgCard";
import { ActiveChatInfo, ChatMessage } from "../../types/chat";
import { useMessageStore } from "../../store/messageStore";
import { useSocketStore } from "../../store/socketStore";
import { RiCloseFill } from "react-icons/ri";
import MemberDropdown from "./MemberDropdown";
import { Members } from "../../store/chatStore";
import TypingIndicator from "./TypingIndicator";
import { useTypingEmitter } from "../../hooks/useTypingEmitter";
import { CiMedicalCross } from "react-icons/ci";

interface Props {
  activeChatInfo: ActiveChatInfo;
  chatName?: string;
  groupMembers: Members[] | null;
}

const SocketChatWindow: React.FC<Props> = ({ activeChatInfo, groupMembers }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { sendJson, isConnected, typingStatus } = useSocketStore();
  const messages = useMessageStore((state) => state.messages);

  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const sendMsgInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const meUser = useMemo(() => JSON.parse(localStorage.getItem("meUser")!), []);
  const meId = meUser?.id;
  const meUsername = meUser?.username;

  // auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // focus input when replying
  useEffect(() => {
    sendMsgInputRef.current?.focus();
  }, [replyTo]);

  // reset when switching chats
  useEffect(() => {
    setInput("");
    setReplyTo(null);
  }, [activeChatInfo?.chatId]);

  const onTyping = useTypingEmitter(
    useCallback(
      (isTyping: boolean) => {
        sendJson({
          type: "typing",
          is_typing: isTyping,
        });
      },
      [sendJson]
    )
  );

  /** -------------------- File Upload -------------------- **/
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;
  if (!files) return;

  const fileList = Array.from(files);

  // ✅ update preview state
  setSelectedFiles((prev) => [...prev, ...fileList]);

  for (const file of fileList) {
    try {
      // 1. Upload file to backend
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("https://your-api.com/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();

      // Suppose backend returns: { url: "https://cdn.com/file.jpg" }
      const fileUrl = data.url;

      // 2. Send message through socket with file reference
      const sendData = {
        type: "send_message",
        content: file.name,
        content_type: "file",
        file_url: fileUrl,
        group_id:
          activeChatInfo?.chatType === "group" ? activeChatInfo?.chatId : null,
        receiver_id:
          activeChatInfo?.chatType === "personal"
            ? activeChatInfo?.chatId
            : null,
        parent_id: replyTo?.id || null,
      };

      sendJson(sendData);
    } catch (err) {
      console.error("File upload failed", err);
    }
  }

  // reset input so same file can be picked again
  event.target.value = "";
};


  /** -------------------- Text Message -------------------- **/
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInput(val);
      if (val.trim()) onTyping();
    },
    [onTyping]
  );

  const sendMessage = useCallback(() => {
    if (!input.trim()) return;
    const sendData = {
      type: "send_message",
      content: input.trim(),
      group_id: activeChatInfo?.chatType === "group" ? activeChatInfo?.chatId : null,
      receiver_id: activeChatInfo?.chatType === "personal" ? activeChatInfo?.chatId : null,
      parent_id: replyTo?.id || null,
    };
    sendJson(sendData);
    setInput("");
    setReplyTo(null);
  }, [input, activeChatInfo, replyTo, sendJson]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e?.key === "Enter") sendMessage();
  };

  /** -------------------- Render Messages -------------------- **/
  const renderMessages = useMemo(
    () =>
      messages.map((msg) => (
        <MsgCard
          key={msg?.id}
          activeChatInfo={activeChatInfo}
          meUserId={meId}
          msgId={msg?.id}
          replyMsg={setReplyTo}
        />
      )),
    [messages, activeChatInfo, meId]
  );

  return (
    <div className="flex flex-col h-[80vh] w-full">
      {/* Header */}
      <div className="pl-12 p-4 flex h-17 items-center justify-between bg-cowberry-cream-500">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-yellow-800 truncate">
            {activeChatInfo?.chatName || "No User?"}
          </h2>
          <TypingIndicator typingUsers={typingStatus} currentUser={meUsername} />
        </div>
        <div className="flex items-center gap-2">
          {activeChatInfo?.chatType === "group" && (
            <MemberDropdown members={groupMembers!} />
          )}
          <p className="text-lg font-bold text-yellow-800">
            {isConnected ? "🟢" : "🔴"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="custom-scrollbar flex-1 p-4 overflow-y-auto space-y-2">
        {renderMessages}
        <div ref={bottomRef} className="pt-10" />
      </div>

      {/* Reply Section */}
      {replyTo && (
        <div className="relative p-1 bg-cowberry-cream-500 rounded-tl-xl rounded-tr-xl">
          <div className="w-full bg-brand-500 p-2 rounded-lg border-l-5 border-brand-400 text-gray-200">
            <h4 className="text-xs capitalize font-bold text-cowberry-cream-500">
              {replyTo?.sender === meId
                ? `${replyTo?.sender_username} (You)`
                : replyTo?.sender_username}
            </h4>
            <p>{replyTo?.content}</p>
            <button
              type="button"
              className="absolute top-2 right-2 text-xl text-gray-200"
              onClick={() => setReplyTo(null)}
            >
              <RiCloseFill />
            </button>
          </div>
        </div>
      )}

          {/* Preview Section */}
{selectedFiles.length > 0 && (
  <div className="mt-2 flex flex-wrap gap-3">
    {selectedFiles.map((file, index) => {
      const isImage = file.type.startsWith("image/");
      const fileUrl = isImage ? URL.createObjectURL(file) : null;

      return (
        <div
          key={index}
          className="relative border rounded-lg p-2 w-24 h-24 flex items-center justify-center bg-gray-100"
        >
                    {isImage ? (
                      <img
                        src={fileUrl!}
                        alt={file.name}
                        className="w-full h-full object-cover rounded "
                      />
                    ) : (
                      <p className="text-xs text-gray-700 truncate">{file.name}</p>
                    )}

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

      {/* Input Section */}
      <div className="w-full p-4 bg-cowberry-cream-500 flex gap-2">

              


        <div>
          <button
            type="button"
            onClick={handleButtonClick}
            className="p-2 rounded bg-blue-500 text-white"
          >
            <CiMedicalCross />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
          />


        </div>

        <input
          className="flex-1 text-yellow-800 outline-none border-none rounded px-3 py-2"
          type="text"
          ref={sendMsgInputRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-brand-500 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default React.memo(SocketChatWindow);
