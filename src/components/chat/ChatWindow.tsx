import { useEffect, useState } from "react"
import { AxiosAllGroup, AxiosGetGroupMsg, axiosGetGroupMsg, axiosPostSendMsg } from "../../store/chatStore"
import MemberDropdown from "./MemberDropdown";

interface Props {
  group: AxiosAllGroup; 
  allMsg: AxiosGetGroupMsg[];
  dispatch: React.Dispatch<React.SetStateAction<never[]>>;
}

const ChatWindow: React.FC<Props> = ({ group, allMsg, dispatch }) => {
  const [newMsg, setNewMsg] = useState<string>("");
  const [meUserId, setMeUserId] = useState<number>();

  const send = () => {
    if (!newMsg.trim()) return
        
    if(meUserId && allMsg[0]?.group){
      const createMsg = {
        sender: meUserId,
        group: allMsg[0]?.group,
        content: newMsg
      };

      axiosPostSendMsg(createMsg);
    }

     ;(async () => {
          if(group?.group_id){
            const groupMsg = await axiosGetGroupMsg(group?.group_id);
            if(groupMsg.length > 0){
              dispatch(groupMsg);
            } else dispatch([]);
          }
        })();
    
    setNewMsg("")
  }

  const timeZone = (utcDateStr:string)=>{
    const utcDate = new Date(utcDateStr);

    // Format in IST using toLocaleString with timeZone
    const istDateStr = utcDate.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: true, // Optional: for AM/PM format
    });

    return istDateStr;
  }

  useEffect(()=>{
      const localMeData = localStorage.getItem("meUser")!
      setMeUserId(JSON.parse(localMeData)?.id);
  },[]);

  return (
    <div className="flex flex-col h-[80vh] w-full">
      <div className="flex justify-between p-4 bg-cowberry-cream-500">
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
              <small className="text-xs text-end text-gray-200">{timeZone(msg?.sent_at)}</small>
            </div>
          </div>
        )): (
          <p className="text-center w-full text-2xl font-bold text-dashboard-brown-200">Chat Not Found!</p>
        )} 
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

export default ChatWindow
