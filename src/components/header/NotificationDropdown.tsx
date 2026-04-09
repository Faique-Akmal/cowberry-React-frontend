// NotificationDropdown.tsx (updated with WebSocket)
import { useState, useEffect, useRef } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import AnnouncementModal from "./AnnouncementModal";
import API from "../../api/axios";

interface Announcement {
  id: number;
  title: string;
  description: string;
  content: string;
  isActive: boolean;
  priority: "low" | "medium" | "high";
  category: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: number;
    username: string;
    email: string;
  };
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Announcement[];
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unreadIds, setUnreadIds] = useState<Set<number>>(new Set());
  const socketRef = useRef<WebSocket | null>(null);

  // Get user info and token
  const accessToken = localStorage.getItem("accessToken");
  const meUser = JSON.parse(localStorage.getItem("meUser") || "{}");
  const userId = meUser?.id;

  // Fetch announcements from API
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!accessToken || !userId) {
      console.warn("No token or user ID found. Skipping WebSocket connection.");
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
    const socketUrl = `${SOCKET_URL}/ws/announcements/${userId}/?token=${accessToken}`;

    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("Announcement WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Real-time announcement received:", data);

        if (data.type === "new_announcement" || data.type === "announcement") {
          const newAnnouncement: Announcement = {
            id: data.id,
            title: data.title,
            description:
              data.description || data.content?.substring(0, 100) || "",
            content: data.content,
            isActive: true,
            priority: data.priority || "medium",
            category: data.category || "general",
            startDate: data.startDate || new Date().toISOString(),
            endDate: data.endDate || new Date().toISOString(),
            createdAt: data.timestamp || new Date().toISOString(),
            updatedAt: data.timestamp || new Date().toISOString(),
            createdBy: data.created_by || {
              id: data.created_by,
              username: "Admin",
              email: "",
            },
          };

          // Add to beginning of announcements array
          setAnnouncements((prev) => [newAnnouncement, ...prev]);

          // Mark as unread and show notification
          setUnreadIds((prev) => new Set(prev).add(newAnnouncement.id));
          setNotifying(true);

          // Show browser notification
          if (Notification.permission === "granted") {
            new Notification(
              `New ${newAnnouncement.priority} priority announcement`,
              {
                body: newAnnouncement.title,
                icon: "/announcement-icon.png",
                tag: `announcement-${newAnnouncement.id}`,
              },
            );
          }

          // Optional: Play sound
          // const audio = new Audio("/notification-sound.mp3");
          // audio.play();
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    socket.onclose = () => {
      console.log("Announcement WebSocket disconnected");
      // Reconnect after 3 seconds
      setTimeout(() => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) {
          console.log("Reconnecting WebSocket...");
        }
      }, 3000);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [accessToken, userId]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await API.get<ApiResponse>("/auth/announcements");
      const data = response.data;

      if (data.success && data.data) {
        const announcementsList = Array.isArray(data.data)
          ? data.data
          : [data.data];
        setAnnouncements(announcementsList);

        // Check for unread announcements (based on localStorage)
        const lastReadTime = localStorage.getItem("lastReadAnnouncementTime");
        if (lastReadTime) {
          const newUnreadIds = announcementsList
            .filter((ann) => new Date(ann.createdAt) > new Date(lastReadTime))
            .map((ann) => ann.id);
          setUnreadIds(new Set(newUnreadIds));
          setNotifying(newUnreadIds.length > 0);
        } else if (announcementsList.length > 0) {
          setNotifying(true);
          setUnreadIds(new Set(announcementsList.map((ann) => ann.id)));
        }
      } else {
        setError(data.message || "Failed to fetch announcements");
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setError("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
    // Mark all as read when dropdown closes
    if (unreadIds.size > 0) {
      localStorage.setItem(
        "lastReadAnnouncementTime",
        new Date().toISOString(),
      );
      setUnreadIds(new Set());
      setNotifying(false);
    }
  }

  const handleClick = () => {
    toggleDropdown();
  };

  const handleAnnouncementClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsModalOpen(true);
    closeDropdown();

    // Mark this specific announcement as read
    setUnreadIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(announcement.id);
      if (newSet.size === 0) {
        setNotifying(false);
      }
      return newSet;
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAnnouncement(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "maintenance":
        return "🛠️";
      case "update":
        return "🔄";
      case "general":
        return "📢";
      default:
        return "📄";
    }
  };

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors dark:bg-cowberry-green-600 bg-amber-300 border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
            !notifying ? "hidden" : "flex"
          }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
        {unreadIds.size > 0 && (
          <span className="absolute -top-1 -right-1 z-10 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadIds.size > 99 ? "99+" : unreadIds.size}
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="fixed left-1/2 transform -translate-x-1/2 lg:left-auto lg:right-8 lg:translate-x-0 flex flex-col gap-3 w-[90%] sm:w-[420px] max-w-sm z-50 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Announcements
            {unreadIds.size > 0 && (
              <span className="ml-2 text-xs text-blue-500">
                ({unreadIds.size} new)
              </span>
            )}
          </h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        <ul className="flex flex-col h-auto max-h-96 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
              <button
                onClick={fetchAnnouncements}
                className="mt-2 px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No announcements found
            </div>
          ) : (
            announcements.map((announcement) => (
              <li key={announcement.id}>
                <DropdownItem
                  onItemClick={() => handleAnnouncementClick(announcement)}
                  className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 cursor-pointer transition-all ${
                    unreadIds.has(announcement.id)
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : ""
                  }`}
                >
                  <span className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800">
                    <span className="text-lg">
                      {getCategoryIcon(announcement.category)}
                    </span>
                    <span
                      className={`absolute bottom-0 right-0 z-10 h-2.5 w-2.5 rounded-full border-[1.5px] border-white ${getPriorityColor(announcement.priority)} dark:border-gray-900`}
                    ></span>
                  </span>

                  <span className="block flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <span
                        className={`font-medium ${unreadIds.has(announcement.id) ? "text-blue-600 dark:text-blue-400" : "text-gray-800 dark:text-white/90"} line-clamp-1`}
                      >
                        {announcement.title}
                        {unreadIds.has(announcement.id) && (
                          <span className="ml-2 inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                        )}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full text-white ${getPriorityColor(announcement.priority)}`}
                      >
                        {announcement.priority}
                      </span>
                    </div>

                    <span className="mb-1.5 block text-theme-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {announcement.description}
                    </span>

                    <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {announcement.createdBy.username}
                      </span>
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>{formatDate(announcement.createdAt)}</span>
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))
          )}
        </ul>
      </Dropdown>

      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        announcement={selectedAnnouncement}
      />
    </div>
  );
}
