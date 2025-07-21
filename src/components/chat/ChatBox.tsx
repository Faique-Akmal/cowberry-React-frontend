import { useEffect, useState } from "react"
import ChatList from "./ChatList"
import ChatWindow from "./ChatWindow"
import {axiosGetAllGroup, AxiosAllGroup, axiosGetGroupMsg } from "../../store/chatStore"
import ChatSocket from "./ChatSocket";
// import ChatRoom from "./ChatRoom";

const ChatBox: React.FC = () => {
  const [activeChatId, setActiveChatId] = useState<number>(1);
  const [groups, setGroups] = useState<AxiosAllGroup[]>([]);
  const [allMsg, setAllMsg] = useState([]);

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
        const groupMsg = await axiosGetGroupMsg(activeChat?.group_id);
        if(groupMsg.length > 0){
          setAllMsg(groupMsg)
        } else setAllMsg([]);
      }
    })();

  },[activeChat])
  
  // console.count("ChatBox rendered");

  return (
     <div className="bg-white dark:border-gray-800 dark:bg-white/[0.03] rounded-xl sm:p-4">
      <div className="mb-4 w-full flex rounded-xl overflow-hidden bg-[url(/123.png)] bg-size-[25%] bg-repeat">
        <ChatSocket groupId={activeChatId} allMsg={allMsg} />
      </div>
      <div className="flex rounded-xl overflow-hidden bg-[url(/123.png)] bg-size-[25%] bg-repeat">
        <ChatList groups={groups} activeChatId={activeChatId} onSelectChat={setActiveChatId} />
        <ChatWindow group={activeChat} allMsg={allMsg} dispatch={setAllMsg} />
      </div>
    </div>
  );
};

export default ChatBox;
