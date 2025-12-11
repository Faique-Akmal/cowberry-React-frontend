import  { useEffect, useRef, useState } from "react";

const groupId = 1; // Replace with your actual group ID
// const meUser = JSON.parse(localStorage.getItem("meUser")!);
//   const meUserId = meUser?.id; // Replace with your actual group ID


const MessagesView = () => {
  const [messages, setMessages] = useState([]);
  const [typingStatus, setTypingStatus] = useState({});
  const [onlineGroupUsers, setOnlineGroupUsers] = useState([]);
  const [personalOnlineUsers, setPersonalOnlineUsers] = useState({});
  const socketRef = useRef(null);

  const accessToken = localStorage.getItem('accessToken');


   const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
    const socketUrl = `ws:${SOCKET_URL}/ws/chat/${groupId}/?token=${accessToken}`

  useEffect(() => {
    // Connect to WebSocket
    socketRef?.current = new WebSocket(socketUrl);

    socketRef?.current.onopen = () => {
      console.log("WebSocket connected");

      // Optional: Ask for online status once connected
      socketRef.current.send(JSON.stringify({
        type: "get_online_status",
        group_id: groupId,
        personal_ids: [/* fill with user IDs */]
      }));
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "chat_message":
          console.log("Message received", data);
          setMessages((prev) => [...prev, data]);
          break;

        case "edit_message":
          setMessages((prev) =>
            prev.map((msg) => (msg.id === data.id ? { ...msg, ...data } : msg))
          );
          break;

        case "delete_message":
          setMessages((prev) =>
            prev.map((msg) => (msg.id === data.id ? { ...msg, is_deleted: true } : msg))
          );
          break;

        case "message_history":
          setMessages(data.messages || []);
          break;

        case "typing":
          setTypingStatus((prev) => ({
            ...prev,
            [data.user]: data.is_typing,
          }));
          break;

        case "read_receipt":
          console.log(`Message ${data.message_id} read by user ${data.user_id}`);
          break;

        case "online_status":
          setOnlineGroupUsers(data.group_online_users);
          setPersonalOnlineUsers(data.personal_online_users);
          break;

        default:
          console.warn("Unknown message type:", data.type);
      }
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [groupId]);

  return (
    <div>
      <h3>Messages</h3>
      {messages.map((msg) => (
        <div key={msg?.id}>
          <strong>{msg?.sender_username}</strong>:{" "}
          {msg?.is_deleted ? <i>Message deleted</i> : msg?.content}
          {msg?.is_edited && <small> (edited)</small>}
        </div>
      ))}

      <h4>Typing:</h4>
      {Object.entries(typingStatus).map(([user, status]) =>
        status ? <div key={user}>{user} is typing...</div> : null
      )}

      <h4>Online Group Users:</h4>
      <pre>{JSON.stringify(onlineGroupUsers, null, 2)}</pre>

      <h4>Online Status (Personal):</h4>
      <pre>{JSON.stringify(personalOnlineUsers, null, 2)}</pre>
    </div>
  );
};

export default MessagesView;