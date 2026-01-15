import React, { useEffect, useRef, useState, useMemo } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useSocketStore } from "../../store/useSocketStore";
import { ChatService } from "../../services/chatService";
import { format } from "date-fns";
import {
  Send,
  Paperclip,
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
  Ban,
  BadgePlus,
  Download,
  CheckCheck,
  Edit2,
  Trash2,
  X,
  CornerUpLeft,
  Users,
  Plus,
  Settings,
} from "lucide-react";
import { User, Conversation, Message } from "../../types/chatTypes";
import toast from "react-hot-toast";

// --- Config ---
const BASE_URL = import.meta.env.VITE_FILE_URL || "http://localhost:5000";
const BG_IMAGE =
  "https://cdn.magicdecor.in/com/2024/05/09154244/TV-Unit-Luxury-Floral-Pattern-Wallpaper-Design.jpg";

const getFullUrl = (path: string | undefined) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${BASE_URL}${path}`;
};

// --- Types for Sidebar Items ---
type SidebarItem = {
  type: "CONVERSATION" | "USER";
  id: string; // Unique key for list
  data: Conversation | User;
  name: string;
  image: string;
  isGroup: boolean;
  status?: string;
  timestamp?: string;
  lastMessage?: string;
};

const GroupChatInterface = () => {
  const { socket, connect, disconnect } = useSocketStore();
  const {
    conversations,
    activeConversation,
    messages,
    currentUser,
    setConversations,
    setActiveConversation,
    setMessages,
    setCurrentUser,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    addOrUpdateConversation,
    removeConversation,
  } = useChatStore();

  // --- Local State ---
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);

  // Data State
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoadingSidebar, setIsLoadingSidebar] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Group Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // --- Initial Load ---
  useEffect(() => {
    const init = async () => {
      const storedUserId = localStorage.getItem("userId");
      const storedUsername = localStorage.getItem("username");
      const storedRole = localStorage.getItem("userRole");

      if (storedUserId) {
        setCurrentUser({
          id: Number(storedUserId),
          username: storedUsername || "User",
          email: "",
          role: { name: storedRole || "employee" },
        });
      }

      connect();

      try {
        const [convData, usersData] = await Promise.all([
          ChatService.getConversations(),
          ChatService.getAllUsers(),
        ]);
        setConversations(convData);
        setAllUsers(usersData);
      } catch (err) {
        console.error("Initialization error", err);
      } finally {
        setIsLoadingSidebar(false);
      }
    };

    init();
    return () => disconnect();
  }, []);

  // --- Sidebar Logic: Merging Conversations & Users ---
  const sidebarList = useMemo(() => {
    if (!currentUser) return [];

    const items: SidebarItem[] = [];
    const chattedUserIds = new Set<number>();

    // 1. Process Existing Conversations
    conversations.forEach((conv) => {
      let name = "Chat";
      let image = "";
      let isGroup = false;

      if (conv.type === "GROUP") {
        name = conv.name || "Group";
        image = `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff`;
        isGroup = true;
      } else {
        // Personal Chat
        const otherParticipant = conv.participants.find(
          (p) => p.user.id !== currentUser.id
        )?.user;
        if (otherParticipant) {
          chattedUserIds.add(otherParticipant.id);
          name = otherParticipant.username;
          image =
            otherParticipant.profileImageUrl ||
            `https://ui-avatars.com/api/?name=${name}&background=random`;
        }
      }

      items.push({
        type: "CONVERSATION",
        id: `conv-${conv.id}`,
        data: conv,
        name,
        image,
        isGroup,
        lastMessage:
          conv.messages?.[0]?.content ||
          (conv.messages?.[0]?.fileUrl ? "Attachment" : ""),
        timestamp: conv.messages?.[0]?.createdAt,
      });
    });

    // 2. Process Remaining Users (Potential Chats)
    allUsers.forEach((user) => {
      if (user.id !== currentUser.id && !chattedUserIds.has(user.id)) {
        items.push({
          type: "USER",
          id: `user-${user.id}`,
          data: user,
          name: user.username,
          image:
            user.profileImageUrl ||
            `https://ui-avatars.com/api/?name=${user.username}&background=random`,
          isGroup: false,
          status: "New Chat",
        });
      }
    });

    // 3. Filter by Search
    if (!searchTerm) return items;
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, allUsers, currentUser, searchTerm]);

  // --- Socket & Message Logic ---
  useEffect(() => {
    if (activeConversation && socket) {
      socket.emit("join_conversation", activeConversation.id);
      ChatService.getMessages(activeConversation.id).then(setMessages);
      setShowMobileChat(true);
      setReplyingTo(null);
      setEditingMessage(null);
    }
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showMobileChat, replyingTo]);

  // --- Actions ---

  const handleSidebarItemClick = async (item: SidebarItem) => {
    if (item.type === "CONVERSATION") {
      setActiveConversation(item.data as Conversation);
    } else {
      // It's a User, start a new chat
      try {
        const user = item.data as User;
        const newConv = await ChatService.startPersonalChat(user.id);
        addOrUpdateConversation(newConv); // Add to conversation list immediately
        setActiveConversation(newConv);
      } catch (err) {
        toast.error("Failed to start chat");
      }
    }
  };

  const handleSendMessage = () => {
    if (!input.trim() || !activeConversation || !currentUser || !socket) return;

    if (editingMessage) {
      socket.emit("edit_message", {
        messageId: editingMessage.id,
        newContent: input,
        conversationId: activeConversation.id,
      });
      setEditingMessage(null);
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

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast.error("Name and members required");
      return;
    }
    setIsCreatingGroup(true);
    try {
      const { group } = await ChatService.createGroup({
        name: groupName,
        participantIds: selectedUsers,
      });
      addOrUpdateConversation(group);
      setIsGroupModalOpen(false);
      setGroupName("");
      setSelectedUsers([]);
      toast.success("Group created!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create group");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!activeConversation || activeConversation.type !== "GROUP") return;
    if (!confirm("Are you sure? This will delete all messages.")) return;

    try {
      await ChatService.deleteGroup(activeConversation.id);
      removeConversation(activeConversation.id);
      toast.success("Group Deleted");
      setActiveConversation(null);
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation || !currentUser || !socket) return;

    try {
      setIsUploading(true);
      const { fileUrl, type } = await ChatService.uploadFile(file);

      let msgType = "DOCUMENT";
      if (type.startsWith("image/")) msgType = "IMAGE";
      if (type.startsWith("video/")) msgType = "VIDEO";

      socket.emit("send_message", {
        conversationId: activeConversation.id,
        senderId: currentUser.id,
        content: file.name,
        type: msgType,
        fileUrl: fileUrl,
      });
      setIsAttachMenuOpen(false);
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // --- Renderers ---
  const renderAttachment = (msg: Message) => {
    const fullUrl = getFullUrl(msg.fileUrl);
    if (msg.type === "IMAGE")
      return (
        <img
          src={fullUrl}
          alt="img"
          className="max-h-60 rounded-lg cursor-pointer hover:opacity-90 border border-white/20"
          onClick={() => window.open(fullUrl)}
        />
      );
    if (msg.type === "VIDEO")
      return (
        <video
          src={fullUrl}
          controls
          className="max-h-60 rounded-lg bg-black border border-white/20"
        />
      );
    return (
      <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg border border-white/10 hover:bg-white/20 transition">
        <FileText className="text-blue-300 w-8 h-8" />
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium text-white">
            {msg.content}
          </p>
          <p className="text-[10px] text-white/50 uppercase">Document</p>
        </div>
        <a
          href={fullUrl}
          target="_blank"
          className="p-2 hover:bg-white/10 rounded-full"
        >
          <Download className="w-5 h-5 text-white" />
        </a>
      </div>
    );
  };

  // --- Components ---
  const GroupModal = () => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#1a1a1a] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Create New Group</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white mt-1 focus:border-indigo-500 focus:bg-white/10 outline-none transition"
              placeholder="e.g. Marketing Team"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider">
              Select Members
            </label>
            <div className="mt-1 max-h-48 overflow-y-auto space-y-1 custom-scrollbar border border-white/10 rounded-xl p-2 bg-black/20">
              {allUsers
                .filter((u) => u.id !== currentUser?.id)
                .map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      if (selectedUsers.includes(user.id))
                        setSelectedUsers((prev) =>
                          prev.filter((id) => id !== user.id)
                        );
                      else setSelectedUsers((prev) => [...prev, user.id]);
                    }}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                      selectedUsers.includes(user.id)
                        ? "bg-indigo-600/30 border border-indigo-500/50"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border transition ${
                        selectedUsers.includes(user.id)
                          ? "bg-indigo-500 border-indigo-500"
                          : "border-white/30"
                      }`}
                    >
                      {selectedUsers.includes(user.id) && (
                        <CheckCheck className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-white/90 text-sm">
                      {user.username}
                    </span>
                  </div>
                ))}
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setIsGroupModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl bg-white/5 text-white hover:bg-white/10 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={isCreatingGroup}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition font-medium shadow-lg shadow-indigo-500/20"
            >
              {isCreatingGroup ? "Creating..." : "Create Group"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="relative flex h-screen w-full items-center justify-center bg-cover bg-center overflow-hidden font-sans"
      style={{ backgroundImage: `url(${BG_IMAGE})` }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {isGroupModalOpen && <GroupModal />}

      <div className="relative z-10 flex h-full w-full max-w-[1600px] overflow-hidden bg-white/10 shadow-2xl backdrop-blur-xl border-white/20 md:h-[90vh] md:w-[95%] md:rounded-3xl md:border transition-all">
        {/* --- Sidebar --- */}
        <div
          className={`absolute inset-y-0 left-0 z-20 w-full flex-col border-r border-white/20 bg-white/20 backdrop-blur-lg transition-transform duration-300 md:relative md:w-80 md:translate-x-0 ${
            showMobileChat ? "-translate-x-full" : "translate-x-0"
          } flex`}
        >
          <div className="flex h-20 items-center justify-between px-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white tracking-wide drop-shadow-md">
              Messages
            </h2>
            {/* Create Group Button */}
            {currentUser?.role?.name !== "employee" && (
              <button
                onClick={() => setIsGroupModalOpen(true)}
                className="p-2 rounded-full bg-white/10 hover:bg-indigo-500/20 text-white hover:text-indigo-300 transition border border-white/5"
              >
                <Users className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="px-6 py-4">
            <div className="relative group">
              <Search className="absolute left-3 top-3 h-5 w-5 text-white/60 group-focus-within:text-white transition-colors" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 py-2.5 pl-10 text-white placeholder-white/40 outline-none focus:bg-black/30 focus:border-white/20 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
            {isLoadingSidebar ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-white/50" />
              </div>
            ) : (
              sidebarList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSidebarItemClick(item)}
                  className={`group flex items-center gap-4 rounded-2xl p-3 cursor-pointer transition-all duration-200 ${
                    activeConversation?.id === (item.data as any).id &&
                    item.type === "CONVERSATION"
                      ? "bg-white/20 ring-1 ring-white/20 shadow-lg"
                      : "hover:bg-white/10"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={item.image}
                      alt="dp"
                      className="h-12 w-12 rounded-full object-cover border-2 border-white/30 shadow-sm"
                    />
                    {item.isGroup && (
                      <div className="absolute -bottom-1 -right-1 bg-indigo-500 rounded-full p-0.5 border-2 border-black">
                        <Users className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <h3 className="truncate font-semibold text-white text-[15px]">
                        {item.name}
                      </h3>
                      {item.timestamp && (
                        <span className="text-[10px] text-white/40">
                          {format(new Date(item.timestamp), "HH:mm")}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm text-white/60 group-hover:text-white/80 transition-colors">
                      {item.type === "USER"
                        ? "Start a new chat"
                        : item.lastMessage || "Start chatting..."}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- Chat Window --- */}
        <div
          className={`absolute inset-y-0 right-0 z-10 w-full flex-col bg-white/5 transition-transform duration-300 md:relative md:flex md:translate-x-0 ${
            showMobileChat ? "translate-x-0" : "translate-x-full"
          } flex`}
        >
          {activeConversation ? (
            <>
              {/* Header */}
              <div className="flex h-20 items-center justify-between border-b border-white/10 bg-white/10 px-6 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileChat(false)}
                    className="md:hidden text-white p-1 hover:bg-white/10 rounded-full"
                  >
                    <ArrowLeft />
                  </button>

                  {(() => {
                    // Dynamically get details for header
                    const isGroup = activeConversation.type === "GROUP";
                    const otherUser = !isGroup
                      ? activeConversation.participants.find(
                          (p) => p.user.id !== currentUser?.id
                        )?.user
                      : null;
                    const name = isGroup
                      ? activeConversation.name
                      : otherUser?.username;
                    const image = isGroup
                      ? `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff`
                      : otherUser?.profileImageUrl;

                    return (
                      <>
                        <img
                          src={image}
                          className="w-10 h-10 rounded-full border-2 border-white/30"
                          alt=""
                        />
                        <div>
                          <h3 className="text-lg font-bold text-white leading-tight">
                            {name}
                          </h3>
                          {isGroup ? (
                            <span className="text-xs text-white/60">
                              {activeConversation.participants.length} members
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-green-400 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>{" "}
                              Online
                            </span>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Group Actions */}
                {activeConversation.type === "GROUP" && (
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 hover:bg-white/10 rounded-full text-white/80 transition"
                      title="Group Info"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                    {(currentUser?.role?.name?.toLowerCase() === "admin" ||
                      currentUser?.role?.name?.toLowerCase() === "manager") && (
                      <button
                        onClick={handleDeleteGroup}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-full transition"
                        title="Delete Group"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.id;
                  const isDeleted = msg.isDeleted;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isMe ? "items-end" : "items-start"
                      } animate-in slide-in-from-bottom-2 duration-300`}
                    >
                      <div
                        className={`relative max-w-[80%] rounded-2xl p-3 shadow-lg group ${
                          isMe
                            ? "bg-indigo-600 text-white rounded-br-none"
                            : "bg-white/10 text-white rounded-bl-none border border-white/10"
                        }`}
                      >
                        {/* Group Sender Name */}
                        {activeConversation.type === "GROUP" && !isMe && (
                          <p className="text-[10px] text-orange-300 font-bold mb-1 opacity-80">
                            {msg.sender.username}
                          </p>
                        )}

                        {/* Reply Preview in Message */}
                        {msg.replyTo && (
                          <div className="mb-2 p-2 rounded-lg bg-black/20 text-xs border-l-2 border-white/50 opacity-80 flex flex-col">
                            <span className="font-bold text-indigo-300">
                              {msg.replyTo.sender?.username || "User"}
                            </span>
                            <span className="truncate">
                              {msg.replyTo.content || "Attachment"}
                            </span>
                          </div>
                        )}

                        {/* Content */}
                        {isDeleted ? (
                          <p className="italic text-sm opacity-60 flex items-center gap-2">
                            <Ban className="w-4 h-4" /> Message deleted
                          </p>
                        ) : (
                          <>
                            {msg.type !== "TEXT" && renderAttachment(msg)}
                            {msg.content && msg.type !== "LOCATION" && (
                              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                                {msg.content}
                              </p>
                            )}
                          </>
                        )}

                        {/* Footer */}
                        <div className="text-[10px] text-white/50 text-right mt-1 flex items-center justify-end gap-1">
                          {format(new Date(msg.createdAt), "HH:mm")}
                          {msg.isEdited && <span>(edited)</span>}
                          {isMe && (
                            <CheckCheck className="w-3 h-3 text-blue-200" />
                          )}
                        </div>

                        {/* Hover Menu */}
                        {!isDeleted && (
                          <div
                            className={`absolute top-2 ${
                              isMe ? "left-2" : "right-2"
                            } opacity-0 group-hover:opacity-100 transition-opacity`}
                          >
                            <button
                              onClick={() =>
                                setActiveMenuId(
                                  activeMenuId === msg.id ? null : msg.id
                                )
                              }
                              className="p-1 hover:bg-black/20 rounded-full"
                            >
                              <MoreVertical className="w-4 h-4 text-white/70" />
                            </button>
                            {activeMenuId === msg.id && (
                              <div className="absolute top-6 z-50 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl py-1 w-32 animate-in zoom-in-95">
                                <button
                                  onClick={() => {
                                    setReplyingTo(msg);
                                    setActiveMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-white/10"
                                >
                                  <CornerUpLeft className="w-3 h-3" /> Reply
                                </button>
                                {isMe && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditingMessage(msg);
                                        setActiveMenuId(null);
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-white/10"
                                    >
                                      <Edit2 className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                      onClick={() => {
                                        socket?.emit("delete_message", {
                                          messageId: msg.id,
                                          conversationId: activeConversation.id,
                                        });
                                        setActiveMenuId(null);
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-red-500/20 text-red-400"
                                    >
                                      <Trash2 className="w-3 h-3" /> Delete
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
              <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md relative">
                {/* Reply/Edit Banner */}
                {(replyingTo || editingMessage) && (
                  <div className="absolute bottom-full left-0 w-full bg-[#1a1a1a] p-3 border-t border-white/10 flex items-center justify-between animate-in slide-in-from-bottom-5">
                    <div className="flex flex-col border-l-4 border-indigo-500 pl-3">
                      <span className="text-xs text-indigo-400 font-bold">
                        {editingMessage
                          ? "Editing Message"
                          : `Replying to ${replyingTo?.sender.username}`}
                      </span>
                      <span className="text-sm text-white/70 truncate max-w-md">
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
                      className="p-1 hover:bg-white/10 rounded-full"
                    >
                      <X className="w-4 h-4 text-white/50" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-black/20 rounded-full p-1.5 border border-white/10">
                  {/* Attachment Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                      className={`p-2 rounded-full transition ${
                        isAttachMenuOpen
                          ? "bg-white/20 text-white rotate-45"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                    {isAttachMenuOpen && (
                      <div className="absolute bottom-14 left-0 bg-[#1c1c1c]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 w-44 shadow-2xl flex flex-col gap-1 animate-in zoom-in-95 origin-bottom-left">
                        <button
                          onClick={() => {
                            mediaInputRef.current?.click();
                            setIsAttachMenuOpen(false);
                          }}
                          className="flex items-center gap-3 p-3 hover:bg-white/10 rounded-xl text-white/90 text-sm transition"
                        >
                          <div className="p-1.5 bg-purple-500/20 rounded-lg text-purple-400">
                            <ImageIcon className="w-4 h-4" />
                          </div>{" "}
                          Photos & Video
                        </button>
                        <button
                          onClick={() => {
                            docInputRef.current?.click();
                            setIsAttachMenuOpen(false);
                          }}
                          className="flex items-center gap-3 p-3 hover:bg-white/10 rounded-xl text-white/90 text-sm transition"
                        >
                          <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400">
                            <FileText className="w-4 h-4" />
                          </div>{" "}
                          Document
                        </button>
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder={
                      editingMessage ? "Edit message..." : "Type a message..."
                    }
                    className="flex-1 bg-transparent outline-none text-white px-2 placeholder-white/30"
                  />

                  {isUploading ? (
                    <div className="p-2">
                      <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                    </div>
                  ) : (
                    <button
                      onClick={handleSendMessage}
                      disabled={!input.trim()}
                      className={`p-2 rounded-full transition ${
                        input.trim()
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                          : "bg-white/5 text-white/30"
                      }`}
                    >
                      <Send className="w-5 h-5 ml-0.5" />
                    </button>
                  )}

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
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 bg-white/5 backdrop-blur-sm">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-tr from-indigo-500/20 to-purple-500/20 ring-1 ring-white/20 shadow-2xl animate-pulse">
                <ImageIcon className="h-10 w-10 text-white/80" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-white drop-shadow-md">
                Welcome to Glass Chat
              </h3>
              <p className="max-w-xs text-white/60">
                Select a conversation or start a new one.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupChatInterface;
