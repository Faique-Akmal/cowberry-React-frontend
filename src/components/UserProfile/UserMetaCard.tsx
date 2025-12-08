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
        console.error("Invalid user ID in localStorage:", storedUserId);
        setError("Invalid user ID found. Please log in again.");
        setLoading(false);
      }
    } else {
      console.error("No user ID found in localStorage");
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
            console.error("Error parsing localStorage data:", parseError);
            // Continue to fetch from API if parsing fails
          }
        }
        
        // Fetch from API if no cached data or parsing failed
        await fetchUserFromAPI();
        
      } catch (error) {
        console.error("Error loading user data:", error);
        setError("Failed to load user profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const fetchUserFromAPI = async () => {
      try {
        console.log("Fetching user with ID:", userId); // Debug log
        
        const response = await API.get(`/auth/me/${userId}`);
        console.log("API Response:", response.data); // Debug log
        
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
        console.error("Failed to fetch user from API:", error);
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

      console.log("Updating user with ID:", userId); // Debug log
      console.log("Update data:", { username, hasImage: !!profileImage }); // Debug log

      // Make PATCH request
      const response = await API.patch(`/auth/me/${userId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Update response:", response.data); // Debug log

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
      console.error("Failed to update profile:", error);
      
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
      <div
        style={{
          backgroundColor: themeConfig.content.background,
          color: themeConfig.content.text,
        }}
        className="p-4 sm:p-5 border border-gray-200 rounded-2xl bg-white dark:bg-black dark:text-white dark:border-cowberry-green-500"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Profile Section */}
          <div className="flex flex-col items-center w-full gap-4 sm:gap-6 lg:flex-row">
            {/* Profile Image */}
            <div>
              <div className="mr-3 overflow-hidden rounded-full w-12 h-12 flex items-center justify-center">
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
                        fallback.className = 'w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-medium';
                        fallback.textContent = meUserData.username?.charAt(0).toUpperCase() || '?';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-medium">
                    {meUserData.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>
            </div>

            {/* Username & Details */}
            <div className="text-center lg:text-left">
              <h4 className="mb-2 text-lg font-semibold capitalize text-gray-800 dark:text-white">
                {meUserData.username}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center lg:flex-row lg:gap-3 lg:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {meUserData.role || "Field Employee"}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 lg:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {meUserData.address || "No address provided"}
                </p>
              </div>
              <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Employee Code: {meUserData.employeeCode}
              </div>
              {/* <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                User ID: {meUserData.id}
              </div> */}
            </div>
          </div>

          {/* Edit Button */}
          <button
            onClick={openModal}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {t("profile.Edit")}
          </button>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={handleModalClose} className="max-w-lg w-full m-4">
        <div className="p-4 text-center sm:text-left">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {t("profile.Edit Profile")}
            </h3>
            <button
              onClick={handleModalClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              disabled={isSaving}
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {t("profile.Update your profile information below.")}
          </p>
          <form className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("profile.Username")}
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                disabled={isSaving}
              />
            </div>

            {/* Profile Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("profile.Profile Image")}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
                disabled={isSaving}
              />
              {profileImage && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Selected: {profileImage.name}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Current: {meUserData.profileImageUrl && meUserData.profileImageUrl !== "https://example.com/profile.jpg" 
                  ? meUserData.profileImageUrl 
                  : "Default image"}
              </p>
            </div>

            {/* Current Profile Info */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                User ID: {meUserData.id}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Current Username: {meUserData.username}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Email: {meUserData.email}
              </p>
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t("profile.Saving...")}
                </>
              ) : (
                t("profile.Save Changes")
              )}
            </button>
          </form>
        </div>
      </Modal>
    </>
  );
}