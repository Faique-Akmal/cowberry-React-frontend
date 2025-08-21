import React, { useState } from "react";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function RegisterUserForm() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    role: "",
    department: "",
    mobile_no: "",
    birth_date: "",
    address: "",
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("meUser") || "{}");
const userRole = currentUser?.role;
const userDepartment = currentUser?.department;

const isAdmin = userRole === 1;
const isDeptHead = userRole === 3;
const isManager = userRole === 4;

// Department options (only allow user's own department if not admin)
const departmentOptions = [
  { id: 1, name: "Support" },
  { id: 2, name: "Procurement" },
  { id: 3, name: "Electric" },
  { id: 4, name: "Order" },
  { id: 5, name: "Marketing" },
  { id: 6, name: "Accountant" },
  { id: 7, name: "IT" },
  { id: 8, name: "HR" },
];

const filteredDepartments = isAdmin
  ? departmentOptions
  : departmentOptions.filter((d) => d.id === userDepartment);

// Optional: restrict assignable roles based on current user's role
const roleOptions = [
  { id: 1, name: "Admin" },
  { id: 2, name: "HR" },
  { id: 3, name: "Department Head" },
  { id: 4, name: "Manager" },
  { id: 5, name: "Executive" },
  { id: 6, name: "Employee" },
  { id: 7, name: "Employee Office" },
];

// You can filter roleOptions here if needed


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);
    setIsLoading(true);

    // Ensure department match for non-admins
if (!isAdmin && parseInt(formData.department) !== userDepartment) {
  // setMessage("You can only assign users to your own department.");
  toast.error("You can only assign users to your own department.");
  setIsError(true);
  setIsLoading(false);
  return;
}


    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      // setMessage(" All fields are required.");
      toast.error("All fields are required.");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    if (!formData.role || !formData.department) {
      // setMessage(" Please select both Role and Department.");
      toast.error("Please select both Role and Department.");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        role: parseInt(formData.role),
        department: parseInt(formData.department),
      };

      const response = await API.post("/register/", payload);

      if (response.status === 201 || response.status === 200) {
        // setMessage(" User registered successfully!");
        toast.success("Registration successful!");
        setIsError(false);
        setFormData({
          first_name: "",
          last_name: "",
          username: "",
          email: "",
          password: "",
          role: "",
          department: "",
          mobile_no: "",
          birth_date: "",
          address: "",
        });
      } else {
        // setMessage(" Registration failed. Try again.");
        toast.error(t("toast.Registration failed. Try again."));
        setIsError(true);
      }
    } catch (error: any) {
      const data = error?.response?.data;
      const status = error?.response?.status;
      let errMsg = "Something went wrong.";

      if (status === 400 && typeof data === "object") {
        const firstError = Object.values(data)[0];
        errMsg = Array.isArray(firstError) ? firstError[0] : String(firstError);
      } else if (status === 409) {
        errMsg = " User already exists.";
      } else if (status === 422) {
        errMsg = " Validation error.";
      } else if (status === 500) {
        errMsg = " Internal Server Error.";
      } else if (error.code === "ECONNABORTED") {
        errMsg = " Request timed out.";
      }

      setMessage(errMsg);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border p-8 max-w-[700px] m-auto border-gray-200 bg-white dark:border-gray-800 dark:bg-black dark:text-white lg:p-10">
      <h2 className="text-2xl font-bold mb-3 text-center text-gray-800 dark:text-white">{t("register.User Registration")}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
       <div className="grid grid-cols-2 space-y-2 gap-5 ">

         <div>
           <input
          type="text"
          name="first_name"
          placeholder={t("register.First Name")}
          value={formData.first_name}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
         </div>
       <div>
         <input
          type="text"
          name="last_name"
          placeholder={t("register.Last Name")}
          value={formData.last_name}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
       </div>
       </div>
        <input
          type="text"
          name="username"
          placeholder={t("register.Username")}
          value={formData.username}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          type="email"
          name="email"
          placeholder={t("register.Email")}
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          type="password"
          name="password"
          placeholder={t("register.Password")}
          value={formData.password}
          onChange={handleChange}
          required
          minLength={6}
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">{t("register.Select Role")}</option>
          <option value="1">{t("register.Admin")}</option>
          <option value="2">{t("register.HR")}</option>
          <option value="3">{t("register.Department Head")}</option>
          <option value="4">{t("register.Manager")}</option>
          <option value="5">{t("register.Executive")}</option>
          <option value="6">{"Employee"}</option>
          <option value="6">{t("register.Employee_office")}</option>
        </select>
        <select
          name="department"
          value={formData.department}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">{t("register.Select Department")}</option>
          <option value="1">{t("register.support")}</option>
          <option value="2">{t("register.Procurement")}</option>
          <option value="3">{t("register.Electric")}</option>
          <option value="4">{t("register.Order")}</option>
          <option value="5">{t("register.Marketing")}</option>
          <option value="6">{t("register.Accountant")}</option>
          <option value="7">{"IT"}</option>
          <option value="8">{t("register.HR")}</option>
        </select>
        <input
          type="tel"
          name="mobile_no"
          placeholder={t("profile.mobile_no")}
          value={formData.mobile_no}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <label>{t("register.D.O.B.")}</label>
        <input
          type="date"
          name="birth_date"
          placeholder="Birth Date"
          value={formData.birth_date}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          type="text"
          name="address"
          placeholder={t("register.Enter address here")}
          value={formData.address}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        {message && (
          <div className={`p-3 text-sm rounded ${isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-cowberry-green-600 text-white py-2 rounded hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t("register.Registering...") : t("register.Register")}
        </button>
      </form>
    </div>
  );
}
