// src/stores/socketStore.ts
import { create } from 'zustand';
import { useMessageStore } from './messageStore';
import { ActiveChatInfo } from '../types/chat';

interface SocketState {
  socket: WebSocket | null
  isConnected: boolean

  typingStatus: Record<string, boolean>
  onlineGroupUsers: number[]
  personalOnlineUsers: Record<string, boolean>

  connect: (chatInfo: ActiveChatInfo, token: string) => void
  disconnect: () => void
  sendJson: (data: any) => void
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  typingStatus: {},
  onlineGroupUsers: [],
  personalOnlineUsers: {},

  connect: (chatInfo, token) => {
    const { addMessage, loadMessages, editMessage, deleteMessage } = useMessageStore.getState();

    const meUser = JSON.parse(localStorage.getItem("meUser")!);
    const meUserId = meUser?.id;

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
    const socketUrl = `wss:${SOCKET_URL}/ws/chat/${chatInfo.chatType === "group" ?
      chatInfo?.chatId :
      (!!(chatInfo?.chatType === "personal") &&
        `personal/${chatInfo?.chatId}`)}/?token=${token}`

    const ws = new WebSocket(socketUrl)

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      set({ socket: ws, isConnected: true });

      get().sendJson({
        type: 'message_history',
        group_id: chatInfo.chatType === "group" ? chatInfo?.chatId : null,
        receiver_id: chatInfo.chatType === "personal" ? chatInfo?.chatId : null
      });

      get().sendJson({
        type: "typing",
        is_typing: false,
      });

      get().sendJson({
        type: "get_online_status",
        group_id: chatInfo.chatType === "group" ? chatInfo.chatId : null,
        personal_ids: [meUserId]
      });
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('📥 WebSocket message:', data)

      switch (data?.type) {
        case 'message_history':
          loadMessages(data?.messages);
          break
        case 'chat_message':
          addMessage(data);
          break
        case 'edit_message':
          editMessage(data?.id, { content: data?.content, is_edited: data?.is_edited });
          break
        case 'delete_message':
          deleteMessage(data?.id);
          break
        case "typing":
          set((state) => ({
            typingStatus: {
              ...state.typingStatus,
              [data.user]: data.is_typing,
            },
          }));
          break;
        case "read_receipt":
          console.log(`📨 Message ${data.message_id} read by user ${data.user_id}`);
          break;
        case "online_status":
          set({
            onlineGroupUsers: data.group_online_users || [],
            personalOnlineUsers: data.personal_online_users || {},
          });
          break;
        default:
          console.warn('🤷‍♂️ Unknown WebSocket type:', data)
      }
    }

    ws.onerror = (err) => {
      console.error('❌ WebSocket error', err);
    }

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      set({ isConnected: false, socket: null });
    }
  },

  disconnect: () => {
    const { socket } = get();

    get().sendJson({
      type: "typing",
      is_typing: false,
    });

    if (socket) {
      socket.close()
      set({ socket: null, isConnected: false })
    }
  },

  sendJson: (data) => {
    const { socket } = get()
    if (socket?.readyState === WebSocket?.OPEN) {
      socket?.send(JSON.stringify(data))
    } else {
      console.error('❌ WebSocket is not connected');
    }
  },
}));
