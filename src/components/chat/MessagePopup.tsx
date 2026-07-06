import React, { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Message, User } from "../../types/chatTypes";

interface MessagePopupProps {
  message: Message;
  sender: User;
  onClose: () => void;
  onClick: () => void;
}

export const MessagePopup: React.FC<MessagePopupProps> = ({
  message,
  sender,
  onClose,
  onClick,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  // Auto-dismiss after 5 seconds with progress bar
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          handleClose();
          return 0;
        }
        return prev - 1;
      });
    }, 50); // 5 seconds total (5000ms / 50ms = 100 steps)

    return () => clearInterval(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Allow animation to complete
  };

  const handleClick = () => {
    onClick();
    handleClose();
  };

  const getMessagePreview = () => {
    if (message.type === "IMAGE") return "📷 Photo";
    if (message.type === "VIDEO") return "📹 Video";
    if (message.type === "LOCATION") return "📍 Location";
    if (message.type === "DOCUMENT") return "📄 Document";
    return message.content || "";
  };

  return (
    <div
      className={`transform transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div
        onClick={handleClick}
        className="relative w-80 cursor-pointer overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl hover:bg-white/20 transition-colors"
      >
        {/* Progress bar */}
        <div
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-50"
          style={{ width: `${progress}%` }}
        />

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-4 pr-8">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                style={{
                  backgroundColor: getAvatarColor(sender.firstName || "U"),
                }}
              >
                {sender.firstName?.substring(0, 2).toUpperCase() ||
                  sender.username?.substring(0, 2).toUpperCase() ||
                  "U"}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white truncate">
                  {sender.firstName} {sender.lastName}
                </span>
                <span className="text-xs text-white/40 flex-shrink-0">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <MessageCircle className="h-3 w-3 text-blue-400 flex-shrink-0" />
                <p className="text-sm text-white/80 truncate">
                  {getMessagePreview()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function for avatar colors (reuse from your main component)
const getAvatarColor = (name: string) => {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7B731",
    "#5D9BEC",
    "#F06292",
    "#BA68C8",
    "#4DB6AC",
    "#FF8A65",
    "#7986CB",
    "#A2B9C8",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
