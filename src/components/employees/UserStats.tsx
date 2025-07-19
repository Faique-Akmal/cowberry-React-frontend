import React, { useEffect, useState } from "react";

import API from "../../api/axios";

interface StatsData {
  activeGoals: number;
  progress: number; // as percentage
  is_completed: number;
  dueTasks: number;
}

const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState<StatsData>({
    activeGoals: 0,
    progress: 0,
     is_completed: 0,
    dueTasks: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      const response = await API.get("/my-assigned-tasks/");
      const data = response.data;

      setStats({
        activeGoals: data.activeGoals,
        progress: data.progress,
         is_completed: data.completedTasks,
        dueTasks: data.dueTasks,
      });
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

  const cardClass =
    "flex flex-col items-center justify-center bg-[#1c1c2e] text-white rounded-lg shadow-lg p-4 w-full sm:w-44 h-24 hover:bg-[#2c2c3e] transition-all";

  return (
    <div className="flex flex-wrap gap-4 p-4 justify-center">
      <div className={cardClass}>
        <p className="text-sm text-gray-400">Active Tasks</p>
        <p className="text-xl font-semibold">{stats.activeGoals}</p>
      </div>
      <div className={cardClass}>
        <p className="text-sm text-gray-400">Progress</p>
        <p className="text-xl font-semibold">{stats.progress}%</p>
      </div>
      <div className={cardClass}>
        <p className="text-sm text-gray-400">Completed Task</p>
        <p className="text-xl font-semibold">{stats. is_completed}</p>
      </div>
      <div className={cardClass}>
        <p className="text-sm text-gray-400">Due Tasks</p>
        <p className="text-xl font-semibold">{stats.dueTasks}</p>
      </div>
    </div>
  );
};

export default DashboardStats;
