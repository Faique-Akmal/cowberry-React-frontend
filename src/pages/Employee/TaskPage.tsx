import React, { useState } from "react";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const TaskPage = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    address: "",
    // date: "",
    // is_completed: false,
    // completed_at: "",
    completion_description: "",
    assigned_to: "",
    assigned_by: "",
    created_by: "",
  });

  const [message, setMessage] = useState("");
  const { t } = useTranslation();
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
      // !formData.date ||
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

      // setMessage("✅ Task created successfully!");
            toast.success("✅ Task created successfully!"); 
      setFormData({
        title: "",
        description: "",
        start_date: "",
        address: "",
        // date: "",
        // is_completed: false,
        // completed_at: "",
        completion_description: "",
        assigned_to: "",
        assigned_by: "",
        created_by: "",
      });
    } catch (error: any) {
      console.error("Error:", error);
      // setMessage("❌ Error creating task. Please try again.");
      toast.error("Error creating task. Please try again.");
    }
  };

  return (
    <div className="rounded-2xl border p-8 border-gray-200 bg-white dark:border-gray-800 dark:bg-black dark:text-white lg:p-10">
      <h2 className="text-2xl font-bold mb-4 text-center">{t("task.Assign New Task")}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          placeholder={t("task.Title")}
          maxLength={255}
          required
          value={formData.title}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <textarea
          name="description"
          placeholder={t("task.Description")}
          required
          value={formData.description}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
       <label>{t("task.Start Date")}</label>
        <input
          type="date"
          name="start_date"
          placeholder="Start Date"
          required
          value={formData.start_date}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />


        <label>{t("task.Destination")}</label>
        <input
          type="text"
          name="address"
          placeholder={t("task.Enter address here")}
          value={formData.address}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />
{/* 
     <label>Due Date</label>
        <input
          type="date"
          name="date"
          placeholder="Due Date"
          required
          value={formData.date}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        /> */}
{/* 
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
        /> */}

        <input
          type="text"
          name="completion_description"
          placeholder={t("task.Completion Description")}
          value={formData.completion_description}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          type="number"
          name="assigned_to"
          placeholder={t("task.Assigned To (User ID)")}
          required
          value={formData.assigned_to}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          type="number"
          name="assigned_by"
          placeholder={t("task.Assigned By (Your ID)")}
          required
          value={formData.assigned_by}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          type="number"
          name="created_by"
          placeholder={t("task.Created By (Your ID)")}
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
          className="w-full bg-cowberry-green-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {t("task.Create Task")}
        </button>
      </form>
    </div>
  );
};

export default TaskPage;
