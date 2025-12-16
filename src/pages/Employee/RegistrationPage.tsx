import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useTheme } from '../../context/ThemeContext.tsx';
import { FaUserPlus, FaBuilding, FaUserTag, FaSpinner } from "react-icons/fa";

interface Department {
  departmentId: number;
  name: string;
}

export default function RegisterUserForm() {
  const { themeConfig } = useTheme();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    email: "",
    password: "",
    role: "",
    mobileNo: "",
    departmentId: "",
    address: "",
    birthDate: "",
    profileImageUrl: "",
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Get current user from localStorage
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem("meUser");
      if (!userData) return null;
      return JSON.parse(userData);
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
      return null;
    }
  };

  const currentUser = getCurrentUser();
  const userRole = currentUser?.role;
  const userDepartmentId = currentUser?.departmentId;

  // Check if user has permission to register (HR or Manager can register users)
  const canRegisterAllDepartments = userRole && (
    userRole.toLowerCase() === "hr" || 
    userRole.toLowerCase() === "manager"
  );

  // Fetch departments and roles from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        
        // Fetch departments
        const deptResponse = await API.get("/departments/static_departments");
        
        if (deptResponse.data?.departments && Array.isArray(deptResponse.data.departments)) {
          const deptData = deptResponse.data.departments;
          setDepartments(deptData);
        } else {
          console.error("Invalid departments format:", deptResponse.data);
          toast.error("Invalid departments data format");
        }

        // Fetch roles
        const roleResponse = await API.get("/roles/static_roles");
        
        if (roleResponse.data?.roles && Array.isArray(roleResponse.data.roles)) {
          const roleData = roleResponse.data.roles;
          setRoles(roleData);
        } else {
          console.error("Invalid roles format:", roleResponse.data);
          toast.error("Invalid roles data format");
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        if (error.response?.status === 404) {
          toast.error("API endpoints not found. Please check your API configuration.");
        } else if (error.response?.status === 401) {
          toast.error("Unauthorized. Please login again.");
        } else if (error.message === "Network Error") {
          toast.error("Network error. Please check your connection.");
        } else {
          toast.error("Failed to load departments and roles");
        }
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Filter roles based on user permissions
  const filteredRoles = React.useMemo(() => {
    return roles;
  }, [roles]);

  // Handler for input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler for file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        toast.error("File size too large. Maximum size is 5MB.");
        return;
      }

      // Check file type
      if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
        toast.error("Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP).");
        return;
      }

      // Convert to base64 for immediate preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        setFormData(prev => ({
          ...prev,
          profileImageUrl: base64Image
        }));
        toast.success("Image uploaded successfully!");
      };
      reader.onerror = () => {
        toast.error("Failed to read image file.");
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler for removing image
  const handleImageChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      profileImageUrl: value
    }));
    if (!value) {
      toast("Image removed", { icon: "🗑️" });
    }
  };

  // Handler for form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);
    setIsLoading(true);

    // Basic validation
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim() || !formData.full_name.trim()) {
      toast.error("Username, Full Name, Email and Password are required.");
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

    // Mobile number validation (if provided)
    if (formData.mobileNo && !/^\d{10}$/.test(formData.mobileNo.replace(/\D/g, ''))) {
      toast.error("Please enter a valid 10-digit mobile number.");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    // Password validation
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      // Prepare payload according to API requirements
      const payload = {
        username: formData.username.trim(),
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        mobileNo: formData.mobileNo || null,
        departmentId: parseInt(formData.departmentId),
        address: formData.address || null,
        birthDate: formData.birthDate || null,
        profileImageUrl: formData.profileImageUrl || null,
      };

      console.log("Submitting payload:", payload);

      // Make POST request to the correct endpoint
      const response = await API.post("/auth/register", payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.status === 200 || response.status === 201) {
        const responseData = response.data;
        toast.success(responseData.message || "Registration successful!");
        setMessage(responseData.message || "User registered successfully!");
        setIsError(false);
        
        // Send email to the newly registered user
        await sendRegistrationEmail(payload, responseData.user);
        
        // Reset form
        setFormData({
          username: "",
          full_name: "",
          email: "",
          password: "",
          role: "",
          mobileNo: "",
          departmentId: "",
          address: "",
          birthDate: "",
          profileImageUrl: "",
        });
        
        // Hide URL input if it's open
        setShowUrlInput(false);
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Registration failed. Please try again.";
      toast.error(errorMessage);
      setMessage(errorMessage);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to send registration email
  const sendRegistrationEmail = async (userData: any, responseUser: any) => {
    try {
      const emailData = {
        to: userData.email,
        subject: "Welcome to Our Platform - Account Created Successfully",
        username: userData.username,
        employee_code: responseUser.employee_code || responseUser.employeeCode || "N/A",
        password: userData.password,
        role: userData.role,
        full_name: userData.full_name,
      };

      const emailResponse = await API.post("/email/send-registration-email", emailData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (emailResponse.status === 200) {
        console.log("Registration email sent successfully");
        toast.success("Welcome email sent to user!");
      } else {
        console.warn("Email sending failed:", emailResponse.data);
        toast("User registered but email sending failed", { icon: "⚠️" });
      }
    } catch (emailError: any) {
      console.error("Error sending registration email:", emailError);
      toast("User registered but email notification failed", { icon: "⚠️" });
    }
  };

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
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 lg:px-6 rounded-3xl bg-gradient-to-br from-white/20 via-white/10 to-white/5 dark:from-gray-900/30 dark:via-gray-800/20 dark:to-gray-900/10 backdrop-blur-2xl border border-white/40 dark:border-gray-700/40 p-4 lg:p-6 xl:p-8 shadow-[0_8px_32px_rgba(31,38,135,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] overflow-hidden relative">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
      
      {/* Header */}
      <div className="text-center mb-8 relative z-10">
        {/* <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500/80 to-indigo-600/80 backdrop-blur-lg border border-blue-400/50 dark:border-indigo-500/50 rounded-2xl mb-4 shadow-[0_4px_20px_rgba(59,130,246,0.3)]">
          <FaUserPlus className="text-white text-2xl" />
        </div> */}
        <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-green-600 via-indigo-600 to-green-600 dark:from-green-400 dark:via-indigo-400 dark:to-green-400 bg-clip-text text-transparent">
          User Registration
        </h2>
        {/* <p className="text-gray-600 dark:text-gray-400 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl px-4 py-2 inline-block">
          Register new users with appropriate roles and departments
        </p> */}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        {/* Personal Information */}
        <div className="bg-gradient-to-br from-white/40 to-white/20 dark:from-gray-800/40 dark:to-gray-900/20 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-sm border border-blue-400/30 dark:border-indigo-500/30">
              <FaUserPlus className="text-blue-500 dark:text-blue-400" />
            </div>
            Personal Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                placeholder="Enter full name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/60 dark:border-gray-600/60 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Username *
              </label>
              <input
                type="text"
                name="username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/60 dark:border-gray-600/60 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-gradient-to-br from-white/40 to-white/20 dark:from-gray-800/40 dark:to-gray-900/20 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Account Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/60 dark:border-gray-600/60 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Password *
              </label>
              <input
                type="password"
                name="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/60 dark:border-gray-600/60 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300"
              />
              <p className="text-xs mt-1 px-2 py-1 text-gray-600 dark:text-gray-400 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg inline-block">
                Password must be at least 6 characters long
              </p>
            </div>
          </div>
        </div>

        {/* Role and Department */}
        <div className="bg-gradient-to-br from-white/40 to-white/20 dark:from-gray-800/40 dark:to-gray-900/20 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Role & Department
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-sm border border-blue-400/30 dark:border-indigo-500/30">
                  <FaUserTag className="text-blue-500 dark:text-blue-400" />
                </div>
                Select Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                disabled={filteredRoles.length === 0}
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/60 dark:border-gray-600/60 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23999' viewBox='0 0 256 256'%3E%3Cpath d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z'%3E%3C/path%3E%3C/svg%3E")`
                }}
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
              {/* <p className="text-xs mt-1 px-2 py-1 text-gray-600 dark:text-gray-400 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg inline-block">
                {filteredRoles.length} role(s) available
              </p> */}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-sm border border-blue-400/30 dark:border-indigo-500/30">
                  <FaBuilding className="text-blue-500 dark:text-blue-400" />
                </div>
                Select Department *
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/60 dark:border-gray-600/60 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23999' viewBox='0 0 256 256'%3E%3Cpath d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z'%3E%3C/path%3E%3C/svg%3E")`
                }}
              >
                <option value="">Choose a department</option>
                <option value="1">IT</option>
                <option value="2">Marketing</option>
                <option value="3">Sales</option>
                <option value="4">Production</option>
                <option value="4">Production</option>
                <option value="5">HR</option>
              </select>
              {/* <p className="text-xs mt-1 px-2 py-1 text-gray-600 dark:text-gray-400 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg inline-block">
                4 department(s) available
              </p> */}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-gradient-to-br from-white/40 to-white/20 dark:from-gray-800/40 dark:to-gray-900/20 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Additional Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Mobile Number
              </label>
              <input
                type="tel"
                name="mobileNo"
                placeholder="10-digit mobile number"
                value={formData.mobileNo}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/60 dark:border-gray-600/60 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Date of Birth
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/60 dark:border-gray-600/60 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Address
              </label>
              <input
                type="text"
                name="address"
                placeholder="Enter complete address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/60 dark:border-gray-600/60 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300"
              />
            </div>

            {/* Profile Image Picker */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Profile Image (Optional)
              </label>
              
              <div className="flex items-center space-x-4">
                {/* Image Preview */}
                {formData.profileImageUrl ? (
                  <div className="relative">
                    <img
                      src={formData.profileImageUrl}
                      alt="Profile preview"
                      className="w-20 h-20 rounded-lg object-cover border-2 border-white/60 dark:border-gray-600/60"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageChange('')}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600 transition-colors duration-200"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg flex items-center justify-center bg-white/30 dark:bg-gray-700/30 border-2 border-dashed border-white/60 dark:border-gray-600/60">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Image Picker Buttons */}
                <div className="flex flex-col space-y-2">
                  {/* File Upload */}
                  <label className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors duration-200 inline-flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                  
                  {/* URL Input Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="px-4 py-2 bg-white/50 dark:bg-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-700/70 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors duration-200 inline-flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>Enter URL</span>
                  </button>
                </div>
              </div>
              
              {/* URL Input Field (Conditional) */}
              {showUrlInput && (
                <div className="mt-4">
                  <input
                    type="url"
                    name="profileImageUrl"
                    placeholder="https://example.com/profile.jpg"
                    value={formData.profileImageUrl}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/60 dark:border-gray-600/60 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300"
                  />
                </div>
              )}
              
              <p className="text-xs mt-1 px-2 py-1 text-gray-600 dark:text-gray-400 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg inline-block">
                Optional: Upload an image or provide a URL
              </p>
            </div>
          </div>
        </div>

        {/* Error/Success Message */}
        {message && (
          <div className={`p-4 rounded-2xl backdrop-blur-xl border ${
            isError 
              ? "bg-gradient-to-br from-red-100/40 to-red-50/30 border-red-200/60 text-red-700 dark:from-red-900/30 dark:to-red-800/20 dark:border-red-700/40 dark:text-red-400" 
              : "bg-gradient-to-br from-green-100/40 to-green-50/30 border-green-200/60 text-green-700 dark:from-green-900/30 dark:to-green-800/20 dark:border-green-700/40 dark:text-green-400"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl backdrop-blur-sm ${
                isError 
                  ? "bg-red-500/20 border border-red-400/30" 
                  : "bg-green-500/20 border border-green-400/30"
                }`}
              >
                {isError ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="font-medium">{message}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-700/90 to-green-500/90 hover:from-blue-600 hover:to-indigo-700 dark:from-blue-500/80 dark:to-indigo-600/80 dark:hover:from-blue-600 dark:hover:to-indigo-700 backdrop-blur-lg text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-blue-400/50 dark:border-indigo-500/50 shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_25px_rgba(59,130,246,0.4)]"
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
        {/* <div className="text-sm text-center text-gray-600 dark:text-gray-400 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4">
          <p>Fields marked with * are required</p>
          <p className="mt-1">Make sure to assign appropriate roles and departments based on user permissions</p>
        </div> */}
      </form>
    </div>
  );
}