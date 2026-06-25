import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const ChatToggle = () => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if current path is /chat, /login, /signup, or starts with these paths
    const isHiddenPage =
      location.pathname === "/chat" ||
      location.pathname.startsWith("/chat/") ||
      location.pathname === "/login" ||
      location.pathname === "/" ||
      location.pathname === "/signin" ||
      location.pathname === "/signup";

    setIsVisible(!isHiddenPage);
  }, [location]);

  return (
    <Link
      to="/chat"
      className={`fixed hidden sm:flex  z-[9999] bottom-15 right-5 bg-lantern-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-lantern-blue-400 transition-all duration-300 hover:scale-110 active:scale-95 ${
        isVisible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-10 pointer-events-none"
      }`}
    >
      <MessageCircle size={24} />
    </Link>
  );
};

export default ChatToggle;
