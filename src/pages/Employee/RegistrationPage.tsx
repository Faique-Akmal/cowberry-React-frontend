  import React, { useState, useEffect } from "react";
  import API from "../../api/axios";
  import toast from "react-hot-toast";
  import { useTranslation } from "react-i18next";
  import { useTheme } from '../../context/ThemeContext.tsx';
  import { FaUserPlus, FaBuilding, FaUserTag, FaSpinner } from "react-icons/fa";

  interface Department {
    id: number;
    name: string;
  }

  interface Role {
    id: number;
    name: string;
  }

  export default function RegisterUserForm() {
    const { themeConfig } = useTheme();
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

    const [departments, setDepartments] = useState<string[]>([]);
    const [roles, setRoles] = useState<string[]>([]);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const currentUser = JSON.parse(localStorage.getItem("meUser") || "{}");
    const userRole = currentUser?.role;
    const userDepartment = currentUser?.department;
    const isAdmin = userRole === 1;

    // Fetch departments and roles from API
    useEffect(() => {
      const fetchData = async () => {
        try {
          setIsLoadingData(true);
          
          // Fetch departments
          const deptResponse = await API.get("/departments/static_departments");
          console.log("Departments API response:", deptResponse.data);
          
          if (deptResponse.data?.departments && Array.isArray(deptResponse.data.departments)) {
            setDepartments(deptResponse.data.departments);
          }

          // Fetch roles
          const roleResponse = await API.get("/roles/static_roles");
          console.log("Roles API response:", roleResponse.data);
          
          if (roleResponse.data?.roles && Array.isArray(roleResponse.data.roles)) {
            setRoles(roleResponse.data.roles);
          }
        } catch (error: any) {
          console.error("Error fetching data:", error);
          console.error("Error details:", error.response?.data);
          toast.error("Failed to load departments and roles");
        } finally {
          setIsLoadingData(false);
        }
      };

      fetchData();
    }, []);

    // Filter departments based on user permissions
    const filteredDepartments = isAdmin
      ? departments
      : departments.filter((dept) => 
          userDepartment && dept === userDepartment
        );

    // Filter roles based on user permissions
    const filteredRoles = isAdmin
      ? roles
      : roles.filter((role) => role !== "Admin"); // Non-admins can't create admin users

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

      // Basic validation
      if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
        toast.error("All fields are required.");
        setIsError(true);
        setIsLoading(false);
        return;
      }

      if (!formData.role || !formData.department) {
        toast.error("Please select both Role and Department.");
        setIsError(true);
        setIsLoading(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address.");
        setIsError(true);
        setIsLoading(false);
        return;
      }

      // Password validation (minimum 8 characters)
      if (formData.password.length < 8) {
        toast.error("Password must be at least 8 characters long.");
        setIsError(true);
        setIsLoading(false);
        return;
      }

      // Mobile number validation
      if (formData.mobile_no && !/^\d{10}$/.test(formData.mobile_no)) {
        toast.error("Please enter a valid 10-digit mobile number.");
        setIsError(true);
        setIsLoading(false);
        return;
      }

      try {
        const payload = {
          ...formData,
          role: formData.role,
          department: formData.department,
        };

        console.log("Submitting payload:", payload);

        const response = await API.post("/admin/register/", payload);

        if (response.status === 201 || response.status === 200) {
          toast.success("Registration successful!");
          setIsError(false);
          // Reset form
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
        }
      } catch (error: any) {
        console.error("Registration error:", error);
        const data = error?.response?.data;
        const status = error?.response?.status;
        let errMsg = "Something went wrong.";

        if (status === 400 && typeof data === "object") {
          const firstError = Object.values(data)[0];
          errMsg = Array.isArray(firstError) ? firstError[0] : String(firstError);
        } else if (status === 409) {
          errMsg = "User already exists with this email or username.";
        } else if (status === 422) {
          errMsg = "Validation error. Please check your input.";
          // Show specific validation errors
          if (data?.detail) {
            errMsg = data.detail;
          }
        } else if (status === 500) {
          errMsg = "Internal Server Error. Please try again later.";
        } else if (error.code === "ECONNABORTED") {
          errMsg = "Request timed out. Please check your connection.";
        } else if (error.message === "Network Error") {
          errMsg = "Network error. Please check your connection.";
        }

        toast.error(errMsg);
        setMessage(errMsg);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Debug: Check what data we have
    console.log("Departments state:", departments);
    console.log("Roles state:", roles);
    console.log("Filtered departments:", filteredDepartments);
    console.log("Filtered roles:", filteredRoles);
    console.log("User department:", userDepartment);
    console.log("Is admin:", isAdmin);

    if (isLoadingData) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Loading form data...</p>
          </div>
        </div>
      );
    }

    return (
      <div 
        style={{
          backgroundColor: themeConfig.content.background,
          color: themeConfig.content.text,
        }}
        className="rounded-2xl border p-6 md:p-8 max-w-3xl mx-auto border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
            <FaUserPlus className="text-white text-2xl" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">
            {t("register.User Registration")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Register new users with appropriate roles and departments
          </p>
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
              <p>Debug: {departments.length} departments loaded</p>
              <p>Debug: {roles.length} roles loaded</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <FaUserPlus className="text-blue-500" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  placeholder="Enter first name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 dark:border-gray-700 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  placeholder="Enter last name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 dark:border-gray-700 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Account Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 dark:border-gray-700 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 dark:border-gray-700 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full border border-gray-300 dark:border-gray-700 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Password must be at least 8 characters long
                </p>
              </div>
            </div>
          </div>

          {/* Role and Department */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Role & Department
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <FaUserTag className="text-blue-500" />
                  Select Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 dark:border-gray-700 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Choose a role</option>
                  {filteredRoles.length > 0 ? (
                    filteredRoles.map((role, index) => (
                      <option key={index} value={role}>
                        {role}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No roles available
                    </option>
                  )}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {filteredRoles.length} role(s) available
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <FaBuilding className="text-blue-500" />
                  Select Department *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 dark:border-gray-700 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Choose a department</option>
                  {filteredDepartments.length > 0 ? (
                    filteredDepartments.map((dept, index) => (
                      <option key={index} value={dept}>
                        {dept}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No departments available
                    </option>
                  )}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {filteredDepartments.length} department(s) available
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Additional Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  name="mobile_no"
                  placeholder="10-digit mobile number"
                  value={formData.mobile_no}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-700 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-700 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="Enter complete address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-700 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {message && (
            <div className={`p-4 rounded-lg ${isError ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'}`}>
              <div className="flex items-center gap-2">
                {isError ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{message}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading || filteredDepartments.length === 0 || filteredRoles.length === 0}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <FaUserPlus />
                  Register User
                </>
              )}
            </button>
          </div>

          {/* Form Notes */}
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
            <p>Fields marked with * are required</p>
            <p className="mt-1">Make sure to assign appropriate roles and departments based on user permissions</p>
            {filteredDepartments.length === 0 && (
              <p className="text-red-500 dark:text-red-400 mt-1">
                No departments available. Please contact administrator.
              </p>
            )}
            {filteredRoles.length === 0 && (
              <p className="text-red-500 dark:text-red-400 mt-1">
                No roles available. Please contact administrator.
              </p>
            )}
          </div>
        </form>
      </div>
    );
  }