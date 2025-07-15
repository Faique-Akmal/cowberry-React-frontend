import React, { useState } from "react";
import axios from "axios";
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
  const navigate = useNavigate();

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
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      console.log("Server response:", response);

      if (response.data.status === "success" || response.status === 200) {
        setMessage("Password reset link sent to your email.");
        setIsError(false);

        setTimeout(() => {
          setEmail("");
          setMessage("");
          onClose();
          navigate("/change-password");
        }, 2000);
      } else {
        setMessage(response.data.message || "Failed to send reset link.");
        setIsError(true);
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 404) {
          setMessage("Email not found.");
        } else if (status === 422) {
          setMessage(data.message || "Invalid email format.");
        } else if (status === 429) {
          setMessage("Too many requests. Try again later.");
        } else if (status === 500) {
          setMessage("Server error. Try again later.");
        } else {
          setMessage(data.message || `Error: ${status}`);
        }
      } else if (error.request) {
        setMessage("No response from server.");
      } else {
        setMessage("Unexpected error occurred.");
      }

      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleSendLink();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail("");
      setMessage("");
      setIsError(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-center">Forgot Password</h2>

        <label className="text-sm font-medium text-gray-700 block mb-1">
          Enter your email address
        </label>
        <input
          type="email"
          placeholder="example@gmail.com"
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
