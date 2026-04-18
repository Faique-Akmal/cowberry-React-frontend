// NotificationDropdown.tsx - Complete working component
import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
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
    full_name?: string;

    email: string;
  };
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Announcement[];
}

// ─── Toast Notification Component ───────────────────────────────────────────

const ToastNotification = ({
  message,
  priority,
  onClose,
}: {
  message: string;
  priority: string;
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const borderColor =
    priority === "high"
      ? "border-red-500"
      : priority === "medium"
        ? "border-yellow-500"
        : "border-green-500";

  const iconColor =
    priority === "high"
      ? "text-red-500"
      : priority === "medium"
        ? "text-yellow-500"
        : "text-green-500";

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-toast-in">
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-l-4 ${borderColor} p-4 min-w-[300px] max-w-sm`}
      >
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              New Announcement
            </p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

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
  const [toast, setToast] = useState<{
    message: string;
    priority: string;
  } | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const accessToken = localStorage.getItem("accessToken");

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getUserId = (): number | null => {
    try {
      const raw = localStorage.getItem("userId");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (typeof parsed === "number") return parsed;
      if (parsed?.id) return parsed.id;
      if (parsed?.userId) return parsed.userId;
      return null;
    } catch {
      return null;
    }
  };

  const userId = getUserId();

  // ── Sound (Web Audio API — no mp3 file needed) ─────────────────────────────
  const playNotificationSound = (priority: string) => {
    if (priority === "low") return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }
      const ctx = audioCtxRef.current;

      // Resume if suspended (browser autoplay policy)
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (priority === "high") {
        // Two-tone urgent beep for high priority
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      } else {
        // Single soft chime for medium
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      }

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + (priority === "high" ? 0.5 : 0.4),
      );

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + (priority === "high" ? 0.5 : 0.4));
    } catch (err) {
      console.warn("Audio playback failed:", err);
    }
  };

  // ── Browser Notification ───────────────────────────────────────────────────
  const showBrowserNotification = (
    title: string,
    body: string,
    priority: string,
  ) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/announcement-icon.png",
        tag: `announcement-${Date.now()}`,
        requireInteraction: priority === "high",
      });
    }
  };

  // ── Handle incoming real-time announcement ─────────────────────────────────
  const handleNewAnnouncement = (data: any) => {
    try {
      const newAnn: Announcement = {
        id: data.id || Date.now(),
        title: data.title,
        description: data.description || data.content?.substring(0, 100) || "",
        content: data.content,
        isActive: true,
        priority: data.priority || "medium",
        category: data.category || "general",
        startDate: data.startDate || new Date().toISOString(),
        endDate: data.endDate || new Date().toISOString(),
        createdAt: data.timestamp || new Date().toISOString(),
        updatedAt: data.timestamp || new Date().toISOString(),
        createdBy:
          typeof data.created_by === "object"
            ? data.created_by
            : { id: data.created_by || 0, username: "Admin", email: "" },
      };

      // Prevent duplicates
      setAnnouncements((prev) => {
        if (prev.some((a) => a.id === newAnn.id)) return prev;
        return [newAnn, ...prev];
      });

      setUnreadIds((prev) => {
        const next = new Set(prev);
        next.add(newAnn.id);
        return next;
      });

      setNotifying(true);

      // Toast
      setToast({
        message: `${newAnn.priority.toUpperCase()}: ${newAnn.title}`,
        priority: newAnn.priority,
      });

      // Sound
      playNotificationSound(newAnn.priority);

      // Browser notification
      showBrowserNotification(
        `New ${newAnn.priority} Priority Announcement`,
        newAnn.title,
        newAnn.priority,
      );
    } catch (err) {
      console.error("Error processing announcement:", err);
    }
  };

  // ── Fetch from API ─────────────────────────────────────────────────────────
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await API.get<ApiResponse>("/auth/announcements");
      const data = response.data;

      if (data.success && data.data) {
        const list = Array.isArray(data.data) ? data.data : [data.data];
        setAnnouncements(list);

        const lastViewTime = localStorage.getItem("lastAnnouncementViewTime");
        const lastReadTime = localStorage.getItem("lastReadAnnouncementTime");

        const lastCheckTime =
          lastViewTime && lastReadTime
            ? new Date(
                Math.max(
                  new Date(lastViewTime).getTime(),
                  new Date(lastReadTime).getTime(),
                ),
              )
            : lastViewTime
              ? new Date(lastViewTime)
              : lastReadTime
                ? new Date(lastReadTime)
                : null;

        if (lastCheckTime) {
          const newUnread = list
            .filter((a) => new Date(a.createdAt) > lastCheckTime)
            .map((a) => a.id);
          setUnreadIds(new Set(newUnread));
          setNotifying(newUnread.length > 0);
        } else if (list.length > 0) {
          setNotifying(true);
          setUnreadIds(new Set(list.map((a) => a.id)));
        }
      } else {
        setError(data.message || "Failed to fetch announcements");
      }
    } catch {
      setError("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Request browser notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Socket.IO connection
  useEffect(() => {
    if (!accessToken || !userId) {
      console.warn("No token or userId — skipping WebSocket connection.");
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
    if (!SOCKET_URL) {
      console.error("VITE_SOCKET_URL not set in .env");
      return;
    }

    const cleanToken = accessToken.replace(/^["']|["']$/g, "");

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token: cleanToken },
      path: "/socket.io",
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket.IO connected");
      socket.emit("join_announcements", userId);
    });

    socket.on("new_announcement", handleNewAnnouncement);
    socket.on("announcement", handleNewAnnouncement);

    socket.on("connect_error", (err) =>
      console.error("Socket error:", err.message),
    );
    socket.on("disconnect", (reason) =>
      console.log("Socket disconnected:", reason),
    );

    return () => {
      socket.emit("leave_announcements", userId);
      socket.disconnect();
    };
  }, [accessToken, userId]);

  // Polling fallback (kicks in only if WebSocket fails after 10s)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      if (!socketRef.current?.connected) {
        console.log("WebSocket not connected — polling every 30s");
        interval = setInterval(fetchAnnouncements, 30_000);
      }
    }, 10_000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const closeDropdown = () => {
    setIsOpen(false);
    if (unreadIds.size > 0) {
      const now = new Date().toISOString();
      localStorage.setItem("lastReadAnnouncementTime", now);
      localStorage.setItem("lastAnnouncementViewTime", now);
      setUnreadIds(new Set());
      setNotifying(false);
    }
  };

  const handleAnnouncementClick = (ann: Announcement) => {
    setSelectedAnnouncement(ann);
    setIsModalOpen(true);
    closeDropdown();

    setUnreadIds((prev) => {
      const next = new Set(prev);
      next.delete(ann.id);
      if (next.size === 0) {
        setNotifying(false);
        localStorage.setItem(
          "lastReadAnnouncementTime",
          new Date().toISOString(),
        );
      }
      return next;
    });
  };

  const markAllRead = () => {
    const now = new Date().toISOString();
    localStorage.setItem("lastReadAnnouncementTime", now);
    localStorage.setItem("lastAnnouncementViewTime", now);
    setUnreadIds(new Set());
    setNotifying(false);
  };

  // ── UI Helpers ─────────────────────────────────────────────────────────────

  const getPriorityDotColor = (priority: string) => {
    switch (priority) {
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

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const formatDate = (dateString: string) => {
    const diff = (Date.now() - new Date(dateString).getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <ToastNotification
          message={toast.message}
          priority={toast.priority}
          onClose={() => setToast(null)}
        />
      )}

      {/* Bell Button */}
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-amber-300 dark:bg-gray-700 border border-amber-400 dark:border-gray-600 rounded-full dropdown-toggle hover:bg-amber-400 dark:hover:bg-gray-600 h-11 w-11"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Notifications"
      >
        {/* Ping ring */}
        {notifying && (
          <span className="absolute right-0 top-0.5 z-10 h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-500" />
          </span>
        )}

        {/* Unread count badge */}
        {unreadIds.size > 0 && (
          <span className="absolute -top-1.5 -right-1.5 z-10 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-gray-900">
            {unreadIds.size > 99 ? "99+" : unreadIds.size}
          </span>
        )}

        {/* Bell icon */}
        <svg
          className="fill-current text-amber-800 dark:text-gray-300"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
          />
        </svg>
      </button>

      {/* Dropdown */}
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="fixed left-1/2 -translate-x-1/2 lg:left-auto lg:right-8 lg:translate-x-0 w-[92%] sm:w-[420px] z-50 p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <h5 className="text-base font-semibold text-gray-900 dark:text-white">
              Announcements
            </h5>
            {unreadIds.size > 0 && (
              <span className="text-xs text-blue-500 font-medium animate-pulse">
                {unreadIds.size} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unreadIds.size > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={closeDropdown}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* List */}
        <ul className="flex flex-col max-h-96 overflow-y-auto -mx-1 pr-1 custom-scrollbar">
          {loading ? (
            <li className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-7 w-7 border-2 border-blue-500 border-t-transparent" />
            </li>
          ) : error ? (
            <li className="text-center py-8 text-red-500 text-sm">
              <p>{error}</p>
              <button
                onClick={fetchAnnouncements}
                className="mt-3 px-4 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
            </li>
          ) : announcements.length === 0 ? (
            <li className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">
              No announcements yet
            </li>
          ) : (
            announcements.map((ann) => {
              const isUnread = unreadIds.has(ann.id);
              return (
                <li key={ann.id}>
                  <DropdownItem
                    onItemClick={() => handleAnnouncementClick(ann)}
                    className={`flex gap-3 rounded-xl mx-1 px-3 py-3 cursor-pointer transition-all duration-150 hover:bg-gray-50 dark:hover:bg-white/5 ${
                      isUnread
                        ? "bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-500 pl-2"
                        : ""
                    }`}
                  >
                    {/* Avatar */}
                    <span className="relative flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800">
                      <span className="text-base leading-none">
                        {getCategoryIcon(ann.category)}
                      </span>
                      <span
                        className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-gray-900 ${getPriorityDotColor(ann.priority)} ${isUnread ? "animate-pulse" : ""}`}
                      />
                    </span>

                    {/* Content */}
                    <span className="flex-1 min-w-0 block">
                      <span className="flex items-start justify-between gap-2 mb-0.5">
                        <span
                          className={`text-sm font-medium truncate ${
                            isUnread
                              ? "text-blue-600 dark:text-blue-400 font-semibold"
                              : "text-gray-800 dark:text-gray-100"
                          }`}
                        >
                          {ann.title}
                        </span>
                        <span
                          className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${getPriorityBadgeClass(ann.priority)}`}
                        >
                          {ann.priority}
                        </span>
                      </span>

                      <span className="block text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-1">
                        {ann.description}
                      </span>

                      <span className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
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
                        {ann.createdBy.full_name || ann.createdBy.username}
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        {formatDate(ann.createdAt)}
                      </span>
                    </span>
                  </DropdownItem>
                </li>
              );
            })
          )}
        </ul>
      </Dropdown>

      {/* Announcement Detail Modal */}
      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAnnouncement(null);
        }}
        announcement={selectedAnnouncement}
      />
    </div>
  );
}
