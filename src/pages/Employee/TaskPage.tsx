import React, { useState } from "react";
import API from "../../api/axios";

const TaskPage = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    address: "",
    date: "",
    is_completed: false,
    completed_at: "",
    completion_description: "",
    assigned_to: "",
    assigned_by: "",
    created_by: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.date ||
      !formData.assigned_to ||
      !formData.assigned_by
    ) {
      setMessage("❌ Please fill all required fields.");
      return;
    }

    try {
      const response = await API.post("/tasks/", {
        ...formData,
        assigned_to: parseInt(formData.assigned_to),
        assigned_by: parseInt(formData.assigned_by),
        created_by: parseInt(formData.created_by),
      });

      setMessage("✅ Task created successfully!");

      setFormData({
        title: "",
        description: "",
        start_date: "",
        address: "",
        date: "",
        is_completed: false,
        completed_at: "",
        completion_description: "",
        assigned_to: "",
        assigned_by: "",
        created_by: "",
      });
    } catch (error: any) {
      console.error("Error:", error);
      setMessage("❌ Error creating task. Please try again.");
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-transparent shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Assign New Task</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          placeholder="Title"
          maxLength={255}
          required
          value={formData.title}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <textarea
          name="description"
          placeholder="Description"
          required
          value={formData.description}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          type="date"
          name="start_date"
          placeholder="Start Date"
          required
          value={formData.start_date}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          name="address"
          placeholder="Enter address here"
          value={formData.address}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />

        <input
          type="date"
          name="date"
          placeholder="Due Date"
          required
          value={formData.date}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_completed"
            checked={formData.is_completed}
            onChange={handleChange}
          />
          Is Completed?
        </label>

        <input
          type="datetime-local"
          name="completed_at"
          value={formData.completed_at}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          name="completion_description"
          placeholder="Completion Description"
          value={formData.completion_description}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          type="number"
          name="assigned_to"
          placeholder="Assigned To (User ID)"
          required
          value={formData.assigned_to}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          type="number"
          name="assigned_by"
          placeholder="Assigned By (Your ID)"
          required
          value={formData.assigned_by}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          type="number"
          name="created_by"
          placeholder="Created By (Your ID)"
          required
          value={formData.created_by}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        {message && (
          <p className={`text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Create Task
        </button>
      </form>
    </div>
  );
};

export default TaskPage;
