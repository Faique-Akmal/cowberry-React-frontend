import { useEffect, useRef, useState } from "react"
import { AxiosAllGroup, AxiosGetGroupMsg, axiosPostSendMsg } from "../../store/chatStore"
import MemberDropdown from "./MemberDropdown";
import MsgCard, { WSMessage } from "./MsgCard";
import Alert from "../ui/alert/Alert";
import toast from 'react-hot-toast';
 
interface Props {
  group: AxiosAllGroup; 
  allMsg: AxiosGetGroupMsg[];
  dispatch?: (values: AxiosGetGroupMsg[]) => void;
  // dispatch: React.Dispatch<React.SetStateAction<never[]>>;
}

const ChatWindow: React.FC<Props> = ({ group, allMsg }) => {
  const [newMsg, setNewMsg] = useState<string>("");
  const [meUserId, setMeUserId] = useState<number>();
  const [messages, setMessages] = useState<WSMessage[]>([]);
  

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const send = () => {
    if (!newMsg.trim()) return
        
    if(meUserId && allMsg[0]?.group){
      
      const createMsg = {
        sender: meUserId,
        group: allMsg[0]?.group,
        content: newMsg
      };

      try {
        axiosPostSendMsg(createMsg);
        toast.success("Message sent!");
      } catch (error) {
        console.error("Get message request error:", error);
        toast.error("Failed to send message");        
      }
    }

    //  ;(async () => {
    //     if(group?.group_id){
          
    //       try {
    //         const groupMsg = await axiosGetGroupMsg(group?.group_id);
    //         if(groupMsg.length > 0){
    //           dispatch(groupMsg);
    //         } else dispatch([]);
    //       } catch (error) {
    //         console.error("Get message request error:", error);
    //       }
    //     }
    //   })();
    
    setNewMsg("")
  }

  const mappedMsg = allMsg?.map((msg)=>({
    message: msg?.content,
    senderId: msg?.sender,
    groupId: msg?.group,
    messageId: msg?.id,
    senderUsername:msg?.sender_username,
    timestemp:msg?.sent_at
  }));

 useEffect(()=>{
    setMessages(mappedMsg);    
  }, [allMsg]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMsg]); // Triggers scroll on new messages

  useEffect(()=>{
      const localMeData = localStorage.getItem("meUser")!
      const localUserID = JSON.parse(localMeData).id!
      setMeUserId(localUserID);
  },[]);

    console.count("ChatWindow rendered");


  return (
    <div className="flex flex-col h-[80vh] w-full">
      <div className="pl-12 p-4 lg:p-4 flex h-17 items-center justify-between bg-cowberry-cream-500">
        <h2 className="text-lg font-bold text-yellow-800">{group?.group_name || "No User?"}</h2>
        <div> 
          <MemberDropdown members={group?.members || null} />
        </div>
      </div>
      <div className="custom-scrollbar flex-1 p-4 overflow-y-auto space-y-2">
        {messages.length > 0 ? messages.map((msg) => (  
         !!meUserId && <MsgCard key={msg?.messageId} meUserId={meUserId} msg={msg}/>
        )): (
          <Alert
          variant="warning"
          title="Chat Not Found!"
          message="Try again later!"
          showLink={false}
          />
        )}
        <div ref={bottomRef} className="pt-10" />
      </div>
      <div className="p-4 bg-cowberry-cream-500 flex gap-2">
        <input
          type="text"
          className="flex-1 border text-yellow-800 outline-none border-none rounded px-3 py-2"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Type a message"
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button onClick={send} className="bg-brand-500 text-white px-4 py-2 rounded">
          Send
        </button>
      </div>
    </div>
  )
}

export default ChatWindow;
