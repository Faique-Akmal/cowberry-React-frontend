import { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import Alert from "../ui/alert/Alert";
import { Modal } from "../ui/modal";
import API from "../../api/axios";
import toast from "react-hot-toast";

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

      const updateData = {
        fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        mobileNo: mobileNo.trim(),
        address: address.trim(),
      };

      const response = await API.patch(`/auth/me/${userId}`, updateData, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
      });

      toast.success("Profile updated successfully!", { id: "save-user" });
      
      if (response.data && response.data.user) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        setAddress(updatedUser.address || "");
        setFirstName(updatedUser.firstName || updatedUser.fullName?.split(' ')[0] || "");
        setLastName(updatedUser.lastName || updatedUser.fullName?.split(' ').slice(1).join(' ') || "");
        setMobileNo(updatedUser.mobileNo || "");
        
        if (updatedUser.department && updatedUser.department.name) {
          setUserDepartment(updatedUser.department.name);
        }
        
        localStorage.setItem(`user_${userId}`, JSON.stringify(updatedUser));
      }
      
      closeModal();
    } catch (error: any) {
    
      
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
    if (user) {
      setAddress(user.address || "");
      setFirstName(user.firstName || user.fullName?.split(' ')[0] || "");
      setLastName(user.lastName || user.fullName?.split(' ').slice(1).join(' ') || "");
      setMobileNo(user.mobileNo || "");
    }
    setError("");
    closeModal();
  };

  if (!userId && isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent"></div>
        <span className="ml-4 text-gray-600">Loading user information...</span>
      </div>
    );
  }

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

  if (isLoading && !user) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent"></div>
        <span className="ml-4 text-gray-600">Loading profile...</span>
      </div>
    );
  }

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
        p-6
        rounded-2xl
        bg-white/40 dark:bg-gray-900/70
        backdrop-blur-md
        border border-gray-200/80 dark:border-gray-700/80
        shadow-sm
        relative
        overflow-hidden
      ">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/10 dark:from-blue-900/5 dark:to-purple-900/5"></div>
        
        {/* Main Content */}
        <div className="relative">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                Personal Information
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                View and manage your profile details
              </p>
            </div>
            
             <div className="mt-8 pt-6  border-gray-200 dark:border-gray-700">
            <button
              onClick={openModal}
              disabled={isLoading}
              className="
                group
                inline-flex items-center gap-3
                px-5 py-3
                rounded-xl
                bg-white dark:bg-gray-800
                hover:bg-gray-50 dark:hover:bg-gray-700
                border border-gray-300 dark:border-gray-600
                hover:border-gray-400 dark:hover:border-gray-500
                text-gray-700 dark:text-gray-300
                font-medium
                shadow-sm hover:shadow
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {/* <div className="
                p-2
                rounded-lg
                bg-blue-50 dark:bg-blue-900/20
                group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30
                transition-colors duration-200
              ">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2v11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div> */}
              Edit Profile
            </button>
          </div>
          </div>

          {/* User Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {[
              { label: "First Name", value: user.firstName || user.fullName?.split(' ')[0] || "N/A", type: "capitalize" },
              { label: "Last Name", value: user.lastName || user.fullName?.split(' ').slice(1).join(' ') || "N/A", type: "capitalize" },
              { label: "Username", value: user.username || "N/A" },
              { label: "Email", value: user.email || "N/A" },
              { label: "Mobile No", value: user.mobileNo || "N/A" },
              { label: "Role", value: user.role || "N/A", type: "capitalize" },
              { label: "Department", value: user.department?.name || userDepartment || "N/A", type: "capitalize" },
              { label: "Employee Code", value: user.employeeCode || "N/A" },
              { label: "Status", value: user.isActiveEmployee ? "Active" : "Inactive", type: "status" },
              { label: "Joined Date", value: new Date(user.createdAt || user.birthDate).toLocaleDateString() }
            ].map((item, index) => (
              <div key={index} className="
                p-4
                rounded-xl
                bg-white/50 dark:bg-gray-800/40
                border border-gray-100 dark:border-gray-700/50
                hover:bg-white/70 dark:hover:bg-gray-800/50
                transition-all duration-200
              ">
                <div className="flex items-center justify-between mb-2">
                  <span className="
                    text-xs font-medium
                    text-gray-500 dark:text-gray-400
                    uppercase tracking-wider
                  ">
                    {item.label}
                  </span>
                  {item.type === "status" && (
                    <span className={`
                      px-2.5 py-1
                      rounded-full
                      text-xs font-medium
                      ${item.value === "Active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }
                    `}>
                      {item.value}
                    </span>
                  )}
                </div>
                {item.type !== "status" && (
                  <p className={`
                    text-gray-900 dark:text-white
                    font-medium
                    ${item.type === "capitalize" ? "capitalize" : ""}
                    truncate
                  `}>
                    {item.value}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Full-width fields */}
          <div className="space-y-5">
            <div className="
              p-5
              rounded-xl
              bg-white/50 dark:bg-gray-800/40
              border border-gray-100 dark:border-gray-700/50
            ">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Address</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your complete residential address</p>
                </div>
              </div>
              <p className="text-gray-900 dark:text-white capitalize pl-11">
                {user.address || "N/A"}
              </p>
            </div>

            <div className="
              p-5
              rounded-xl
              bg-white/50 dark:bg-gray-800/40
              border border-gray-100 dark:border-gray-700/50
            ">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Date of Birth</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your birth date</p>
                </div>
              </div>
              <p className="text-gray-900 dark:text-white pl-11">
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
      </div>

      {/* Edit Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={handleModalClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="
          relative w-full max-w-2xl max-h-[90vh]
          rounded-xl
          bg-white dark:bg-gray-900
          border border-gray-200 dark:border-gray-700
          shadow-xl
          overflow-hidden
        ">
          {/* Header */}
          <div className="
            px-6 py-5
            border-b border-gray-200 dark:border-gray-700
            bg-gray-50 dark:bg-gray-800/50
          ">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Edit Profile
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Update your personal information
                  </p>
                </div>
              </div>
              <button
                onClick={handleModalClose}
                className="
                  p-2 rounded-lg
                  text-gray-400 hover:text-gray-700 dark:hover:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  transition-colors duration-200
                "
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="h-full max-h-[calc(90vh-80px)] overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* User ID Badge */}
              <div className="
                inline-flex items-center gap-2
                px-4 py-2
                rounded-lg
                bg-gray-50 dark:bg-gray-800/60
                border border-gray-200 dark:border-gray-700
                text-sm
              ">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white bg-white/50 dark:bg-gray-700/50 px-2 py-0.5 rounded">
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
                  <svg className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h5 className="font-medium text-gray-900 dark:text-white">Personal Information</h5>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        disabled={isSaving}
                        required
                        className="
                          w-full px-4 py-2.5
                          bg-white dark:bg-gray-800
                          border border-gray-300 dark:border-gray-600
                          rounded-lg
                          text-gray-900 dark:text-white
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          placeholder:text-gray-400 dark:placeholder:text-gray-500
                          transition-all duration-200
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        disabled={isSaving}
                        className="
                          w-full px-4 py-2.5
                          bg-white dark:bg-gray-800
                          border border-gray-300 dark:border-gray-600
                          rounded-lg
                          text-gray-900 dark:text-white
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          placeholder:text-gray-400 dark:placeholder:text-gray-500
                          transition-all duration-200
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <h5 className="font-medium text-gray-900 dark:text-white">Contact Information</h5>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="mobileNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
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
                            w-full pl-12 pr-4 py-2.5
                            bg-white dark:bg-gray-800
                            border border-gray-300 dark:border-gray-600
                            rounded-lg
                            text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                            placeholder:text-gray-400 dark:placeholder:text-gray-500
                            transition-all duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed
                          "
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter your complete address"
                        disabled={isSaving}
                        required
                        rows={3}
                        className="
                          w-full px-4 py-2.5
                          bg-white dark:bg-gray-800
                          border border-gray-300 dark:border-gray-600
                          rounded-lg
                          text-gray-900 dark:text-white
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          placeholder:text-gray-400 dark:placeholder:text-gray-500
                          transition-all duration-200
                          disabled:opacity-50 disabled:cursor-not-allowed
                          resize-none
                        "
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="
                  pt-6
                  border-t border-gray-200 dark:border-gray-700
                  flex items-center gap-3 justify-end
                ">
                  <button 
                    type="button"
                    onClick={handleModalClose}
                    disabled={isSaving}
                    className="
                      px-5 py-2.5
                      rounded-lg
                      bg-white dark:bg-gray-800
                      hover:bg-gray-50 dark:hover:bg-gray-700
                      border border-gray-300 dark:border-gray-600
                      text-gray-700 dark:text-gray-300
                      font-medium
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center gap-2
                    "
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="
                      px-6 py-2.5
                      rounded-lg
                      bg-blue-600 hover:bg-blue-700
                      dark:bg-blue-700 dark:hover:bg-blue-600
                      text-white
                      font-medium
                      shadow-sm hover:shadow
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center gap-2
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
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
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