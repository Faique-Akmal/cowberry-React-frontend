import React, { useState } from "react";
import axios from "axios";

import API from "../../api/axios";

export default function RegisterUserForm() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "",
    department: "",
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

    // Validation
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      setMessage("❌ All fields are required.");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    if (!formData.role || !formData.department) {
      setMessage("❌ Please select both Role and Department.");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      // Payload setup - update according to backend expectations
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: parseInt(formData.role, 10),
        department: parseInt(formData.department, 10),
      };

      console.log("Payload:", payload);

      const response = await API.post("/register/", payload, {
       
      });

      if (response.status === 201 || response.status === 200) {
        setMessage("✅ User registered successfully!");
        setIsError(false);
        setFormData({
          username: "",
          email: "",
          password: "",
          role: "",
          department: "",
        });
      } else {
        setMessage("❌ Registration failed. Try again.");
        setIsError(true);
      }
    } catch (error: any) {
      console.error("Error response:", error?.response?.data);

      let errMsg = "❌ Something went wrong.";
      const data = error?.response?.data;
      const status = error?.response?.status;

      if (status === 400 && data && typeof data === "object") {
        const firstError = Object.values(data)[0];
        errMsg = Array.isArray(firstError) ? firstError[0] : String(firstError);
      } else if (status === 409) {
        errMsg = "❌ User already exists.";
      } else if (status === 422) {
        errMsg = "❌ Validation error.";
      } else if (status === 500) {
        errMsg = "❌ Internal Server Error.";
      } else if (error.code === "ECONNABORTED") {
        errMsg = "❌ Request timed out.";
      }

      setMessage(errMsg);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">User Registration</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          minLength={6}
        />

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select Role</option>
          <option value="1">Admin</option>
          <option value="2">HR</option>
          <option value="3">Department Head</option>
          <option value="4">Manager</option>
          <option value="5">Executive</option>
          <option value="6">Employee</option>
        </select>

        <select
          name="department"
          value={formData.department}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select Department</option>
          <option value="1">HR</option>
          <option value="2">Sales</option>
          <option value="3">Support</option>
          <option value="4">IT</option>
          <option value="5">Product</option>
          <option value="6">Accountant</option>
        </select>

        {message && (
          <div className={`p-3 text-sm rounded ${isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
