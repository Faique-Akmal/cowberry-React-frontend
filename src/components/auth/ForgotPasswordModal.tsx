import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // ✅ Import useNavigate

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const navigate = useNavigate(); // ✅ Hook to navigate

  const handleSendLink = async () => {
    if (!email.trim()) {
      setMessage("Please enter your email address.");
      setIsError(true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage("Please enter a valid email address.");
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await axios.post(
        "http://192.168.0.136:8000/api/forgot-password/",
        { email: email.trim().toLowerCase() },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 15000,
        }
      );

      if (response.data.status === "success" || response.status === 200) {
        setMessage("Password reset link has been sent to your email address.");
        setIsError(false);

        setTimeout(() => {
          setEmail("");
          setMessage("");
          onClose(); // Close modal
          navigate("/change-password"); // ✅ Navigate to change password
        }, 2000); // Delay to show success message
      } else {
        setMessage(response.data.message || "Failed to send reset link.");
        setIsError(true);
      }
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 404) {
          setMessage("Email address not found.");
        } else if (status === 422) {
          setMessage(data.message || "Invalid email format.");
        } else if (status === 429) {
          setMessage("Too many requests. Try again later.");
        } else if (status === 500) {
          setMessage("Server error. Try again later.");
        } else {
          setMessage(data.message || `Error: ${status}.`);
        }
      } else if (error.request) {
        setMessage("Server not responding. Check your connection.");
      } else {
        setMessage("Unexpected error. Try again.");
      }
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setMessage("");
      setEmail("");
      setIsError(false);
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleSendLink();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-center">Forgot Password</h2>

        <label className="block mb-2 text-sm font-medium text-gray-700">
          Enter your email address
        </label>
        <input
          type="email"
          placeholder="example@gmail.com"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />

        {message && (
          <p className={`mt-2 text-sm ${isError ? "text-red-600" : "text-green-600"}`}>
            {message}
          </p>
        )}

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={handleClose}
            className="text-gray-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSendLink}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </div>
      </div>
    </div>
  );
}
