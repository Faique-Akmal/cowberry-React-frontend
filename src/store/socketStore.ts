// src/stores/socketStore.ts
import { create } from 'zustand';
import { useMessageStore } from './messageStore';
import toast from 'react-hot-toast';
import { ActiveChatInfo } from '../types/chat';
// import { ChatMessage } from '../types/chat';

interface SocketState {
  socket: WebSocket | null
  isConnected: boolean

  connect: (chatInfo: ActiveChatInfo, token: string) => void
  disconnect: () => void
  sendJson: (data: any) => void
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: (chatInfo, token) => {
    const { addMessage, loadMessages, editMessage, deleteMessage } = useMessageStore.getState()

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
    const socketUrl = `ws:${SOCKET_URL}/ws/chat/${chatInfo?.chatId}/?token=${token}`

    const ws = new WebSocket(socketUrl)

    ws.onopen = () => {
      console.log('✅ WebSocket connected')
      set({ socket: ws, isConnected: true })
      get().sendJson({ 
        type: 'message_history', 
        group_id: chatInfo.chatType === "group" ? chatInfo?.chatId : null, 
        receiver_id: chatInfo.chatType === "personal" ? chatInfo?.chatId : null })

      console.log('🔗 Requesting message history...', { 
      type: 'message_history', 
      group_id: chatInfo.chatType === "group" ? chatInfo?.chatId : null, 
      receiver_id: chatInfo.chatType === "personal" ? chatInfo?.chatId : null
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
          editMessage(data?.id, { content: data?.content })
          break
        case 'delete_message':
          deleteMessage(data?.id);
          break
        default:
          console.warn('🤷‍♂️ Unknown WebSocket type:', data)
      }
    }

    ws.onerror = (err) => {
      console.error('❌ WebSocket error', err)
    }

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected')
      set({ isConnected: false, socket: null })
    }
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.close()
      set({ socket: null, isConnected: false })
    }
  },

  sendJson: (data) => {
    const { socket } = get()
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data))
    } else {
      toast.error('WebSocket is not connected')
    }
  },
}))
