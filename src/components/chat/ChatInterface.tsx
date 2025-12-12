import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useSocketStore } from "../../store/useSocketStore";
import { ChatService } from "../../services/chatService";
import { format } from "date-fns";
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  MoreVertical,
  Phone,
  Video,
  Search,
} from "lucide-react";
import { User } from "../../types/chatTypes";

// --- Mock User List Hook (Replace with actual API call) ---
const useUserList = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Yahan API call karein: ChatService.getAllUsers()
    // Demo data for now:

    // setUsers([
    //   {
    //     id: 2,
    //     username: "rahul",
    //     firstName: "Rahul",
    //     lastName: "Sharma",
    //     email: "rahul@test.com",
    //     profileImageUrl: "https://i.pravatar.cc/150?u=2",
    //   },
    //   {
    //     id: 3,
    //     username: "priya",
    //     firstName: "Priya",
    //     lastName: "Verma",
    //     email: "priya@test.com",
    //     profileImageUrl: "https://i.pravatar.cc/150?u=3",
    //   },
    // ]);

    const fetchAllChatUser = async () => {
      try {
        const allChatUsers = await ChatService.getAllUsers();
        setUsers(allChatUsers);
      } catch (error) {
        console.error("Failed to start chat", error);
      }
    };
    fetchAllChatUser();
  }, []);
  return users;
};

export const ChatInterface = () => {
  const { socket, connect, disconnect } = useSocketStore();
  const {
    activeConversation,
    messages,
    currentUser,
    setActiveConversation,
    setMessages,
    // addMessage,
    setCurrentUser,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const users = useUserList();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial Setup
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedUsername = localStorage.getItem("username");
    const storedUserEmail = localStorage.getItem("email");
    // const storedUser = localStorage.getItem("userId");
    // const storedUser = localStorage.getItem("userId");
    if (storedUserId && storedUsername && storedUserEmail)
      setCurrentUser({
        id: Number(storedUserId),
        username: storedUsername!,
        email: storedUserEmail!,
      });
    // else
    //   setCurrentUser({
    //     id: 1,
    //     username: "me",
    //     email: "me@test.com",
    //     firstName: "Me",
    //     lastName: "",
    //   }); // Fallback for dev

    connect();
    return () => disconnect();
  }, []);

  // 2. Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Join Room when conversation changes
  useEffect(() => {
    if (activeConversation && socket) {
      console.log("activeConversation: ", activeConversation);
      socket.emit("join_conversation", activeConversation.id);

      // Fetch History
      ChatService.getMessages(activeConversation.id).then((data) => {
        setMessages(data);
      });
    }
  }, [activeConversation, socket]);

  // --- Handlers ---

  const handleUserClick = async (receiverId: number) => {
    try {
      const conversation = await ChatService.startChat(receiverId);
      setActiveConversation(conversation);
    } catch (error) {
      console.error("Failed to start chat", error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !activeConversation || !currentUser || !socket) return;

    const payload = {
      conversationId: activeConversation.id,
      senderId: currentUser.id,
      content: input,
      type: "TEXT",
    };

    socket.emit("send_message", payload);
    setInput("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation || !currentUser || !socket) return;

    try {
      setIsUploading(true);
      const { fileUrl, type } = await ChatService.uploadFile(file);

      // Determine message type
      let msgType = "DOCUMENT";
      if (type.startsWith("image/")) msgType = "IMAGE";
      if (type.startsWith("video/")) msgType = "VIDEO";

      const payload = {
        conversationId: activeConversation.id,
        senderId: currentUser.id,
        content: file.name,
        type: msgType,
        fileUrl: fileUrl,
      };

      socket.emit("send_message", payload);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* --- Sidebar --- */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Messages</h2>
          <div className="mt-2 relative">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-8 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-brand-500"
            />
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserClick(user.id)}
              className={`flex items-center p-3 cursor-pointer hover:bg-blue-50 transition-colors ${
                activeConversation?.participants.some(
                  (p) => p.user.id === user.id
                )
                  ? "bg-blue-100"
                  : ""
              }`}
            >
              <img
                src={
                  user.profileImageUrl ||
                  `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}`
                }
                alt="avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="ml-3">
                <p className="text-sm font-semibold text-gray-800">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  @{user.username}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Main Chat Area --- */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold">
                  {/* Logic to show other participant's initial */}
                  {activeConversation.type === "PERSONAL" ? "P" : "G"}
                </div>
                <div className="ml-3">
                  <h3 className="font-bold text-gray-800">
                    {/* Display Name Logic Here (Simplified) */}
                    {activeConversation.type === "PERSONAL"
                      ? "Chat"
                      : activeConversation.name}
                  </h3>
                  <span className="text-xs text-green-500 flex items-center">
                    ● Online
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-600">
                <Phone className="w-5 h-5 cursor-pointer hover:text-brand-600" />
                <Video className="w-5 h-5 cursor-pointer hover:text-brand-600" />
                <MoreVertical className="w-5 h-5 cursor-pointer" />
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 bg-opacity-50">
              {messages.map((msg) => {
                const isMe = msg.senderId === currentUser?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg rounded-2xl p-3 shadow-sm relative group ${
                        isMe
                          ? "bg-brand-500 text-white rounded-tr-none"
                          : "bg-green-100 text-gray-800 rounded-tl-none border border-brand-100"
                      }`}
                    >
                      {/* Image/File Rendering */}
                      {msg.type === "IMAGE" && (
                        <img
                          src={msg.fileUrl}
                          alt="attachment"
                          className="w-full h-48 object-cover rounded-lg mb-2"
                        />
                      )}

                      {/* Deleted Message Handling */}
                      {msg.isDeleted ? (
                        <p className="italic text-sm opacity-60">
                          🚫 This message was deleted
                        </p>
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      )}

                      <div
                        className={`text-[10px] mt-1 flex items-center justify-end ${
                          isMe ? "text-blue-100" : "text-gray-400"
                        }`}
                      >
                        {format(new Date(msg.createdAt), "hh:mm a")}
                        {msg.isEdited && <span className="ml-1">(edited)</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white p-4 border-t border-gray-200">
              <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-500 hover:text-brand-600"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <input
                  type="text"
                  className="flex-1 bg-transparent focus:outline-none text-sm text-gray-800"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />

                {isUploading ? (
                  <span className="text-xs text-brand-500 animate-pulse">
                    Uploading...
                  </span>
                ) : (
                  <button
                    onClick={handleSendMessage}
                    className={`p-2 rounded-full ${
                      input.trim()
                        ? "bg-brand-500 hover:bg-brand-400 text-white shadow-lg"
                        : "bg-gray-300 text-gray-500"
                    }`}
                    disabled={!input.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600">
              No Chat Selected
            </h3>
            <p>Select a user from the sidebar to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
};
