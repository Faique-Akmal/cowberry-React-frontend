import { useEffect, useState } from "react"
import { AxiosAllGroup, axiosGetGroupMsg } from "../../store/chatStore"
import MemberDropdown from "./MemberDropdown";
import { axiosGetMe } from "../../store/userStore";

interface Props {
  group:AxiosAllGroup; 
}

const ChatWindow: React.FC<Props> = ({ group }) => {
  const [allMsg, setAllMsg] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [meUserId, setMeUserId] = useState();

  const send = () => {
    if (!newMsg.trim()) return
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
    ;(async ()=>{
      const meData = await axiosGetMe();

      if(meData){
        setMeUserId(meData?.id);
      }
    })();
  },[])

  useEffect(()=>{
    ;(async()=>{
      if(group){
        // console.log(group);
        const groupMsg = await axiosGetGroupMsg(group?.group_id);
        if(groupMsg.length > 0){
          // console.log(res);
          setAllMsg(groupMsg)
        }
      }
    })();
  },[group])

  console.log("All Msg :",allMsg[0]);

  return (
    <div className="flex flex-col h-[80vh] w-full">
      <div className="flex justify-between p-4 bg-cowberry-cream-500">
        <h2 className="text-lg font-bold text-yellow-800">{group?.group_name || "No User?"}</h2>
        <div>
          <MemberDropdown members={group?.members || null} />
        </div>
      </div>
      <div className="custom-scrollbar flex-1 p-4 overflow-y-auto space-y-2">
        {allMsg.map((msg) => (
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
        ))} 
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
