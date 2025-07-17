import { Chat } from "../../types"


interface Props {
  chats: Chat[]
  activeChatId: number
  onSelectChat: (id: number) => void
}

const ChatList: React.FC<Props> = ({ chats, activeChatId, onSelectChat }) => {
  return (
    <div className="w-full bg-dashboard-brown-200 md:w-1/3 h-[80vh] overflow-y-auto">
      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => onSelectChat(chat.id)}
          className={`flex gap-2 p-4 cursor-pointer text-white hover:bg-green-500 ${
            activeChatId === chat.id ? "bg-brand-500 " : ""
          }`}
        >
          <span className="mr-3 overflow-hidden rounded-full h-11 w-11">
            <img src="/images/user/owner.jpg" alt="User" />
          </span>
          <div>
            <h3 className="font-semibold">{chat.name}</h3>
            <p className="text-sm text-gray-300">
              {chat.messages[chat.messages.length - 1]?.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ChatList
