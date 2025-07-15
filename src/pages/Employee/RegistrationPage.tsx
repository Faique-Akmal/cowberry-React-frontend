import React, { useState } from "react";
import axios from "axios";

export default function RegisterUserForm() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "0",
    department: "0",
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

    try {
      const response = await axios.post("http://192.168.0.144:8000/api/register/", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: Number(formData.role),         // 👈 Ensure numeric values
        department: Number(formData.department),
      });

      if (response.status === 201 || response.data.status === "success") {
        setMessage("User registered successfully!");
        setFormData({
          username: "",
          email: "",
          password: "",
          role: "0",
          department: "0",
        });
      } else {
        setIsError(true);
        setMessage(response.data.message || "Registration failed.");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      const errMsg =
        error.response?.data?.message || error.response?.data?.detail || "Server error occurred.";
      setMessage(errMsg);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">User Registration</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded"
        />

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded"
          required
        >
          <option value="0">Select Role</option>
          <option value="1">Admin</option>
          <option value="2">Manager</option>
          <option value="3">Employee</option>
        </select>

        <select
          name="department"
          value={formData.department}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded"
          required
        >
          <option value="0">Select Department</option>
          <option value="1">Development</option>
          <option value="2">Marketing</option>
          <option value="3">HR</option>
        </select>

        {message && (
          <p className={`text-sm ${isError ? "text-red-600" : "text-green-600"}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
