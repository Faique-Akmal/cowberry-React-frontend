import { useState } from "react";

import { Link } from "react-router";
import { axiosPostChangePassword } from "../../store/userStore";
import toast from "react-hot-toast";


const ChangePasswordModal: React.FC = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  // const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // const accessToken = localStorage.getItem("accessToken");

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      setMessage("Both fields are required.");
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      // const response = await API.post(
      //   "/change-password/",
        // {
        //   old_password: oldPassword,
        //   new_password: newPassword,
        // }
       
      // );
      const oldNewPass = await axiosPostChangePassword({
          old_password: oldPassword,
          new_password: newPassword,
        });



      if (oldNewPass.status === 200 || oldNewPass.data.status === "success") {
        setMessage("Password changed successfully!");
        toast.success("Password changed successfully!");

        setIsError(false);
        
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
          setOldPassword("");
          setNewPassword("");
          setMessage("");
        }, 1500);
      } else {
        setMessage("Failed to change password.");
        toast.error("Failed to change password.");

        setIsError(true);
      }
    } catch (error) {
      console.error("Error:", error);
      // if (error.response?.data?.message) {
      //   setMessage(error.response.data.message);
      // } else {
      //   setMessage("Something went wrong. Please try again.");
      // }
      toast.error("Something went wrong.Please try again.")
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit();
    }
  };

 

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Change Password</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              placeholder="Enter your current password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              placeholder="Enter new password (min 8 characters)"
            />
          </div>

        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-md text-sm text-center ${
            isError 
              ? "bg-red-50 text-red-800 border border-red-200" 
              : "bg-green-50 text-green-800 border border-green-200"
          }`}>
            {message}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            disabled={loading}
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;