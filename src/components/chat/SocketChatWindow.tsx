import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import MsgCard from "./MsgCard";
import { ActiveChatInfo, ChatMessage } from "../../types/chat";
import { useMessageStore } from "../../store/messageStore";
import { useSocketStore } from "../../store/socketStore";
import { RiCloseFill } from "react-icons/ri";
import { FiPaperclip, FiMapPin, FiFileText, FiImage } from "react-icons/fi";
import MemberDropdown from "./MemberDropdown";
import { Members } from "../../store/chatStore";
import TypingIndicator from "./TypingIndicator";
import { useTypingEmitter } from "../../hooks/useTypingEmitter";
import { IoSend } from "react-icons/io5";
import { SiSocketdotio } from "react-icons/si";

interface Props {
  activeChatInfo: ActiveChatInfo;
  chatName?: string;
  groupMembers: Members[] | null;
}

const SocketChatWindow: React.FC<Props> = ({
  activeChatInfo,
  groupMembers,
}) => {
  const { sendJson, isConnected, typingStatus } = useSocketStore();
  const messages = useMessageStore((state) => state.messages);

  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const sendMsgInputRef = useRef<HTMLInputElement>(null);

  const meUser = useMemo(
    () => JSON.parse(localStorage.getItem("meUser")!),
    []
  );
  const meId = meUser?.id;
  const meUsername = meUser?.username;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    sendMsgInputRef.current?.focus();
  }, [replyTo]);

  useEffect(() => {
    setInput("");
    setReplyTo(null);
    setSelectedFiles([]);
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

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInput(val);
      if (val.trim()) onTyping();
    },
    [onTyping]
  );

  /** Convert File → Base64 */
  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });

  /** Select files */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
    setShowAttachmentMenu(false);
  };

  /** Remove selected file */
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /** Send Message + Files */
  const sendMessage = useCallback(async () => {
    if (!input.trim() && selectedFiles.length === 0) return;

    const filesBase64 = await Promise.all(
      selectedFiles.map((file) => toBase64(file))
    );

    const sendData = {
      type: "send_message",
      message_type: selectedFiles.length > 0 ? "file" : "text",
      content: input.trim(),
      group_id:
        activeChatInfo?.chatType === "group" ? activeChatInfo?.chatId : null,
      receiver_id:
        activeChatInfo?.chatType === "personal" ? activeChatInfo?.chatId : null,
      parent_id: replyTo?.id || null,
      latitude: null,
      longitude: null,
      files: filesBase64,
    };

    sendJson(sendData);

    // Reset
    setInput("");
    setReplyTo(null);
    setSelectedFiles([]);
  }, [input, selectedFiles, activeChatInfo, replyTo, sendJson]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e?.key === "Enter") sendMessage();
  };

  /** Share Location */
  const handleSendLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sendJson({
          type: "send_message",
          message_type: "location",
          content: "📍 Shared current location",
          group_id:
            activeChatInfo?.chatType === "group"
              ? activeChatInfo?.chatId
              : null,
          receiver_id:
            activeChatInfo?.chatType === "personal"
              ? activeChatInfo?.chatId
              : null,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          files: [],
        });
      },
      (err) => {
        console.error(err);
        alert("Unable to fetch location");
      }
    );
    setShowAttachmentMenu(false);
  };

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
    <div className="flex flex-col h-[80vh] w-full relative">
      {/* Header */}
      <div className="pl-12 p-4 flex h-17 items-center justify-between bg-cowberry-cream-500">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-yellow-800 truncate">
            {activeChatInfo?.chatName || "No User?"}
          </h2>
          <TypingIndicator typingUsers={typingStatus} currentUser={meUsername} />
        </div>
        <div className="flex pr-1 items-center gap-2">
          {activeChatInfo?.chatType === "group" && (
            <MemberDropdown members={groupMembers!} />
          )}
          <p className={`text-lg ${isConnected ? "text-green-500" : "text-red-500"}`}>
            <SiSocketdotio />
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="custom-scrollbar flex-1 p-4 overflow-y-auto space-y-2">
        {renderMessages}
        <div ref={bottomRef} className="pt-10" />
      </div>



      {/* Reply Preview */}
      {replyTo && (
        <div className="relative p-1 bg-cowberry-cream-500 rounded-tl-xl rounded-tr-xl">
          <div className="w-full bg-brand-500 p-2 rounded-lg border-l-5 border-brand-400 text-gray-200">
            <h4 className="text-xs capitalize font-bold text-cowberry-cream-500">
              {replyTo?.sender === meId
                ? `${replyTo?.sender_username} (You)`
                : replyTo?.sender_username}
            </h4>
            <p className="max-w-112 truncate">{replyTo?.content}</p>
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

      {/* File Preview */}
      {selectedFiles.length > 0 && (
        <div className="bg-cowberry-cream-500 pt-3 px-2 flex gap-2 overflow-x-auto rounded-tl-xl rounded-tr-xl">
          {selectedFiles.map((file, idx) => (
            <div
              key={idx}
              className="relative drop-shadow-xl px-2 py-2 w-30 h-fit overflow-hidden rounded-xl bg-green-900"
            >
              {file.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-20 w-4/5 mx-auto object-contain rounded"
                />
              ) : file.type.startsWith("video/") ? (
                <video
                  src={URL.createObjectURL(file)}
                  className="h-16 w-4/5 rounded"
                  muted
                />
              ) : (
                <span className="text-xs text-gray-300">{file.type}</span>
              )}
              <p className="text-xs mt-2 text-white truncate w-full">{file.name}</p>
              <button
                onClick={() => removeFile(idx)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center"
              >
                <RiCloseFill />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input + Send */}
      <div className="w-full px-4 py-2 bg-cowberry-cream-500 flex gap-2 items-center rounded-tl-lg rounded-tr-lg relative">
        <input
          className="flex-1 text-yellow-800 outline-none border-none rounded px-3 py-2"
          type="text"
          ref={sendMsgInputRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
        />

        {/* Hidden File Inputs */}
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          id="image-video-upload"
          onChange={handleFileSelect}
        />
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.csv,.xls,.xlsx"
          className="hidden"
          id="doc-upload"
          onChange={handleFileSelect}
        />

        {/* Attachment Menu Button */}
        <button
          type="button"
          title="Attach"
          onClick={() => setShowAttachmentMenu((prev) => !prev)}
          className="cursor-pointer bg-transparent hover:bg-green-200 transition px-3 py-3 rounded-full text-brand-500"
        >
          <FiPaperclip size={20} />
        </button>

        {/* Floating Attachment Menu */}
        {showAttachmentMenu && (
          <div className="absolute bottom-14 right-16 bg-white shadow-lg rounded-lg p-3 flex flex-col gap-2 z-50">
            <label
              htmlFor="image-video-upload"
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
            >
              <FiImage /> <span>Image/Video</span>
            </label>
            <label
              htmlFor="doc-upload"
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
            >
              <FiFileText /> <span>Document</span>
            </label>
            <button
              onClick={handleSendLocation}
              className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded"
            >
              <FiMapPin /> <span>Location</span>
            </button>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={sendMessage}
          className="text-xl bg-[#21C063] hover:bg-[#21A156] transition text-black px-3 py-3 rounded-full"
        >
          <IoSend />
        </button>
      </div>
    </div>
  );
};

export default React.memo(SocketChatWindow);
