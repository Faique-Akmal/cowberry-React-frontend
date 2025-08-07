import { useEffect, useState, useRef } from "react";
import { Link } from "react-router";
import { TfiAnnouncement } from "react-icons/tfi";
import API from "../api/axios";
import { Dropdown } from "../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../components/ui/dropdown/DropdownItem";

interface Announcement {
  id: number;
  title: string;
  content: string;
  timestamp: string;
  created_by: number;
}

export default function AnnouncementNotification() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  // const socketRef = useRef<WebSocket | null>(null);


  //   const accessToken = localStorage.getItem("accessToken");
  //   const meUser = JSON.parse(localStorage.getItem("meUser")!);
  // const userId= meUser?.id;

  // Fetch initial announcements on mount
  useEffect(() => {
    API.get("/hrms/announcements/")
      .then((res) => {
          // console.log("Fetched announcements:", res.data);
        //  setAnnouncements(res.data.results || []);
        setAnnouncements(res.data.results || []);
      })
      .catch((err) => {
        console.error("Failed to fetch announcements:", err);
      });
  }, []);

  // WebSocket connection
  // useEffect(() => {
  //     const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // should already include ws:// or wss://
  //   const socketUrl = `${SOCKET_URL}/ws/announcements/${userId}/?token=${accessToken}`;
   
  //   const socket = new WebSocket(socketUrl);
  //   socketRef.current = socket;

  //   socket.onopen = () => {
  //     console.log("WebSocket connected ");
  //   };

  //   socket.onmessage = (event) => {
  //     const data = JSON.parse(event.data);
  //     console.log("New WebSocket message:", data);

  //     if (data.type === "announcement") {
  //       const newAnnouncement: Announcement = {
  //         id: data.id,
  //         title: data.title,
  //         content: data.content,
  //         timestamp: data.timestamp,
  //         created_by: data.created_by,
  //       };

  //       setAnnouncements((prev) => [newAnnouncement, ...prev]);
  //       setNotifying(true); // Show notification dot
  //     }
  //   };

  //   socket.onclose = () => {
  //     console.log("WebSocket disconnected ❌");
  //   };

  //   socket.onerror = (err) => {
  //     console.error("WebSocket error:", err);
  //   };

  //   return () => {
  //     socket.close(); // Cleanup on unmount
  //   };
  // }, []);



  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleClick = () => {
    toggleDropdown();
    setNotifying(false);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-amber-300 border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
            !notifying ? "hidden" : "flex"
          }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
        <TfiAnnouncement />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Announcements
          </h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ✖
          </button>
        </div>

        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {announcements.length === 0 && (
            <li className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
              No announcements available
            </li>
          )}
          {announcements.map((item) => (
            <li key={item.id}>
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex flex-col gap-1 rounded-lg border-b border-gray-100 p-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
              >
                <span className="text-sm font-medium text-gray-800 dark:text-white">
                  {item.title}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.content}
                </span>
                <span className="text-[11px] text-gray-400 mt-1">
                  {formatTimestamp(item.timestamp)}
                </span>
              </DropdownItem>
            </li>
          ))}
        </ul>
{/* 
        <Link
          to="/"
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          View All Announcements
        </Link> */}
      </Dropdown>
    </div>
  );
}
