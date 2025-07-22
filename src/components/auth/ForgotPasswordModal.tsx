import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";

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
  const [resetToken, setResetToken] = useState(""); // ← Important

  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSendLink = async () => {
    if (!email.trim()) {
      setMessage("Please enter your email.");
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const res = await API.post("/forgot-password/", {
        email: email.trim().toLowerCase()
      });

      if (res.status === 200 && res.data.token) {
        setMessage("Email sent. Please enter new password.");
        setShowChangePassword(true);
        setResetToken(res.data.token); // Use this in real world, else mock token
      } else {
        setMessage("Email sent. Please check your inbox.");
        setShowChangePassword(true);
        // Remove the line above if your flow strictly needs the token from email link
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to send reset email.";
      setMessage(msg);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setMessage("Both fields are required.");
      setIsError(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const res = await API.post("/change-password/", {
        email: email.trim(),
        new_password: newPassword,
        token: resetToken || undefined, // Include if your API requires it
      });

      if (res.status === 200) {
        setMessage("Password changed successfully.");
        setTimeout(() => {
          onClose();
          navigate("/signin");
        }, 1500);
      } else {
        setMessage(res.data?.message || "Password change failed.");
        setIsError(true);
      }
    } catch (err: any) {
      console.error(err);
      setMessage("Error occurred while changing password.");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setMessage("");
    setNewPassword("");
    setConfirmPassword("");
    setResetToken("");
    setIsError(false);
    setShowChangePassword(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-lg font-bold text-center mb-4">
          {showChangePassword ? "Set New Password" : "Forgot Password"}
        </h2>

        {!showChangePassword ? (
          <>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              placeholder="your@example.com"
              className="w-full border px-3 py-2 mt-1 rounded-md"
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSendLink}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleChangePassword}>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-2"
              required
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
              required
            />
            <div className="flex justify-between">
              <button type="button" onClick={handleClose} className="text-gray-600">
                Cancel
              </button>
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                {isLoading ? "Saving..." : "Change Password"}
              </button>
            </div>
          </form>
        )}

        {message && (
          <p className={`mt-4 text-sm ${isError ? "text-red-500" : "text-green-500"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
