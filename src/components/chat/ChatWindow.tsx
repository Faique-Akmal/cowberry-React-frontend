import { Chat } from "../../types"
import { useState } from "react"

interface Props {
  chat: Chat
  onSendMessage: (chatId: number, text: string) => void
}

const ChatWindow: React.FC<Props> = ({ chat, onSendMessage }) => {
  const [newMsg, setNewMsg] = useState("")

  const send = () => {
    if (!newMsg.trim()) return
    onSendMessage(chat.id, newMsg)
    setNewMsg("")
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 rounded-xl bg-cowberry-cream-500">
        <h2 className="text-lg font-bold">{chat.name}</h2>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-2">
        {chat.messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-xs flex flex-col p-2 rounded-lg rounded-br-none ${
              msg.sender === "me"
                ? "bg-brand-500 text-white self-end ml-auto"
                : "bg-brand-400 text-white self-start"
            }`}
          >
            <p>{msg.text}</p>
            <small className=" text-xs text-end text-gray-200">{msg.timestamp}</small>
          </div>
        ))}
      </div>
      <div className="p-4 rounded-xl bg-cowberry-cream-500 flex gap-2">
        <input
          type="text"
          className="flex-1 border outline-none border-none rounded px-3 py-2"
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
