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
import { User, Conversation } from "../../types/chatTypes";
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

// --- Helper: Get Chat Name & Image ---
const getChatDetails = (conversation: Conversation, currentUserId?: number) => {
  if (conversation.type === "GROUP") {
    return {
      name: conversation.name || "Group Chat",
      image: `https://ui-avatars.com/api/?name=${conversation.name}&background=6366f1&color=fff`,
      isGroup: true,
    };
  }
  // Personal Chat: Find other participant
  const otherUser = conversation.participants.find(
    (p) => p.user.id !== currentUserId
  )?.user;
  return {
    name: otherUser?.username || "Unknown",
    image:
      otherUser?.profileImageUrl ||
      `https://ui-avatars.com/api/?name=${otherUser?.firstName}+${otherUser?.lastName}&background=random`,
    isGroup: false,
    status: "Online", // Placeholder
  };
};

export const ChatInterface = () => {
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
    addConversation,
  } = useChatStore();

  // --- Local State ---
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null); // Message menu
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);

  // --- Group Creation/Edit Modal State ---
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // --- Refs ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // --- Initial Load ---
  useEffect(() => {
    // Load User from LocalStorage (Mock Auth)
    const storedUserId = localStorage.getItem("userId");
    const storedUsername = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role"); // Store role too

    if (storedUserId) {
      setCurrentUser({
        id: Number(storedUserId),
        username: storedUsername || "User",
        email: "",
        role: storedRole || "employee",
      });
    }

    connect();
    fetchConversations();
    fetchAllUsers(); // For group creation list

    return () => disconnect();
  }, []);

  const fetchConversations = async () => {
    try {
      const data = await ChatService.getConversations();
      setConversations(data);
    } catch (err) {
      console.error("Load chats error", err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const data = await ChatService.getAllUsers();
      setAllUsers(data);
    } catch (err) {
      console.error("Load users error", err);
    }
  };

  // --- Socket Events Logic ---
  useEffect(() => {
    if (activeConversation && socket) {
      socket.emit("join_conversation", activeConversation.id);
      ChatService.getMessages(activeConversation.id).then(setMessages);
      setShowMobileChat(true);
      setReplyingTo(null);
      setEditingMessage(null);
    }
  }, [activeConversation]);

  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showMobileChat, replyingTo]);

  // --- Actions ---

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
      addConversation(group);
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
      toast.success("Group Deleted");
      setActiveConversation(null);
      fetchConversations(); // Refresh list
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
          className="max-h-60 rounded-lg cursor-pointer hover:opacity-90"
          onClick={() => window.open(fullUrl)}
        />
      );
    if (msg.type === "VIDEO")
      return (
        <video
          src={fullUrl}
          controls
          className="max-h-60 rounded-lg bg-black"
        />
      );
    return (
      <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg border border-white/10">
        <FileText className="text-blue-300" />
        <div className="flex-1 truncate text-sm">{msg.content}</div>
        <a
          href={fullUrl}
          target="_blank"
          className="p-1 hover:bg-white/10 rounded"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    );
  };

  // --- Group Modal UI ---
  const GroupModal = () => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a1a] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Create New Group</h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/60 uppercase font-bold">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white mt-1 focus:border-indigo-500 outline-none"
              placeholder="e.g. Marketing Team"
            />
          </div>

          <div>
            <label className="text-xs text-white/60 uppercase font-bold">
              Select Members
            </label>
            <div className="mt-1 max-h-48 overflow-y-auto space-y-1 custom-scrollbar border border-white/10 rounded-lg p-2">
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
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
                      selectedUsers.includes(user.id)
                        ? "bg-indigo-600/30 border border-indigo-500/50"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
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
              className="flex-1 py-2.5 rounded-xl bg-white/5 text-white hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={isCreatingGroup}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition font-medium"
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

      <div className="relative z-10 flex h-full w-full max-w-[1600px] overflow-hidden bg-white/10 shadow-2xl backdrop-blur-xl border-white/20 md:h-[90vh] md:w-[95%] md:rounded-3xl md:border">
        {/* --- Sidebar --- */}
        <div
          className={`absolute inset-y-0 left-0 z-20 w-full flex-col border-r border-white/20 bg-white/20 backdrop-blur-lg transition-transform duration-300 md:relative md:w-80 md:translate-x-0 ${
            showMobileChat ? "-translate-x-full" : "translate-x-0"
          } flex`}
        >
          <div className="flex h-20 items-center justify-between px-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white tracking-wide">
              Messages
            </h2>
            {/* Create Group Button (Only for admins/managers ideally, but showing for UI) */}
            <button
              onClick={() => setIsGroupModalOpen(true)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              <Users className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-4">
            {/* Search Logic Here */}
            <div className="relative group">
              <Search className="absolute left-3 top-3 h-5 w-5 text-white/60" />
              <input
                type="text"
                placeholder="Search chats..."
                className="w-full rounded-2xl border border-white/10 bg-black/20 py-2.5 pl-10 text-white placeholder-white/40 outline-none focus:bg-black/30"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
            {conversations.map((chat) => {
              const { name, image, isGroup } = getChatDetails(
                chat,
                currentUser?.id
              );
              return (
                <div
                  key={chat.id}
                  onClick={() => setActiveConversation(chat)}
                  className={`group flex items-center gap-4 rounded-2xl p-3 cursor-pointer transition-all ${
                    activeConversation?.id === chat.id
                      ? "bg-white/20 ring-1 ring-white/20"
                      : "hover:bg-white/10"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={image}
                      alt="dp"
                      className="h-12 w-12 rounded-full object-cover border-2 border-white/30"
                    />
                    {isGroup && (
                      <div className="absolute -bottom-1 -right-1 bg-indigo-500 rounded-full p-0.5 border-2 border-black">
                        <Users className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="truncate font-semibold text-white">
                      {name}
                    </h3>
                    <p className="truncate text-sm text-white/60">
                      {chat.messages?.[0]?.type === "TEXT"
                        ? chat.messages[0].content
                        : chat.messages?.[0]
                        ? "Attachment"
                        : "Start chatting..."}
                    </p>
                  </div>
                </div>
              );
            })}
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
                    className="md:hidden text-white"
                  >
                    <ArrowLeft />
                  </button>

                  <img
                    src={
                      getChatDetails(activeConversation, currentUser?.id).image
                    }
                    className="w-10 h-10 rounded-full border border-white/30"
                    alt=""
                  />

                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {getChatDetails(activeConversation, currentUser?.id).name}
                    </h3>
                    {activeConversation.type === "GROUP" && (
                      <span className="text-xs text-white/60">
                        {activeConversation.participants.length} members
                      </span>
                    )}
                  </div>
                </div>

                {/* Group Actions (Edit/Delete) */}
                {activeConversation.type === "GROUP" && (
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 hover:bg-white/10 rounded-full text-white/80"
                      title="Group Info"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                    {/* Only Admin should see delete (Logic handled in backend, UI can hide too) */}
                    <button
                      onClick={handleDeleteGroup}
                      className="p-2 hover:bg-red-500/20 text-red-400 rounded-full"
                      title="Delete Group"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isMe ? "items-end" : "items-start"
                      } animate-in slide-in-from-bottom-2`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-3 shadow-lg ${
                          isMe
                            ? "bg-indigo-600 text-white rounded-br-none"
                            : "bg-white/10 text-white rounded-bl-none border border-white/10"
                        }`}
                      >
                        {/* Sender Name in Group */}
                        {activeConversation.type === "GROUP" && !isMe && (
                          <p className="text-[10px] text-orange-300 font-bold mb-1">
                            {msg.sender.username}
                          </p>
                        )}

                        {msg.replyTo && (
                          <div className="mb-2 p-2 rounded bg-black/20 text-xs border-l-2 border-white/50 opacity-80">
                            Replying to: {msg.replyTo.content || "Attachment"}
                          </div>
                        )}

                        {msg.type !== "TEXT" && renderAttachment(msg)}
                        {msg.type === "TEXT" && <p>{msg.content}</p>}

                        <div className="text-[10px] text-white/50 text-right mt-1">
                          {format(new Date(msg.createdAt), "HH:mm")}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md">
                {/* Reply Preview Banner */}
                {replyingTo && (
                  <div className="flex items-center justify-between bg-black/40 p-2 rounded-t-lg border-b border-white/10 mb-2">
                    <div className="text-sm text-white/80 pl-2 border-l-2 border-indigo-500">
                      Replying to{" "}
                      <span className="font-bold">
                        {replyingTo.sender.username}
                      </span>
                    </div>
                    <button onClick={() => setReplyingTo(null)}>
                      <X className="w-4 h-4 text-white/60" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-black/20 rounded-full p-1.5 border border-white/10">
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
                      <div className="absolute bottom-12 left-0 bg-[#1c1c1c] border border-white/10 rounded-xl p-2 w-40 shadow-2xl flex flex-col gap-1 animate-in zoom-in-95">
                        <button
                          onClick={() => {
                            mediaInputRef.current?.click();
                            setIsAttachMenuOpen(false);
                          }}
                          className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg text-white/80 text-sm"
                        >
                          <ImageIcon className="w-4 h-4 text-purple-400" />{" "}
                          Photos
                        </button>
                        <button
                          onClick={() => {
                            docInputRef.current?.click();
                            setIsAttachMenuOpen(false);
                          }}
                          className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg text-white/80 text-sm"
                        >
                          <FileText className="w-4 h-4 text-blue-400" />{" "}
                          Documents
                        </button>
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent outline-none text-white px-2"
                  />

                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim()}
                    className={`p-2 rounded-full ${
                      input.trim()
                        ? "bg-indigo-600 text-white"
                        : "bg-white/5 text-white/30"
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>

                  {/* Hidden Inputs */}
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
            <div className="flex items-center justify-center h-full text-white/50">
              Select a chat to start
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
