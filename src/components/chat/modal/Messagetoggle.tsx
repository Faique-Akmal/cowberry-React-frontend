import { useCallback, useEffect, useState } from "react";
import { axiosGetAllGroup, AxiosAllGroup } from "../../../store/chatStore";
import { FaBars, FaTimes } from "react-icons/fa";
import { useMessageStore } from "../../../store/messageStore";
import ChatList from "../ChatList";

import { ActiveChatInfo } from "../../../types/chat";
import { useSocketStore } from "../../../store/socketStore";
import SocketChatWindow from "../SocketChatWindow";

const MessageToggle: React.FC = () => {
  const { connect, disconnect } = useSocketStore();
  const { clearMessages } = useMessageStore();
  const [activeChatInfo, setActiveChatInfo] = useState<ActiveChatInfo | null>(null);
  const [groups, setGroups] = useState<AxiosAllGroup[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const accessToken = localStorage.getItem("accessToken");

  // Fetch groups once
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const allGroups = await axiosGetAllGroup();
        if (allGroups?.length > 0) {
          setGroups(allGroups);
          setActiveChatInfo({
            chatId: allGroups[0]?.group_id,
            chatType: "group",
            chatName: allGroups[0]?.group_name,
          });
        }
      } catch (err) {
        console.error("Failed to fetch groups:", err);
      }
    };
    fetchGroups();
  }, []);

  // Connect socket when activeChat changes
  useEffect(() => {
    if (!accessToken || activeChatInfo === null) return;

    clearMessages();
    disconnect();
    connect(activeChatInfo!, accessToken!);

    return () => {
      disconnect();
    };
  }, [activeChatInfo]);

  const handleSelectChat = useCallback((chatInfo: ActiveChatInfo) => {
    setActiveChatInfo(chatInfo);
    setIsSidebarOpen(false);
  }, []);

  const activeChat = groups.find(
    (group) => group.group_id === activeChatInfo?.chatId
  );

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-t-xl h-[400px] flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-gray-600 dark:text-gray-300 hover:text-blue-600"
        >
          {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {activeChatInfo?.chatName || "Select a chat"}
        </h2>
      </div>

      <div className="flex flex-1 relative overflow-hidden">
        {/* Sidebar with ChatList */}
        {isSidebarOpen && (
          <div className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-20 shadow-lg overflow-y-auto">
            <ChatList
              groups={groups}
              activeChatInfo={activeChatInfo!}
              onSelectChat={handleSelectChat}
            />
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 overflow-hidden">
          {activeChatInfo && activeChat ? (
            <SocketChatWindow
              activeChatInfo={activeChatInfo}
              groupMembers={activeChat?.members}
            />
          ) :
           (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a chat to start messaging
            </div>
          )
          }
        </div>
      </div>
    </div>
  );
};

export default MessageToggle;
