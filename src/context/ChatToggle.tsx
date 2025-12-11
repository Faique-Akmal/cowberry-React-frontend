import React, { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { TbArrowsMaximize } from "react-icons/tb";
// import MessageToggle from "../components/chat/modal/Messagetoggle";

const ChatToggle = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Toggle Button - only show when modal is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed z-[9999] bottom-2 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Popup Modal (bottom-right) */}
      {isOpen && (
        <div className="fixed bottom-2 right-6 z-[9998] h-[500px] w-[350px] bg-white dark:bg-gray-900 rounded-2xl  shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center px-3 py-2 bg-black text-white border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-white dark:text-gray-200">
              Messaging
            </h2>
            <div className="flex items-center gap-3">
              {/* Maximize button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/chat");
                }}
                className="text-gray-600 hover:text-blue-600"
              >
                <TbArrowsMaximize size={20} />
              </button>

              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-600 hover:text-red-500"
              >
                ✖
              </button>
            </div>
          </div>

          {/* Chat Component */}
          <div className="flex-1 overflow-hidden">
            {/* <MessageToggle /> */}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatToggle;
