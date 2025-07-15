import React, { useState } from "react";

import axios from "axios";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const accessToken = localStorage.getItem("accessToken");

    


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
      const response = await axios.post(
        "http://192.168.0.144:8000/api/change-password",
        {
          old_password: oldPassword,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 || response.data.status === "success") {
        setMessage("Password changed successfully!");
        setIsError(false);
        setTimeout(() => {
          onClose();
          setOldPassword("");
          setNewPassword("");
          setMessage("");
        }, 1500);
      } else {
        setMessage("Failed to change password.");
        setIsError(true);
      }
    } catch (error: any) {
      console.error("Error:", error);
      if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage("Something went wrong. Please try again.");
      }
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4 text-center">Change Password</h2>

        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">Old Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">New Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {message && (
          <div
            className={`mb-4 text-sm text-center ${
              isError ? "text-red-600" : "text-green-600"
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex justify-between mt-6">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            Cancel
          </button>

          <button
            onClick={handleChangePassword}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
