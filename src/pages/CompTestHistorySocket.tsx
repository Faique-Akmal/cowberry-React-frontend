// import { useEffect, useState } from "react";
// import {axiosGetAllGroup, AxiosAllGroup, axiosGetGroupMsg, AxiosGetGroupMsg } from "../store/chatStore";

// import toast from "react-hot-toast";
// import ChatSocket from "../components/chat/ChatSocket";
import SocketChatWindow from "../components/chat-old/SocketChatWindow";

const CompTest: React.FC = () => {
  // const [activeChatId, setActiveChatId] = useState<number>(1);
  // const [groups, setGroups] = useState<AxiosAllGroup[]>([]);
  // const [allMsg, setAllMsg] = useState<AxiosGetGroupMsg[]>([]);

  // useEffect(() => {
  //     ;(async ()=>{
  //       const allGroups = await axiosGetAllGroup();

  //       if(allGroups.length > 0){
  //         setGroups(allGroups);

  //         const firstGroupId = allGroups[0]?.group_id;
  //         setActiveChatId(firstGroupId)
  //       }
  //     }
  //     )();

  //   }, []);

  // const activeChat = groups.find((group) => group.group_id === activeChatId)!

  // useEffect(()=>{

  //   ;(async()=>{

  //     if(activeChat){
  //       const toastId = toast.loading('Sending...');
  //       try {
  //         const groupMsg = await axiosGetGroupMsg(activeChat?.group_id);
  //         if(groupMsg.length > 0){
  //           setAllMsg(groupMsg)
  //         } else setAllMsg([]);
  //         toast.success("All messages are up to date.", {id:toastId});
  //       } catch (error) {
  //         console.error("Get message request error:", error);
  //         toast.error("Failed to fetch all messages.", {id: toastId});
  //       }
  //     }
  //   })();

  //   // console.count("ChatBox rendered");
  // },[activeChat])

  return (
    <div className="relative bg-white dark:border-gray-800 dark:bg-white/[0.03] rounded-xl sm:p-4">
      <div className="mb-4 w-full flex rounded-xl overflow-hidden bg-[url(/123.png)] bg-size-[25%] bg-repeat">
        <SocketChatWindow groupId={"1"} />
      </div>
    </div>
  );
};

export default CompTest;
