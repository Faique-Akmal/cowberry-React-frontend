import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import toast from "react-hot-toast";

import { FaUserPlus, FaBuilding, FaUserTag, FaSpinner } from "react-icons/fa";

interface Department {
  departmentId: number;
  name: string;
}

interface Role {
  id?: number;
  roleId?: number;
  name: string;
  roleName?: string;
}

export default function RegisterUserForm() {
 
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
  const [roles, setRoles] = useState<Role[]>([]);
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

  // Fetch departments and roles from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        
        // Fetch departments
        const deptResponse = await API.get("/departments/static_departments");
        console.log("Departments response:", deptResponse.data);
        
        let departmentsData: Department[] = [];
        
        if (Array.isArray(deptResponse.data)) {
          // If the API returns an array directly
          departmentsData = deptResponse.data;
        } else if (deptResponse.data?.departments && Array.isArray(deptResponse.data.departments)) {
          // If the API returns { departments: [] }
          departmentsData = deptResponse.data.departments;
        } else if (deptResponse.data?.data && Array.isArray(deptResponse.data.data)) {
          // If the API returns { data: [] }
          departmentsData = deptResponse.data.data;
        }
        
        // Ensure we have the correct structure
        const validDepartments = departmentsData
          .filter((dept: any) => dept && (dept.departmentId || dept.id) && dept.name)
          .map((dept: any) => ({
            departmentId: dept.departmentId || dept.id,
            name: dept.name
          }));
        
        setDepartments(validDepartments);

        // Fetch roles
        const roleResponse = await API.get("/roles/static_roles");
        console.log("Roles response:", roleResponse.data);
        
        let rolesData: Role[] = [];
        
        if (Array.isArray(roleResponse.data)) {
          // If the API returns an array directly
          rolesData = roleResponse.data;
        } else if (roleResponse.data?.roles && Array.isArray(roleResponse.data.roles)) {
          // If the API returns { roles: [] }
          rolesData = roleResponse.data.roles;
        } else if (roleResponse.data?.data && Array.isArray(roleResponse.data.data)) {
          // If the API returns { data: [] }
          rolesData = roleResponse.data.data;
        }
        
        // Ensure we have the correct structure
        const validRoles = rolesData
          .filter((role: any) => role && (role.name || role.roleName))
          .map((role: any) => ({
            id: role.id || role.roleId,
            name: role.name || role.roleName
          }));
        
        setRoles(validRoles);
        
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
        // Set empty arrays to prevent blocking the form
        setDepartments([]);
        setRoles([]);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

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

    // Validate department selection
    if (!formData.departmentId) {
      toast.error("Please select a department.");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    // Validate role selection
    if (!formData.role) {
      toast.error("Please select a role.");
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
   <div className="w-full max-w-3xl mx-auto px-4 py-8">
  {/* Header */}
  <div className="text-center mb-10">
    <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-800 dark:text-gray-200">
      User Registration
    </h2>
    <p className="text-gray-600 dark:text-gray-400">
      Register new users with appropriate roles and departments
    </p>
  </div>

  <form onSubmit={handleSubmit} className="space-y-8">
    {/* Personal Information Section */}
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
          <FaUserPlus className="text-blue-600 dark:text-blue-400 text-lg" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Personal Information
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
      </div>
    </div>

    {/* Account Information Section */}
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
        Account Information
      </h3>
      
      <div className="space-y-6">
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
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
            Password must be at least 6 characters long
          </p>
        </div>
      </div>
    </div>

    {/* Role & Department Section */}
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
        Role & Department
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900">
              <FaUserTag className="text-blue-600 dark:text-blue-400" />
            </div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Role *
            </label>
          </div>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            disabled={roles.length === 0}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
          >
            <option value="">Choose a role</option>
            {roles.length > 0 ? (
              roles.map((role, index) => (
                <option key={role.id || index} value={role.name}>
                  {role.name}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No roles available
              </option>
            )}
          </select>
          {roles.length === 0 && (
            <p className="text-xs mt-2 text-yellow-600 dark:text-yellow-400">
              No roles found. Please check API connection.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900">
              <FaBuilding className="text-blue-600 dark:text-blue-400" />
            </div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Department *
            </label>
          </div>
          <select
            name="departmentId"
            value={formData.departmentId}
            onChange={handleChange}
            required
            disabled={departments.length === 0}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
          >
            <option value="">Choose a department</option>
            {departments.length > 0 ? (
              departments.map((dept) => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.name}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No departments available
              </option>
            )}
          </select>
          {departments.length === 0 && (
            <p className="text-xs mt-2 text-yellow-600 dark:text-yellow-400">
              No departments found. Please check API connection.
            </p>
          )}
        </div>
      </div>
    </div>

    {/* Additional Information Section */}
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
        Additional Information
      </h3>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
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
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* Profile Image Section */}
        <div>
          <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
            Profile Image (Optional)
          </label>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Image Preview */}
            {formData.profileImageUrl ? (
              <div className="relative">
                <img
                  src={formData.profileImageUrl}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-lg object-cover border border-gray-300 dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={() => handleImageChange('')}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            {/* Image Picker Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors inline-flex items-center justify-center gap-2">
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
              
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2"
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
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          )}
          
          <p className="text-xs mt-3 text-gray-500 dark:text-gray-400">
            Optional: Upload an image (max 5MB) or provide a URL
          </p>
        </div>
      </div>
    </div>

    {/* Error/Success Message */}
    {message && (
      <div className={`p-4 rounded-lg border ${
        isError 
          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400" 
          : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${
            isError 
              ? "bg-red-100 dark:bg-red-800" 
              : "bg-green-100 dark:bg-green-800"
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
        className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      
      <p className="text-xs text-center mt-4 text-gray-500 dark:text-gray-400">
        Fields marked with * are required
      </p>
    </div>
  </form>
</div>
  );
}