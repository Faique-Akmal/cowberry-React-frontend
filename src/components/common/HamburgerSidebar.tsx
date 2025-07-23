import { useEffect, useState } from "react";
import ChatList from "../chat/ChatList";
import ChatWindow from "../chat/ChatWindow";
import {
  axiosGetAllGroup,
  AxiosAllGroup,
  axiosGetGroupMsg,
} from "../../store/chatStore";
import { FaBars, FaTimes } from "react-icons/fa";

const HamburgerSidebar: React.FC = () => {
  const [activeChatId, setActiveChatId] = useState<number>(1);
  const [groups, setGroups] = useState<AxiosAllGroup[]>([]);
  const [allMsg, setAllMsg] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const allGroups = await axiosGetAllGroup();
      if (allGroups.length > 0) {
        setGroups(allGroups);
        setActiveChatId(allGroups[0]?.group_id);
      }
    })();
  }, []);

  const activeChat = groups.find((group) => group.group_id === activeChatId)!;

  useEffect(() => {
    (async () => {
      if (activeChat) {
        const groupMsg = await axiosGetGroupMsg(activeChat.group_id);
        setAllMsg(groupMsg.length > 0 ? groupMsg : []);
      }
    })();
  }, [activeChat]);

  return (
    <div className="w-full overflow-clip rounded-xl bg-white h-[80vh] dark:bg-white/[0.03] flex flex-col md:flex-row relative">
      {/* Top Mobile Bar */}
      <div className="md:hidden absolute h-17 p-2 flex justify-between items-center shadow-sm  z-10">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-gray-800"
        >
          {isSidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`absolute md:relative top-17 left-0 sm:top-0 z-40 w-full sm:w-1/3 h-full text-white transition-transform duration-300 transform
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:flex md:flex-col`}
      >
          <ChatList
            groups={groups}
            activeChatId={activeChatId}
            onSelectChat={(id) => {
              setActiveChatId(id);
              setIsSidebarOpen(false); // close sidebar on select (mobile)
            }}
          />
      </div>

      {/* Main Chat Area */}
      <div className="w-full flex overflow-hidden bg-[url(/123.png)] bg-size-[25%] bg-repeat">
        <ChatWindow group={activeChat} allMsg={allMsg} dispatch={setAllMsg} />
      </div>
    </div>
  );
};

export default HamburgerSidebar;
