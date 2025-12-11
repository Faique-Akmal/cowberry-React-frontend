import { useState, useEffect } from "react"
import { axiosGetGroupMsg } from "../../store/chatStore";

interface Props {
  groupId: number;
  chatType?: "group" | "personal";
}

interface LastMsg {
  msg: string;
  username?: string;
}


function LastChatMsg({ groupId, chatType = "group" }: Props) {
  const [lastMsg, setLastMsg] = useState<LastMsg | null>(null);

  const getAllLastMsg = async (groupId: number) => {
    const groupMsg = await axiosGetGroupMsg(groupId);
    if (groupMsg?.length > 0) {
      setLastMsg({ msg: groupMsg[groupMsg?.length - 1]?.content, username: groupMsg[groupMsg?.length - 1]?.sender_username });
    }
  }

  useEffect(() => {
    if (chatType === "personal") {
      setLastMsg({ msg: "No last message found." });
      return;
    } else {
      getAllLastMsg(groupId);
      return;
    }
  }, [groupId]);

  return (
    <p className="w-full font-semibold truncate">{lastMsg?.msg ? chatType === "personal" ? lastMsg?.msg : `${lastMsg?.username}: ${lastMsg?.msg}` : "No last message found."}</p>
  )
}

export default LastChatMsg;