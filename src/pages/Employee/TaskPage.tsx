import React, { useState, useEffect } from "react";
import axios from "axios";

export default function TaskPage() {
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    is_completed: false,
    completed_at: "",
    completion_description: "",
    assigned_to: 0,
    assigned_by: 0,
  });

  const API_URL = "http://10.79.184.40:8000/api/my-created-tasks/"; 

  // Fetch tasks
  useEffect(() => {
    axios
      .get(API_URL)
      .then((res) => setTasks(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Handle form input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();

    // Set completion date if marked completed
    const payload = {
      ...formData,
      completed_at: formData.is_completed ? new Date().toISOString() : null,
    };

    axios
      .post(API_URL, payload)
      .then((res) => {
        alert("Task added successfully!");
        setTasks((prev) => [...prev, res.data]);
        setFormData({
          title: " ",
          description: " ",
          date: " ",
          is_completed: false,
          completed_at: "" ,
          completion_description: "",
          assigned_to: 0,
          assigned_by: 0,
        });
      })
      .catch((err) => {
        console.error("Error creating task:", err);
      });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📝 Task Manager</h1>

      {/* Task Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md p-6 rounded-xl space-y-4 border"
      >
        <div>
          <label className="block font-semibold">Title</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label className="block font-semibold">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label className="block font-semibold">Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_completed"
            checked={formData.is_completed}
            onChange={handleChange}
          />
          <label>Mark as completed</label>
        </div>

        {formData.is_completed && (
          <div>
            <label className="block font-semibold">Completion Description</label>
            <input
              name="completion_description"
              value={formData.completion_description}
              onChange={handleChange}
              className="w-full border rounded p-2"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold">Assigned To (User ID)</label>
            <input
              name="assigned_to"
              type="number"
              value={formData.assigned_to}
              onChange={handleChange}
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block font-semibold">Assigned By (User ID)</label>
            <input
              name="assigned_by"
              type="number"
              value={formData.assigned_by}
              onChange={handleChange}
              className="w-full border rounded p-2"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded"
        >
          Create Task
        </button>
      </form>

      {/* Task List */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">📋 All Tasks</h2>
        {tasks.length === 0 ? (
          <p>No tasks available.</p>
        ) : (
          <div className="space-y-4">
            {tasks.map((task, index) => (
              <div key={index} className="border p-4 rounded shadow bg-gray-50">
                <h3 className="text-xl font-semibold">{task.title}</h3>
                <p>{task.description}</p>
                <p>
                  <span className="font-semibold">Due:</span>{" "}
                  {new Date(task.date).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-semibold">Status:</span>{" "}
                  {task.is_completed ? "✅ Completed" : "❌ Pending"}
                </p>
                {task.is_completed && (
                  <>
                    <p>
                      <span className="font-semibold">Completed At:</span>{" "}
                      {new Date(task.completed_at).toLocaleString()}
                    </p>
                    <p>
                      <span className="font-semibold">Completion Note:</span>{" "}
                      {task.completion_description}
                    </p>
                  </>
                )}
                <p className="text-sm text-gray-500">
                  Assigned To: {task.assigned_to} | By: {task.assigned_by}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
