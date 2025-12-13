import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
// import { TbArrowsMaximize } from "react-icons/tb";
// import { ChatInterface } from "../components/chat/ChatInterface";
// import MessageToggle from "../components/chat-old/modal/Messagetoggle";

const ChatToggle = () => {
  // const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Toggle Button - only show when modal is closed */}
      {!isOpen && (
        <Link
          onClick={() => setIsOpen(true)}
          to="/chat"
          className="fixed z-9999 bottom-2 right-6 bg-brand-500 text-white p-4 rounded-full shadow-lg hover:bg-brand-600 transition"
        >
          <MessageCircle size={24} />
        </Link>
      )}

      {/* Chat Popup Modal (bottom-right) */}
      {/* {isOpen && ( */}
      {/* <div className="fixed bottom-2 right-6 z-9998 h-[500px] w-[350px] bg-white dark:bg-gray-900 rounded-2xl  shadow-2xl flex flex-col"> */}
      {/* Header */}
      {/* <div className="flex justify-between items-center px-3 py-2 bg-black text-white border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-white dark:text-gray-200">
              Messaging
            </h2>
            <div className="flex items-center gap-3"> */}
      {/* Maximize button */}
      {/* <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/chat");
                }}
                className="text-gray-600 hover:text-brand-400"
              >
                <TbArrowsMaximize size={20} />
              </button> */}

      {/* Close button */}
      {/* <button
                onClick={() => setIsOpen(false)}
                className="text-gray-600 hover:text-red-500"
              >
                ✖
              </button>
            </div>
          </div> */}

      {/* Chat Component */}
      {/* <div className="w-full"> */}
      {/* <ChatInterface /> */}
      {/* </div> */}
      {/* </div> */}
      {/* )} */}
    </>
  );
};

export default ChatToggle;
