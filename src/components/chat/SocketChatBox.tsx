import { useCallback, useEffect, useState } from "react";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
// import SocketChatWindow from "./SocketChatWindow";
import { axiosGetAllGroup, AxiosAllGroup } from "../../store/chatStore";
import { FaBars, FaTimes } from "react-icons/fa";
import { useSocketStore } from "../../store/socketStore";
import { ActiveChatInfo } from "../../types/chat";
import { useMessageStore } from "../../store/messageStore";


const SocketChatBox: React.FC = () => {
  const { connect, disconnect } = useSocketStore();
  const { clearMessages } = useMessageStore();
  const [activeChatInfo, setActiveChatInfo] = useState<ActiveChatInfo | null>(null);
  const [groups, setGroups] = useState<AxiosAllGroup[]>([]);

  const accessToken = localStorage.getItem('accessToken');


  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch groups once
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const allGroups = await axiosGetAllGroup();
        if (allGroups?.length > 0) {
          setGroups(allGroups);
          setActiveChatInfo({ chatId: allGroups[0]?.group_id, chatType: "group", chatName: allGroups[0]?.group_name });
        }
      } catch (err) {
        console.error("Failed to fetch groups:", err);
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    if (!accessToken || activeChatInfo === null) return;
    // cler all previous messages
    clearMessages();

    // Disconnect current connection before creating new one
    disconnect();
    connect(activeChatInfo!, accessToken!);

    return () => {
      disconnect(); // clean up on unmount or before next connect
    };
  }, [activeChatInfo]);

  const handleSelectChat = useCallback((chatInfo: ActiveChatInfo) => {
    setActiveChatInfo(chatInfo);
    setIsSidebarOpen(false);
  }, []);

  const activeChat = groups.find((group) => group.group_id === activeChatInfo?.chatId)!

  return (
    <div className="relative bg-white dark:border-gray-800 dark:bg-white/[0.03] rounded-xl sm:p-4">
      {/* with sidebar */}
      <div className="w-full overflow-clip rounded-xl bg-white h-[80vh] dark:bg-white/[0.03] flex flex-col lg:flex-row relative">
        {/* Top Mobile Bar */}
        <div className="lg:hidden absolute h-17 p-2 flex justify-between items-center shadow-sm z-10">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-xs text-dashboard-brown-200"
          >
            {isSidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        {/* Sidebar */}
        <div
          className={`absolute lg:relative top-17 left-0 lg:top-0 z-3 w-full lg:w-1/3 h-full text-white transition-transform duration-300 transform
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:flex lg:flex-col`}
        >
          <ChatList
            groups={groups}
            activeChatInfo={activeChatInfo!}
            onSelectChat={handleSelectChat}
          />
        </div>

        {/* Main Chat Area */}
        <div className="w-full flex overflow-hidden bg-[url(/123.png)] bg-size-[25%] bg-repeat">
          <ChatWindow activeChatInfo={activeChatInfo!} groupMembers={activeChat?.members} />
          {/* <SocketChatWindow activeChatInfo={activeChatInfo!} groupMembers={activeChat?.members} /> */}
        </div>
      </div>
    </div>
  );
};

export default SocketChatBox;
