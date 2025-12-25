import { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import Alert from "../ui/alert/Alert";
import { Modal } from "../ui/modal";
import API from "../../api/axios";
import toast from "react-hot-toast";
// import { useTranslation } from "react-i18next";
// import { useTheme } from "../../context/ThemeContext";

interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roleId: number;
  departmentId: number | null;
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
  } | null;
  branch: any | null;
  travelSessions: any[];
  createdUsers: any[];
  createdAt?: string;
}

export default function UserInfoCard() {
  // const { themeConfig } = useTheme();
  // const { t } = useTranslation();
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
        toast.error("Invalid user ID found. Please log in again.");
      }
    } else {
      setError("User not authenticated. Please log in.");
    }
  }, []);

  // Fetch user info from API when userId is available
  useEffect(() => {
    const fetchUserById = async (id: number) => {
      try {
        setIsLoading(true);
        setError("");
        
        const response = await API.get(`/auth/me/${id}`);
        
        if (response.data && response.data.user) {
          const userData = response.data.user;
          setUser(userData);
          setAddress(userData.address || "");
          setFirstName(userData.firstName || userData.fullName?.split(' ')[0] || "");
          setLastName(userData.lastName || userData.fullName?.split(' ').slice(1).join(' ') || "");
          setMobileNo(userData.mobileNo || "");
          
          // Set department name from the department object
          if (userData.department && userData.department.name) {
            setUserDepartment(userData.department.name);
          }
          
          localStorage.setItem(`user_${id}`, JSON.stringify(userData));
          toast.success("Profile loaded successfully!");
        } else {
          throw new Error("Invalid response structure");
        }
      } catch (error: any) {
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
      // Note: Based on your curl example, it uses fullName, not firstName/lastName separately
      const updateData = {
        fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        mobileNo: mobileNo.trim(),
        address: address.trim(),
      };

      console.log("Sending PATCH request to:", `/auth/me/${userId}`);
      console.log("Update data:", updateData);

      // PATCH request to update user
      const response = await API.patch(`/auth/me/${userId}`, updateData, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
      });

      console.log("PATCH response:", response.data);

      toast.success("Profile updated successfully!", { id: "save-user" });
      
      // Update local state with new data
      if (response.data && response.data.user) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        
        // Update form fields with the server response
        setAddress(updatedUser.address || "");
        setFirstName(updatedUser.firstName || updatedUser.fullName?.split(' ')[0] || "");
        setLastName(updatedUser.lastName || updatedUser.fullName?.split(' ').slice(1).join(' ') || "");
        setMobileNo(updatedUser.mobileNo || "");
        
        // Update department name if available
        if (updatedUser.department && updatedUser.department.name) {
          setUserDepartment(updatedUser.department.name);
        }
        
        // Update localStorage with new data
        localStorage.setItem(`user_${userId}`, JSON.stringify(updatedUser));
      }
      
      closeModal();
    } catch (error: any) {
      console.error("Update error:", error);
      
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
    <>
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
                  bg-gradient-to-r from-green-800 to-green-600
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
                  // FIXED: Extract department name from object
                  { label: "Department", value: user.department?.name || userDepartment || "N/A", type: "capitalize" },
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
                      <p className={`text-sm font-medium
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
      </div>

      {/* Edit Modal */}
    <Modal 
  isOpen={isOpen} 
  onClose={handleModalClose}
  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
>
  <div className="
    relative w-full max-w-2xl max-h-[90vh]
    rounded-2xl
    bg-white dark:bg-gray-900
    border border-gray-200 dark:border-gray-700
    shadow-2xl
    overflow-hidden
  ">
    {/* Header with gradient background */}
    <div className="
      relative
   
      px-6 py-5
      border-b border-blue-500/30 dark:border-blue-700/30
    ">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="
            text-xl font-bold text-black
            flex items-center gap-3
          ">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Edit Profile
          </h4>
          <p className="text-black-100 text-sm mt-1">
            Update your personal information
          </p>
        </div>
        <button
          onClick={handleModalClose}
          className="
            p-2 rounded-lg
            bg-white/10 hover:bg-white/20
            text-white
            transition-colors duration-200
          "
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    {/* Scrollable content */}
    <div className="relative z-10 h-full max-h-[calc(90vh-80px)] overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* User ID Badge */}
        <div className="
          inline-flex items-center gap-2
          px-3 py-2
          rounded-lg
          bg-blue-50 dark:bg-blue-900/20
          border border-blue-200 dark:border-blue-700/50
          text-sm
        ">
          <span className="text-blue-700 dark:text-blue-300 font-medium">User ID:</span>
          <span className="font-mono text-blue-900 dark:text-blue-200 bg-white/50 dark:bg-blue-800/30 px-2 py-0.5 rounded">
            {userId}
          </span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="
            p-4
            rounded-lg
            bg-red-50 dark:bg-red-900/20
            border border-red-200 dark:border-red-700/50
            flex items-start gap-3
          ">
            <div className="
              p-2 rounded-full
              bg-red-100 dark:bg-red-800/30
            ">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Name Fields Card */}
          <div className="
            bg-gray-50 dark:bg-gray-800/50
            border border-gray-200 dark:border-gray-700
            rounded-xl
            p-5
            space-y-4
          ">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h5 className="font-semibold text-gray-900 dark:text-gray-100">Personal Information</h5>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="
                  block text-sm font-medium
                  text-gray-700 dark:text-gray-300
                ">
                  First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    disabled={isSaving}
                    required
                    className="
                      w-full px-4 py-3
                      bg-white dark:bg-gray-800
                      border border-gray-300 dark:border-gray-600
                      rounded-lg
                      text-gray-900 dark:text-gray-100
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      placeholder:text-gray-400 dark:placeholder:text-gray-500
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                      hover:border-gray-400 dark:hover:border-gray-500
                    "
                  />
                  <div className="absolute inset-0 border border-transparent rounded-lg pointer-events-none"></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="lastName" className="
                  block text-sm font-medium
                  text-gray-700 dark:text-gray-300
                ">
                  Last Name
                </label>
                <div className="relative">
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    disabled={isSaving}
                    className="
                      w-full px-4 py-3
                      bg-white dark:bg-gray-800
                      border border-gray-300 dark:border-gray-600
                      rounded-lg
                      text-gray-900 dark:text-gray-100
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      placeholder:text-gray-400 dark:placeholder:text-gray-500
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                      hover:border-gray-400 dark:hover:border-gray-500
                    "
                  />
                  <div className="absolute inset-0 border border-transparent rounded-lg pointer-events-none"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Card */}
          <div className="
            bg-gray-50 dark:bg-gray-800/50
            border border-gray-200 dark:border-gray-700
            rounded-xl
            p-5
            space-y-4
          ">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h5 className="font-semibold text-gray-900 dark:text-gray-100">Contact Information</h5>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="mobileNo" className="
                  block text-sm font-medium
                  text-gray-700 dark:text-gray-300
                ">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    +91
                  </div>
                  <input
                    id="mobileNo"
                    type="tel"
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                    placeholder="9876543210"
                    disabled={isSaving}
                    required
                    className="
                      w-full pl-12 pr-4 py-3
                      bg-white dark:bg-gray-800
                      border border-gray-300 dark:border-gray-600
                      rounded-lg
                      text-gray-900 dark:text-gray-100
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      placeholder:text-gray-400 dark:placeholder:text-gray-500
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                      hover:border-gray-400 dark:hover:border-gray-500
                    "
                  />
                  <div className="absolute inset-0 border border-transparent rounded-lg pointer-events-none"></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="address" className="
                  block text-sm font-medium
                  text-gray-700 dark:text-gray-300
                ">
                  Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your complete address"
                    disabled={isSaving}
                    required
                    className="
                      w-full px-4 py-3
                      bg-white dark:bg-gray-800
                      border border-gray-300 dark:border-gray-600
                      rounded-lg
                      text-gray-900 dark:text-gray-100
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      placeholder:text-gray-400 dark:placeholder:text-gray-500
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                      hover:border-gray-400 dark:hover:border-gray-500
                    "
                  />
                  <div className="absolute inset-0 border border-transparent rounded-lg pointer-events-none"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="
            pt-6
            border-t border-gray-200 dark:border-gray-700
            flex flex-col sm:flex-row items-center gap-3 justify-end
            sticky bottom-0 bg-white dark:bg-gray-900
          ">
            <button 
              type="button"
              onClick={handleModalClose}
              disabled={isSaving}
              className="
                px-6 py-3
                rounded-lg
                bg-gray-100 dark:bg-gray-800
                hover:bg-gray-200 dark:hover:bg-gray-700
                border border-gray-300 dark:border-gray-600
                text-gray-700 dark:text-gray-300
                font-medium
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                w-full sm:w-auto
                flex items-center justify-center gap-2
              "
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="
                px-8 py-3
                rounded-lg
                bg-gradient-to-r from-green-600 to-green-700
                hover:from-green-700 hover:to-green-800
                dark:from-blue-700 dark:to-blue-800
                dark:hover:from-blue-600 dark:hover:to-blue-700
                text-white
                font-medium
                shadow-lg hover:shadow-xl
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                w-full sm:w-auto
                flex items-center justify-center gap-3
                min-w-[160px]
              "
            >
              {isSaving ? (
                <>
                  <span className="
                    animate-spin
                    w-5 h-5
                    border-2 border-white border-t-transparent
                    rounded-full
                  "></span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</Modal>  
    </>
  );
}