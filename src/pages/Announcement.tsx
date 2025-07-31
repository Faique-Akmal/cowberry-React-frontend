import React, { useState } from "react";
import API from "../../api/axios"; // Your Axios instance

const AnnouncementForm = () => {
  const [title, setTitle] = useState("");
  const [created_by, setCreated_by] = useState(""); // Set this manually or from localStorage
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Uncomment this line if you're storing userId in localStorage
  // useEffect(() => {
  //   const storedUserId = localStorage.getItem("userId");
  //   if (storedUserId) {
  //     setCreated_by(storedUserId);
  //   }
  // }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError("Both title and content are required.");
      return;
    }

    if (!created_by.trim()) {
      setError("Created By (user ID) is required.");
      return;
    }

    try {
      setLoading(true);
      await API.post("/hrms/announcements/", {
        title,
        content,
        created_by,
      });

      // Reset fields
      setTitle("");
      setContent("");
      setCreated_by("");
      setError("");
      alert("Announcement created successfully!");
    } catch (err) {
      console.error("Error posting announcement:", err);
      setError("Failed to create announcement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto mt-8 p-4 shadow-lg bg-white rounded">
      <h2 className="text-xl font-semibold mb-4">Create Announcement</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Title</label>
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
          <label className="block text-sm font-medium mb-1">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            rows={4}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Created By (User ID)</label>
          <input
            type="text"
            value={created_by}
            maxLength={5}
            onChange={(e) => setCreated_by(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            required
          />
        </div>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Posting..." : "Post Announcement"}
        </button>
      </form>
    </div>
  );
};

export default AnnouncementForm;
