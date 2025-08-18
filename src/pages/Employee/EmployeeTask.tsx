import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import toast from "react-hot-toast";
import UpdateTaskModal from "./UpdateTaskModal";

type Task = {
  id: number;
  title: string;
  description: string;
  start_date: string;
  address: string;
  dest_lat: number;
  dest_lng: number;
  is_completed: boolean;
  completed_at: string;
  completion_description: string;
  created_at: string;
  assigned_to: number;
  assigned_by: number;
  created_by: number;
};

export default function TaskShowPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all"); // ✅ New filter state

  const handleUpdateClick = (task: Task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleUpdate = (updatedTask: Task) => {
    console.log("Updated Task:", updatedTask);
    // you could replace task in state or refetch tasks here
  };

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("User not authenticated. Please log in again.");

        const response = await API.get("/my-assigned-tasks/", { timeout: 10000 });
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
        toast.error("Failed to load tasks.");
        setError(err.message || "Unexpected error.");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Invalid date"
      : date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
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

  // ✅ Filter tasks before rendering
  const filteredTasks = tasks.filter((task) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "completed") return task.is_completed;
    if (filterStatus === "pending") return !task.is_completed;
    return true;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-2xl dark:bg-black dark:text-white shadow-lg">
      <h1 className="text-3xl font-bold mb-2 p-3 rounded-2xl border text-center text-black dark:text-white border-b-4">
        My Tasks
      </h1>

      {/* ✅ Dropdown for filtering */}
      <div className="mb-4 flex justify-end">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border px-3 py-2 rounded-md dark:bg-gray-800 dark:text-white"
        >
          <option value="all">All Tasks</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="text-blue-600 mt-2">Loading tasks...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 border border-red-300 p-4 rounded text-center">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filteredTasks.length === 0 && (
        <div className="text-center text-gray-500 py-6">No tasks found for this filter.</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 m-4">
        {filteredTasks.map((task) => (
          <div key={task.id} className="p-4 shadow bg-dashboard-brown-200 rounded-2xl border-b-4">
            <h2 className="text-lg font-semibold dark:text-black">
              <span>Title:</span> {task.title}
            </h2>
            <p className="text-sm text-black mb-2">
              <b>Description</b>: {task.description || "No description"}
            </p>
            <p className="text-sm text-black mb-2">
              <b>Destination</b>: {task.address || "No address provided"}
            </p>
            <p className="text-sm text-gray-700 dark:text-white mb-2">
              <span className="text-black">Complete Description:</span>
              <br />
              <b>{task.completion_description || "No description"}</b>
            </p>
            <div className="flex justify-between items-center text-sm m-2">
              <span
                className={`px-2 py-1 rounded-full ${getStatusColor(
                  task.is_completed ? "completed" : "pending"
                )}`}
              >
                {task.is_completed ? "Completed" : "Pending"}
              </span>
              <span className="text-black">Start Date: {formatDate(task.start_date)}</span>
            </div>
            <hr />
            <div>
              <button
                onClick={() => handleUpdateClick(task)}
                className="text-sm p-1 mt-2 text-white mb-2 cursor-pointer w-full rounded-full bg-green-700"
              >
                Update Task
              </button>
            </div>
          </div>
        ))}

        <UpdateTaskModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onUpdate={handleUpdate}
        />
      </div>
    </div>
  );
}
