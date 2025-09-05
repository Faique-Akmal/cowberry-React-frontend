import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext.tsx";
import { useData } from "../../context/DataProvider"; 
import API from "../../api/axios";

const DEPT_ID_TO_NAME: Record<string, string> = {
  "8": "HR",
  "7": "IT",
  "6": "Accounts",
  "5": "Marketing",
  "4": "Order",
  "3": "Electric",
  "2": "Procurement",
  "1": "Support",
};

const TaskPage = () => {
  const { themeConfig } = useTheme();
  const { fetchUsers } = useData(); // ✅ from DataProvider
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    address: "",
    completion_description: "",
    assigned_to: "",
    assigned_by: "",
    created_by: "",
  });

  const [users, setUsers] = useState<any[]>([]);
  const [meUser, setMeUser] = useState<any>(null);
  const [message, setMessage] = useState("");

  // ✅ Load current user once
  useEffect(() => {
    const meUserRaw = localStorage.getItem("meUser");
    const parsed = meUserRaw ? JSON.parse(meUserRaw) : null;

    if (parsed?.id) {
      setMeUser(parsed);
      setFormData((prev) => ({
        ...prev,
        assigned_by: parsed.id, // auto fill
      }));
    }
  }, []);

  // ✅ Fetch and filter users from DataProvider
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const allUsers = await fetchUsers();

        if (!meUser?.department) {
          console.warn("⚠️ No department in meUser, showing all");
          setUsers(allUsers);
          return;
        }

        // --- department normalization ---
        const normalizeDept = (dept: any): string | null => {
          if (!dept) return null;
          if (typeof dept === "string") return dept.toLowerCase();
          if (typeof dept === "object") return dept.name?.toLowerCase() ?? null;
          if (typeof dept === "number")
            return DEPT_ID_TO_NAME[String(dept)]?.toLowerCase() ?? null;
          return null;
        };

        const myDept = normalizeDept(meUser.department);
        const filtered = allUsers.filter((u) => {
          const userDept = normalizeDept(u.department);
          return userDept === myDept;
        });

        setUsers(filtered);
      } catch (err) {
        console.error("❌ Error fetching users:", err);
        toast.error("Failed to load users");
      }
    };

    if (meUser) loadUsers();
  }, [meUser, fetchUsers]);

  // ✅ Form field change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.assigned_to ||
      !formData.assigned_by
    ) {
      setMessage("❌ Please fill all required fields.");
      return;
    }

    try {
      await API.post("/tasks/", {
        ...formData,
        assigned_to: parseInt(formData.assigned_to),
        assigned_by: parseInt(formData.assigned_by),
        created_by: parseInt(formData.created_by),
      });

      toast.success("✅ Task created successfully!");
      setFormData({
        title: "",
        description: "",
        start_date: "",
        address: "",
        completion_description: "",
        assigned_to: "",
        assigned_by: meUser?.id || "",
        created_by: "",
      });
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error creating task. Please try again.");
    }
  };

  return (
    <div
      style={{
        backgroundColor: themeConfig.content.background,
        color: themeConfig.content.text,
      }}
      className="rounded-2xl border p-8 border-gray-200 dark:border-gray-800 dark:bg-black dark:text-white lg:p-10"
    >
      <h2 className="text-2xl font-bold mb-4 text-center">
        {t("task.Assign New Task")}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
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

        {/* Description */}
        <textarea
          name="description"
          placeholder={t("task.Description")}
          required
          value={formData.description}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        {/* Start Date */}
        <label>{t("task.Start Date")}</label>
        <input
          type="date"
          name="start_date"
          required
          value={formData.start_date}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          min={new Date().toISOString().split("T")[0]}
          onFocus={(e) => e.target.showPicker?.()}
        />

        {/* Destination */}
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

        {/* Completion Description */}
        <input
          type="text"
          name="completion_description"
          placeholder={t("task.Completion Description")}
          value={formData.completion_description}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        {/* Assigned To Dropdown */}
        <label>Assigned To</label>
        <select
          name="assigned_to"
          required
          value={formData.assigned_to}
          onChange={handleChange}
          className="w-full border p-2 rounded dark:bg-black bg-white text-black dark:text-white max-h-40 overflow-y-auto"
          size={5}
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username || user.name || `User ${user.id}`}
            </option>
          ))}
        </select>

        {/* Assigned By */}
        <label>Assigned By</label>
        <select
          name="assigned_by"
          required
          value={formData.assigned_by}
          className="w-full border p-2 rounded dark:bg-black bg-gray-200 text-black dark:text-white"
          disabled
        >
          {meUser && (
            <option value={meUser.id}>
              {meUser.username || meUser.name || `User ${meUser.id}`}
            </option>
          )}
        </select>

        {/* Created By Dropdown */}
        <label>Created By</label>
        <select
          name="created_by"
          required
          value={formData.created_by}
          onChange={handleChange}
          className="w-full border p-2 rounded dark:bg-black bg-white text-black dark:text-white max-h-40 overflow-y-auto"
          size={5}
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username || user.name || `User ${user.id}`}
            </option>
          ))}
        </select>

        {message && (
          <p
            className={`text-sm ${
              message.startsWith("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
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
