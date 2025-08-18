import { useState, useEffect } from "react";
import API from "../../api/axios";

const UpdateTaskModal = ({ task, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    status: "",
    description: "",
    completed_at: "",
    is_completed: false,
  });

  // Update form when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        status: task.status || "",
        description: task.description || "",
        completed_at: task.completed_at
          ? task.completed_at.slice(0, 16) // format for datetime-local input
          : "",
        is_completed: task.is_completed ?? false,
      });
    }
  }, [task]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "is_completed") {
      setFormData((prev) => ({ ...prev, [name]: value === "true" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // PATCH API call
  const handleUpdate = async () => {
    try {
      // prepare payload: only include fields that are not empty
      const payload: any = {};
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== "" && formData[key] !== null) {
          payload[key] = formData[key];
        }
      });

      const res = await API.patch(`/tasks/${task.id}/`, payload);
      onUpdate(res.data); // refresh parent UI
      onClose();
    } catch (error) {
      console.error("Task update failed", error.response?.data || error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-black dark:text-white rounded-xl p-6 w-[400px]">
        <h2 className="text-xl font-bold mb-4">Update Task</h2>

        {/* Status */}
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full p-2 mb-3 border rounded"
        >
          <option value="">-- Select Status --</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>

        {/* Description */}
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Task Description"
          className="w-full p-2 mb-3 border rounded"
        />

        {/* Completed At */}
        <input
          type="datetime-local"
          name="completed_at"
          value={formData.completed_at}
          onChange={handleChange}
          className="w-full p-2 mb-3 border rounded"
        />

        {/* Is Completed */}
        <h2>Is Completed</h2>
        <select
          name="is_completed"
          value={formData.is_completed ? "true" : "false"}
          onChange={handleChange}
          className="w-full p-2 mb-3 border rounded"
        >
          <option value="">-- Select --</option>
          <option value="true">True</option>
          <option value="false">False</option>
        </select>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 bg-gray-400 text-white rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={handleUpdate}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateTaskModal;
