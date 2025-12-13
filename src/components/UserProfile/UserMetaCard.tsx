import { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Alert from "../ui/alert/Alert";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

interface UserData {
  id: number;
  username: string;
  fullName: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roleId: number;
  departmentId: number | null; // Updated to allow null
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
  } | null; // Updated to allow null
  branch: any | null;
  travelSessions: any[];
  createdUsers: any[];
}

export default function UserMetaCard() {
  const { themeConfig } = useTheme();
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();
  
  // State for user data
  const [meUserData, setMeUserData] = useState<UserData | null>(null);
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  // Get userId from localStorage on component mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      const id = parseInt(storedUserId, 10);
      if (!isNaN(id)) {
        setUserId(id);
      } else {
        // console.error("Invalid user ID in localStorage:", storedUserId);
        setError("Invalid user ID found. Please log in again.");
        setLoading(false);
      }
    } else {
      // console.error("No user ID found in localStorage");
      setError("User not authenticated. Please log in.");
      setLoading(false);
    }
  }, []);

  // Load user data when userId is available
  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError(null);
        
        // First check localStorage
        const localMeData = localStorage.getItem("meUser");
        
        if (localMeData) {
          try {
            const parsedData = JSON.parse(localMeData);
            
            // Check if the data has the structure { message: "...", user: {...} }
            if (parsedData.user) {
              const userData: UserData = parsedData.user;
              setMeUserData(userData);
              setUsername(userData.username || "");
              return; // Use cached data
            } else if (parsedData.username) {
              // If it's already the user object directly
              setMeUserData(parsedData);
              setUsername(parsedData.username || "");
              return; // Use cached data
            }
          } catch (parseError) {
            // console.error("Error parsing localStorage data:", parseError);
            // Continue to fetch from API if parsing fails
          }
        }
        
        // Fetch from API if no cached data or parsing failed
        await fetchUserFromAPI();
        
      } catch (error) {
        // console.error("Error loading user data:", error);
        setError("Failed to load user profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const fetchUserFromAPI = async () => {
      try {
        // console.log("Fetching user with ID:", userId); // Debug log
        
        const response = await API.get(`/auth/me/${userId}`);
        // console.log("API Response:", response.data); // Debug log
        
        if (response.data && response.data.user) {
          const userData = response.data.user;
          setMeUserData(userData);
          setUsername(userData.username || "");
          
          // Store complete response in localStorage
          localStorage.setItem("meUser", JSON.stringify(response.data));
          localStorage.setItem(`user_${userId}`, JSON.stringify(userData));
          
          toast.success("Profile loaded successfully!");
        } else {
          throw new Error("Invalid response structure");
        }
      } catch (error: any) {
        // console.error("Failed to fetch user from API:", error);
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           "Failed to load user profile";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    };

    loadUserData();
  }, [userId]);

  const handleSave = async () => {
    if (!meUserData || !userId) {
      toast.error("User data not available");
      return;
    }

    try {
      setIsSaving(true);
      const formData = new FormData();
      
      // Only update username if it has changed
      if (username !== meUserData.username) {
        formData.append("username", username);
      }

      // Append profile image only if it's a valid File
      if (profileImage instanceof File) {
        formData.append("profile_image", profileImage);
      }

      // Check if we have any data to update
      if (formData.entries().next().done) {
        toast.error("No changes to save");
        return;
      }

      // console.log("Updating user with ID:", userId); // Debug log
      // console.log("Update data:", { username, hasImage: !!profileImage }); // Debug log

      // Make PATCH request
      const response = await API.patch(`/auth/me/${userId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // console.log("Update response:", response.data); // Debug log

      // Update localStorage and state with new data
      if (response.data && response.data.user) {
        const updatedUser = response.data.user;
        setMeUserData(updatedUser);
        setUsername(updatedUser.username);
        
        // Update localStorage with complete response
        localStorage.setItem("meUser", JSON.stringify(response.data));
        localStorage.setItem(`user_${userId}`, JSON.stringify(updatedUser));
        
        toast.success("Profile updated successfully!");
      } else if (response.data) {
        // If response is just the user object
        const updatedUser = response.data;
        setMeUserData(updatedUser);
        setUsername(updatedUser.username);
        
        localStorage.setItem("meUser", JSON.stringify({ 
          message: "User updated", 
          user: updatedUser 
        }));
        localStorage.setItem(`user_${userId}`, JSON.stringify(updatedUser));
        
        toast.success("Profile updated successfully!");
      }

      // Reset profile image
      setProfileImage(null);
      closeModal();
      
    } catch (error: any) {
      // console.error("Failed to update profile:", error);
      
      if (error.response?.status === 401) {
        toast.error("Unauthorized. Please log in again.");
      } else if (error.response?.status === 404) {
        toast.error(`User with ID ${userId} not found`);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update profile. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalClose = () => {
    // Reset form values to original when closing
    if (meUserData) {
      setUsername(meUserData.username);
    }
    setProfileImage(null);
    closeModal();
  };

  // Show loading state when initially loading userId
  if (!userId && loading) {
    return (
      <div className="p-4 sm:p-5 border border-gray-200 rounded-2xl bg-white dark:bg-black dark:text-white dark:border-cowberry-green-500">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading user information...</span>
        </div>
      </div>
    );
  }

  // Show error if no userId found
  if (!userId && !loading) {
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
  if (loading && !meUserData) {
    return (
      <div className="p-4 sm:p-5 border border-gray-200 rounded-2xl bg-white dark:bg-black dark:text-white dark:border-cowberry-green-500">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading profile...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !meUserData) {
    return (
      <Alert
        variant="warning"
        title="Failed to load user profile"
        message={error}
        showLink={false}
      />
    );
  }

  // No data state
  if (!meUserData) {
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
    
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between relative z-10">
      {/* Profile Section */}
      <div className="flex flex-col items-center w-full gap-4 sm:gap-6 lg:flex-row">
        {/* Profile Image Container */}
        <div className="
          relative
          mr-3
          overflow-hidden
          rounded-2xl
          w-14 h-14 sm:w-16 sm:h-16
          flex items-center justify-center
          border-2 border-white/40 dark:border-gray-700/40
          shadow-[0_4px_20px_rgba(59,130,246,0.2)]
        ">
          {meUserData.profileImageUrl && meUserData.profileImageUrl !== "https://example.com/profile.jpg" ? (
            <img
              src={meUserData.profileImageUrl}
              alt="User"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = 'w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500/80 to-purple-600/80 text-white text-xl sm:text-2xl font-medium backdrop-blur-sm';
                  fallback.textContent = meUserData.username?.charAt(0).toUpperCase() || '?';
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <div className="
              w-full h-full
              flex items-center justify-center
              bg-gradient-to-r from-blue-500/80 to-purple-600/80
              text-white text-xl sm:text-2xl font-medium
              backdrop-blur-sm
            ">
              {meUserData.username?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>

        {/* Username & Details */}
        <div className="text-center lg:text-left">
          <h4 className="
            mb-2 text-lg sm:text-xl font-semibold capitalize
            bg-gradient-to-r from-blue-600 to-purple-600
            dark:from-blue-400 dark:to-purple-400
            bg-clip-text text-transparent
          ">
            {meUserData.username}
          </h4>
          
          <div className="
            flex flex-col items-center gap-2 text-center 
            lg:flex-row lg:gap-3 lg:text-left
          ">
            <p className="
              text-sm px-2 py-1
              rounded-lg
              bg-gradient-to-r from-blue-100/60 to-cyan-100/40
              dark:from-blue-900/40 dark:to-cyan-900/30
              border border-blue-200/60 dark:border-blue-700/40
              text-blue-800 dark:text-blue-300
              backdrop-blur-sm
              capitalize
            ">
              {meUserData.role || "Field Employee"}
            </p>
            
            <div className="
              hidden lg:block
              h-3.5 w-px
              bg-gradient-to-b from-white/40 to-transparent
              dark:from-gray-600/40 dark:to-transparent
            "></div>
            
            <p className="
              text-sm px-2 py-1
              rounded-lg
              bg-gradient-to-r from-gray-100/60 to-gray-100/40
              dark:from-gray-800/40 dark:to-gray-900/30
              border border-gray-200/60 dark:border-gray-700/40
              text-gray-700 dark:text-gray-300
              backdrop-blur-sm
              capitalize
              max-w-[200px] truncate
            ">
              {meUserData.address || "No address provided"}
            </p>
          </div>
          
          <div className="
            mt-2
            text-xs px-2 py-1
            rounded-lg
            bg-gradient-to-r from-white/40 to-white/20
            dark:from-gray-800/40 dark:to-gray-900/20
            backdrop-blur-sm
            border border-white/40 dark:border-gray-700/40
            text-gray-600 dark:text-gray-400
            inline-block
          ">
            Employee Code: <span className="font-mono font-medium">{meUserData.employeeCode}</span>
          </div>
        </div>
      </div>

      {/* Edit Button */}
      <button
        onClick={openModal}
        disabled={loading}
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
          lg:w-auto
        "
      >
        <div className="
          p-1.5 rounded-lg
          bg-gradient-to-r from-blue-500/20 to-indigo-500/20
          backdrop-blur-sm
          border border-blue-400/30 dark:border-indigo-500/30
        ">
          <svg className="w-4 h-4 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        Edit
      </button>
    </div>
  </div>

  {/* Modal */}
  <Modal isOpen={isOpen} onClose={handleModalClose} className="max-w-lg w-full m-4">
    <div className="
      relative
      p-6 sm:p-8
      rounded-3xl
      bg-gradient-to-br from-white/80 to-white/60
      dark:from-gray-900/80 dark:to-gray-800/60
      backdrop-blur-2xl
      border border-white/40 dark:border-gray-700/40
      shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]
      overflow-hidden
    ">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <h3 className="
            text-lg sm:text-xl font-semibold
            bg-gradient-to-r from-blue-600 to-purple-600
            dark:from-blue-400 dark:to-purple-400
            bg-clip-text text-transparent
          ">
            Edit Profile
          </h3>
          <button
            onClick={handleModalClose}
            disabled={isSaving}
            className="
              p-2 rounded-lg
              bg-white/40 dark:bg-gray-700/40
              backdrop-blur-sm
              border border-white/60 dark:border-gray-600/60
              text-gray-600 hover:text-gray-900
              dark:text-gray-400 dark:hover:text-gray-300
              hover:bg-white/60 dark:hover:bg-gray-600/60
              transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            ✕
          </button>
        </div>
        
        <p className="
          text-sm mb-6
          text-gray-600 dark:text-gray-400
          bg-white/30 dark:bg-gray-800/30
          backdrop-blur-sm
          rounded-xl px-3 py-2
        ">
          Update your profile information below.
        </p>
        
        <form className="space-y-5">
          {/* Username */}
          <div>
            <label className="
              block text-sm font-medium mb-2
              text-gray-700 dark:text-gray-300
            ">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              disabled={isSaving}
              placeholder="Enter username"
            />
          </div>

          {/* Profile Image Upload */}
          <div>
            <label className="
              block text-sm font-medium mb-2
              text-gray-700 dark:text-gray-300
            ">
              Profile Image
            </label>
            <div className="
              relative
              px-4 py-3
              bg-white/50 dark:bg-gray-700/50
              backdrop-blur-sm
              border-2 border-dashed border-white/60 dark:border-gray-600/60
              rounded-xl
              hover:border-blue-400/60 dark:hover:border-blue-500/60
              transition-all duration-300
            ">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
                className="
                  absolute inset-0 w-full h-full opacity-0 cursor-pointer
                  disabled:opacity-0 disabled:cursor-not-allowed
                "
                disabled={isSaving}
              />
              <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">
                  {profileImage ? profileImage.name : "Click to upload profile image"}
                </span>
              </div>
            </div>
            
            {profileImage && (
              <p className="
                mt-2 text-sm
                text-gray-600 dark:text-gray-400
                bg-white/30 dark:bg-gray-800/30
                backdrop-blur-sm
                rounded-lg px-3 py-1.5 inline-block
              ">
                Selected: <span className="font-medium">{profileImage.name}</span>
              </p>
            )}
            
            <p className="
              mt-2 text-xs
              text-gray-500 dark:text-gray-400
              bg-white/20 dark:bg-gray-800/20
              backdrop-blur-sm
              rounded-lg px-2 py-1 inline-block
            ">
              Current: {meUserData.profileImageUrl && meUserData.profileImageUrl !== "https://example.com/profile.jpg" 
                ? meUserData.profileImageUrl 
                : "Default image"}
            </p>
          </div>

          {/* Current Profile Info */}
          <div className="
            p-4 rounded-xl
            bg-gradient-to-br from-blue-50/40 to-blue-50/20
            dark:from-blue-900/20 dark:to-blue-800/10
            backdrop-blur-xl
            border border-blue-200/40 dark:border-blue-800/40
          ">
            <div className="space-y-2">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">User ID:</span> <span className="font-mono">{meUserData.id}</span>
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Current Username:</span> {meUserData.username}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Email:</span> {meUserData.email}
              </p>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="
              w-full
              px-6 py-3
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
              flex items-center justify-center gap-2
            "
          >
            {isSaving ? (
              <>
                <div className="
                  animate-spin rounded-full
                  h-4 w-4
                  border-2 border-white border-t-transparent
                "></div>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </div>
    </div>
  </Modal>
</>
  );
}