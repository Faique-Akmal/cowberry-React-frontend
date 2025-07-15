import React, { useEffect, useState } from "react";
import axios from "axios";
import API from "../../api/axios";

type Task = {
  id: number;
  title: string;
  description: string;
  status: string;
  due_date: string;
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
        if (!token) {
          throw new Error("User not authenticated. Token not found.");
        }

        const response = await API.get(
          "/my-assigned-tasks/",
         
        );

        console.log("API response:", response.data); 

        const responseTasks = Array.isArray(response.data)
          ? response.data
          : response.data.tasks || response.data.results || [];

        if (!Array.isArray(responseTasks)) {
          throw new Error("Invalid data format received from server.");
        }

        setTasks(responseTasks);
      } catch (err: any) {
        console.error("Error fetching tasks:", err);

        const message =
          err.response?.data?.detail ||
          err.message ||
          "Failed to load tasks. Please try again.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">My Tasks</h1>

      {loading && <p className="text-center text-blue-600">Loading tasks...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && tasks.length === 0 && !error && (
        <p className="text-center text-gray-600">No tasks assigned yet.</p>
      )}

      {/* 🧪 Debug output */}
      {/* <pre>{JSON.stringify(tasks, null, 2)}</pre> */}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {Array.isArray(tasks) &&
          tasks.map((task) => (
            <div
              key={task.id}
              className="border rounded-xl p-4 shadow hover:shadow-md transition duration-300 bg-white"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                {task.title}
              </h2>
              <p className="text-sm text-gray-600 mb-3">{task.description}</p>
              <div className="flex justify-between items-center text-sm">
                <span
                  className={`px-2 py-1 rounded-full ${
                    task.status.toLowerCase() === "completed"
                      ? "bg-green-100 text-green-700"
                      : task.status.toLowerCase() === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {task.status}
                </span>
                <span className="text-gray-500">
                  Due: {new Date(task.due_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
