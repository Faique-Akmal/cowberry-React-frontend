import { Chat } from "../../types"


interface Props {
  chats: Chat[]
  activeChatId: number
  onSelectChat: (id: number) => void
}

const ChatList: React.FC<Props> = ({ chats, activeChatId, onSelectChat }) => {
  return (
    <div className="w-full md:w-1/3 border-r h-full overflow-y-auto">
      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => onSelectChat(chat.id)}
          className={`p-4 border-b cursor-pointer hover:bg-gray-100 ${
            activeChatId === chat.id ? "bg-gray-200" : ""
          }`}
        >
          <h3 className="font-semibold">{chat.name}</h3>
          <p className="text-sm text-gray-500">
            {chat.messages[chat.messages.length - 1]?.text}
          </p>
        </div>
      ))}
    </div>
  )
}

export default ChatList
