import React, { useState } from "react";
import { MessageCircle } from "lucide-react"; 
import ChatBox from "../components/chat/ChatBox"; 
import { useNavigate } from "react-router";

const ChatToggle = () => {
    const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
   <>
  {/* Floating Toggle Button */}
  <button
    onClick={() => navigate("/chat")}
    className="fixed z-[9999] bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
  >
    <MessageCircle size={24} />
  </button>

  {/* Chat Modal */}
  {isOpen && (
    <div className="fixed inset-0 z-[9998] w- flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900  shadow-2xl p-5">
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-3 text-gray-600 hover:text-red-500"
        >
          ✖
        </button>

        {/* Chat Component */}
        <ChatBox onClose={() => setIsOpen(false)} />
      </div>
    </div>
  )}
</>

  );
};

export default ChatToggle;
