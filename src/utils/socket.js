// utils/socket.js
import ReconnectingWebSocket from 'reconnecting-websocket';

export const connectWebSocket = (token) => {
  const ws = new ReconnectingWebSocket(`${import.meta.env.VITE_SOCKET_URL}/ws/chat/group/{group_id}/?token=${token}`);
  return ws;
};