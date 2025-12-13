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
  const userDepartmentId = currentUser?.departmentId; // This should be the numeric ID
  
  console.log("Current user data:", currentUser);
  console.log("User role:", userRole);
  console.log("User departmentId:", userDepartmentId);
  
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
        console.log("Departments API response:", deptResponse.data);
        
        if (deptResponse.data?.departments && Array.isArray(deptResponse.data.departments)) {
          const deptData = deptResponse.data.departments;
          console.log("Loaded departments:", deptData);
          setDepartments(deptData);
        } else {
          console.error("Invalid departments format:", deptResponse.data);
          toast.error("Invalid departments data format");
        }

        // Fetch roles
        const roleResponse = await API.get("/roles/static_roles");
        console.log("Roles API response:", roleResponse.data);
        
        if (roleResponse.data?.roles && Array.isArray(roleResponse.data.roles)) {
          const roleData = roleResponse.data.roles;
          console.log("Loaded roles:", roleData);
          setRoles(roleData);
        } else {
          console.error("Invalid roles format:", roleResponse.data);
          toast.error("Invalid roles data format");
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        console.error("Error details:", error.response?.data);
        
        // More specific error messages
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

  // Filter departments based on user permissions
  // const filteredDepartments = React.useMemo(() => {
  //   console.log("=== DEPARTMENT FILTERING LOGIC ===");
  //   console.log("All departments:", departments);
  //   console.log("User department ID:", userDepartmentId, "Type:", typeof userDepartmentId);
  //   console.log("User role:", userRole);
  //   console.log("Can register all departments:", canRegisterAllDepartments);

  //   // If no departments loaded, return empty array
  //   if (!departments || departments.length === 0) {
  //     console.log("No departments loaded");
  //     return [];
  //   }

  //   // HR and Manager can see all departments
  //   if (canRegisterAllDepartments) {
  //     console.log("User is HR/Manager, showing all departments");
  //     return departments;
  //   }
    
  //   // For HOD or regular users, show only their department
  //   if (!userDepartmentId) {
  //     console.warn("No user department ID found for non-HR/Manager user");
  //     return [];
  //   }

  //   // Convert userDepartmentId to number for comparison
  //   const userDeptIdNum = Number(userDepartmentId);
  //   console.log("User department ID (as number):", userDeptIdNum);
    
  //   // Find the department that matches user's departmentId
  //   const userDepartment = departments.find(dept => {
  //     console.log(`Comparing: department.id=${dept.departmentId} (${typeof dept.departmentId}) with userDeptId=${userDeptIdNum} (${typeof userDeptIdNum})`);
  //     return dept.departmentId === userDeptIdNum;
  //   });

  //   console.log("Found user's department:", userDepartment);
    
  //   // If we found the user's department, return it in an array
  //   if (userDepartment) {
  //     console.log("Returning single department:", userDepartment.name);
  //     return [userDepartment];
  //   }
    
  //   console.log("No matching department found for user");
  //   return [];
  // }, [departments, userDepartmentId, canRegisterAllDepartments]);

  // Filter roles based on user permissions
  const filteredRoles = React.useMemo(() => {
    // All authorized users can assign any available role
    console.log("Available roles:", roles);
    return roles;
  }, [roles]);

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

  // Basic validation remains the same...
  if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim() || !formData.full_name.trim()) {
    toast.error("Username, Full Name, Email and Password are required.");
    setIsError(true);
    setIsLoading(false);
    return;
  }

  // ... (rest of validation code remains the same)

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
        departmentId:"",
        address: "",
        birthDate: "",
        profileImageUrl: "",
      });
      
      console.log("Registered user:", responseData.user);
    }
  } catch (error: any) {
    // ... (error handling remains the same)
  } finally {
    setIsLoading(false);
  }
};

