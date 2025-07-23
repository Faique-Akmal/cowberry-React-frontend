import { useEffect, useState } from "react"
import ChatList from "./ChatList"
import ChatWindow from "./ChatWindow"
import {axiosGetAllGroup, AxiosAllGroup, axiosGetGroupMsg } from "../../store/chatStore"
// import ChatSocket from "./ChatSocket";
// import HamburgerSidebar from "../common/HamburgerSidebar";
// import ChatRoom from "./ChatRoom";
import { FaBars, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";

const ChatBox: React.FC = () => {
  const [activeChatId, setActiveChatId] = useState<number>(1);
  const [groups, setGroups] = useState<AxiosAllGroup[]>([]);
  const [allMsg, setAllMsg] = useState([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


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

  useEffect(()=>{

    ;(async()=>{
      
      if(activeChat){
        const toastId = toast.loading('Sending...');
        try {
          const groupMsg = await axiosGetGroupMsg(activeChat?.group_id);
          if(groupMsg.length > 0){
            setAllMsg(groupMsg)
          } else setAllMsg([]);
          toast.success("All messages are up to date.", {id:toastId});
        } catch (error) {
          console.error("Get message request error:", error);
          toast.error("Failed to fetch all messages.", {id: toastId});  
        }
      }
    })();

    // console.count("ChatBox rendered");
  },[activeChat])
  

  return (
    <div className="relative bg-white dark:border-gray-800 dark:bg-white/[0.03] rounded-xl sm:p-4">
      {/* <div className="mb-4 relative w-full h-full flex rounded-xl bg-[url(/123.png)] bg-size-[25%] bg-repeat">
        <HamburgerSidebar />
      </div> */}

      {/* <div className="mb-4 w-full flex rounded-xl overflow-hidden bg-[url(/123.png)] bg-size-[25%] bg-repeat">
        <ChatSocket groupId={activeChatId} allMsg={allMsg} />
      </div> */}
      {/* <div className="flex rounded-xl overflow-hidden bg-[url(/123.png)] bg-size-[25%] bg-repeat">
        <ChatList groups={groups} activeChatId={activeChatId} onSelectChat={setActiveChatId} />
        <ChatWindow group={activeChat} allMsg={allMsg} dispatch={setAllMsg} />
      </div> */}


      {/* with sidebar */}
      <div className="w-full overflow-clip rounded-xl bg-white h-[80vh] dark:bg-white/[0.03] flex flex-col md:flex-row relative">
        {/* Top Mobile Bar */}
        <div className="md:hidden absolute h-17 p-2 flex justify-between items-center shadow-sm z-10">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-xs text-gray-700"
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
    </div>
  );
};

export default ChatBox;
