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
  ArrowLeft,
  Loader2,
  FileText,
  MapPin,
  // Check,
  Download,
  CheckCheck,
} from "lucide-react";
import { Message, User } from "../../types/chatTypes";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_FILE_URL || "http://localhost:5000";

const getFullUrl = (path: string | undefined) => {
  if (!path) return "";
  if (
    path.startsWith("https") ||
    path.startsWith("http") ||
    path.startsWith("blob:")
  )
    return path;
  return `${BASE_URL}${path}`;
};

// --- Background Image for Nature Theme ---
const BG_IMAGE =
  "https://cdn.magicdecor.in/com/2024/05/09154244/TV-Unit-Luxury-Floral-Pattern-Wallpaper-Design.jpg";
// "https://images.pexels.com/photos/265216/pexels-photo-265216.jpeg?auto=compress&cs=tinysrgb&w=600";
// "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2070&auto=format&fit=crop";

// --- Custom Hook for User List ---
const useUserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllChatUser = async () => {
      try {
        const allChatUsers = await ChatService.getAllUsers();
        setUsers(allChatUsers);
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllChatUser();
  }, []);
  return { users, loading };
};

export const ChatInterface = () => {
  const { socket, connect, disconnect } = useSocketStore();
  const {
    activeConversation,
    messages,
    currentUser,
    setActiveConversation,
    setMessages,
    setCurrentUser,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSendingLocation, setIsSendingLocation] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false); // Mobile view toggle

  const { users, loading: usersLoading } = useUserList();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter users based on search
  const filteredUsers = users.filter(
    (u) =>
      u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 1. Initial Setup
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedUsername = localStorage.getItem("username");
    const storedUserEmail = localStorage.getItem("email");

    if (storedUserId && storedUsername && storedUserEmail) {
      setCurrentUser({
        id: Number(storedUserId),
        username: storedUsername,
        email: storedUserEmail,
      });
    }

    connect();
    return () => disconnect();
  }, []);

  // 2. Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showMobileChat]);

  // 3. Join Room & Fetch History
  useEffect(() => {
    if (activeConversation && socket) {
      socket.emit("join_conversation", activeConversation.id);

      ChatService.getMessages(activeConversation.id).then((data) => {
        setMessages(data);
      });

      // Mobile: Jab chat select ho, chat view dikhao
      setShowMobileChat(true);
    }
  }, [activeConversation, socket]);

  // --- Handlers ---

  const handleUserClick = async (receiverId: number) => {
    try {
      const conversation = await ChatService.startChat(receiverId);
      console.log("CLG ::: conversation ::: ", conversation);
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

  // ✅ Optimized File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation || !currentUser || !socket) return;

    // Client-side Validation (Optimization)
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File size exceeds 100MB");
      return;
    }

    try {
      console.log("DEGUB ::: CLG ::: File", file);
      setIsUploading(true);
      const { fileUrl, type } = await ChatService.uploadFile(file);

      // Determine proper message type based on MIME
      let msgType = "DOCUMENT";
      if (type.startsWith("image/")) msgType = "IMAGE";
      if (type.startsWith("video/")) msgType = "VIDEO";

      const payload = {
        conversationId: activeConversation.id,
        senderId: currentUser.id,
        content: file.name, // Show filename
        type: msgType,
        fileUrl: fileUrl,
      };

      socket.emit("send_message", payload);
      toast.success("Attachment uploaded!");
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ✅ New: Handle Location Sharing
  const handleSendLocation = () => {
    if (!activeConversation || !currentUser || !socket) return;
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsSendingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        const payload = {
          conversationId: activeConversation.id,
          senderId: currentUser.id,
          content: `${latitude},${longitude}`, // Store as "lat,long" string
          type: "LOCATION",
        };

        socket.emit("send_message", payload);
        setIsSendingLocation(false);
        toast.success("Location sent!");
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsSendingLocation(false);
        toast.error("Unable to retrieve your location");
      },
      { enableHighAccuracy: true } // Better accuracy for GPS
    );
  };

  const handleBackToSidebar = () => {
    setShowMobileChat(false);
    // Optional: Clear active conversation if you want fresh state
    // setActiveConversation(null);
  };

  // ✅ Optimized Attachment Render
  const renderAttachment = (msg: Message) => {
    const fullUrl = getFullUrl(msg.fileUrl);
    if (msg.type === "IMAGE") {
      return (
        <div className="mb-2 overflow-hidden rounded-lg border border-white/20 cursor-pointer group">
          <img
            src={fullUrl}
            alt="attachment"
            loading="lazy" // Performance optimization
            className="max-h-64 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onClick={() => window.open(msg.fileUrl, "_blank")}
          />
        </div>
      );
    }
    if (msg.type === "VIDEO") {
      return (
        <div className="mb-2 overflow-hidden rounded-lg border border-white/20 bg-black">
          <video src={fullUrl} controls className="max-h-64 w-full" />
        </div>
      );
    }
    if (msg.type === "LOCATION" && msg.content) {
      const [lat, lng] = msg.content.split(",");
      const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      // Static map preview URL (using OpenStreetMap for free preview or Google Static Maps if you have API key)
      // Using a generic map placeholder or OSM link for optimization without API keys
      return (
        <div className="mb-2 overflow-hidden rounded-lg border border-white/20 bg-black/20 p-2">
          <div className="flex items-center gap-2 mb-2 text-white/90 font-medium">
            <MapPin className="w-5 h-5 text-red-500" />
            <span>Current Location</span>
          </div>
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-blue-300 hover:underline break-all"
          >
            View on Google Maps ({Number(lat).toFixed(4)},{" "}
            {Number(lng).toFixed(4)})
          </a>
        </div>
      );
    }
    // Docs / Zips
    return (
      <div className="flex items-center gap-3 rounded-lg bg-black/20 p-3 mb-2 border border-white/10 hover:bg-black/30 transition-colors">
        <div className="p-2 bg-white/10 rounded-full">
          <FileText className="h-6 w-6 text-blue-300" />
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium text-white/90">
            {msg.content}
          </p>
          <p className="text-[10px] text-white/50 uppercase">File</p>
        </div>
        <a
          href={fullUrl}
          download
          target="_blank"
          rel="noreferrer"
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80"
          title="Download"
        >
          <Download className="h-5 w-5" />
        </a>
      </div>
    );
  };

  return (
    <div
      className="relative flex h-screen w-full items-center justify-center bg-cover bg-center overflow-hidden font-sans"
      style={{ backgroundImage: `url(${BG_IMAGE})` }}
    >
      {/* Dark Overlay for contrast */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      {/* --- Main Glass Container --- */}
      <div className="relative z-10 flex h-full w-full max-w-[1600px] overflow-hidden bg-white/10 shadow-2xl backdrop-blur-xl border-white/20 md:h-[90vh] md:w-[95%] md:rounded-3xl md:border">
        {/* --- Sidebar (Left Panel) --- */}
        <div
          className={`absolute inset-y-0 left-0 z-20 w-full flex-col border-r border-white/20 bg-white/20 backdrop-blur-lg transition-transform duration-300 md:relative md:w-80 md:translate-x-0 ${
            showMobileChat ? "-translate-x-full" : "translate-x-0"
          } flex`}
        >
          {/* Sidebar Header */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white tracking-wide drop-shadow-sm">
              Messages
            </h2>
            {/* User Profile Pic (Optional) */}
            <div className="h-10 w-10 rounded-full bg-linear-to-tr from-lime-400 to-green-500 p-0.5">
              <img
                src={`https://ui-avatars.com/api/?name=${currentUser?.username}&background=random`}
                alt="Me"
                className="h-full w-full rounded-full border-2 border-white/50"
              />
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-6 py-4">
            <div className="relative group">
              <Search className="absolute left-3 top-3 h-5 w-5 text-white/60 group-focus-within:text-white transition-colors" />
              <input
                type="text"
                placeholder="Search friends..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 py-2.5 pl-10 pr-4 text-white placeholder-white/40 backdrop-blur-sm focus:border-white/40 focus:bg-black/30 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
            {usersLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-white/50" />
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  className={`group flex cursor-pointer items-center gap-4 rounded-2xl p-3 transition-all duration-200 hover:bg-white/20 ${
                    activeConversation?.participants.some(
                      (p) => p.user.id === user.id
                    )
                      ? "bg-white/25 shadow-lg ring-1 ring-white/20"
                      : "hover:shadow-md"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={`https://ui-avatars.com/api/?name=${user?.username}&background=random`}
                      alt="avatar"
                      className="h-12 w-12 rounded-full object-cover border-2 border-white/30 shadow-sm"
                    />
                    {/* Online Dot Mockup */}
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-white/20"></span>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <h3 className="truncate text-base font-semibold text-white drop-shadow-sm group-hover:text-white">
                        {/* {user.firstName} {user.lastName} */}
                        {user?.username}
                      </h3>
                      <span className="text-[10px] text-white/50">
                        12:30 PM
                      </span>
                    </div>
                    <p className="truncate text-sm text-white/60 group-hover:text-white/80">
                      {user?.email}
                    </p>
                  </div>
                </div>
              ))
            )}

            {filteredUsers.length === 0 && !usersLoading && (
              <div className="text-center text-white/40 mt-10 text-sm">
                No users found
              </div>
            )}
          </div>
        </div>

        {/* --- Chat Area (Right Panel) --- */}
        <div
          className={`absolute inset-y-0 right-0 z-10 w-full flex-col bg-white/5 transition-transform duration-300 md:relative md:flex md:translate-x-0 ${
            showMobileChat ? "translate-x-0" : "translate-x-full"
          } flex`}
        >
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex h-20 items-center justify-between border-b border-white/10 bg-white/10 px-4 shadow-sm backdrop-blur-md md:px-8">
                <div className="flex items-center gap-3">
                  {/* Back Button (Mobile Only) */}
                  <button
                    onClick={handleBackToSidebar}
                    className="mr-1 rounded-full p-2 text-white/80 hover:bg-white/20 md:hidden"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-white font-bold shadow-lg ring-2 ring-white/20">
                    {activeConversation.type === "PERSONAL" ? "P" : "G"}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white drop-shadow-sm">
                      {activeConversation.type === "PERSONAL"
                        ? activeConversation.participants.find(
                            (p) => p.user.id !== currentUser?.id
                          )?.user.firstName || "Chat"
                        : activeConversation.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                      <span className="text-xs font-medium text-white/70">
                        Online
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-white/70">
                  <button className="rounded-full p-2.5 transition-colors hover:bg-white/20 hover:text-white">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button className="rounded-full p-2.5 transition-colors hover:bg-white/20 hover:text-white">
                    <Video className="h-5 w-5" />
                  </button>
                  <button className="rounded-full p-2.5 transition-colors hover:bg-white/20 hover:text-white">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
                {messages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isMe ? "justify-end" : "justify-start"
                      } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                      <div
                        className={`relative max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-lg backdrop-blur-md ${
                          isMe
                            ? "bg-linear-to-br from-green-600/50 to-brand-600/50 text-white rounded-br-none border border-white/20"
                            : "bg-linear-to-br from-black/20 to-white/20 text-white rounded-tl-none border border-white/10"
                        }`}
                      >
                        {/* Attachments */}
                        {msg.type !== "TEXT" && renderAttachment(msg)}

                        {/* Text Content */}
                        {!msg.isDeleted &&
                          msg.content &&
                          msg.type === "TEXT" && (
                            <p className="text-[15px] leading-relaxed tracking-wide whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          )}

                        {msg.isDeleted && (
                          <p className="italic text-sm opacity-60 flex items-center gap-2">
                            🚫 Message deleted
                          </p>
                        )}

                        <div
                          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                            isMe ? "text-white/70" : "text-gray-200"
                          }`}
                        >
                          <span>
                            {format(new Date(msg.createdAt), "h:mm a")}
                          </span>
                          {msg.isEdited && <span>(edited)</span>}
                          {isMe && <CheckCheck className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="bg-white/10 p-4 md:px-8 md:py-5 backdrop-blur-md border-t border-white/10">
                <div className="flex items-center gap-3 rounded-3xl bg-black/20 p-1.5 pr-2 ring-1 ring-white/10 transition-all focus-within:ring-white/30 focus-within:bg-black/30">
                  {/* Attachment Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-all"
                    title="Attach File"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  {/* Location Button (New) */}
                  <button
                    onClick={handleSendLocation}
                    disabled={isSendingLocation}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-all ${
                      isSendingLocation ? "animate-pulse text-red-400" : ""
                    }`}
                    title="Share Location"
                  >
                    <MapPin className="h-5 w-5" />
                  </button>

                  {/* Text Input */}
                  <input
                    type="text"
                    className="flex-1 bg-transparent px-2 py-2 text-white placeholder-white/40 focus:outline-none text-sm md:text-base"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />

                  {/* Send Button */}
                  {isUploading || isSendingLocation ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  ) : (
                    <button
                      onClick={handleSendMessage}
                      disabled={!input.trim()}
                      className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                        input.trim()
                          ? "bg-linear-to-r from-green-300/50 to-green-500/30 text-white"
                          : "bg-white/10 text-white/30 cursor-not-allowed"
                      }`}
                    >
                      <Send className="h-5 w-5 ml-0.5" />
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            // Empty State (No Chat Selected)
            <div className="flex h-full flex-col items-center justify-center text-center p-6 bg-white/5 backdrop-blur-sm">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-tr from-indigo-500/20 to-purple-500/20 ring-1 ring-white/20 shadow-2xl">
                <ImageIcon className="h-10 w-10 text-white/80" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-white drop-shadow-md">
                Welcome to Glass Chat
              </h3>
              <p className="max-w-xs text-white/60">
                Select a conversation from the sidebar to start messaging in a
                beautiful interface.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
