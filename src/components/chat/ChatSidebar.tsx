import { useMemo } from "react";
import { Search, Users, Loader2 } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { ChatService } from "../../services/chatService";
import { User, Conversation } from "../../types/chatTypes";
import { format } from "date-fns";

interface Props {
  allUsers: User[];
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  onOpenGroupModal: () => void;
  showMobile: boolean;
  isLoading: boolean;
}

type SidebarItem = {
  type: "CONVERSATION" | "USER";
  id: string;
  data: Conversation | User;
  name: string;
  image: string;
  isGroup: boolean;
  status?: string;
  timestamp?: string;
  lastMsg?: string;
  time?: string | null;
};

export const Sidebar = ({
  allUsers,
  searchTerm,
  setSearchTerm,
  onOpenGroupModal,
  showMobile,
  isLoading,
}: Props) => {
  const {
    conversations,
    currentUser,
    activeConversation,
    setActiveConversation,
    addOrUpdateConversation,
  } = useChatStore();

  const sidebarList = useMemo(() => {
    if (!currentUser) return [];
    const items: SidebarItem[] = [];
    const chattedIds = new Set<number>();

    // 1. Conversations
    conversations.forEach((conv) => {
      let name = "Chat",
        image = "",
        isGroup = false;
      if (conv.type === "GROUP") {
        name = conv?.name || "Group";
        image = `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff`;
        isGroup = true;
      } else {
        const other = conv.participants.find(
          (p) => p.user.id !== currentUser.id
        )?.user;
        if (other) {
          chattedIds.add(other.id);
          name = other.username;
          image = `https://ui-avatars.com/api/?name=${name}&background=random`;
        }
      }
      items.push({
        type: "CONVERSATION",
        id: `conv-${conv.id}`,
        data: conv,
        name,
        image,
        isGroup,
        lastMsg: conv.messages?.[0]?.content || "Start chatting...",
        time: conv.messages?.[0]?.createdAt,
      });
    });

    // 2. Users
    allUsers.forEach((user) => {
      if (user.id !== currentUser.id && !chattedIds.has(user.id)) {
        items.push({
          type: "USER",
          id: `user-${user.id}`,
          data: user,
          name: user.username,
          image:
            user.profileImageUrl ||
            `https://ui-avatars.com/api/?name=${user?.username}&background=random`,
          isGroup: false,
          lastMsg: "New Chat",
          time: null,
        });
      }
    });

    return searchTerm
      ? items.filter((i) =>
          i.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : items;
  }, [conversations, allUsers, currentUser, searchTerm]);

  const handleClick = async (item: SidebarItem) => {
    if (item.type === "CONVERSATION") {
      setActiveConversation(item.data as Conversation);
    } else {
      try {
        const newConv = await ChatService.startPersonalChat(item.data.id);
        addOrUpdateConversation(newConv);
        setActiveConversation(newConv);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div
      className={`absolute inset-y-0 left-0 z-20 w-full flex-col border-r border-white/20 bg-white/20 backdrop-blur-lg transition-transform duration-300 md:relative md:w-80 md:translate-x-0 ${
        showMobile ? "-translate-x-full" : "translate-x-0"
      } flex`}
    >
      <div className="flex h-20 items-center justify-between px-6 border-b border-white/10">
        <h2 className="text-2xl font-bold text-white tracking-wide drop-shadow-md">
          Messages
        </h2>
        {currentUser?.role?.name?.toLowerCase() !== "employee" && (
          <button
            onClick={onOpenGroupModal}
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
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        ) : (
          sidebarList.map((item) => (
            <div
              key={item.id}
              onClick={() => handleClick(item)}
              className={`group flex items-center gap-4 rounded-2xl p-3 cursor-pointer transition-all duration-200 ${
                activeConversation?.id === item.data.id &&
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
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-lime-400">
                    <Users className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-baseline">
                  <h3 className="truncate font-semibold text-white text-[15px]">
                    {item.name}
                  </h3>
                  {item.time && (
                    <span className="text-[10px] text-white/40">
                      {format(new Date(item.time), "HH:mm")}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-white/60 group-hover:text-white/80 transition-colors">
                  {item.lastMsg}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
