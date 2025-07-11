import React, { useState } from "react";
import axios from "axios";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleSendLink = async () => {
    // Basic email validation
    if (!email.trim()) {
      setMessage("Please enter your email address.");
      setIsError(true);
      return;
    }

    // Basic email format validation
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
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 15000, // 15 seconds timeout
      };

      const response = await axios.post(
        "http://192.168.0.136:8000/api/forgot-password/",
        {
          email: email.trim().toLowerCase(),
        },
        config
      );

      console.log("Forgot password response:", response.data); // For debugging

      if (response.data.status === "success" || response.status === 200) {
        setMessage("Password reset link has been sent to your email address.");
        setIsError(false);
        
        // Clear form and close modal after success
        setTimeout(() => {
          setMessage("");
          setEmail("");
          onClose();
        }, 3000);
      } else {
        setMessage(response.data.message || "Failed to send reset link. Please try again.");
        setIsError(true);
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        console.log("Error response:", data);
        
        if (status === 404) {
          setMessage("Email address not found. Please check your email and try again.");
        } else if (status === 422) {
          setMessage(data.message || "Invalid email format.");
        } else if (status === 429) {
          setMessage("Too many requests. Please try again later.");
        } else if (status === 500) {
          setMessage("Server error. Please try again later.");
        } else {
          setMessage(data.message || `Error: ${status}. Please try again.`);
        }
      } else if (error.request) {
        // Request was made but no response received
        console.log("No response received:", error.request);
        setMessage("Cannot connect to server. Please check your connection.");
      } else {
        // Something else happened
        console.log("Request error:", error.message);
        setMessage("An unexpected error occurred. Please try again.");
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
    if (e.key === 'Enter' && !isLoading) {
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
          <p className={`mt-2 text-sm ${
            isError ? "text-red-600" : "text-green-600"
          }`}>
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
            className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </div>
      </div>
    </div>
  );
}