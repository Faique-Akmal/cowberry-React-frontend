import React, { useState } from "react";
import { MessageCircle } from "lucide-react";

import { useNavigate } from "react-router";
import SocketChatBox from "../components/chat/SocketChatBox";
import { TbArrowsMaximize } from "react-icons/tb";

const ChatToggle = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed z-[9999] bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 ">
          <div className="relative  bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-[900px] ">
                        <div className="flex justify-between items-center mb-4">
                    {/* Close button */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-600 hover:text-red-500 p-2 m-2 absolute top-0 right-0"
                    >
                        ✖
                    </button>

                    {/* Full screen navigation button */}
                    <button
                        onClick={() => {
                        setIsOpen(false);
                        navigate("/chat");
                        }}
                        className="px-4 py-2 text-black  rounded hover:bg-cowberry-green-600 top-0 left-0 m-2 "
                    >
                  <TbArrowsMaximize />
                    </button>
                    </div>

            {/* Chat Component */}
            <SocketChatBox />

          
          </div>
        </div>
      )}
    </>
  );
};

export default ChatToggle;
