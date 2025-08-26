import { useState, useEffect } from "react";
import API from "../../api/axios";
import { ImCross } from "react-icons/im";

const UpdateTaskModal = ({ task, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    status: "",
    completion_description: "",
    completed_at: "",
    is_completed: false,
  });

  // Update form when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        status: task.status || "",
        completion_description: task.completion_description || "",
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
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">

   <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4">

        <h2 className="text-xl font-bold mb-4 p-4">Update Task</h2>
            <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
          >
            <ImCross className="w-5 h-5" />
          </button>


        {/* Status */}
       {/* <div className="space-y-2 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"> */}
              {/* <Clock className="w-4 h-4" /> */}
              {/* Task Status
            </label>
            <div className="relative">
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 appearance-none bg-white cursor-pointer"
              >
                <option value="">Select task status</option>
                <option value="pending">🔄 Pending</option>
                <option value="completed">✅ Completed</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div> */}


        {/* completion_description */}
        <div className="space-y-2 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {/* <Calendar className="w-4 h-4" /> */}
              Completion Date & Time
            </label>
            <input
              type="datetime-local"
              name="completed_at"
              value={formData.completed_at}
              onChange={handleChange}
              className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200"
            />
          </div>

              <div className="space-y-2 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {/* <FileText className="w-4 h-4" /> */}
              Completion Notes
            </label>
            <textarea
              name="completion_description"
              value={formData.completion_description}
              onChange={handleChange}
              placeholder="Describe what was completed or any additional notes..."
              rows="4"
              className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 resize-none"
            />
          </div>



        {/* Completed At */}
           <div className="space-y-3 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {/* <Check className="w-4 h-4" /> */}
              Mark as Completed
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, is_completed: true }))}
                className={`flex-1 p-3 rounded-xl font-medium transition-all duration-200 ${
                  formData.is_completed
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                ✅ Yes
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, is_completed: false }))}
                className={`flex-1 p-3 rounded-xl font-medium transition-all duration-200 ${
                  !formData.is_completed
                    ? 'bg-gray-500 text-white shadow-lg shadow-gray-500/25'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                ❌ No
              </button>
            </div>
          </div>
      

        {/* Is Completed
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
        </select> */}

        {/* Buttons */}
        <div className="flex justify-end gap-2 p-4">
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
