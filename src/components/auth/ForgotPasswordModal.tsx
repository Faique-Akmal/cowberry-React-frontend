import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [step, setStep] = useState<"email" | "reset">("email");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSendResetLink = async () => {
    if (!email.trim()) {
      setMessage("Please enter your email.");
      setIsError(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await API.post("/forgot-password/", {
        email: email.trim().toLowerCase()
      });

      if (res.status === 200 && res.data.token) {
        setResetToken(res.data.token); 
        setStep("reset");
        setMessage("Token received. Please enter your new password.");
        setIsError(false);
      } else {
        setMessage("Reset link sent to your email.");
        setStep("reset"); 
      }
    } catch (err: any) {
      console.error(err);
      setIsError(true);
      setMessage("Failed to send reset link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
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
    try {
      const res = await API.post("/change-password/", {
        email: email.trim().toLowerCase(),
        new_password: newPassword,
        token: resetToken || undefined
      });

      if (res.status === 200) {
        setMessage("Password changed successfully.");
        setIsError(false);
        setTimeout(() => {
          handleClose();
          navigate("/signin");
        }, 1500);
      } else {
        setMessage("Failed to change password.");
        setIsError(true);
      }
    } catch (err: any) {
      console.error(err);
      setIsError(true);
      setMessage("Server error while changing password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setNewPassword("");
    setConfirmPassword("");
    setResetToken("");
    setStep("email");
    setIsError(false);
    setMessage("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold text-center mb-4">
          {step === "email" ? "Forgot Password" : "Set New Password"}
        </h2>

        {step === "email" ? (
          <>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@example.com"
              className="w-full border px-3 py-2 mt-1 rounded"
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSendResetLink}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handlePasswordReset}>
            <label className="text-sm font-medium">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full border px-3 py-2 mt-1 rounded mb-3"
              required
            />

            <label className="text-sm font-medium">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full border px-3 py-2 mt-1 rounded mb-4"
              required
            />

            <div className="flex justify-between">
              <button type="button" onClick={handleClose} className="text-gray-500">
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
          <p className={`mt-4 text-sm ${isError ? "text-red-500" : "text-green-600"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
