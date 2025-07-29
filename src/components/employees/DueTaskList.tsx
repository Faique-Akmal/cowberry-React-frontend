import React, { useEffect, useState } from "react";

import API from "../../api/axios";

interface Task {
  id: number;
  title: string;
  progress: number; // 0–100
  members: string[]; // array of profile image URLs
}

const DueTasksList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTaskId, setLoadingTaskId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const fetchTasks = async () => {
  try {
    const res = await API.get("/my-assigned-tasks/");
    console.log("API response:", res.data);

    // Check if response is wrapped
    const rawData = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data.results)
      ? res.data.results
      : [];

    setTasks(rawData);
  } catch (err) {
    setError("Failed to load tasks");
    console.error(err);
  }
};


  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSimulateLoading = (id: number) => {
    setLoadingTaskId(id);
    setTimeout(() => {
      setLoadingTaskId(null);
    }, 2000);
  };

  const getColor = (progress: number) => {
    if (progress >= 75) return "border-yellow-400";
    if (progress >= 40) return "border-blue-500";
    return "border-red-500";
  };

  return (
    <div className="p-4 bg-[#1b4425] min-h-screen text-white">
      <h2 className="text-lg font-semibold mb-4">Complete Due Tasks</h2>

      {error && <p className="text-red-400">{error}</p>}

      <div className="space-y-4">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className="flex items-center justify-between bg-[#dbdbe0] rounded-xl p-4 shadow-md"
          >
            <div className="space-y-2">
              <p className="font-medium">
                {index + 1}. {task.title}
              </p>
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  {task.members.slice(0, 3).map((imgUrl, idx) => (
                    <img
                      key={idx}
                      src={imgUrl}
                      alt="member"
                      className="w-6 h-6 rounded-full border-2 border-white"
                    />
                  ))}
                </div>
                {/* <p className="text-sm text-gray-300">
                  +{task.members.length} member{task.members.length > 1 ? "s" : ""}
                </p> */}
              </div>
            </div>

            {/* Progress circle with loading */}
            <button
              onClick={() => handleSimulateLoading(task.id)}
              className="relative w-12 h-12 flex items-center justify-center"
            >
              {loadingTaskId === task.id ? (
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
              ) : (
                <div
                  className={`relative w-12 h-12 rounded-full border-4 ${getColor(
                    task.progress
                  )} flex items-center justify-center`}
                >
                  <span className="text-sm font-bold">
                    {task.progress}%
                  </span>
                </div>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DueTasksList;
