import { useState, useEffect } from "react"
import { axiosGetGroupMsg } from "../../store/chatStore";

interface Props {
  groupId:number;
}

function  LastChatMsg({groupId}:Props) {
  const [lastMsg, setLastMsg] = useState<string>("");

  const getAllLastMsg = async (groupId:number) => {
    const groupMsg = await axiosGetGroupMsg(groupId);
      if(groupMsg?.length > 0){
      setLastMsg(groupMsg[groupMsg?.length-1]?.content);
        }
  }

  useEffect(() => {
    getAllLastMsg(groupId);
  }, [groupId]);

  return (
    <p className="font-semibold">{lastMsg ? lastMsg : "No last message found."}</p>
  )
}

export default LastChatMsg;