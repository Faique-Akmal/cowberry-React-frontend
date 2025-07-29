// src/components/auth/ForgotPasswordModal.tsx
import React, { useState } from "react";
import API from "../../api/axios";
import { Navigate, useNavigate } from "react-router";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate =  useNavigate();
  const handleSendResetLink = async () => {
    if (!email.trim()) {
      setMessage("Please enter your email.");
      setIsError(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await API.post("/forgot-password/", {
        email: email.trim().toLowerCase(),
      });

      if (response.status === 200) {
        setMessage("Reset link sent successfully.");
        setIsError(false);
       onClose();
        navigate("/signin");
      } else {
        setMessage("Something went wrong. Please try again.");
        setIsError(true);
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      setMessage(
        error.response?.data?.message ||
        "Server error. Please try again later."
      );
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseAll = () => {
    setEmail("");
    setMessage("");
    setIsError(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center">Forgot Password</h2>

        <label className="block text-sm mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full border px-3 py-2 rounded mb-4"
        />

        {message && (
          <p className={`text-sm ${isError ? "text-red-600" : "text-green-600"}`}>
            {message}
          </p>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={handleCloseAll}
            className="text-gray-500 hover:underline"
          >
            Cancel
          </button>
          <button
            onClick={handleSendResetLink}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send Link"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
