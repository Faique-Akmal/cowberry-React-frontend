import React, { useEffect, useState } from "react";
import API from "../../api/axios";

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
    "  flex flex-col  bg-[url('/123.png'),url('/old-paper-texture.jpg')] bg-cover font-extrabold  items-center justify-center hover:text-[#184719] text-gray rounded-lg shadow-lg p-4 w-full sm:w-44 h-24  transition-all";

  return (
    <>
       <div className="relative flex justify-center"  >
         <b>  <h1 className="text-2xl text-gray-600 ">TASK UPDATES</h1></b>
        </div>
    <div className="flex flex-wrap gap-4 p-4  justify-center">
     
      <div className={cardClass}  >
        <p className="text-sm ">Total Tasks</p>
        <p className="text-xl font-semibold">{totalTasks}</p>
      </div>
      <div className={cardClass} >
        <p className="text-sm ">Progress</p>
        <p className="text-xl font-semibold">{progress}%</p>
      </div>
      <div className={cardClass} >
        <p className="text-sm ">Completed Tasks</p>
        <p className="text-xl font-semibold">{completedTasks}</p>
      </div>
      <div className={cardClass} >
        <p className="text-sm  ">Active Tasks</p>
        <p className="text-xl font-semibold">{activeTasks}</p>
      </div>

       <div className={cardClass} >
        <p className="text-sm ">Due Tasks</p>
        <p className="text-xl font-semibold">{dueTasks}</p>
      </div>
    </div>
    </>
  );
};

export default DashboardStats;
