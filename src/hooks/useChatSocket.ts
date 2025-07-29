// hooks/useChatSocket.ts
import { useEffect, useRef } from "react";
import { useMessageStore } from "../store/messageStore";
import toast from "react-hot-toast";

// import toast from "react-hot-toast";

interface ChatSocketOptions {
  chatGroupName: string;
  // onMessage?: (data: any) => void;
}

const SOCKET_URL=import.meta.env.VITE_SOCKET_URL;

export const useChatSocket = ({ chatGroupName }: ChatSocketOptions) => {
   const {
      addMessage,
      editMessage,
      deleteMessage,
      // addReply,
      loadMessages,
      // clearMessages
    } = useMessageStore();

  const socketRef = useRef<WebSocket | null>(null);

  const accessToken = localStorage.getItem("accessToken")!

  useEffect(() => {
    const socketUrl = `ws:${SOCKET_URL}/ws/chat/${chatGroupName}/?token=${accessToken!}`;
    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('✅ Connected to server');
      sendJson({ type: "message_history", group_id: parseInt(chatGroupName) });
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("useChatSocket, parsed data",data);

      switch (data?.type) {
        case "message_history":
          console.log("message_history", data);
          loadMessages(data.messages);
          break;
        case "chat_message":
          console.log("chat_message", data);
          addMessage(data);
          break;
        case "edit_message":
          console.log("edit_message", data);
          editMessage(data.id, {content: data.content});
          toast.success('Message edited (live)')
          break;
        case "delete_message":
          console.log("delete_message", data);
          deleteMessage(data.id);

          toast.success('Message edited (live)', {
            style: {
            border: '1px solid #FA99A4',
            padding: '16px',
            color: '#FA99A4',
          },
          iconTheme: {
            primary: '#FA99A4',
            secondary: '#FFFAEE',
          },
          })
          break;
        default:
          console.warn('🤷‍♂️ Unknown WebSocket type:', data)
      }
    };

    socket.onerror = (err) => {
      console.error('❌ WebSocket error', err);
    };

    socket.onclose = () => {
      console.log("🩻 WebSocket closed");
    };

    return () => {
      socket.close();
    };
  }, [chatGroupName]);

  const sendJson = (payload: any) => {
    console.log("useChatSocket, payload : ", payload)
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    }
  };

  return {
    sendJson,
  };
};