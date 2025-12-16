import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useSocketStore } from "../../store/useSocketStore";
import { ChatService } from "../../services/chatService";
import { format } from "date-fns";
import {
  Send,
  Image as ImageIcon,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Phone,
  Video,
  Search,
  ArrowLeft,
  Loader2,
  FileText,
  MapPin,
  MapPinned,
  Telescope,
  Ban,
  BadgePlus,
  Download,
  CheckCheck,
  Edit2,
  Trash2,
  X,
  CornerUpLeft,
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

// --- Background Image ---
const BG_IMAGE =
  "https://cdn.magicdecor.in/com/2024/05/09154244/TV-Unit-Luxury-Floral-Pattern-Wallpaper-Design.jpg";

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
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSendingLocation, setIsSendingLocation] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);

  // --- UI States ---
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false); // Attachment Menu State

  const { users, loading: usersLoading } = useUserList();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Input Refs ---
  const mediaInputRef = useRef<HTMLInputElement>(null); // For Images/Videos
  const docInputRef = useRef<HTMLInputElement>(null); // For Documents
  const textInputRef = useRef<HTMLInputElement>(null);

  // Filter users
  const filteredUsers = users.filter(
    (u) =>
      u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Setup User & Socket
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

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showMobileChat, replyingTo]);

  // Handle Editing State
  useEffect(() => {
    if (editingMessage) {
      setInput(editingMessage.content || "");
      textInputRef.current?.focus();
    }
  }, [editingMessage]);

  // Join Room
  useEffect(() => {
    if (activeConversation && socket) {
      socket.emit("join_conversation", activeConversation.id);
      ChatService.getMessages(activeConversation.id).then(setMessages);
      setShowMobileChat(true);
      // Clear states when changing chat
      setReplyingTo(null);
      setEditingMessage(null);
      setIsAttachMenuOpen(false);
      setInput("");
    }
  }, [activeConversation, socket]);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Logic could be more specific, but for now simple closing works
      const target = e.target as HTMLElement;
      if (!target.closest(".message-menu-trigger")) {
        setActiveMenuId(null);
      }
      if (
        !target.closest(".attachment-menu-trigger") &&
        !target.closest(".attachment-menu")
      ) {
        setIsAttachMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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

    if (editingMessage) {
      socket.emit("edit_message", {
        messageId: editingMessage.id,
        newContent: input,
        conversationId: activeConversation.id,
      });
      setEditingMessage(null);
      toast.success("Message updated");
    } else {
      const payload = {
        conversationId: activeConversation.id,
        senderId: currentUser.id,
        content: input,
        type: "TEXT",
        replyToId: replyingTo?.id || null,
      };
      socket.emit("send_message", payload);
      setReplyingTo(null);
    }

    setInput("");
  };

  const handleDeleteMessage = (msgId: number) => {
    if (!socket || !activeConversation) return;
    socket.emit("delete_message", {
      messageId: msgId,
      conversationId: activeConversation.id,
    });
    toast.success("Message deleted");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation || !currentUser || !socket) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error("File size exceeds 100MB");
      return;
    }

    try {
      setIsUploading(true);
      const { fileUrl, type } = await ChatService.uploadFile(file);

      let msgType = "DOCUMENT";
      if (type.startsWith("image/")) msgType = "IMAGE";
      if (type.startsWith("video/")) msgType = "VIDEO";

      const payload = {
        conversationId: activeConversation.id,
        senderId: currentUser.id,
        content: file.name,
        type: msgType,
        fileUrl: fileUrl,
        replyToId: replyingTo?.id || null,
      };

      socket.emit("send_message", payload);
      setReplyingTo(null);
      setIsAttachMenuOpen(false); // Close menu after selection
      toast.success("Attachment sent!");
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      // Reset inputs
      if (mediaInputRef.current) mediaInputRef.current.value = "";
      if (docInputRef.current) docInputRef.current.value = "";
    }
  };

  const handleSendLocation = () => {
    if (!activeConversation || !currentUser || !socket) return;
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    setIsSendingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const payload = {
          conversationId: activeConversation.id,
          senderId: currentUser.id,
          content: `${latitude},${longitude}`,
          type: "LOCATION",
          replyToId: replyingTo?.id || null,
        };
        socket.emit("send_message", payload);
        setIsSendingLocation(false);
        setReplyingTo(null);
        setIsAttachMenuOpen(false);
        toast.success("Location sent!");
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsSendingLocation(false);
        toast.error("Unable to retrieve location");
      },
      { enableHighAccuracy: true }
    );
  };

  // --- Renderers ---

  const renderAttachment = (msg: Message) => {
    const fullUrl = getFullUrl(msg.fileUrl);

    if (msg.type === "IMAGE") {
      return (
        <div className="mb-2 overflow-hidden rounded-lg border border-white/20 cursor-pointer group">
          <img
            src={fullUrl}
            alt="attachment"
            loading="lazy"
            className="max-h-64 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onClick={() => window.open(fullUrl, "_blank")}
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
      return (
        <div className="overflow-hidden rounded-lg border border-white/20 bg-black/20">
          <div className="flex items-center gap-2 text-white/90 font-medium">
            {/* <MapPin className="w-5 h-5 text-red-500" /> */}
            <img
              // src={mapUrl}
              src={`https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&size=450,250&z=15&l=map&pt=${lng},${lat},pm2rdm`}
              alt="Location Preview"
              className="w-full h-40 object-cover rounded-tl rounded-tr"
            />{" "}
          </div>
          <div className="p-2 flex flex-col items-center">
            <a href={mapUrl} target="_blank" rel="noopener noreferrer">
              <button className="mx-auto overflow-hidden relative w-32 h-8 bg-brand-500 text-white border-none rounded-md text-sm font-bold cursor-pointer z-10 group">
                <span className="flex items-center justify-center gap-1">
                  <MapPinned className="w-5 h-5" /> Open map
                </span>
                <span className="absolute w-36 h-32 -top-8 -left-2 bg-white rotate-12 transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-500 duration-1000 origin-left" />
                <span className="absolute w-36 h-32 -top-8 -left-2 bg-green-400 rotate-12 transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-700 duration-700 origin-left" />
                <span className="absolute w-36 h-32 -top-8 -left-2 bg-green-600 rotate-12 transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-1000 duration-500 origin-left" />
                <span className="group-hover:opacity-100 group-hover:duration-1000 duration-100 opacity-0 absolute top-1.5 left-6 z-10">
                  <span className="flex items-center justify-center gap-1">
                    <Telescope className="w-5 h-5" /> Explore!
                  </span>
                </span>
              </button>
            </a>
          </div>
        </div>
      );
    }
    // Docs
    return (
      <div className="flex items-center gap-3 rounded-lg bg-black/20 p-3 mb-2 border border-white/10 hover:bg-black/30 transition-colors">
        <div className="p-2 bg-white/10 rounded-full">
          <FileText className="h-6 w-6 text-blue-300" />
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium text-white/90">
            {msg.content}
          </p>
          <p className="text-[10px] text-white/50 uppercase">Document</p>
        </div>
        <a
          href={fullUrl}
          download
          target="_blank"
          rel="noreferrer"
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80"
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
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      <div className="relative z-10 flex h-full w-full max-w-[1600px] overflow-hidden bg-white/10 shadow-2xl backdrop-blur-xl border-white/20 md:h-[90vh] md:w-[95%] md:rounded-3xl md:border">
        {/* Sidebar */}
        <div
          className={`absolute inset-y-0 left-0 z-20 w-full flex-col border-r border-white/20 bg-white/20 backdrop-blur-lg transition-transform duration-300 md:relative md:w-80 md:translate-x-0 ${
            showMobileChat ? "-translate-x-full" : "translate-x-0"
          } flex`}
        >
          <div className="flex h-20 items-center justify-between px-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white tracking-wide drop-shadow-sm">
              Messages
            </h2>
            <div className="h-10 w-10 rounded-full bg-linear-to-tr from-lime-400 to-green-500 p-0.5">
              <img
                src={`https://ui-avatars.com/api/?name=${currentUser?.username}&background=random`}
                alt="Me"
                className="h-full w-full rounded-full border-2 border-white/50"
              />
            </div>
          </div>

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
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-white/20"></span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <h3 className="truncate text-base font-semibold text-white drop-shadow-sm group-hover:text-white">
                        {user.username}
                      </h3>
                    </div>
                    <p className="truncate text-sm text-white/60 group-hover:text-white/80">
                      {user.email}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
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
                  <button
                    onClick={() => setShowMobileChat(false)}
                    className="mr-1 rounded-full p-2 text-white/80 hover:bg-white/20 md:hidden"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-green-500 to-lime-700 text-white font-bold shadow-lg ring-2 ring-white/20">
                    {activeConversation.type === "PERSONAL"
                      ? activeConversation.participants[0].user.username
                          .slice(0, 2)
                          .toUpperCase()
                      : "G"}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white drop-shadow-sm">
                      {activeConversation.type === "PERSONAL"
                        ? activeConversation.participants.find(
                            (p) => p.user.id !== currentUser?.id
                          )?.user.username || "Chat"
                        : activeConversation.name}
                    </h3>
                    <span className="text-xs font-medium text-white/70 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>{" "}
                      Online
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                  <button className="p-2 hover:bg-white/20 rounded-full">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button className="p-2 hover:bg-white/20 rounded-full">
                    <Video className="h-5 w-5" />
                  </button>
                  <button className="p-2 hover:bg-white/20 rounded-full">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
                {messages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.id;
                  const isDeleted = msg.isDeleted;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isMe ? "items-end" : "items-start"
                      } animate-in fade-in slide-in-from-bottom-2`}
                    >
                      {/* Message Bubble */}
                      <div
                        className={`relative max-w-[85%] md:max-w-[70%] rounded-2xl px-3 pt-3 pb-2 shadow-lg backdrop-blur-md group ${
                          !isMe
                            ? "bg-linear-to-br from-green-600/50 to-brand-600/50 text-white rounded-tl-none border border-white/20"
                            : "bg-linear-to-br from-black/20 to-white/20 text-white rounded-br-none border border-white/10"
                        }`}
                      >
                        {/* Reply Context */}
                        {!isDeleted && msg.replyTo && (
                          <div
                            className={`mb-2 rounded-lg border-l-4 p-2 text-xs opacity-80 ${
                              !isMe
                                ? "border-white/50 bg-black/10"
                                : "border-indigo-400 bg-white/5"
                            }`}
                          >
                            <p className="font-bold mb-0.5">
                              {msg.replyTo.senderId === currentUser?.id
                                ? "You"
                                : ""}
                            </p>
                            <p className="truncate">
                              {msg.replyTo.content || "Attachment"}
                            </p>
                          </div>
                        )}

                        {/* Attachments */}
                        {!isDeleted &&
                          msg.type !== "TEXT" &&
                          renderAttachment(msg)}

                        {/* Text Content */}
                        {!isDeleted && msg.content && msg.type === "TEXT" && (
                          <p className="text-[15px] leading-relaxed tracking-wide whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        )}

                        {msg.isDeleted && (
                          <p className="italic text-md opacity-60 flex items-center gap-2">
                            <Ban className="h-5 w-5" /> Message deleted
                          </p>
                        )}

                        <div
                          className={`mt-1 flex items-center justify-end gap-1 text-xs ${
                            !isMe ? "text-white/80" : "text-gray-100"
                          }`}
                        >
                          <span>
                            {format(new Date(msg.createdAt), "h:mm a")}
                          </span>
                          {msg.isEdited && <span>(edited)</span>}
                          {isMe && <CheckCheck className="h-4 w-4" />}
                        </div>

                        {/* Dropdown Menu (Only for valid messages) */}
                        {!isDeleted && (
                          <div
                            className={`absolute top-0.5 ${
                              isMe ? "right-1" : "right-1"
                            } opacity-0 group-hover:opacity-100 transition-opacity message-menu-trigger`}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(
                                  activeMenuId === msg.id ? null : msg.id
                                );
                              }}
                              className="p-1 rounded-full hover:bg-black/50 text-white/90"
                            >
                              {activeMenuId ? (
                                <ChevronUp className="h-6 w-6" />
                              ) : (
                                <ChevronDown className="h-6 w-6" />
                              )}
                            </button>

                            {/* Popup Menu */}
                            {activeMenuId === msg.id && (
                              <div
                                className={`absolute top-9 ${
                                  !!isMe && "right-0"
                                } z-50 w-32 rounded-lg bg-black/20 shadow-xl backdrop-blur-xl text-gray-50 p-1 text-[16px] font-medium animate-in fade-in zoom-in-95 origin-top-left`}
                              >
                                <button
                                  onClick={() => {
                                    setReplyingTo(msg);
                                    setActiveMenuId(null);
                                    textInputRef.current?.focus();
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-indigo-50/40 rounded-md flex items-center gap-2"
                                >
                                  <CornerUpLeft className="h-3.5 w-3.5" /> Reply
                                </button>
                                {isMe && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditingMessage(msg);
                                        setActiveMenuId(null);
                                        textInputRef.current?.focus();
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-indigo-200/40 rounded-md flex items-center gap-2"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" /> Edit
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleDeleteMessage(msg.id);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-red-50/50 rounded-md text-red-600 flex items-center gap-2"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" /> Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="bg-white/10 p-4 md:px-8 md:py-5 backdrop-blur-md border-t border-white/10 relative">
                {/* Reply/Edit Preview Banner */}
                {(replyingTo || editingMessage) && (
                  <div className="absolute bottom-full left-0 right-0 mx-4 md:mx-8 mb-2 p-3 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-between text-white animate-in slide-in-from-bottom-2">
                    <div className="flex flex-col text-sm border-l-4 border-green-400 pl-3">
                      <span className="font-bold text-green-300 mb-0.5">
                        {editingMessage
                          ? "Editing Message"
                          : `Replying to ${replyingTo?.sender.username}`}
                      </span>
                      <span className="truncate max-w-md opacity-80 text-xs">
                        {editingMessage
                          ? editingMessage.content
                          : replyingTo?.content || "Attachment"}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setEditingMessage(null);
                        setInput("");
                      }}
                      className="p-1.5 hover:bg-white/20 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div
                  className={`flex items-center gap-3 rounded-3xl bg-black/20 p-1.5 pr-2 ring-1 transition-all focus-within:bg-black/30 ${
                    editingMessage ?? replyingTo
                      ? "ring-amber-400/50"
                      : "ring-white/10"
                  }`}
                >
                  {/* --- ATTACHMENT MENU BUTTON --- */}
                  <div className="relative attachment-menu-trigger">
                    <button
                      onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                        isAttachMenuOpen
                          ? "bg-white/20 text-white rotate-45"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <BadgePlus className="h-6 w-6" />
                    </button>

                    {/* Popup Attachment Menu */}
                    {isAttachMenuOpen && (
                      <div className="attachment-menu absolute bottom-14 left-0 w-48 p-2 rounded-2xl bg-[#1c1c1c]/50 backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col gap-1 animate-in slide-in-from-bottom-2 fade-in zoom-in-95 origin-bottom-left z-50">
                        {/* Option 1: Location */}
                        <button
                          onClick={() => {
                            handleSendLocation();
                            setIsAttachMenuOpen(false);
                          }}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/10 text-white/90 transition-colors group text-left w-full"
                        >
                          <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 group-hover:bg-green-500 group-hover:text-white transition-all">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              Location
                            </span>
                            <span className="text-[10px] text-white/50">
                              Share GPS
                            </span>
                          </div>
                        </button>

                        {/* Option 2: Photos & Videos */}
                        <button
                          onClick={() => {
                            mediaInputRef.current?.click();
                            setIsAttachMenuOpen(false);
                          }}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/10 text-white/90 transition-colors group text-left w-full"
                        >
                          <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">Gallery</span>
                            <span className="text-[10px] text-white/50">
                              Photos & Videos
                            </span>
                          </div>
                        </button>

                        {/* Option 3: Document */}
                        <button
                          onClick={() => {
                            docInputRef.current?.click();
                            setIsAttachMenuOpen(false);
                          }}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/10 text-white/90 transition-colors group text-left w-full"
                        >
                          <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              Document
                            </span>
                            <span className="text-[10px] text-white/50">
                              All Files
                            </span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Hidden Inputs for File Selection */}
                  <input
                    type="file"
                    ref={mediaInputRef}
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                  />
                  <input
                    type="file"
                    ref={docInputRef}
                    className="hidden"
                    // No accept means all files allowed (Documents/Zips etc)
                    onChange={handleFileUpload}
                  />

                  {/* Text Input */}
                  <input
                    type="text"
                    className="flex-1 bg-transparent px-2 py-2 text-white placeholder-white/40 focus:outline-none text-sm md:text-base"
                    placeholder={
                      editingMessage
                        ? "Edit your message..."
                        : "Type a message..."
                    }
                    value={input}
                    ref={textInputRef}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />

                  {/* Send/Loading/Location Loading */}
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
                      {editingMessage ? (
                        <CheckCheck className="h-5 w-5" />
                      ) : (
                        <Send className="h-5 w-5 ml-0.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 bg-white/5 backdrop-blur-sm">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-tr from-indigo-500/20 to-purple-500/20 ring-1 ring-white/20 shadow-2xl">
                <ImageIcon className="h-10 w-10 text-white/80" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-white drop-shadow-md">
                Welcome to Glass Chat
              </h3>
              <p className="max-w-xs text-white/60">
                Select a conversation from the sidebar to start messaging.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
