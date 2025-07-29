// src/stores/socketStore.ts
import { create } from 'zustand'
import { useMessageStore } from './messageStore'
import toast from 'react-hot-toast'
// import { ChatMessage } from '../types/chat'

interface SocketState {
  socket: WebSocket | null
  isConnected: boolean

  connect: (groupId: string, token: string) => void
  disconnect: () => void
  sendJson: (data: any) => void
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: (groupId, token) => {
    const { addMessage, loadMessages, editMessage, deleteMessage } = useMessageStore.getState()

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
    const socketUrl = `ws:${SOCKET_URL}/ws/chat/${groupId}/?token=${token}`

    const ws = new WebSocket(socketUrl)

    ws.onopen = () => {
      console.log('✅ WebSocket connected')
      set({ socket: ws, isConnected: true })
      get().sendJson({ type: 'message_history', group_id: parseInt(groupId) })
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('📥 WebSocket message:', data)

      switch (data?.type) {
        case 'message_history':
          loadMessages(data?.messages)
          break
        case 'chat_message':
          console.log('👺 chat_message:', data);
        
          // const newMsgData = {
          //   id: data?.id,
          //   sender: data?.sender,
          //   sender_username: data?.sender_username,
          //   recipient: data?.recipient ?? null,
          //   group: data?.group ?? null,
          //   group_name: data?.group_name ?? null,
          //   content: `by chat_message ${data?.content}`,
          //   parent: data?.parent ?? null,
          //   replies: data?.replies ?? [],
          //   sent_at: data?.sent_at,
          //   is_read: data?.is_read ?? false,
          //   read_at: data?.read_at ?? null,
          //   is_deleted: data?.is_deleted ?? false
          // };

          addMessage(data);
          break
        case 'edit_message':
          editMessage(data?.id, { content: data?.content })
          toast.success('Message edited (live)')
          break
        case 'delete_message':
          deleteMessage(data?.id)
          toast.success('Message deleted (live)', {
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
