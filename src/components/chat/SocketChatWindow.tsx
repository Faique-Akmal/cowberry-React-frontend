// components/SocketSocketChatWindow.tsx
import React, { useEffect, useState } from "react";
import { useChatSocket } from "../../hooks/useChatSocket";

interface Message {
  id: number;
  sender: number;
  sender_username: string;
  content: string;
  sent_at: string;
  is_read: boolean;
  parent?: Message;
  replies?: Message[];
  is_deleted?: boolean;
}

interface Props {
  chatGroupName: string;
  currentUserId: number;
  receiverId?: number;
}

 const SocketChatWindow: React.FC<Props> = ({ chatGroupName, currentUserId, receiverId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const { sendJson } = useChatSocket({
    chatGroupName,
    onMessage: (data) => {
      console.log("got onMessage data :", data);

      switch (data.type) {
        case "message_history":
          setMessages(data.messages);
          break;
        case "chat_message":
          setMessages((prev) => [...prev, data]);
          break;
        case "edit_message":
          setMessages((prev) =>
            prev.map((msg) => (msg.id === data.id ? { ...msg, content: data.content } : msg))
          );
          break;
        case "delete_message":
          setMessages((prev) =>
            prev.map((msg) => (msg.id === data.id ? { ...msg, content: "", is_deleted: true } : msg))
          );
          break;
        default:
          console.log("Unhandled:", data);
      }
    },
  });


  // Load message history on mount
  useEffect(() => {
    ;(async()=>{
      const resSocket = await sendJson({ type: "message_history", group_id: parseInt(chatGroupName) });
      console.log("resSocket :", resSocket)
    })();
  }, [chatGroupName]);

  const sendMessage = () => {
    if (input.trim()) {
      sendJson({
        type: "send_message",
        content: input,
        group_id: parseInt(chatGroupName),
        receiver_id: null,
        parent_id: replyTo?.id,
      });
      setInput("");
      setReplyTo(null);
    }
  };

  const handleEdit = (id: number, newContent: string) => {
    sendJson({ type: "edit_message", message_id: id, new_content: newContent });
  };

  const handleDelete = (id: number) => {
    sendJson({ type: "delete_message", message_id: id });
  };

  return (
    <div>
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: "1rem" }}>
            <strong>{msg.sender_username}</strong>:{" "}
            {msg.is_deleted ? <i>Message deleted</i> : msg.content}
            <div>
              <button onClick={() => setReplyTo(msg)}>Reply</button>
              {msg.sender === currentUserId && (
                <>
                  <button onClick={() => handleEdit(msg.id, prompt("Edit message:", msg.content) || msg.content)}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(msg.id)}>Delete</button>
                </>
              )}
            </div>
            {/* {msg?.replies.length > 0 &&
              msg?.replies.map((r) => (
                <div key={r.id} style={{ marginLeft: "2rem", fontStyle: "italic" }}>
                  ↳ {r.sender_username}: {r.content}
                </div>
              ))} */}
          </div>
        ))}
      </div>
      {replyTo && (
        <div>
          Replying to: <strong>{replyTo.sender_username}</strong> — {replyTo.content}
          <button onClick={() => setReplyTo(null)}>Cancel</button>
        </div>
      )}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default SocketChatWindow;