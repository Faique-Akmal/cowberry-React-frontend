import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import { useTranslation } from "react-i18next";

interface Task {
  id: number;
  title: string;
  status: string;
  is_completed: boolean;
  completed_at: string;
}

const DashboardStats: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useTranslation();

 const fetchStats = async () => {
  try {
    const response = await API.get("/my-assigned-tasks/");
    const taskList = Array.isArray(response.data) ? response.data : response.data.results; // <- FIX
    setTasks(taskList || []);
  } catch (err) {
    setError("Failed to fetch stats.");
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <div className="text-white">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  // Calculate stats from task list
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.is_completed).length;
  const activeTasks = tasks.filter(task => !task.is_completed).length;
  const dueTasks = tasks.filter(task => {
    const dueDate = new Date(task.completed_at);
    const today = new Date();
    return dueDate < today && !task.is_completed;
  }).length;

  

  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const cardClass =
    "  flex flex-col  bg-[url('/123.png'),url('/old-paper-texture.jpg')] bg-cover font-extrabold  items-center justify-center hover:text-[#0D5EA6] text-gray rounded-lg shadow-lg p-4 w-full sm:w-44 h-24  transition-all";

  return (
    <>
    
  {/* Title */}
  <div className="relative flex justify-center mb-4">
    <h1 className="text-2xl font-bold text-gray-600">{t("home.TASK UPDATES")}</h1>
  </div>

  {/* Cards Grid */}
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 p-4 justify-items-center">
    <div className={cardClass}>
      <p className="text-sm">{t("home.Total Tasks")}</p>
      <p className="text-xl font-semibold">{totalTasks}</p>
    </div>

    <div className={cardClass}>
      <p className="text-sm">{t("home.Progress")}</p>
      <p className="text-xl font-semibold">{progress}%</p>
    </div>

    <div className={cardClass}>
      <p className="text-sm">{t("home.Completed Tasks")}</p>
      <p className="text-xl font-semibold">{completedTasks}</p>
    </div>

    <div className={cardClass}>
      <p className="text-sm">{t("home.Active Tasks")}</p>
      <p className="text-xl font-semibold">{activeTasks}</p>
    </div>

    <div className={cardClass}>
      <p className="text-sm">{t("home.Due Tasks")}</p>
      <p className="text-xl font-semibold">{dueTasks}</p>
    </div>
  </div>
</>

  );
};

export default DashboardStats;
