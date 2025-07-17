import { Members } from "./store/chatStore"

export interface Message {
  id: number
  sender: "me" | "them"
  text: string
  timestamp: string
}

export interface Chat {
  id: number
  name: string
  members: Members[]
}

