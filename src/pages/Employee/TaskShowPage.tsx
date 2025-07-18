import React, { useEffect, useState } from "react";
import API from "../../api/axios";

type Task = {
  id: number;
  title: string;
  description: string;
  date: string;
  is_completed: boolean;
  completed_at: string;
  completion_description: string;
  created_at: string;
  assigned_to: string;
  assigned_by: string;
};

export default function TaskShowPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("accessToken");

        if (!token) throw new Error("User not authenticated. Please log in again.");

        const response = await API.get("/my-assigned-tasks/", {
          // headers: {
          //   Authorization: `Bearer ${token}`,
          //   "Content-Type": "application/json",
          // },
          timeout: 10000,
        });

        console.log("API response:", response.data); // 👈 Always log this to check structure

        let responseTasks: Task[] = [];
        if (Array.isArray(response.data)) {
          responseTasks = response.data;
        } else if (typeof response.data === "object") {
          responseTasks =
            response.data.tasks ||
            response.data.results ||
            response.data.data ||
            response.data.items ||
            [];
        }

        if (!Array.isArray(responseTasks)) throw new Error("Invalid data format");

        setTasks(responseTasks);
      } catch (err: any) {
        console.error("Error fetching tasks:", err);
        let message = "Failed to load tasks.";
        if (err.response) {
          switch (err.response.status) {
            case 401:
              message = "Authentication failed.";
              break;
            case 403:
              message = "Access denied.";
              break;
            case 404:
              message = "Endpoint not found.";
              break;
            case 500:
              message = "Server error.";
              break;
            default:
              message = err.response.data?.detail || "Unexpected error.";
          }
        } else if (err.request) {
          message = "No response from server.";
        } else {
          message = err.message;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Invalid date" : date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6 max-w-5xl  mx-auto">
      <h1 className="text-3xl font-bold mb-2  p-3 rounded-2xl border text-center text-neutral-500">My Tasks</h1>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="text-blue-600 mt-2">Loading tasks...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 border border-red-300 p-4 rounded text-center">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="mt-2 bg-red-600 text-white px-4 py-2 rounded">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && tasks.length === 0 && (
        <div className="text-center text-gray-500 py-6">No tasks assigned yet.</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {tasks.map((task) => (
          <div key={task.id} className="p-4 rounded shadow bg-white">
            <h2 className="text-lg font-semibold">{task.title}</h2>
            <p className="text-sm text-gray-600 mb-2">
              {task.description || "No description"}
            </p>
              <p className="text-sm text-gray-600 mb-2">
              <b>{task.completion_description || "No description"}</b>
            </p>
            <div className="flex justify-between items-center text-sm">
              <span
                className={`px-2 py-1 rounded-full ${getStatusColor(task.is_completed ? "completed" : "pending")}`}
              >
                {task.is_completed ? "Completed" : "Pending"}
              </span>
              <span className="text-gray-500">Due: {formatDate(task.date)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
 