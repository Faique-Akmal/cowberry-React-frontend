import { useEffect, useState } from "react";
import { role, department } from "../../store/store";
import { useModal } from "../../hooks/useModal";
import Alert from "../ui/alert/Alert";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import API from "../../api/axios";

interface UserProfile {
  username: string;
  role: number;
  department: number;
  address: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile_no: string;
  profile_image: string;
}

export default function UserInfoCard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [userDepartment, setUserDepartment] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [first_name, setFirst_name] = useState<string>("");
  const [last_name, setLast_name] = useState<string>("");
  const [mobile_no, setMobile_no] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { isOpen, openModal, closeModal } = useModal();

  // Fetch user info from API
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await API.get("/me/");
        setUser(response.data);
        setAddress(response.data.address || ""); 
        setFirst_name(response.data.first_name || "");
        setLast_name(response.data.last_name || "");
        setMobile_no(response.data.mobile_no || "");
        setUser(response.data);
        localStorage.setItem("meUser", JSON.stringify(response.data));
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setError("Failed to load user profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Set role & department names from ID
  useEffect(() => {
    if (user) {
      const roleName = role.find((r) => r.id === user.role)?.name || "Unknown";
      const deptName = department.find((d) => d.id === user.department)?.name || "Unknown";
      setUserRole(roleName);
      setUserDepartment(deptName);
    }
  }, [user]);

const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!address.trim()) {
    setError("Address cannot be empty");
    return;
  }

  try {
    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("address", address.trim());
    formData.append("mobile_no", mobile_no.trim());
    formData.append("first_name", first_name.trim());
    formData.append("last_name", last_name.trim());

    const response = await API.patch("/me/", formData ,{
      headers: {
        "Content-Type": "multipart/form-data",
      },}
    ); 

    
    localStorage.setItem("meUser", JSON.stringify(response.data));
    closeModal(); // if applicable
    setUser(response.data); // optionally update UI
  } catch (error: any) {
    if (error.response) {
      setError(error.response.data.detail || "Update failed");
    } else {
      setError("Network error");
    }
  } finally {
    setIsLoading(false);
  }
};


  const handleModalClose = () => {
    // Reset address to original value when closing without saving
    if (user) {
      setAddress(user.address || "");
      setAddress(user.first_name || "");
      setAddress(user.last_name || "");
      setAddress(user.mobile_no || "");
    }
    setError("");
    closeModal();
  };

  if (isLoading && !user) {
    return (
      <Alert
        variant="warning"
        title="Loading..."
        message="Please wait while we load your profile."
        showLink={false}
      />
    );
  }

  if (error && !user) {
    return (
      <Alert
        variant="warning"
        title="Failed to load user profile"
        message="Please try again later."
        showLink={false}
      />
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-3 border bg-white border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Personal Information
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  First Name
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                  {user.first_name || "N/A"}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Last Name
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                  {user.last_name || "N/A"}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Email
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.email || "N/A"}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  mobile_no
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.mobile_no || "N/A"}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Role
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                  {userRole}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Department
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                  {userDepartment || "N/A"}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Address
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                  {user.address || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openModal}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={handleModalClose} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 bg-white rounded-3xl dark:bg-gray-900 lg:p-11">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Edit Address
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Update your address below.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSave} className="flex flex-col">
            <Label htmlFor="address">first_name</Label>
            <Input
              id="first_name"
              type="text"
              value={first_name}
              onChange={(e) => setFirst_name(e.target.value)}
              placeholder="Enter your address"
              disabled={isLoading}
            
            />
             <Label htmlFor="address">last_name</Label>
            <Input
              id="last_name"
              type="text"
              value={last_name}
              onChange={(e) => setLast_name (e.target.value)}
              placeholder="Enter your address"
              disabled={isLoading}
            
            />
             <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your address"
              disabled={isLoading}
            
            />
             <Label htmlFor="address">Mob.No.</Label>
            <Input
              id="tel"
              type="tel"
              value={mobile_no}
              onChange={(e) => setMobile_no(e.target.value)}
              placeholder="Enter your mobile number"
              disabled={isLoading}
            
            />

            <div className="flex items-center gap-3 mt-6 justify-end">
              <Button 
                type="button"
                size="sm" 
                variant="outline" 
                onClick={handleModalClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                size="sm" 
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}