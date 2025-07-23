import { useEffect, useRef, useState } from "react"
import { AxiosAllGroup, AxiosGetGroupMsg, axiosGetGroupMsg, axiosPostSendMsg } from "../../store/chatStore"
import MemberDropdown from "./MemberDropdown";
import Alert from "../ui/alert/Alert";
import TimeZone from "../common/TimeZone";
import toast from 'react-hot-toast';

interface Props {
  group: AxiosAllGroup; 
  allMsg: AxiosGetGroupMsg[];
  dispatch: React.Dispatch<React.SetStateAction<never[]>>;
}

const ChatWindow: React.FC<Props> = ({ group, allMsg, dispatch }) => {
  const [newMsg, setNewMsg] = useState<string>("");
  const [meUserId, setMeUserId] = useState<number>();

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

     ;(async () => {
        if(group?.group_id){
          
          try {
            const groupMsg = await axiosGetGroupMsg(group?.group_id);
            if(groupMsg.length > 0){
              dispatch(groupMsg);
            } else dispatch([]);
          } catch (error) {
            console.error("Get message request error:", error);
          }
        }
      })();
    
    setNewMsg("")
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMsg]); // Triggers scroll on new messages

  useEffect(()=>{
      const localMeData = localStorage.getItem("meUser")!
      setMeUserId(JSON.parse(localMeData)?.id);
  },[]);

  return (
    <div className="flex flex-col h-[80vh] w-full">
      <div className="pl-12 p-4 md:p-4 flex h-17 items-center justify-between bg-cowberry-cream-500">
        <h2 className="text-lg font-bold text-yellow-800">{group?.group_name || "No User?"}</h2>
        <div> 
          <MemberDropdown members={group?.members || null} />
        </div>
      </div>
      <div className="custom-scrollbar flex-1 p-4 overflow-y-auto space-y-2">
        {allMsg.length > 0 ? allMsg.map((msg) => (  
          <div
            key={msg?.id}
            className={`max-w-xs flex flex-col p-2 rounded-lg ${
              meUserId === msg?.sender
                ? "bg-brand-500 text-white self-end ml-auto rounded-br-none"
                : "bg-brand-400 text-white self-start rounded-bl-none"
            }`}
            >
            <h4 className="text-xs capitalize font-bold text-cowberry-cream-500">
              {`${msg?.sender_username}`}
            </h4>
            <div className="pl-2 gap-3 flex flex-col">
              <p>{msg?.content}</p>
              <small className="text-xs text-end text-gray-200">{<TimeZone utcDateStr={msg?.sent_at} />}</small>
            </div>
          </div>
        )): (
          <Alert
          variant="warning"
          title="Chat Not Found!"
          message="Try again later!"
          showLink={false}
          />
        )}
        <div ref={bottomRef} className="pt-4" />
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
