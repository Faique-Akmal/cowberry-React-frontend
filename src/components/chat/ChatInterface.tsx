import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useSocketStore } from "../../store/useSocketStore";
import { ChatService } from "../../services/chatService";
import { Image as ImageIcon } from "lucide-react";
import { User } from "../../types/chatTypes";

// Sub-components
import { Sidebar } from "./ChatSidebar";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import MessageBubble from "./MessageBubble";
import { CreateGroupModal } from "./CreateGroupModal";

const BG_IMAGE =
  "https://cdn.magicdecor.in/com/2024/05/09154244/TV-Unit-Luxury-Floral-Pattern-Wallpaper-Design.jpg";

const ChatInterface = () => {
  const { socket, connect, disconnect } = useSocketStore();
  const {
    setConversations,
    setMessages,
    setCurrentUser,
    activeConversation,
    messages,
    currentUser,
  } = useChatStore();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoadingSidebar, setIsLoadingSidebar] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Initial Data Load ---
  useEffect(() => {
    const init = async () => {
      const storedUserId = localStorage.getItem("userId");
      const storedUsername = localStorage.getItem("username");
      const storedEmail = localStorage.getItem("email");
      const storedRole = localStorage.getItem("userRole");

      if (storedUserId) {
        setCurrentUser({
          id: Number(storedUserId),
          username: storedUsername || "User",
          email: storedEmail!,
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
        console.error(err);
      } finally {
        setIsLoadingSidebar(false);
      }
    };

    init();
    return () => disconnect();
  }, []);

  // --- Socket: Active Chat Management ---
  useEffect(() => {
    if (activeConversation && socket) {
      socket.emit("join_conversation", activeConversation.id);
      ChatService.getMessages(activeConversation.id).then(setMessages);
      setShowMobileChat(true);
    }
  }, [activeConversation]);

  // --- Auto Scroll ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showMobileChat]);

  const handleDeleteMessage = (id: number) => {
    socket?.emit("delete_message", {
      messageId: id,
      conversationId: activeConversation?.id,
    });
  };

  return (
    <div
      className="relative flex h-screen w-full items-center justify-center bg-cover bg-center overflow-hidden font-sans"
      style={{ backgroundImage: `url(${BG_IMAGE})` }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {isGroupModalOpen && (
        <CreateGroupModal
          users={allUsers}
          onClose={() => setIsGroupModalOpen(false)}
        />
      )}

      <div className="relative z-10 flex h-full w-full max-w-[1600px] overflow-hidden bg-white/10 shadow-2xl backdrop-blur-xl border-white/20 md:h-[90vh] md:w-[95%] md:rounded-3xl md:border transition-all">
        <Sidebar
          allUsers={allUsers}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isLoading={isLoadingSidebar}
          showMobile={showMobileChat}
          onOpenGroupModal={() => setIsGroupModalOpen(true)}
        />

        {/* --- Chat Window --- */}
        <div
          className={`absolute inset-y-0 right-0 z-10 w-full flex-col bg-white/5 transition-transform duration-300 md:relative md:flex md:translate-x-0 ${
            showMobileChat ? "translate-x-0" : "translate-x-full"
          } flex`}
        >
          {activeConversation ? (
            <>
              <ChatHeader onBack={() => setShowMobileChat(false)} />

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isMe={msg.senderId === currentUser?.id}
                    onDelete={handleDeleteMessage}
                    isGroup={activeConversation.type === "GROUP"}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              <ChatInput />
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

export default ChatInterface;
