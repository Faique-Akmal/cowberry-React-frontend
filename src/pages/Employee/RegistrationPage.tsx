import React, { useState } from "react";
import API from "../../api/axios";

export default function RegisterUserForm() {
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

    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      setMessage(" All fields are required.");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    if (!formData.role || !formData.department) {
      setMessage(" Please select both Role and Department.");
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
        setMessage(" User registered successfully!");
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
        setMessage(" Registration failed. Try again.");
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
    <div className="max-w-md mx-auto px-6 rounded-xl shadow-md bg-[url('/old-paper-texture.jpg')] bg-cover">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">User Registration</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="first_name"
          placeholder="First Name"
          value={formData.first_name}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          type="text"
          name="last_name"
          placeholder="Last Name"
          value={formData.last_name}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
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
          <option value="1">support</option>
          <option value="2">Procurement</option>
          <option value="3">Electric</option>
          <option value="4">Order</option>
          <option value="5">Marketing</option>
          <option value="6">Accountant</option>
          <option value="7">IT</option>
          <option value="8">HR</option>
        </select>
        <input
          type="tel"
          name="mobile_no"
          placeholder="Mobile No."
          value={formData.mobile_no}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
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
          placeholder="Enter address here"
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
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
