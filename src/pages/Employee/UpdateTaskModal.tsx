import { useState } from "react";
import axios from "axios";

const Upcompleted_atTaskModal = ({ task, isOpen, onClose, onUpcompleted_at }) => {
  const [formData, setFormData] = useState({
    // title: task?.title || "",
    status: task?.status || "",
    description: task?.description || "",
    completed_at: task?.completed_at || "",
    is_completed: task?.is_completed || "",
  });

  // Upcompleted_at local state on input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // PUT API call
  const handleUpcompleted_at = async () => {
    try {
      const res = await axios.put(
        `http://192.168.0.144:8000/api/tasks/${task.id}/`,
        formData
      );
      onUpcompleted_at(res.data); // refresh parent UI
      onClose();
    } catch (error) {
      console.error("Upcompleted_at failed", error);
    }
  };

  if (!isOpen) return null;

  return (
   <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-black dark:text-white rounded-xl p-6 w-[400px]">
        <h2 className="text-xl font-bold mb-4">Update Task</h2>

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

        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Task Description"
          className="w-full p-2 mb-3 border rounded"
        />

        <input
  type="datetime-local"
  name="completed_at"
  value={formData.completed_at}
  onChange={handleChange}
  className="w-full p-2 mb-3 border rounded"
/>



                <select
            name="is_completed"
            value={formData.is_completed}
                    onChange={handleChange}
            className="w-full p-2 mb-3 border rounded"
                            >
                <option value="">-- Select Status --</option>
                <option value="true">True</option>
                <option value="false">False</option>
                </select>


        {/* <input
          type="text"
          name="is_completed"
          value={formData.is_completed}
          onChange={handleChange}
          placeholder="Task is_completed"
          className="w-full p-2 mb-3 border rounded"
        /> */}

        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 bg-gray-400 text-white rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={handleUpcompleted_at}
          >
            Upcompleted_at
          </button>
        </div>
      </div>
    </div>
  );
};

export default Upcompleted_atTaskModal;
