import { useEffect, useState, useCallback } from "react";
import ChatList from "./ChatList";
import SocketChatWindow from "./SocketChatWindow";
import { axiosGetAllGroup, AxiosAllGroup } from "../../store/chatStore";
import { FaBars, FaTimes } from "react-icons/fa";
import { useSocketStore } from "../../store/socketStore";

const ChatComponent: React.FC = () => {
  const { connect, disconnect } = useSocketStore();

  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [groups, setGroups] = useState<AxiosAllGroup[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const accessToken = localStorage.getItem("accessToken");

  // Fetch groups once
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const allGroups = await axiosGetAllGroup();
        if (allGroups.length > 0) {
          setGroups(allGroups);
          setActiveChatId(allGroups[0].group_id);
        }
      } catch (err) {
        console.error("Failed to fetch groups:", err);
      }
    };
    fetchGroups();
  }, []);

  // Connect socket when activeChatId changes
  useEffect(() => {
    if (!accessToken || activeChatId === null) return;

    connect(`${activeChatId}`, accessToken);

    return () => {
      disconnect();
    };
  }, [activeChatId, accessToken, connect, disconnect]);

  const handleSelectChat = useCallback((id: number) => {
    setActiveChatId(id);
    setIsSidebarOpen(false);
  }, []);

  const activeChat = groups.find((g) => g.group_id === activeChatId);

  if (!activeChatId || !activeChat) return null;

  return (
    <div className="relative bg-white dark:border-gray-800 dark:bg-white/[0.03] rounded-xl sm:p-4">
      <div className="w-full overflow-clip rounded-xl bg-white h-[80vh] dark:bg-white/[0.03] flex flex-col lg:flex-row relative">
        {/* Mobile Top Bar */}
        <div className="lg:hidden absolute h-17 p-2 flex justify-between items-center shadow-sm z-10">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-700">
            {isSidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        {/* Sidebar */}
        <div
          className={`absolute lg:relative top-17 lg:top-0 left-0 z-20 w-full lg:w-1/3 h-full transition-transform duration-300 transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <ChatList
            groups={groups}
            activeChatId={activeChatId}
            onSelectChat={handleSelectChat}
          />
        </div>

        {/* Main Chat Area */}
        <div className="w-full flex overflow-hidden bg-[url(/123.png)] bg-[length:25%] bg-repeat">
          <SocketChatWindow groupId={`${activeChatId}`} chatName={activeChat?.group_name} />
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
