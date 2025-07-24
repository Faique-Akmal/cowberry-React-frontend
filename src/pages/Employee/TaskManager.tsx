import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import dayjs from "dayjs";

interface Task {
  id: number;
  title: string;
  description: string;
  date: string;
  status: string;
  assigned_to: {
    id: number;
    username: string;
  };
}

interface User {
  id: number;
  username: string;
}

const AdminTaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | "all">("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10); // Load 10 tasks initially


  const fetchUsers = async () => {
    try {
      const res = await API.get("/users/", {
        // headers: {
        //   Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        // },
      });
      setUsers(res.data.results || res.data);
    } catch (err) {
      console.error("Error fetching users", err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await API.get("/tasks/", {
        // headers: {
        //   Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        // },
      });
      setTasks(res.data.results || res.data);
    } catch (err) {
      console.error("Error fetching tasks", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTasks();
  }, []);

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value === "all" ? "all" : Number(e.target.value);
    setSelectedUser(userId);
  };

  const filteredTasks = (selectedUser === "all"
  ? tasks
  : tasks.filter((task) => task.assigned_to.id === selectedUser)
).slice(0, visibleCount); // Show only visibleCount tasks


useEffect(() => {
  const handleScroll = () => {
    const bottom =
      Math.ceil(window.innerHeight + window.scrollY) >=
      document.documentElement.scrollHeight;

    if (bottom) {
      setVisibleCount((prev) => prev + 10); // Load 10 more tasks
    }
  };

  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);


  const openTaskModal = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

 const updateTaskStatus = async (status: string) => {
  if (!selectedTask || !selectedTask.id) {
    console.warn("No task selected for updating.");
    return;
  }

  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("Access token missing.");
    return;
  }

  try {
    const response = await API.patch(
      `/tasks/${selectedTask.id}/`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.status === 200 || response.status === 204) {
      console.log("Task updated successfully:", response.data);
      fetchTasks(); // ✅ Refresh list
      closeModal(); // ✅ Close modal after update
    } else {
      console.warn("Unexpected response:", response);
    }
  } catch (err: any) {
    const errorMessage =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      "Something went wrong while updating the task status.";
    console.error("Update error:", errorMessage);
    // Optionally show a toast or UI message here
  }
};

  const deleteTask = async () => {
    if (!selectedTask || !selectedTask.id) {
      console.error("Invalid task selected for deletion.");
      return;
    }

    try {
      await API.delete(`/tasks/${selectedTask.id}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      console.log(`Task ${selectedTask.id} deleted successfully.`);
      fetchTasks();
      closeModal();
    } catch (err) {
      console.error("Error deleting task", err);
    }
  };

  return (
    <div className="p-6 bg-transparent shadow rounded-lg">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Admin Task Management</h2>
        <select
          onChange={handleUserChange}
          className="border px-3 py-1 rounded"
          value={selectedUser}
        >
          <option value="all">All Users</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="p-4 border rounded-md shadow-sm flex justify-between items-center hover:bg-gray-50 cursor-pointer"
            onClick={() => openTaskModal(task)}
          >
            <div>
              <h3 className="font-semibold">{task.title}</h3>
              <p className="text-sm text-gray-600">
                Assigned to: {task.id}
              </p>
              <p className="text-sm text-gray-500">
                Date: {dayjs(task.date).format("DD MMM YYYY")}
              </p>
            </div>
            <div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  task.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {task.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Task Actions</h3>
              <button className="text-2xl font-bold" onClick={closeModal}>
                &times;
              </button>
            </div>
            <p>
              <strong>Title:</strong> {selectedTask.title}
            </p>
            <p>
              <strong>Description:</strong> {selectedTask.description}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {dayjs(selectedTask.date).format("DD MMM YYYY")}
            </p>
            <p>
              <strong>Status:</strong> {selectedTask.status}
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => updateTaskStatus("completed")}
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                Mark Complete
              </button>
              <button
                onClick={() => updateTaskStatus("incomplete")}
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
              >
                Mark Incomplete
              </button>
              <button
                onClick={deleteTask}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTaskManager;
