import { useEffect, useState } from "react";
// import { role, department } from "../../store/store";
import { useModal } from "../../hooks/useModal";
import Alert from "../ui/alert/Alert";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roleId: number;
  departmentId: number | null;  // Updated to allow null
  branchId: number | null;
  birthDate: string;
  mobileNo: string;
  address: string;
  profileImageUrl: string;
  isActiveEmployee: boolean;
  employeeCode: string;
  isEmployeeCodeVerified: boolean;
  lastSeen: string | null;
 
  role: string;
  is_checkin: boolean;
  department: {
    id: number;
    name: string;
    description: string;
  } | null;  // Updated to allow null
  branch: any | null;
  travelSessions: any[];
  createdUsers: any[];
  createdAt?: string;  // Added optional createdAt
}

export default function UserInfoCard() {
  const { themeConfig } = useTheme();
  const { t } = useTranslation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userDepartment, setUserDepartment] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [mobileNo, setMobileNo] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { isOpen, openModal, closeModal } = useModal();
  
  // Get userId from localStorage
  const [userId, setUserId] = useState<number | null>(null);

  // Initialize userId from localStorage on component mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      const id = parseInt(storedUserId, 10);
      if (!isNaN(id)) {
        setUserId(id);
      } else {
        // console.error("Invalid user ID in localStorage:", storedUserId);
        toast.error("Invalid user ID found. Please log in again.");
      }
    } else {
      // console.error("No user ID found in localStorage");
      setError("User not authenticated. Please log in.");
    }
  }, []);

  // Fetch user info from API when userId is available
  useEffect(() => {
    const fetchUserById = async (id: number) => {
      try {
        setIsLoading(true);
        setError("");
        // console.log("Fetching user with ID:", id); // Debug log
        
        const response = await API.get(`/auth/me/${id}`);
        // console.log("API Response:", response.data); // Debug log
        
        // Your API returns { message: "...", user: {...} }
        if (response.data && response.data.user) {
          const userData = response.data.user;
          setUser(userData);
          setAddress(userData.address || "");
          setFirstName(userData.firstName || userData.fullName?.split(' ')[0] || "");
          setLastName(userData.lastName || userData.fullName?.split(' ').slice(1).join(' ') || "");
          setMobileNo(userData.mobileNo || "");
          
          localStorage.setItem(`user_${id}`, JSON.stringify(userData));
          toast.success("Profile loaded successfully!");
        } else {
          throw new Error("Invalid response structure");
        }
      } catch (error: any) {
        // console.error("Failed to fetch user data:", error);
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           "Failed to load user profile";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserById(userId);
    }
  }, [userId]);

  // Set department name from ID
  // useEffect(() => {
  //   if (user) {
  //     let deptName = "Unknown";
      
  //     if (user.departmentId && department.length > 0) {
  //       deptName = department.find((d) => d.id === user.departmentId)?.name || "Unknown";
  //     } else if (user.department?.name) {
  //       deptName = user.department.name;
  //     }
      
  //     setUserDepartment(deptName);
  //   }
  // }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error("User ID not found. Please refresh the page.");
      return;
    }

    if (!firstName.trim()) {
      toast.error("First name cannot be empty");
      return;
    }

    if (!mobileNo.trim()) {
      toast.error("Mobile number cannot be empty");
      return;
    }

    if (!address.trim()) {
      toast.error("Address cannot be empty");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      toast.loading("Saving changes...", { id: "save-user" });

      // Prepare the data according to your API structure
      const updateData = {
        firstName: firstName.trim(),
        lastName: lastName.trim() || null,
        mobileNo: mobileNo.trim(),
        address: address.trim(),
      };

      // console.log("Sending update for user ID:", userId);
      // console.log("Update data:", updateData);

      // PATCH request to update user
      const response = await API.patch(`/auth/me/${userId}`, updateData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      // console.log("Update response:", response.data);

      toast.success("Profile updated successfully!", { id: "save-user" });
      
      // Update local state with new data
      if (response.data && response.data.user) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        
        // Update localStorage with new data
        localStorage.setItem(`user_${userId}`, JSON.stringify(updatedUser));
        
        // Also update form fields with the server response
        setAddress(updatedUser.address || "");
        setFirstName(updatedUser.firstName || updatedUser.fullName?.split(' ')[0] || "");
        setLastName(updatedUser.lastName || updatedUser.fullName?.split(' ').slice(1).join(' ') || "");
        setMobileNo(updatedUser.mobileNo || "");
      } else {
        // If response doesn't have user data, update from our form
        setUser(prev => prev ? {
          ...prev,
          firstName: firstName,
          lastName: lastName,
          mobileNo: mobileNo,
          address: address
        } : null);
      }
      
      closeModal();
    } catch (error: any) {
      // console.error("Update error:", error);
      
      if (error.response?.status === 404) {
        toast.error(`User with ID ${userId} not found`, { id: "save-user" });
        setError("User not found");
      } else if (error.response?.status === 401) {
        toast.error("Unauthorized. Please log in again.", { id: "save-user" });
        setError("Authentication required");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message, { id: "save-user" });
        setError(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message, { id: "save-user" });
        setError(error.message);
      } else {
        toast.error("Failed to update profile. Please try again.", { id: "save-user" });
        setError("Network error or server issue");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalClose = () => {
    // Reset to original values when closing without saving
    if (user) {
      setAddress(user.address || "");
      setFirstName(user.firstName || user.fullName?.split(' ')[0] || "");
      setLastName(user.lastName || user.fullName?.split(' ').slice(1).join(' ') || "");
      setMobileNo(user.mobileNo || "");
    }
    setError("");
    closeModal();
  };

  // Show loading state when initially loading userId
  if (!userId && isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading user information...</span>
      </div>
    );
  }

  // Show error if no userId found
  if (!userId && !isLoading) {
    return (
      <Alert
        variant="warning"
        title="Authentication Required"
        message="User ID not found. Please log in again."
        showLink={false}
      />
    );
  }

  // Loading state while fetching user data
  if (isLoading && !user) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading profile...</span>
      </div>
    );
  }

  // Error state while fetching user data
  if (error && !user) {
    return (
      <Alert
        variant="warning"
        title="Failed to load user profile"
        message={error}
        showLink={false}
      />
    );
  }

  if (!user) {
    return null;
  }

  return (
 <div className="
  p-4 sm:p-5 lg:p-6
  rounded-3xl
  bg-gradient-to-br from-white/20 via-white/10 to-white/5
  dark:from-gray-900/30 dark:via-gray-800/20 dark:to-gray-900/10
  backdrop-blur-2xl
  border border-white/40 dark:border-gray-700/40
  shadow-[0_8px_32px_rgba(31,38,135,0.15)]
  dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]
  overflow-hidden
  relative
