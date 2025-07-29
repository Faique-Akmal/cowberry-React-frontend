import React, { useState } from "react";
import axios from "axios";
import API from "../../api/axios";



const ChangePasswordModal: React.FC = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  // const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);


  // Reset form when modal closes
  const resetForm = () => {
    setOldPassword("");
    setNewPassword("");
    // setConfirmPassword("");
    setMessage("");
    setIsError(false);
  };

  const handleClose = () => {
     resetForm();
   
    setIsError(false);
    
  };

  // Password validation
  const validatePasswords = () => {
    if (!oldPassword || !newPassword ) {
      setMessage("All fields are required.");
      setIsError(true);
      return false;
    }

    if (newPassword.length < 8) {
      setMessage("New password must be at least 8 characters long.");
      setIsError(true);
      return false;
    }

   

    if (oldPassword === newPassword) {
      setMessage("New password must be different from old password.");
      setIsError(true);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validatePasswords()) {
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setIsError(false);

      const response = await API.post(
        "/change-password/",
        {
          old_password: oldPassword,
          new_password: newPassword,
       
        },
        // {
        //   headers: {
        //     Authorization: `Bearer ${token}`,
        //     "Content-Type": "application/json",
        //   },
        // }
      );

      // Handle successful response
      if (response.status === 200 || response.status === 201) {
        setMessage("Password changed successfully!");
        setIsError(false);
        
        // Close modal after 2 seconds
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (err: any) {
      console.error("Change password error:", err);
      
      // Handle different types of errors
      let errorMessage = "Something went wrong. Please try again.";
      
      if (err?.response?.data) {
        const errorData = err.response.data;
        
        // Handle field-specific errors
        if (errorData.old_password) {
          errorMessage = Array.isArray(errorData.old_password) 
            ? errorData.old_password[0] 
            : errorData.old_password;
        } else if (errorData.new_password) {
          errorMessage = Array.isArray(errorData.new_password) 
            ? errorData.new_password[0] 
            : errorData.new_password;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (err?.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
      } else if (err?.response?.status === 400) {
        errorMessage = "Invalid request. Please check your input.";
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setMessage(errorMessage);
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