// Add this function to send registration email
const sendRegistrationEmail = async (userData: any, responseUser: any) => {
  try {
    // Prepare email data with user details
    // Note: You may need to get employee_code from the API response
    // Adjust the property names based on your backend response
    const emailData = {
      to: userData.email,
      subject: "Welcome to Our Platform - Account Created Successfully",
      username: userData.username,
      employee_code: responseUser.employee_code || responseUser.employeeCode || "N/A", // Adjust based on your API response
      password: userData.password, // Note: In production, consider security implications
      role: userData.role,
      full_name: userData.full_name,
      // You can add more details here
    };

    // Call your email API endpoint
    // Adjust the endpoint based on your backend setup
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
    // Don't fail the registration if email fails - just show a warning
    toast("User registered but email notification failed", { icon: "⚠️" });
  }
};

  // Debug: Check what data we have
  console.log("=== DEBUG INFO ===");
  console.log("Departments state:", departments);
  console.log("Roles state:", roles);
  // console.log("Filtered departments:", filteredDepartments);
  console.log("Filtered roles:", filteredRoles);
  console.log("User department ID:", userDepartmentId);
  console.log("Can register all departments:", canRegisterAllDepartments);
  console.log("User role:", userRole);

  // Auto-select department if only one is available
  // useEffect(() => {
  //   if (filteredDepartments.length === 1 && !formData.departmentId) {
  //     setFormData(prev => ({
  //       ...prev,
  //       departmentId: String(filteredDepartments[0].departmentId)
  //     }));
  //     console.log("Auto-selected department:", filteredDepartments[0].name);
  //   }
  // }, [filteredDepartments]);

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
  className="
    w-full
    max-w-3xl
    mx-auto
    px-2
    sm:px-4
    lg:px-6
    rounded-3xl
    bg-gradient-to-br from-white/20 via-white/10 to-white/5
    dark:from-gray-900/30 dark:via-gray-800/20 dark:to-gray-900/10
    backdrop-blur-2xl
    border border-white/40 dark:border-gray-700/40
    p-4 lg:p-6 xl:p-8
    shadow-[0_8px_32px_rgba(31,38,135,0.15)]
    dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]
    overflow-hidden
    relative
  "
