import { useEffect, useState } from "react";
import { role, department } from "../../store/store";
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
        console.error("Invalid user ID in localStorage:", storedUserId);
        toast.error("Invalid user ID found. Please log in again.");
      }
    } else {
      console.error("No user ID found in localStorage");
      setError("User not authenticated. Please log in.");
    }
  }, []);

  // Fetch user info from API when userId is available
  useEffect(() => {
    const fetchUserById = async (id: number) => {
      try {
        setIsLoading(true);
        setError("");
        console.log("Fetching user with ID:", id); // Debug log
        
        const response = await API.get(`/auth/me/${id}`);
        console.log("API Response:", response.data); // Debug log
        
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
        console.error("Failed to fetch user data:", error);
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
  useEffect(() => {
    if (user) {
      let deptName = "Unknown";
      
      if (user.departmentId && department.length > 0) {
        deptName = department.find((d) => d.id === user.departmentId)?.name || "Unknown";
      } else if (user.department?.name) {
        deptName = user.department.name;
      }
      
      setUserDepartment(deptName);
    }
  }, [user]);

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

      console.log("Sending update for user ID:", userId);
      console.log("Update data:", updateData);

      // PATCH request to update user
      const response = await API.patch(`/auth/me/${userId}`, updateData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Update response:", response.data);

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
    <div 
      style={{
        backgroundColor: themeConfig.content.background,
        color: themeConfig.content.text,
      }}
      className="p-3 border bg-white border-gray-200 rounded-2xl dark:border-cowberry-green-500 lg:p-6 dark:text-white dark:bg-black"
    >
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-cowberry-green-500 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="w-full">
            <div className="flex justify-between items-start mb-6">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {t("profile.Personal Information")}
              </h4>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                ID: {user.id} | Employee: {user.employeeCode}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {t("profile.first_name")}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                  {user.firstName || user.fullName?.split(' ')[0] || "N/A"}
                </p>
              </div>
              
              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {t("profile.Last Name")}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                  {user.lastName || user.fullName?.split(' ').slice(1).join(' ') || "N/A"}
                </p>
              </div>
              
              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {t("profile.Username")}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.username || "N/A"}
                </p>
              </div>
              
              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {t("profile.Email")}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.email || "N/A"}
                </p>
              </div>
              
              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {t("profile.mobile_no")}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.mobileNo || "N/A"}
                </p>
              </div>
              
              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {t("profile.Role")}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                  {user.role || "N/A"}
                </p>
              </div>
              
              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {t("profile.Department")}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                  {userDepartment || "N/A"}
                </p>
              </div>
              
              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {t("profile.Employee Code")}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.employeeCode || "N/A"}
                </p>
              </div>
              
              <div className="lg:col-span-2">
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {t("profile.Address")}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                  {user.address || "N/A"}
                </p>
              </div>

               <div className="lg:col-span-2">
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {t("profile.Date of Birth")}
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
              
              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {t("profile.Status")}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.isActiveEmployee 
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}>
                    {user.isActiveEmployee ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
              
              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {t("profile.Joined Date")}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {new Date(user.createdAt || user.birthDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openModal}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto lg:mt-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2v11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {t("profile.Edit Profile")}
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={handleModalClose} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 bg-white rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                {t("profile.Edit Profile")}
              </h4>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                {t("profile.Update your profile information below.")}
              </p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              User ID: {userId}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">{t("profile.first_name")}</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                  disabled={isSaving}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="lastName">{t("profile.Last Name")}</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                  disabled={isSaving}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="mobileNo">{t("profile.mobile_no")}</Label>
              <Input
                id="mobileNo"
                type="tel"
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value)}
                placeholder="Enter mobile number"
                disabled={isSaving}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="address">{t("profile.Address")}</Label>
              <Input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your address"
                disabled={isSaving}
                required
              />
            </div>

            <div className="flex items-center gap-3 mt-6 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button 
                type="button"
                size="sm" 
                variant="outline" 
                onClick={handleModalClose}
                disabled={isSaving}
              >
                {t("button.cancel")}
              </Button>
              <Button 
                type="submit"
                size="sm" 
                disabled={isSaving}
                className="min-w-[120px]"
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    {t("button.Saving...")}
                  </>
                ) : (
                  t("button.Save Changes")
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}