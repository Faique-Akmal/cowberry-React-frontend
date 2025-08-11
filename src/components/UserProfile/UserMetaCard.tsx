import {useState, useEffect } from "react";
// import axios from "axios";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import { role } from "../../store/store";
import Alert from "../ui/alert/Alert";
import API from "../../api/axios";
import toast from "react-hot-toast";
// import API from "../../api/axios";

interface UserProfile {
  username: string;
  role: string;
  address: string;
  profile_image: string;
}

export default function UserMetaCard() {

  const localMeData = localStorage.getItem("meUser");
const meUserData = localMeData ? JSON.parse(localMeData) : null;


  const { isOpen, openModal, closeModal } = useModal();
  const [username, setUsername] = useState(meUserData?.username || "");
const [profileImage, setProfileImage] = useState<File | null>(null);


 
  

  
  const getRoleName = (roleId: number): string => {
      const roleObj = role.find((r) => r.id === roleId);
      return roleObj ? roleObj.name : "Unknown";
    };
const handleSave = async () => {
  try {
    const formData = new FormData();
    formData.append("username", username);
    toast.success("Username updated successfully");

    // Append profile image only if it's a valid File
    if (profileImage instanceof File) {
      formData.append("profile_image", profileImage);
      toast.success("Profile image updated successfully");
    }

    const response = await API.patch("/me/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Optionally update localStorage
    localStorage.setItem("meUser", JSON.stringify(response.data));

    console.log("Profile updated:", response.data);
    closeModal();
    window.location.reload(); // Consider replacing with a UI update
  } catch (error) {
    console.error("Failed to update profile:", error);
  }
};





  // if (loading) return <p className="text-center">Loading profile...</p>;
  if (!meUserData)
    return (
       <Alert
        variant="warning"
        title="Failed to load meUserData profile!"
        message="Please try again later."
        showLink={false}
      />
    );

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl  dark:text-white dark:bg-black  lg:p-6 bg-white dark:border-cowberry-green-500 ">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-22 h-22 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img
                src={meUserData?.profile_image }
                alt="user"
                className="bg-cover w-full h-full "
              />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800xl:text-left capitalize">
                {meUserData?.username}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">{getRoleName(meUserData?.role)}</p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{meUserData?.address}</p>
              </div>
            </div>
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              {/* You can add social icons or buttons here if needed */}
            </div>
          </div>

          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            Edit
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="text-center p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Edit Profile</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Update your profile information below.
          </p>
          {/* Add form fields for editing user profile here */}
          <form>
            {/* Example input field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                value={username}
                 onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              />


               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
               Profile Image
              </label>
              <input
                type="file"
                accept="image/*"
               onChange={(e) => setProfileImage(e.target.files?.[0] || null)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              />
            </div>
            {/* Add more fields as needed */}
            <button
              type="button"
              onClick={handleSave}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </form>
        </div>
      </Modal>
    </>
  );
}
