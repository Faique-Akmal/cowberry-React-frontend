import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useTheme } from '../../context/ThemeContext.tsx';

interface Task {
  id: number;
  title: string;
  description: string;
  completion_description: string;
  address: string;
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

  const { themeConfig } = useTheme();
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  // const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | "all">("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10); // Load 10 tasks initially


  // const fetchUsers = async () => {
  //   try {
  //     const res = await API.get("/users/", {
  //       // headers: {
  //       //   Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  //       // },
  //     });
  //     setUsers(res.data.results || res.data);
  //   } catch (err) {
  //     console.error("Error fetching users", err);
  //   }
  // };

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
    // fetchUsers();
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
    toast.error("No task selected for updating.");
    // console.warn("No task selected for updating.");
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
      { is_completed: status === "completed"  },
      
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.status === 200 || response.status === 204) {
      // console.log("Task updated successfully:", response.data);
      toast.success("Task updated successfully.");
      fetchTasks();
      closeModal(); 
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
      toast.success("Invalid task selected for deletion.");
      // console.error("Invalid task selected for deletion.");
      return;
    }

    try {
      await API.delete(`/tasks/${selectedTask.id}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      // console.log(`Task ${selectedTask.id} deleted successfully.`);
      toast.success(`Task ${selectedTask.id} deleted successfully.`);
      fetchTasks();
      closeModal();
    } catch (err) {
      console.error("Error deleting task", err);
    }
  };

  return (
    <div 
     style={{
        backgroundColor: themeConfig.content.background,
        color: themeConfig.content.text,
      }}
    className="p-6 bg-white  border-2 dark:border-green-500 shadow rounded-lg dark:text-white dark:bg-black ">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">{t("task.Task Manager")}</h2>
        <hr/>
        {/* <select
          onChange={handleUserChange}
          className="border px-3 py-1 rounded"
          value={selectedUser}
        >
          <option value="all" className="dark:text-white dark:bg-black">{t("task.All Users")}</option>
          {users.map((user) => (
            <option key={user.id} value={user.id} className="capitalize dark:text-white dark:bg-black ">
              {user.username}
            </option>
          ))}
        </select> */}
      </div>

      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="p-4 border rounded-md shadow-sm flex justify-between items-center hover:bg-dashboard-brown-200 cursor-pointer"
            onClick={() => openTaskModal(task)}
          >
            <div>
              <h3 className="font-semibold">{task.title}</h3>
              <p className="text-sm text-gray-600">
                {t("task.Assigned to")}: {task.assigned_to}
              </p>
              <p className="text-sm text-gray-500">
                {t("task.Date")}: {dayjs(task.date).format("DD MMM YYYY")}
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center animate-in fade-in duration-300">
  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform animate-in zoom-in-95 duration-300 overflow-y-auto">
    {/* Header */}
    <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl p-6 pb-4 border-b border-gray-100">
      <h3 className="text-2xl font-bold text-gray-800 pr-8">{t("task.Task Details")}</h3>
      <button 
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
        onClick={closeModal}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    {/* Content */}
    <div className="p-6 space-y-6">
      {/* Title Card */}
      <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-blue-500">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-600 mb-1">{t("task.Title")}</h4>
            <p className="text-lg font-semibold text-gray-900 break-words">{selectedTask.title}</p>
          </div>
        </div>
      </div>

      {/* Description Card */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-600 mb-1">{t("task.Description")}</h4>
            <p className="text-gray-900 break-words leading-relaxed">{selectedTask.description}</p>
          </div>
        </div>
      </div>

      {/* Completion Description Card */}
      {selectedTask.completion_description && (
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-600 mb-1">{t("task.Completion Notes")}</h4>
              <span className="text-gray-900 break-words leading-relaxed">{selectedTask.completion_description}</span>
            </div>
          </div>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Location */}
        <div className="bg-gray-50 rounded-xl p-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-600">{t("task.Destination")}</h4>
              <p className="text-gray-900 text-sm break-words">
                {selectedTask.address || "No address provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="bg-gray-50 rounded-xl p-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-600">{t("task.Date")}</h4>
              <p className="text-gray-900 text-sm font-medium">
                {dayjs(selectedTask.date).format("DD MMM YYYY")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-600">{t("task.Current Status")}</h4>
          </div>
        </div>
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium capitalize ${
          selectedTask.status === 'completed' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : selectedTask.status === 'incomplete'
            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            : 'bg-gray-100 text-gray-800 border border-gray-200'
        }`}>
          {selectedTask.status}
        </span>
      </div>
    </div>

    {/* Action Buttons */}
    <div className="bg-gray-50 rounded-b-2xl px-6 py-4 border-t border-gray-100">
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => updateTaskStatus("completed")}
          className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
         {t("task.Mark Complete")}
        </button>
        
        <button
          onClick={() => updateTaskStatus("incomplete")}
          className="inline-flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
         {t("task.Mark Incomplete")}
        </button>
        
        <button
          onClick={deleteTask}
          className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {t("task.Delete")}
        </button>
      </div>
    </div>
  </div>
</div>
      )}
    </div>
  );
};

export default AdminTaskManager;
