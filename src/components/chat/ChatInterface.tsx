import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useSocketStore } from "../../store/useSocketStore";
import { ChatService } from "../../services/chatService";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Send,
  Image as ImageIcon,
  MoreVertical,
  ChevronDown,
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
  ArrowRight,
} from "lucide-react";
import { Message, User, Conversation } from "../../types/chatTypes";
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
const BG_IMAGE = "/lantern-logo.png";

// Type for chat list item
interface ChatListItem {
  userId: number;
  user: User;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  conversationId?: number;
}

export const ChatInterface = () => {
  const navigate = useNavigate();
  const { socket, connect, disconnect } = useSocketStore();
  const {
    activeConversation,
    messages,
    getMessageById,
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
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);

  // --- State for chat list ---
  const [chatList, setChatList] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Input Refs ---
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Filter chat list based on search term
  const filteredChatList = chatList.filter((chat) => {
    const name =
      `${chat.user.firstName || ""} ${chat.user.lastName || ""}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

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

  // Fetch users and load chat history
  useEffect(() => {
    const fetchUsersAndChats = async () => {
      try {
        setLoading(true);
        // Fetch all users
        const allUsers = await ChatService.getAllUsers();
        setUsers(allUsers);

        // Initialize chat list with all users
        const initialChatList: ChatListItem[] = allUsers.map((user) => ({
          userId: user.id,
          user: user,
          lastMessage: undefined,
          lastMessageTime: undefined,
          unreadCount: 0,
          conversationId: undefined,
        }));

        // Try to load existing conversations to get last messages
        try {
          const conversations = await ChatService.getUserConversations();
          if (conversations && conversations.length > 0) {
            // Update chat list with conversation data
            const updatedChatList = [...initialChatList];

            for (const conv of conversations) {
              const otherParticipant = conv.participants.find(
                (p) => p.user.id !== currentUser?.id,
              )?.user;

              if (otherParticipant) {
                const chatIndex = updatedChatList.findIndex(
                  (chat) => chat.user.id === otherParticipant.id,
                );

                if (chatIndex !== -1) {
                  updatedChatList[chatIndex] = {
                    ...updatedChatList[chatIndex],
                    lastMessage: conv.lastMessage,
                    lastMessageTime: conv.lastMessageAt,
                    conversationId: conv.id,
                    unreadCount: 0,
                  };
                }
              }
            }

            // FIX: Sort by last message time (most recent first)
            // This ensures users with recent messages appear at the top
            const sortedList = [...updatedChatList].sort((a, b) => {
              // If both have no messages, keep original order (or sort alphabetically)
              if (!a.lastMessageTime && !b.lastMessageTime) {
                // Sort alphabetically by name for users with no messages
                const nameA =
                  `${a.user.firstName} ${a.user.lastName}`.toLowerCase();
                const nameB =
                  `${b.user.firstName} ${b.user.lastName}`.toLowerCase();
                return nameA.localeCompare(nameB);
              }
              // Users with no messages go to the bottom
              if (!a.lastMessageTime) return 1;
              if (!b.lastMessageTime) return -1;
              // Most recent messages first (descending order by date)
              return (
                new Date(b.lastMessageTime).getTime() -
                new Date(a.lastMessageTime).getTime()
              );
            });

            setChatList(sortedList);
          } else {
            // If no conversations, sort alphabetically
            const sortedList = [...initialChatList].sort((a, b) => {
              const nameA =
                `${a.user.firstName} ${a.user.lastName}`.toLowerCase();
              const nameB =
                `${b.user.firstName} ${b.user.lastName}`.toLowerCase();
              return nameA.localeCompare(nameB);
            });
            setChatList(sortedList);
          }
        } catch (error) {
          console.log("No conversations found or error loading them:", error);
          // Even if there's an error, sort alphabetically
          const sortedList = [...initialChatList].sort((a, b) => {
            const nameA =
              `${a.user.firstName} ${a.user.lastName}`.toLowerCase();
            const nameB =
              `${b.user.firstName} ${b.user.lastName}`.toLowerCase();
            return nameA.localeCompare(nameB);
          });
          setChatList(sortedList);
        }
      } catch (error) {
        console.error("Failed to fetch users", error);
        toast.error("Failed to load chat list");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUsersAndChats();
    }
  }, [currentUser]);

  // Listen for new messages and update chat list
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      console.log("New message received:", message);

      // Update chat list with new message
      setChatList((prevList) => {
        // First, find which user this message is from/to
        const isIncoming = message.senderId !== currentUser?.id;
        const relevantUserId = isIncoming
          ? message.senderId
          : // For outgoing messages, find the recipient from conversation
            activeConversation?.participants?.find(
              (p) => p.user.id !== currentUser?.id,
            )?.user.id;

        if (!relevantUserId) return prevList;

        const updatedList = prevList.map((chat) => {
          // Find the chat that matches the message
          if (chat.user.id === relevantUserId) {
            const isUnread =
              isIncoming &&
              (!activeConversation ||
                activeConversation.id !== message.conversationId);

            // Format message preview
            let messagePreview = message.content || "";
            if (!messagePreview && message.type === "IMAGE")
              messagePreview = "📷 Image";
            if (!messagePreview && message.type === "VIDEO")
              messagePreview = "📹 Video";
            if (!messagePreview && message.type === "LOCATION")
              messagePreview = "📍 Location";
            if (!messagePreview && message.type === "DOCUMENT")
              messagePreview = "📄 File";

            return {
              ...chat,
              lastMessage: messagePreview,
              lastMessageTime: message.createdAt,
              conversationId: message.conversationId,
              unreadCount: isUnread ? chat.unreadCount + 1 : chat.unreadCount,
            };
          }
          return chat;
        });

        // FIX: Sort by latest message time (most recent first)
        // This is the critical fix - ensures proper sorting on new messages
        const sortedList = [...updatedList].sort((a, b) => {
          // If both have no messages, sort alphabetically
          if (!a.lastMessageTime && !b.lastMessageTime) {
            const nameA =
              `${a.user.firstName} ${a.user.lastName}`.toLowerCase();
            const nameB =
              `${b.user.firstName} ${b.user.lastName}`.toLowerCase();
            return nameA.localeCompare(nameB);
          }
          // Users with no messages go to bottom
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          // Sort by most recent message (descending)
          return (
            new Date(b.lastMessageTime).getTime() -
            new Date(a.lastMessageTime).getTime()
          );
        });

        return sortedList;
      });
    };

    // Listen for message sent confirmation (for outgoing messages)
    const handleMessageSent = (message: Message) => {
      console.log("Message sent confirmation:", message);

      setChatList((prevList) => {
        // For outgoing messages, find the recipient
        const recipientId = activeConversation?.participants?.find(
          (p) => p.user.id !== currentUser?.id,
        )?.user.id;

        if (!recipientId) return prevList;

        const updatedList = prevList.map((chat) => {
          if (chat.user.id === recipientId) {
            let messagePreview = message.content || "";
            if (!messagePreview && message.type === "IMAGE")
              messagePreview = "📷 Image";
            if (!messagePreview && message.type === "VIDEO")
              messagePreview = "📹 Video";
            if (!messagePreview && message.type === "LOCATION")
              messagePreview = "📍 Location";
            if (!messagePreview && message.type === "DOCUMENT")
              messagePreview = "📄 File";

            return {
              ...chat,
              lastMessage: messagePreview,
              lastMessageTime: message.createdAt,
              conversationId: message.conversationId,
              // Don't increment unread count for outgoing messages
            };
          }
          return chat;
        });

        // Sort by most recent message
        const sortedList = [...updatedList].sort((a, b) => {
          if (!a.lastMessageTime && !b.lastMessageTime) {
            const nameA =
              `${a.user.firstName} ${a.user.lastName}`.toLowerCase();
            const nameB =
              `${b.user.firstName} ${b.user.lastName}`.toLowerCase();
            return nameA.localeCompare(nameB);
          }
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          return (
            new Date(b.lastMessageTime).getTime() -
            new Date(a.lastMessageTime).getTime()
          );
        });

        return sortedList;
      });
    };

    socket.on("receive_message", handleNewMessage);
    socket.on("message_sent", handleMessageSent);

    return () => {
      socket.off("receive_message", handleNewMessage);
      socket.off("message_sent", handleMessageSent);
    };
  }, [socket, currentUser, activeConversation]);

  // Reset unread count when viewing a conversation
  useEffect(() => {
    if (activeConversation) {
      setChatList((prevList) => {
        const updatedList = prevList.map((chat) => {
          if (chat.conversationId === activeConversation.id) {
            return { ...chat, unreadCount: 0 };
          }
          return chat;
        });
        // Don't re-sort here to maintain order
        return updatedList;
      });
    }
  }, [activeConversation]);

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
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleUserClick = async (receiverId: number) => {
    try {
      const conversation = await ChatService.startChat(receiverId);
      setActiveConversation(conversation);

      // Update chat list with conversation ID and reset unread count
      setChatList((prevList) => {
        const updatedList = prevList.map((chat) => {
          if (chat.user.id === receiverId) {
            return { ...chat, conversationId: conversation.id, unreadCount: 0 };
          }
          return chat;
        });
        // Don't re-sort here - keep the order based on message times
        return updatedList;
      });
    } catch (error) {
      console.error("Failed to start chat", error);
      toast.error("Failed to start conversation");
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
      if (file.type.startsWith("video/")) {
        toast.loading("Compressing & Uploading Video...", {
          id: "videoUpload",
        });
      }

      const { fileUrl, type } = await ChatService.uploadFile(file);
      toast.dismiss("videoUpload");

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
      setIsAttachMenuOpen(false);
      toast.success("Sent!");
    } catch (error) {
      console.error("Upload failed", error);
      toast.dismiss("videoUpload");
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
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
      { enableHighAccuracy: true },
    );
  };

  // Helper function to format last message time
  const formatLastMessageTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) {
      return format(date, "h:mm a");
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return format(date, "EEEE");
    } else {
      return format(date, "MMM d");
    }
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
            <img
              src={`https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&size=450,250&z=15&l=map&pt=${lng},${lat},pm2rdm`}
              alt="Location Preview"
              className="w-full h-40 object-cover rounded-tl rounded-tr"
            />
          </div>
          <div className="p-2 flex flex-col items-center">
            <a href={mapUrl} target="_blank" rel="noopener noreferrer">
              <button className="mx-auto overflow-hidden relative w-32 h-8 bg-lantern-blue-600 text-white border-none rounded-md text-sm font-bold cursor-pointer z-10 group">
                <span className="flex items-center justify-center gap-1">
                  <MapPinned className="h-5 w-5" /> Open map
                </span>
                <span className="absolute w-36 h-32 -top-8 -left-2 bg-white rotate-12 transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-500 duration-1000 origin-left" />
                <span className="absolute w-36 h-32 -top-8 -left-2 bg-blue-400 rotate-12 transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-700 duration-700 origin-left" />
                <span className="absolute w-36 h-32 -top-8 -left-2 bg-lantern-blue-600 rotate-12 transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-1000 duration-500 origin-left" />
                <span className="group-hover:opacity-100 group-hover:duration-1000 duration-100 opacity-0 absolute top-1.5 left-6 z-10">
                  <span className="flex items-center justify-center gap-1">
                    <Telescope className="h-5 w-5" /> Explore!
                  </span>
                </span>
              </button>
            </a>
          </div>
        </div>
      );
    }
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
      <div className="absolute inset-0 bg-black" />

      <div className="relative z-10 flex h-full w-full max-w-[1600px] overflow-hidden bg-white/10 shadow-2xl backdrop-blur-xl border-white/20 md:h-[96vh] md:w-[98%] md:rounded-3xl md:border">
        {/* Sidebar */}
        <div
          className={`absolute inset-y-0 left-0 z-20 w-full flex-col border-r border-white/20 bg-white/10 backdrop-blur-lg transition-transform duration-300 md:relative md:w-80 md:translate-x-0 ${
            showMobileChat ? "-translate-x-full" : "translate-x-0"
          } flex`}
        >
          <div className="flex h-20 items-center justify-between px-6 border-b border-white/10 bg-lantern-blue-600">
            <div className="flex items-center gap-1 ">
              <button
                onClick={handleGoBack}
                className="mr-1 rounded-full p-1 text-white/80 hover:bg-white/20"
              >
                <X className="h-7 w-7" />
              </button>
              <h2 className="text-2xl font-bold text-white tracking-wide drop-shadow-sm">
                Messages
              </h2>
            </div>

            <div className="flex items-center gap-1">
              <div className="h-10 w-10 rounded-full bg-linear-to-tr from-blue-400 to-lantern-blue-600 p-0.5">
                <img
                  src={`https://ui-avatars.com/api/?name=${currentUser?.firstName?.substring(0, 2).toUpperCase()}&background=random`}
                  alt="Me"
                  className="h-full w-full rounded-full border-2 border-white/50"
                />
              </div>
              {!!activeConversation && (
                <button
                  onClick={() => setShowMobileChat(true)}
                  className="mr-1 rounded-full p-2 text-white/80 hover:bg-white/20 md:hidden"
                >
                  <ArrowRight className="h-6 w-6" />
                </button>
              )}
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
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-white/50" />
              </div>
            ) : filteredChatList.length === 0 ? (
              <div className="text-center py-10 text-white/50">
                No users found
              </div>
            ) : (
              filteredChatList.map((chat) => {
                const isActive = activeConversation?.participants?.some(
                  (p) => p.user.id === chat.user.id,
                );

                return (
                  <div
                    key={chat.user.id}
                    onClick={() => handleUserClick(chat.user.id)}
                    className={`group flex cursor-pointer items-center gap-3 rounded-2xl p-3 transition-all duration-200 hover:bg-white/20 ${
                      isActive
                        ? "bg-white/25 shadow-lg ring-1 ring-white/20"
                        : "hover:shadow-md"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={`https://ui-avatars.com/api/?name=${chat.user?.firstName || "U"}&background=random`}
                        alt="avatar"
                        className="h-12 w-12 rounded-full object-cover border-2 border-white/30 shadow-sm"
                      />
                      {chat.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center animate-pulse shadow-lg">
                          {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 overflow-hidden min-w-0">
                      <div className="flex justify-between items-baseline gap-2">
                        <h3
                          className={`truncate text-base font-semibold drop-shadow-sm ${
                            chat.unreadCount > 0
                              ? "text-white font-bold"
                              : "text-white/90"
                          }`}
                        >
                          {chat.user.firstName} {chat.user.lastName}
                        </h3>
                        {chat.lastMessageTime && (
                          <span
                            className={`text-xs flex-shrink-0 ${
                              chat.unreadCount > 0
                                ? "text-white font-semibold"
                                : "text-white/50"
                            }`}
                          >
                            {formatLastMessageTime(chat.lastMessageTime)}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center gap-2">
                        <p
                          className={`truncate text-sm ${
                            chat.unreadCount > 0
                              ? "text-white font-medium"
                              : "text-white/60"
                          }`}
                        >
                          {chat.lastMessage || "Click to start conversation"}
                        </p>
                        {chat.unreadCount > 0 && (
                          <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area - Keep all your existing chat area code exactly as it was */}
        <div
          className={`absolute inset-y-0 right-0 z-10 w-full flex-col bg-white/5 transition-transform duration-300 md:relative md:flex md:translate-x-0 ${
            showMobileChat ? "translate-x-0" : "translate-x-full"
          } flex`}
        >
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex h-20 items-center justify-between border-b border-white/10 bg-lantern-blue-600 px-4 shadow-sm backdrop-blur-md md:px-8">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileChat(false)}
                    className="mr-1 rounded-full p-2 text-white/80 hover:bg-white/20 md:hidden"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-lantern-blue-600 to-blue-700 text-white font-bold shadow-lg ring-2 ring-white/20">
                    {activeConversation.type === "PERSONAL"
                      ? activeConversation.participants
                          .find((p) => p.user.id !== currentUser?.id)
                          ?.user.firstName?.slice(0, 2)
                          .toUpperCase()
                      : "G"}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white drop-shadow-sm">
                      {activeConversation.type === "PERSONAL"
                        ? activeConversation.participants.find(
                            (p) => p.user.id !== currentUser?.id,
                          )?.user.firstName || "Chat"
                        : activeConversation.name}
                    </h3>
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
                  const isMenuOpen = activeMenuId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      className={`relative flex flex-col ${
                        isMe ? "items-end" : "items-start"
                      } ${isMenuOpen ? "z-50" : "z-auto"} animate-in fade-in slide-in-from-bottom-2`}
                    >
                      <div
                        className={`relative max-w-[85%] md:max-w-[70%] rounded-2xl px-3 pt-3 pb-2 shadow-lg backdrop-blur-md group ${
                          !isMe
                            ? "bg-linear-to-br from-lantern-blue-600/50 to-blue-400/50 text-white rounded-tl-none border border-white/20"
                            : "bg-linear-to-br from-black/20 to-white/20 text-white rounded-br-none border border-white/10"
                        }`}
                      >
                        <p className="text-xs md:text-sm text-gray-100 font-bold mb-2 pr-7 opacity-80">
                          {msg.sender.firstName}
                          {isMe && " (You)"}
                        </p>
                        {!isDeleted && msg.replyTo && (
                          <div
                            className={`relative mb-2 rounded-lg border-l-4 p-2 text-xs opacity-80 ${
                              !isMe
                                ? "border-white/50 bg-black/10"
                                : "border-lantern-blue-600 bg-white/5"
                            }`}
                          >
                            <span className="font-bold text-grey-600">
                              {msg.replyTo?.sender?.firstName ||
                                getMessageById(msg.replyToId!)?.sender
                                  ?.username ||
                                "User"}
                              {msg.replyTo.senderId === currentUser?.id &&
                                " (You)"}
                            </span>
                            <p className="truncate">
                              {msg.replyTo.content || "Attachment"}
                            </p>
                          </div>
                        )}
                        {!isDeleted &&
                          msg.type !== "TEXT" &&
                          renderAttachment(msg)}
                        {!isDeleted && msg.content && msg.type === "TEXT" && (
                          <p className="text-[15px] leading-relaxed tracking-wide whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        )}
                        {msg.isDeleted && (
                          <p className="italic text-md opacity-60 flex items-center gap-2">
                            <Ban className="h-5 w-5" />{" "}
                            {isMe
                              ? "You deleted this message"
                              : "This message was deleted"}
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
                        {!isDeleted && (
                          <div className="absolute top-1 right-1 md:opacity-0 group-hover:opacity-100 transition-opacity message-menu-trigger">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(
                                  activeMenuId === msg.id ? null : msg.id,
                                );
                              }}
                              className="p-1 rounded-full hover:bg-black/50 text-white/90"
                            >
                              <ChevronDown className="h-6 w-6" />
                            </button>
                            {isMenuOpen && (
                              <div
                                className={`absolute top-9 ${
                                  isMe ? "right-0" : "left-0"
                                } z-100 bg-black/70 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-1 w-32 animate-in zoom-in-95 origin-top-right`}
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
                                    {msg.type !== "LOCATION" && (
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
                                    )}
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
                {(replyingTo || editingMessage) && (
                  <div className="absolute bottom-full left-0 right-0 mx-4 md:mx-8 mb-2 p-3 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-between text-white animate-in slide-in-from-bottom-2">
                    <div className="flex flex-col text-sm border-l-4 border-blue-300 pl-3">
                      <span className="font-bold text-blue-300 mb-0.5">
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
                    (editingMessage ?? replyingTo)
                      ? "ring-amber-400/50"
                      : "ring-white/10"
                  }`}
                >
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
                    {isAttachMenuOpen && (
                      <div className="attachment-menu absolute bottom-14 left-0 w-48 p-2 rounded-2xl bg-[#1c1c1c]/50 backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col gap-1 animate-in slide-in-from-bottom-2 fade-in zoom-in-95 origin-bottom-left z-50">
                        <button
                          onClick={() => {
                            handleSendLocation();
                            setIsAttachMenuOpen(false);
                          }}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/10 text-white/90 transition-colors group text-left w-full"
                        >
                          <div className="h-8 w-8 rounded-full bg-lantern-yellow-400/20 flex items-center justify-center text-lantern-yellow-400 group-hover:bg-lantern-yellow-400 group-hover:text-white transition-all">
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
                    onChange={handleFileUpload}
                  />

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
                          ? "bg-linear-to-r from-blue-300/50 to-lantern-blue-600/30 text-white"
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
                Welcome to Lantern Chat
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
