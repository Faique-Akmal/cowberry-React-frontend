// import { useState, useEffect, useRef } from 'react';

// const MessagesView = () => {
//     const [messages, setMessages] = useState([]);
//     const [newMessage, setNewMessage] = useState('');
//     // const chatContainerRef = useRef(null);

//     useEffect(() => {
//         const ws = new WebSocket('ws://your-django-server/ws/chat/your-chatgroup_name/');

//         ws.onmessage = (event) => {
//             const data = JSON.parse(event.data);
//             setMessages((prevMessages) => [...prevMessages, data]);
//         };

//         return () => {
//             ws.close();
//         };
//     }, []);

//     const handleSendMessage = () => {
//         if (newMessage.trim()) {
          
//             const message = { body: newMessage };
//             // Send message via WebSocket
//             // You can use a library like `socket.io` or `ws` for this
//             setNewMessage('');
//         }
//     };

//     return (
//         <div>
//             {/* Chat UI */}

//             <div className="h-[50vh] custom-scrollbar flex-1 p-4 overflow-y-auto space-y-2">
              
//             </div>

//             <div className="w-full p-4 bg-cowberry-cream-500 flex gap-2">
//               <input
//                 type="text"
//                 className="flex-1 text-yellow-800 outline-none border-none rounded px-3 py-2"
//                 value={newMessage}
//                 onChange={(e) => setNewMessage(e.target.value)}
//                 onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
//                 placeholder="Type message"
//               />
//               <button onClick={handleSendMessage} className="bg-brand-500 text-white px-4 py-2 rounded">
//                 Send
//               </button>
//             </div>
//         </div>
//     );
// };

// export default MessagesView;