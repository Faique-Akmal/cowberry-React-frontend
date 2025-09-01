import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const TaskPage = () => {
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
  const { t } = useTranslation();

  // ✅ Fetch users filtered by department
  // --- Department maps (ID <-> Name) ---
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
// const DEPT_NAME_TO_ID: Record<string, string> = Object.fromEntries(
//   Object.entries(DEPT_ID_TO_NAME).map(([id, name]) => [name.toLowerCase(), id])
// );

// --- Helpers to normalize department values ---
// const getStoredDeptId = (): string | null => {
//   const raw = localStorage.getItem("department");
//   console.log("Stored department value:", raw);
//   if (!raw) return null;

//   // Try JSON first (e.g., {"id":7,"name":"IT"})
//   try {
//     const parsed = JSON.parse(raw);
//     if (parsed && typeof parsed === "object") {
//       if (parsed.id != null) return String(parsed.id);
//       if (parsed.name) return DEPT_NAME_TO_ID[String(parsed.name).toLowerCase()] ?? null;
//     }
//   } catch {
//     // not JSON, continue
//   }

//   const trimmed = raw.trim();
//   // If it's a number-like string, treat it as an ID
//   if (/^\d+$/.test(trimmed)) return trimmed;
//   // Otherwise treat as a name
//   return DEPT_NAME_TO_ID[trimmed.toLowerCase()] ?? null;
// };

// const getUserDeptId = (user: any): string | null => {
//   const dept = user?.department ?? user?.dept ?? user?.department_id;

//   if (dept == null) return null;

//   // Case 1: object { id, name }
//   if (typeof dept === "object") {
//     if (dept.id != null) return String(dept.id);
//     if (dept.name) return DEPT_NAME_TO_ID[String(dept.name).toLowerCase()] ?? null;
//     return null;
//   }

//   // Case 2: primitive (number or string)
//   if (typeof dept === "number") return String(dept);
//   if (typeof dept === "string") {
//     const val = dept.trim();
//     if (/^\d+$/.test(val)) return val; // "7"
//     return DEPT_NAME_TO_ID[val.toLowerCase()] ?? null; // "IT"
//   }

//   return null;
// };


useEffect(() => {
  const meUserRaw = localStorage.getItem("meUser");
  const parsed = meUserRaw ? JSON.parse(meUserRaw) : null;

  if (parsed?.id) {
    setMeUser(parsed);  // store in state
    setFormData((prev) => ({
      ...prev,
      assigned_by: parsed.id,  // auto fill
    }));
  }
}, []);


useEffect(() => {
  const fetchUsers = async () => {
    try {
      const res = await API.get("/users/");
      console.log("🔍 API RESPONSE DATA:", res.data);

      // Normalize user list
      let userList: any[] = [];
      if (Array.isArray(res.data)) {
        userList = res.data;
      } else if (Array.isArray(res.data?.results)) {
        userList = res.data.results;
      } else if (Array.isArray(res.data?.data)) {
        userList = res.data.data;
      } else if (Array.isArray(res.data?.users)) {
        userList = res.data.users;
      }

      console.log("✅ NORMALIZED USERS:", userList.length);

      // ✅ Get meUser from localStorage
      const meUserRaw = localStorage.getItem("meUser");
      const meUser = meUserRaw ? JSON.parse(meUserRaw) : null;

      if (!meUser?.department) {
        console.warn("⚠️ No department found in meUser");
        setUsers(userList);
        return;
      }

      // --- Helper to normalize department ---
      const normalizeDept = (dept: any): string | null => {
        if (!dept) return null;

        if (typeof dept === "string") {
          return dept.toLowerCase();
        }
        if (typeof dept === "object") {
          return dept.name?.toLowerCase() ?? null;
        }
        if (typeof dept === "number") {
          return DEPT_ID_TO_NAME[String(dept)]?.toLowerCase() ?? null;
        }
        return null;
      };

      // --- Get my department ---
      const myDept = normalizeDept(meUser.department);
      console.log("👤 My department:", myDept);

      // --- Filter users by my department ---
      const filteredUsers = userList.filter((user: any) => {
        const userDept = normalizeDept(user.department);
        return userDept === myDept; // same department only
      });

      console.log("✅ FILTERED USERS:", filteredUsers);
      setUsers(filteredUsers);
    } catch (error) {
      console.error("❌ ERROR FETCHING USERS:", error);
      toast.error("Failed to load users");
    }
  };

  fetchUsers();
}, []);



const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
   const { name, value } = e.target;
  setFormData((prev) => ({
    ...prev,
    [name]: value,   // updates the correct field
  }));

    // // ✅ Special handling for start_date validation
    // if (name === "start_date") {
    //   const today = new Date();
    //   const selected = new Date(value);

    //   // Reset time part for accurate comparison
    //   today.setHours(0, 0, 0, 0);
    //   selected.setHours(0, 0, 0, 0);

    //   if (selected < today) {
    //     toast.error("❌ Start date cannot be in the past!");
    //     return;
    //   }
    }

  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: type === "checkbox" ? checked : value,
  //   }));
  // };

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
        assigned_by: "",
        created_by: "",
      });
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error creating task. Please try again.");
    }
  };

  return (
    <div className="rounded-2xl border p-8 border-gray-200 bg-white dark:border-gray-800 dark:bg-black dark:text-white lg:p-10">
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
          className="w-full border p-2 rounded dark:bg-black"
        >
          <option value="">Select User</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username || user.name || `User ${user.id}`}
            </option>
          ))}
        </select>

  <label>Assigned By</label>
<select
  name="assigned_by"
  required
  value={formData.assigned_by}
  className="w-full border p-2 rounded dark:bg-black"
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
          className="w-full border p-2 rounded dark:bg-black"
        >
          <option value="">Select User</option>
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