>
  {/* Background gradient overlay */}
  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
  
  {/* Header */}
  <div className="text-center mb-8 relative z-10">
    <div className="
      inline-flex items-center justify-center w-16 h-16 
      bg-gradient-to-r from-blue-500/80 to-indigo-600/80
      backdrop-blur-lg
      border border-blue-400/50 dark:border-indigo-500/50
      rounded-2xl mb-4
      shadow-[0_4px_20px_rgba(59,130,246,0.3)]
    ">
      <FaUserPlus className="text-white text-2xl" />
    </div>
    <h2 className="
      text-2xl md:text-3xl font-bold mb-2
      bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600
      dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400
      bg-clip-text text-transparent
    ">
      User Registration
    </h2>
    <p className="
      text-gray-600 dark:text-gray-400
      bg-white/30 dark:bg-gray-800/30
      backdrop-blur-sm
      rounded-xl px-4 py-2 inline-block
    ">
      Register new users with appropriate roles and departments
    </p>
  </div>

  <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
    {/* Personal Information */}
    <div className="
      bg-gradient-to-br from-white/40 to-white/20
      dark:from-gray-800/40 dark:to-gray-900/20
      backdrop-blur-xl
      border border-white/40 dark:border-gray-700/40
      rounded-2xl p-5 sm:p-6
      shadow-[0_4px_20px_rgba(0,0,0,0.1)]
      dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]
    ">
      <h3 className="
        text-lg font-semibold mb-4 flex items-center gap-2
        text-gray-800 dark:text-gray-200
      ">
        <div className="
          p-2 rounded-lg
          bg-gradient-to-r from-blue-500/20 to-indigo-500/20
          backdrop-blur-sm
          border border-blue-400/30 dark:border-indigo-500/30
        ">
          <FaUserPlus className="text-blue-500 dark:text-blue-400" />
        </div>
        Personal Information
      </h3>
      <div className="space-y-4">
        <div>
          <label className="
            block text-sm font-medium mb-2
            text-gray-700 dark:text-gray-300
          ">
            Full Name *
          </label>
          <input
            type="text"
            name="full_name"
            placeholder="Enter full name"
            value={formData.full_name}
            onChange={handleChange}
            required
            className="
              w-full px-4 py-3
              bg-white/50 dark:bg-gray-700/50
              backdrop-blur-sm
              border border-white/60 dark:border-gray-600/60
              rounded-xl
              text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
              placeholder-gray-500 dark:placeholder-gray-400
              transition-all duration-300
            "
          />
        </div>
        <div>
          <label className="
            block text-sm font-medium mb-2
            text-gray-700 dark:text-gray-300
          ">
            Username *
          </label>
          <input
            type="text"
            name="username"
            placeholder="Choose a username"
            value={formData.username}
            onChange={handleChange}
            required
            className="
              w-full px-4 py-3
              bg-white/50 dark:bg-gray-700/50
              backdrop-blur-sm
              border border-white/60 dark:border-gray-600/60
              rounded-xl
              text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
              placeholder-gray-500 dark:placeholder-gray-400
              transition-all duration-300
            "
          />
        </div>
      </div>
    </div>

    {/* Account Information */}
    <div className="
      bg-gradient-to-br from-white/40 to-white/20
      dark:from-gray-800/40 dark:to-gray-900/20
      backdrop-blur-xl
      border border-white/40 dark:border-gray-700/40
      rounded-2xl p-5 sm:p-6
      shadow-[0_4px_20px_rgba(0,0,0,0.1)]
      dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]
    ">
      <h3 className="
        text-lg font-semibold mb-4
        text-gray-800 dark:text-gray-200
      ">
        Account Information
      </h3>
      <div className="space-y-4">
        <div>
          <label className="
            block text-sm font-medium mb-2
            text-gray-700 dark:text-gray-300
          ">
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            placeholder="user@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            className="
              w-full px-4 py-3
              bg-white/50 dark:bg-gray-700/50
              backdrop-blur-sm
              border border-white/60 dark:border-gray-600/60
              rounded-xl
              text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
              placeholder-gray-500 dark:placeholder-gray-400
              transition-all duration-300
            "
          />
        </div>

        <div>
          <label className="
            block text-sm font-medium mb-2
            text-gray-700 dark:text-gray-300
          ">
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
            className="
              w-full px-4 py-3
              bg-white/50 dark:bg-gray-700/50
              backdrop-blur-sm
              border border-white/60 dark:border-gray-600/60
              rounded-xl
              text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
              placeholder-gray-500 dark:placeholder-gray-400
              transition-all duration-300
            "
          />
          <p className="
            text-xs mt-1 px-2 py-1
            text-gray-600 dark:text-gray-400
            bg-white/30 dark:bg-gray-800/30
            backdrop-blur-sm
            rounded-lg inline-block
          ">
            Password must be at least 6 characters long
          </p>
        </div>
      </div>
    </div>

    {/* Role and Department */}
    <div className="
      bg-gradient-to-br from-white/40 to-white/20
      dark:from-gray-800/40 dark:to-gray-900/20
      backdrop-blur-xl
      border border-white/40 dark:border-gray-700/40
      rounded-2xl p-5 sm:p-6
      shadow-[0_4px_20px_rgba(0,0,0,0.1)]
      dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]
    ">
      <h3 className="
        text-lg font-semibold mb-4
        text-gray-800 dark:text-gray-200
      ">
        Role & Department
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="
            text-sm font-medium mb-2 flex items-center gap-2
            text-gray-700 dark:text-gray-300
          ">
            <div className="
              p-1.5 rounded-lg
              bg-gradient-to-r from-blue-500/20 to-indigo-500/20
              backdrop-blur-sm
              border border-blue-400/30 dark:border-indigo-500/30
            ">
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
            className="
              w-full px-4 py-3
              bg-white/50 dark:bg-gray-700/50
              backdrop-blur-sm
              border border-white/60 dark:border-gray-600/60
              rounded-xl
              text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-300
              appearance-none
              bg-no-repeat bg-[right_1rem_center] bg-[length:1em]
            "
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
          <p className="
            text-xs mt-1 px-2 py-1
            text-gray-600 dark:text-gray-400
            bg-white/30 dark:bg-gray-800/30
            backdrop-blur-sm
            rounded-lg inline-block
          ">
            {filteredRoles.length} role(s) available
          </p>
        </div>

        <div>
          <label className="
            text-sm font-medium mb-2 flex items-center gap-2
            text-gray-700 dark:text-gray-300
          ">
            <div className="
              p-1.5 rounded-lg
              bg-gradient-to-r from-blue-500/20 to-indigo-500/20
              backdrop-blur-sm
              border border-blue-400/30 dark:border-indigo-500/30
            ">
              <FaBuilding className="text-blue-500 dark:text-blue-400" />
            </div>
            Select Department *
          </label>
          <select
            name="departmentId"
            value={formData.departmentId}
            onChange={handleChange}
            required
            className="
              w-full px-4 py-3
              bg-white/50 dark:bg-gray-700/50
              backdrop-blur-sm
              border border-white/60 dark:border-gray-600/60
              rounded-xl
              text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
              transition-all duration-300
              appearance-none
              bg-no-repeat bg-[right_1rem_center] bg-[length:1em]
            "
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23999' viewBox='0 0 256 256'%3E%3Cpath d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z'%3E%3C/path%3E%3C/svg%3E")`
            }}
          >
            <option value="">Choose a department</option>
            <option value="1">IT</option>
            <option value="2">Marketing</option>
            <option value="3">Sales</option>
            <option value="4">Production</option>
          </select>
          <p className="
            text-xs mt-1 px-2 py-1
            text-gray-600 dark:text-gray-400
            bg-white/30 dark:bg-gray-800/30
            backdrop-blur-sm
            rounded-lg inline-block
          ">
            4 department(s) available
          </p>
        </div>
      </div>
    </div>

    {/* Additional Information */}
    <div className="
      bg-gradient-to-br from-white/40 to-white/20
      dark:from-gray-800/40 dark:to-gray-900/20
      backdrop-blur-xl
      border border-white/40 dark:border-gray-700/40
      rounded-2xl p-5 sm:p-6
      shadow-[0_4px_20px_rgba(0,0,0,0.1)]
      dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]
    ">
      <h3 className="
        text-lg font-semibold mb-4
        text-gray-800 dark:text-gray-200
      ">
        Additional Information
      </h3>
      <div className="space-y-4">
        <div>
          <label className="
            block text-sm font-medium mb-2
            text-gray-700 dark:text-gray-300
          ">
            Mobile Number
          </label>
          <input
            type="tel"
            name="mobileNo"
            placeholder="10-digit mobile number"
            value={formData.mobileNo}
            onChange={handleChange}
            className="
              w-full px-4 py-3
              bg-white/50 dark:bg-gray-700/50
              backdrop-blur-sm
              border border-white/60 dark:border-gray-600/60
              rounded-xl
              text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
              placeholder-gray-500 dark:placeholder-gray-400
              transition-all duration-300
            "
          />
        </div>

        <div>
          <label className="
            block text-sm font-medium mb-2
            text-gray-700 dark:text-gray-300
          ">
            Date of Birth
          </label>
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleChange}
            className="
              w-full px-4 py-3
              bg-white/50 dark:bg-gray-700/50
              backdrop-blur-sm
              border border-white/60 dark:border-gray-600/60
              rounded-xl
              text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
              transition-all duration-300
            "
          />
        </div>

        <div>
          <label className="
            block text-sm font-medium mb-2
            text-gray-700 dark:text-gray-300
          ">
            Address
          </label>
          <input
            type="text"
            name="address"
            placeholder="Enter complete address"
            value={formData.address}
            onChange={handleChange}
            className="
              w-full px-4 py-3
              bg-white/50 dark:bg-gray-700/50
              backdrop-blur-sm
              border border-white/60 dark:border-gray-600/60
              rounded-xl
              text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
              placeholder-gray-500 dark:placeholder-gray-400
              transition-all duration-300
            "
          />
        </div>

        <div>
          <label className="
            block text-sm font-medium mb-2
            text-gray-700 dark:text-gray-300
          ">
            Profile Image URL (Optional)
          </label>
          <input
            type="url"
            name="profileImageUrl"
            placeholder="https://example.com/profile.jpg"
            value={formData.profileImageUrl}
            onChange={handleChange}
            className="
              w-full px-4 py-3
              bg-white/50 dark:bg-gray-700/50
              backdrop-blur-sm
              border border-white/60 dark:border-gray-600/60
              rounded-xl
              text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
              placeholder-gray-500 dark:placeholder-gray-400
              transition-all duration-300
            "
          />
          <p className="
            text-xs mt-1 px-2 py-1
            text-gray-600 dark:text-gray-400
            bg-white/30 dark:bg-gray-800/30
            backdrop-blur-sm
            rounded-lg inline-block
          ">
            Optional: Provide a URL for the user's profile image
          </p>
        </div>
      </div>
    </div>

    {/* Error/Success Message */}
    {message && (
      <div className={`
        p-4 rounded-2xl backdrop-blur-xl
        border
        ${isError 
          ? "bg-gradient-to-br from-red-100/40 to-red-50/30 border-red-200/60 text-red-700 dark:from-red-900/30 dark:to-red-800/20 dark:border-red-700/40 dark:text-red-400" 
          : "bg-gradient-to-br from-green-100/40 to-green-50/30 border-green-200/60 text-green-700 dark:from-green-900/30 dark:to-green-800/20 dark:border-green-700/40 dark:text-green-400"
        }
      `}>
        <div className="flex items-center gap-3">
          <div className={`
            p-2 rounded-xl backdrop-blur-sm
            ${isError 
              ? "bg-red-500/20 border border-red-400/30" 
              : "bg-green-500/20 border border-green-400/30"
            }
          `}>
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
        className="
          w-full
          bg-gradient-to-r from-blue-500/90 to-indigo-600/90
          hover:from-blue-600 hover:to-indigo-700
          dark:from-blue-500/80 dark:to-indigo-600/80
          dark:hover:from-blue-600 dark:hover:to-indigo-700
          backdrop-blur-lg
          text-white
          py-3 px-4
          rounded-xl
          font-semibold
          transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2
          border border-blue-400/50 dark:border-indigo-500/50
          shadow-[0_4px_20px_rgba(59,130,246,0.3)]
          hover:shadow-[0_6px_25px_rgba(59,130,246,0.4)]
        "
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
    <div className="
      text-sm text-center
      text-gray-600 dark:text-gray-400
      bg-white/30 dark:bg-gray-800/30
      backdrop-blur-sm
      rounded-xl p-4
    ">
      <p>Fields marked with * are required</p>
      <p className="mt-1">Make sure to assign appropriate roles and departments based on user permissions</p>
    </div>
  </form>
</div>
  );
}