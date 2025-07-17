import { useEffect, useState } from "react"
import ChatList from "./ChatList"
import ChatWindow from "./ChatWindow"
import {axiosGetAllGroup, AxiosAllGroup} from "../../store/chatStore"

// const initialChats: Chat[] = [
//   {
//     id: 1,
//     name: "John Doe",
//     messages: [
//       { id: 1, sender: "them", text: "Hello!", timestamp: "10:00 AM" },
//       { id: 2, sender: "me", text: "Hi John!", timestamp: "10:01 AM" },
//     ],
//   },
//   {
//     id: 2,
//     name: "Jane Smith",
//     messages: [
//       { id: 1, sender: "them", text: "Hello!", timestamp: "10:00 AM" },
//       { id: 2, sender: "me", text: "Hi John!", timestamp: "10:01 AM" },
//       { id: 3, sender: "them", text: "How are you?", timestamp: "10:02 AM" },
//       { id: 4, sender: "me", text: "I'm good, thanks! You?", timestamp: "10:03 AM" },
//       { id: 5, sender: "them", text: "Doing great.", timestamp: "10:04 AM" },
//       { id: 6, sender: "me", text: "Want to meet up later?", timestamp: "10:05 AM" },
//       { id: 7, sender: "them", text: "Sure, what time?", timestamp: "10:06 AM" },
//       { id: 8, sender: "me", text: "Around 5 PM works?", timestamp: "10:07 AM" },
//       { id: 9, sender: "them", text: "Perfect, see you then!", timestamp: "10:08 AM" },
//       { id: 10, sender: "them", text: "Hey!", timestamp: "11:00 AM" }
//     ],
//   },
//   {
//     id: 3,
//     name: "Walte White",
//     messages: [
//       { id: 1, sender: "them", text: "Hello!", timestamp: "10:00 AM" },
//       { id: 2, sender: "me", text: "Hi John!", timestamp: "10:01 AM" },
//       { id: 3, sender: "them", text: "How are you?", timestamp: "10:02 AM" },
//       { id: 4, sender: "me", text: "I'm good, thanks! You?", timestamp: "10:03 AM" },
//       { id: 5, sender: "them", text: "Doing great.", timestamp: "10:04 AM" },
//       { id: 6, sender: "me", text: "Want to meet up later?", timestamp: "10:05 AM" },
//       { id: 7, sender: "them", text: "Sure, what time?", timestamp: "10:06 AM" },
//       { id: 8, sender: "me", text: "Around 5 PM works?", timestamp: "10:07 AM" },
//       { id: 9, sender: "them", text: "Perfect, see you then!", timestamp: "10:08 AM" },
//       { id: 10, sender: "them", text: "Hey!", timestamp: "11:00 AM" }
//     ],
//   },
// ]

const ChatBox: React.FC = () => {
  const [activeChatId, setActiveChatId] = useState<number>(1);
  const [groups, setGroups] = useState<AxiosAllGroup[]>([]);

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
  
    }, [])
  

  const activeChat = groups.find((group) => group.group_id === activeChatId)!  

  return (
     <div className="bg-white dark:border-gray-800 dark:bg-white/[0.03] rounded-xl sm:p-4">
      <div className="flex rounded-xl overflow-hidden bg-[url(/123.png)] bg-size-[25%] bg-repeat">
        <ChatList groups={groups} activeChatId={activeChatId} onSelectChat={setActiveChatId} />
        <ChatWindow group={activeChat}/>
      </div>
    </div>
  );
};

export default ChatBox;
