import React, { useState, useEffect, useRef } from "react";
import API from "../api/axios"; // Axios instance
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useTheme } from '../context/ThemeContext.tsx';

const AnnouncementForm = () => {
    const { themeConfig } = useTheme();
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdBy, setCreatedBy] = useState("");
  const socketRef = useRef<WebSocket | null>(null);

  // Set user ID and WebSocket connection
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken");

    if (storedUserId) {
      setCreatedBy(storedUserId);
    }

    if (token) {
      const socket = new WebSocket(`wss://yourdomain.com/ws/notifications/?token=${token}`);
      socketRef.current = socket;

      socket.onopen = () => console.log("WebSocket connected");
      socket.onmessage = (event) => console.log("Message from server:", event.data);
      socket.onerror = (err) => console.error("WebSocket error:", err);
      socket.onclose = () => console.log("WebSocket closed");

      return () => {
        socket.close();
      };
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError("Both title and content are required.");
      return;
    }

    if (!createdBy.trim()) {
      setError("User ID is missing.");
      return;
    }

    try {
      setLoading(true);
      const response = await API.post("/hrms/announcements/", {
        title,
        content,
        created_by: createdBy,
      });

      // Send WebSocket notification
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        const wsPayload = {
          type: "announcement_created",
          title,
          content,
          created_by: createdBy,
          timestamp: new Date().toISOString(),
        };
        socketRef.current.send(JSON.stringify(wsPayload));
      }

      // Reset fields
      setTitle("");
      setContent("");
      setError("");
      toast.success(t("announcement.post_success"));
      
    } catch (err) {
      console.error("Error posting announcement:", err);
      // setError("Failed to create announcement.");
      toast.error("Failed to create announcement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
     style={{
        backgroundColor: themeConfig.content.background,
        color: themeConfig.content.text,
      }}
    className=" mx-auto mt-8 p-4 shadow-lg bg-white rounded-2xl dark:bg-black dark:text-white ">
      <h2 className="flex justify-center text-center text-2xl font-semibold mb-4">{t("announcement.Create Announcement")}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-500  text-sm font-medium mb-1 dark:text-white">{t("announcement.Title")}</label>
          <input
            type="text"
            value={title}
            maxLength={255}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-500 text-sm font-medium mb-1 dark:text-white">{t("announcement.Content")}</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            rows={4}
            required
          />
        </div>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      <div className="">
          <button
          type="submit"
          disabled={loading}
          className="bg-blue-600  text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? t("announcement.Posting...") : t("announcement.Post Announcement")}
        </button>
      </div>
      
      </form>
    </div>
  );
};

export default AnnouncementForm;
