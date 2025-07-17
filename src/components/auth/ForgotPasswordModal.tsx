import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios"; // adjust if your API file path differs
// import { Link } from "react-router";
// import ChangePasswordModal from "./ChangePasswordModal";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  if (!isOpen) return null;

  //  Send Link + Show Change Password Modal
  const handleSendLink = async () => {
    if (!email.trim()) {
      setMessage("Please enter your email address.");
      setIsError(true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMessage("Please enter a valid email address.");
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setMessage("");

    try {
      const response = await API.post(
        "/forgot-password/",
        { email: email.trim().toLowerCase() },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
        }
      );

      if (response.data.status === "success" || response.status === 200) {
        setMessage("Reset link sent. You can now set a new password.");
        setShowChangePassword(true);
      } else {
        setMessage(response.data.message || "Failed to send reset link.");
        setIsError(true);
      }
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 404) setMessage("Email not found.");
      else if (status === 422) setMessage(data.message || "Invalid email format.");
      else if (status === 429) setMessage("Too many requests. Try again later.");
      else if (status === 500) setMessage("Server error. Try again later.");
      else setMessage(data?.message || `Error: ${status}`);

      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  //Handle Change Password Submission
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (!newPassword || !confirmPassword) {
      setMessage("Please fill both fields.");
      setIsError(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setIsError(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await API.post("/change-password/", {
        email: email.trim(),
        new_password: newPassword,
      });

      if (response.status === 200) {
        setMessage("Password changed successfully.");
        setTimeout(() => {
          onClose();
          navigate("/signin");
        }, 1500);
      } else {
        setMessage(response.data?.message || "Failed to change password.");
        setIsError(true);
      }
    } catch (error: any) {
      setIsError(true);
      setMessage("Something went wrong while changing password.");
      console.error("Change password error:", error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail("");
      setMessage("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePassword(false);
      setIsError(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-center">
          {showChangePassword ? "Change Password" : "Forgot Password"}
        </h2>

        {!showChangePassword ? (
          <>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Enter your email address
            </label>
            <input
              type="email"
              placeholder="example@gmail.com"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <div className="mt-6 flex justify-between">
              <button
                onClick={handleClose}
                className="text-gray-500 hover:underline"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSendLink}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Reset Password"}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <input
              type="password"
              placeholder="New Password"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-500 hover:underline"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Change Password"}
              </button>
            </div>
          </form>
        )}

        {message && (
          <p className={`mt-4 text-sm ${isError ? "text-red-600" : "text-green-600"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
