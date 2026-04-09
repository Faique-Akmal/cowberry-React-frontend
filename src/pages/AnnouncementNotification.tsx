// AnnouncementNotification.tsx
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router";
import { TfiAnnouncement } from "react-icons/tfi";
import API from "../api/axios";
import { Dropdown } from "../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../components/ui/dropdown/DropdownItem";
import { useTranslation } from "react-i18next";

interface Announcement {
  id: number;
  title: string;
  content: string;
  timestamp: string;
  created_by: number;
}

export default function AnnouncementNotification() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get user info and token
  const accessToken = localStorage.getItem("accessToken");
  const meUser = JSON.parse(localStorage.getItem("meUser") || "{}");
  const userId = meUser?.id;

  // Fetch initial announcements on mount
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await API.get("/hrms/announcements/");
      const fetchedAnnouncements = response.data.results || [];
      setAnnouncements(fetchedAnnouncements);

      // Check for unread announcements (you can implement your own logic)
      const lastReadTime = localStorage.getItem("lastReadAnnouncementTime");
      if (lastReadTime) {
        const newUnread = fetchedAnnouncements.filter(
          (ann: Announcement) =>
            new Date(ann.timestamp) > new Date(lastReadTime),
        ).length;
        setUnreadCount(newUnread);
        setNotifying(newUnread > 0);
      } else if (fetchedAnnouncements.length > 0) {
        setNotifying(true);
        setUnreadCount(fetchedAnnouncements.length);
      }
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    }
  };

  // WebSocket connection
  useEffect(() => {
    if (!accessToken || !userId) {
      console.warn("No token or user ID found. Skipping WebSocket connection.");
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "ws://localhost:8000";
    const socketUrl = `${SOCKET_URL}/ws/announcements/${userId}/?token=${accessToken}`;

    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("Announcement WebSocket connected ✅");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("New announcement via WebSocket:", data);

        // Handle different message types
        if (data.type === "announcement" || data.type === "new_announcement") {
          const newAnnouncement: Announcement = {
            id: data.id || data.announcement_id,
            title: data.title,
            content: data.content,
            timestamp: data.timestamp || new Date().toISOString(),
            created_by: data.created_by,
          };

          // Add new announcement to the top of the list
          setAnnouncements((prev) => [newAnnouncement, ...prev]);

          // Show notification dot and increment unread count
          setNotifying(true);
          setUnreadCount((prev) => prev + 1);

          // Optional: Show browser notification
          if (Notification.permission === "granted") {
            new Notification("New Announcement!", {
              body: data.title,
              icon: "/announcement-icon.png",
            });
          }
        }

        // Handle bulk updates if needed
        if (data.type === "announcements_list" && data.announcements) {
          setAnnouncements(data.announcements);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socket.onclose = () => {
      console.log("Announcement WebSocket disconnected ❌");
      // Optional: Implement reconnection logic
      setTimeout(() => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) {
          console.log("Attempting to reconnect...");
          // Reconnection logic can be added here
        }
      }, 3000);
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => {
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.close();
      }
    };
  }, [accessToken, userId]);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
    // Mark announcements as read when dropdown closes
    if (notifying) {
      localStorage.setItem(
        "lastReadAnnouncementTime",
        new Date().toISOString(),
      );
      setNotifying(false);
      setUnreadCount(0);
    }
  }

  const handleClick = () => {
    toggleDropdown();
    // Don't clear notification immediately - clear when dropdown closes
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-amber-300 border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-cowberry-green-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        <span
          className={`absolute left-7 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
            !notifying ? "hidden" : "flex"
          }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 z-10 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        <TfiAnnouncement className="w-5 h-5" />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="
          fixed 
          left-1/2 transform -translate-x-1/2
          lg:left-auto lg:right-8 lg:translate-x-0
          flex flex-col gap-3 
          w-[90%] sm:w-[380px] max-w-sm 
          z-50 p-6
          bg-white dark:bg-gray-800
          rounded-lg shadow-lg
        "
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {t("announcement.Announcements")}
          </h5>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="text-xs text-blue-500">{unreadCount} new</span>
            )}
            <button
              onClick={toggleDropdown}
              className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              ✖
            </button>
          </div>
        </div>

        <ul className="flex flex-col h-auto max-h-96 overflow-y-auto custom-scrollbar">
          {announcements.length === 0 && (
            <li className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
              {t("announcement.No announcements available")}
            </li>
          )}
          {announcements.map((item) => (
            <li key={item.id}>
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex flex-col gap-1 rounded-lg border-b border-gray-100 p-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
              >
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-800 dark:text-white">
                    {item.title}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.content.length > 100
                    ? `${item.content.substring(0, 100)}...`
                    : item.content}
                </span>
              </DropdownItem>
            </li>
          ))}
        </ul>

        {announcements.length > 0 && (
          <Link
            to="/announcements"
            className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            onClick={closeDropdown}
          >
            View All Announcements
          </Link>
        )}
      </Dropdown>
    </div>
  );
}
