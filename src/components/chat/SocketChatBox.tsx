import { useEffect, useState } from "react"
import ChatList from "./ChatList"
import SocketChatWindow from "./SocketChatWindow"
import {axiosGetAllGroup, AxiosAllGroup } from "../../store/chatStore"
import { FaBars, FaTimes } from "react-icons/fa";
import { useSocketStore } from "../../store/socketStore";
// import toast from "react-hot-toast";

const SocketChatBox: React.FC = () => {
    const { connect, disconnect } = useSocketStore();
  
  const [activeChatId, setActiveChatId] = useState<number>(1);
  const [groups, setGroups] = useState<AxiosAllGroup[]>([]);

  const accessToken = localStorage.getItem('accessToken');


  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
      connect(`${activeChatId}`, accessToken!)
  
      return () => {
        disconnect()
      }
    }, [activeChatId, accessToken, connect])

  useEffect(() => {
      ;(async ()=>{
        const allGroups = await axiosGetAllGroup();

        if(allGroups.length > 0){
          setGroups(allGroups);
          
          const firstGroupId = allGroups[0]?.group_id;
          setActiveChatId(firstGroupId)
        }
      }
      )();
  
    }, []);

  const activeChat = groups.find((group) => group.group_id === activeChatId)!  

  return (
    <div className="relative bg-white dark:border-gray-800 dark:bg-white/[0.03] rounded-xl sm:p-4">
      {/* with sidebar */}
      <div className="w-full overflow-clip rounded-xl bg-white h-[80vh] dark:bg-white/[0.03] flex flex-col lg:flex-row relative">
        {/* Top Mobile Bar */}
        <div className="lg:hidden absolute h-17 p-2 flex justify-between items-center shadow-sm z-10">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-xs text-gray-700"
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
              activeChatId={activeChatId}
              onSelectChat={(id) => {
                setActiveChatId(id);
                setIsSidebarOpen(false); // close sidebar on select (mobile)
              }}
            />
        </div>

        {/* Main Chat Area */}
        <div className="w-full flex overflow-hidden bg-[url(/123.png)] bg-size-[25%] bg-repeat">
          <SocketChatWindow groupId={`${activeChatId}`} chatName={activeChat?.group_name} />
        </div>
      </div>
    </div>
  );
};

export default SocketChatBox;