">
  {/* Background gradient overlay */}
  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
  
  {/* Main Content */}
  <div className="
    p-5 sm:p-6 lg:p-7
    rounded-2xl
    bg-gradient-to-br from-white/30 to-white/20
    dark:from-gray-800/30 dark:to-gray-900/20
    backdrop-blur-xl
    border border-white/40 dark:border-gray-700/40
    relative z-10
    shadow-[0_4px_20px_rgba(0,0,0,0.1)]
    dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]
  ">
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <h4 className="
            text-lg sm:text-xl font-semibold
            bg-gradient-to-r from-blue-600 to-purple-600
            dark:from-blue-400 dark:to-purple-400
            bg-clip-text text-transparent
          ">
            Personal Information
          </h4>
          
          <div className="
            text-sm
            px-3 py-2
            rounded-xl
            bg-gradient-to-r from-white/40 to-white/20
            dark:from-gray-800/40 dark:to-gray-900/20
            backdrop-blur-sm
            border border-white/40 dark:border-gray-700/40
            text-gray-700 dark:text-gray-300
          ">
            ID: <span className="font-mono font-medium">{user.id}</span> | 
            Employee: <span className="font-mono font-medium">{user.employeeCode}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          {[
            { label: "First Name", value: user.firstName || user.fullName?.split(' ')[0] || "N/A", type: "capitalize" },
            { label: "Last Name", value: user.lastName || user.fullName?.split(' ').slice(1).join(' ') || "N/A", type: "capitalize" },
            { label: "Username", value: user.username || "N/A" },
            { label: "Email", value: user.email || "N/A" },
            { label: "Mobile No", value: user.mobileNo || "N/A" },
            { label: "Role", value: user.role || "N/A", type: "capitalize" },
            { label: "Department", value: user.department || "N/A", type: "capitalize" },
            { label: "Employee Code", value: user.employeeCode || "N/A" },
            { label: "Status", value: user.isActiveEmployee ? "Active" : "Inactive", type: "status" },
            { label: "Joined Date", value: new Date(user.createdAt || user.birthDate).toLocaleDateString() }
          ].map((item, index) => (
            <div key={index} className={`
              p-4 rounded-xl
              bg-gradient-to-br from-white/20 to-white/10
              dark:from-gray-800/20 dark:to-gray-900/10
              backdrop-blur-lg
              border border-white/30 dark:border-gray-700/30
              ${(item.label === "Address" || item.label === "Date of Birth") ? 'lg:col-span-2' : ''}
            `}>
              <p className="mb-2 text-xs font-medium
                text-gray-600 dark:text-gray-400
                bg-white/20 dark:bg-gray-800/20
                backdrop-blur-sm
                rounded-lg px-2 py-1 inline-block
              ">
                {item.label}
              </p>
              {item.type === "status" ? (
                <div className={`
                  inline-flex items-center px-3 py-1.5 rounded-xl
                  text-xs font-medium backdrop-blur-sm border
                  ${item.value === "Active"
                    ? "bg-gradient-to-r from-green-100/60 to-emerald-100/40 border-green-200/60 text-green-800 dark:from-green-900/40 dark:to-emerald-900/30 dark:border-green-700/40 dark:text-green-300"
                    : "bg-gradient-to-r from-red-100/60 to-pink-100/40 border-red-200/60 text-red-800 dark:from-red-900/40 dark:to-pink-900/30 dark:border-red-700/40 dark:text-red-300"
                  }
                `}>
                  <span className={`
                    w-2 h-2 rounded-full mr-2
                    ${item.value === "Active" ? "bg-green-400" : "bg-red-400"}
                  `}></span>
                  {item.value}
                </div>
              ) : (
                <p className={`
                  text-sm font-medium
                  ${item.type === "capitalize" ? "capitalize" : ""}
                  text-gray-800 dark:text-white/90
                  truncate
                `}>
                  {item.value}
                </p>
              )}
            </div>
          ))}

          {/* Address Field */}
          <div className="lg:col-span-2 p-4 rounded-xl
            bg-gradient-to-br from-white/20 to-white/10
            dark:from-gray-800/20 dark:to-gray-900/10
            backdrop-blur-lg
            border border-white/30 dark:border-gray-700/30
          ">
            <p className="mb-2 text-xs font-medium
              text-gray-600 dark:text-gray-400
              bg-white/20 dark:bg-gray-800/20
              backdrop-blur-sm
              rounded-lg px-2 py-1 inline-block
            ">
              Address
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
              {user.address || "N/A"}
            </p>
          </div>

          {/* Date of Birth Field */}
          <div className="lg:col-span-2 p-4 rounded-xl
            bg-gradient-to-br from-white/20 to-white/10
            dark:from-gray-800/20 dark:to-gray-900/10
            backdrop-blur-lg
            border border-white/30 dark:border-gray-700/30
          ">
            <p className="mb-2 text-xs font-medium
              text-gray-600 dark:text-gray-400
              bg-white/20 dark:bg-gray-800/20
              backdrop-blur-sm
              rounded-lg px-2 py-1 inline-block
            ">
              Date of Birth
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
              {user.birthDate
                ? new Date(user.birthDate).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Button */}
      <button
        onClick={openModal}
        disabled={isLoading}
        className="
          flex w-full items-center justify-center gap-2
          px-5 py-3
          rounded-xl
          bg-gradient-to-r from-white/40 to-white/20
          dark:from-gray-800/40 dark:to-gray-900/20
          hover:from-white/60 hover:to-white/40
          dark:hover:from-gray-700/60 dark:hover:to-gray-800/40
          backdrop-blur-lg
          border border-white/40 dark:border-gray-700/40
          text-gray-700 dark:text-gray-300
          font-medium
          shadow-[0_4px_12px_rgba(0,0,0,0.1)]
          dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)]
          hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)]
          dark:hover:shadow-[0_6px_20px_rgba(0,0,0,0.4)]
          transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
          lg:w-auto lg:mt-6
        "
      >
        <div className="
          p-1.5 rounded-lg
          bg-gradient-to-r from-blue-500/20 to-indigo-500/20
          backdrop-blur-sm
          border border-blue-400/30 dark:border-indigo-500/30
        ">
          <svg className="w-4 h-4 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2v11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        Edit Profile
      </button>
    </div>
  </div>

  {/* Edit Modal */}
  <Modal isOpen={isOpen} onClose={handleModalClose} className="max-w-[700px] m-4">
    <div className="
      relative w-full p-6 sm:p-8 lg:p-10
      rounded-3xl
      bg-gradient-to-br from-white/80 to-white/60
      dark:from-gray-900/80 dark:to-gray-800/60
      backdrop-blur-2xl
      border border-white/40 dark:border-gray-700/40
      shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]
    ">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-3xl pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
          <div>
            <h4 className="
              mb-2 text-2xl font-bold
              bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600
              dark:from-blue-400 dark:via-purple-400 dark:to-pink-400
              bg-clip-text text-transparent
            ">
              Edit Profile
            </h4>
            <p className="
              mb-6 text-sm
              text-gray-600 dark:text-gray-400
              bg-white/30 dark:bg-gray-800/30
              backdrop-blur-sm
              rounded-xl px-3 py-2 inline-block
            ">
              Update your profile information below.
            </p>
          </div>
          <div className="
            text-sm
            px-3 py-2
            rounded-xl
            bg-gradient-to-r from-white/40 to-white/20
            dark:from-gray-800/40 dark:to-gray-900/20
            backdrop-blur-sm
            border border-white/40 dark:border-gray-700/40
            text-gray-700 dark:text-gray-300
          ">
            User ID: <span className="font-mono font-medium">{userId}</span>
          </div>
        </div>

        {error && (
          <div className="
            mb-6 p-4
            rounded-2xl
            bg-gradient-to-br from-red-100/40 to-red-50/30
            dark:from-red-900/30 dark:to-red-800/20
            backdrop-blur-xl
            border border-red-200/60 dark:border-red-700/40
          ">
            <div className="flex items-center gap-3">
              <div className="
                p-2 rounded-xl
                bg-red-500/20
                backdrop-blur-sm
                border border-red-400/30
              ">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="
            grid grid-cols-1 md:grid-cols-2 gap-4
            p-5
            rounded-2xl
            bg-gradient-to-br from-white/40 to-white/20
            dark:from-gray-800/40 dark:to-gray-900/20
            backdrop-blur-xl
            border border-white/40 dark:border-gray-700/40
          ">
            <div>
              <label htmlFor="firstName" className="
                block text-sm font-medium mb-2
                text-gray-700 dark:text-gray-300
              ">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                disabled={isSaving}
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
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="
                block text-sm font-medium mb-2
                text-gray-700 dark:text-gray-300
              ">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                disabled={isSaving}
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
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              />
            </div>
          </div>
          
          <div className="
            p-5
            rounded-2xl
            bg-gradient-to-br from-white/40 to-white/20
            dark:from-gray-800/40 dark:to-gray-900/20
            backdrop-blur-xl
            border border-white/40 dark:border-gray-700/40
          ">
            <label htmlFor="mobileNo" className="
              block text-sm font-medium mb-2
              text-gray-700 dark:text-gray-300
            ">
              Mobile Number
            </label>
            <input
              id="mobileNo"
              type="tel"
              value={mobileNo}
              onChange={(e) => setMobileNo(e.target.value)}
              placeholder="Enter mobile number"
              disabled={isSaving}
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
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            />
          </div>
          
          <div className="
            p-5
            rounded-2xl
            bg-gradient-to-br from-white/40 to-white/20
            dark:from-gray-800/40 dark:to-gray-900/20
            backdrop-blur-xl
            border border-white/40 dark:border-gray-700/40
          ">
            <label htmlFor="address" className="
              block text-sm font-medium mb-2
              text-gray-700 dark:text-gray-300
            ">
              Address
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your address"
              disabled={isSaving}
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
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            />
          </div>

          <div className="
            flex flex-col sm:flex-row items-center gap-3 mt-6 justify-end pt-6
            border-t border-white/30 dark:border-gray-700/30
          ">
            <button 
              type="button"
              onClick={handleModalClose}
              disabled={isSaving}
              className="
                px-6 py-3
                rounded-xl
                bg-gradient-to-r from-white/40 to-white/20
                dark:from-gray-800/40 dark:to-gray-900/20
                hover:from-white/60 hover:to-white/40
                dark:hover:from-gray-700/60 dark:hover:to-gray-800/40
                backdrop-blur-lg
                border border-white/40 dark:border-gray-700/40
                text-gray-700 dark:text-gray-300
                font-medium
                shadow-sm hover:shadow
                transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed
                w-full sm:w-auto
              "
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="
                px-6 py-3 min-w-[140px]
                rounded-xl
                bg-gradient-to-r from-blue-500/90 to-indigo-600/90
                hover:from-blue-600 hover:to-indigo-700
                dark:from-blue-500/80 dark:to-indigo-600/80
                dark:hover:from-blue-600 dark:hover:to-indigo-700
                backdrop-blur-lg
                text-white
                font-medium
                shadow-[0_4px_20px_rgba(59,130,246,0.3)]
                hover:shadow-[0_6px_25px_rgba(59,130,246,0.4)]
                transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed
                w-full sm:w-auto
                flex items-center justify-center gap-2
              "
            >
              {isSaving ? (
                <>
                  <span className="
                    animate-spin
                    w-4 h-4
                    border-2 border-white border-t-transparent
                    rounded-full
                  "></span>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Modal>
</div>
  );
}