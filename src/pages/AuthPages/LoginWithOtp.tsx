import React, { useState } from "react";
import {  useNavigate } from "react-router";
import API from "../../api/axios";
interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationSuccess: () => void;
  
}

export default function OtpModal({ isOpen, onClose, onVerificationSuccess }: OtpModalProps) {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const accessToken = localStorage.getItem('accessToken');
   const navigate = useNavigate();
  
  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setMessage("Please enter the OTP.");
      setIsError(true);
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setMessage("Please enter a valid 6-digit OTP.");
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await API.post(
        "/verify-otp/",
        {
          otp: otp.trim(),
        }
      );

      if (response.data.status === "success" || response.status === 200) {
        setMessage("OTP verified successfully!");
        setIsError(false);
         navigate("/dashboard", { replace: true });
        
        setTimeout(() => {
          onVerificationSuccess();
          handleClose();
        }, 1500);
      } else {
        setMessage(response.data.message || "Invalid OTP. Please try again.");
        setIsError(true);
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          setMessage("Invalid OTP. Please check and try again.");
        } else if (status === 404) {
          setMessage("User not found. Please contact support.");
        } else if (status === 422) {
          setMessage(data.message || "Invalid OTP format.");
        } else {
          setMessage(data.message || "Verification failed. Please try again.");
        }
      } else if (error.request) {
        setMessage("Cannot connect to server. Please check your connection.");
      } else {
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
      setOtp("");
      setIsError(false);
      onClose();
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d{0,6}$/.test(value)) {
      setOtp(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && otp.length === 6) {
      handleVerifyOtp();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4 text-center">Verify OTP</h2>
        
        <p className="text-sm text-gray-600 mb-4 text-center">
          Please enter the 6-digit OTP sent to your email
          
        </p>
        
        <input
          type="text"
          placeholder="Enter 6-digit OTP"
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-center text-lg tracking-widest font-mono"
          value={otp}
          onChange={handleOtpChange}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          maxLength={6}
        />

        {message && (
          <p className={`mt-3 text-sm text-center ${
            isError ? "text-red-600" : "text-green-600"
          }`}>
            {message}
          </p>
        )}

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            Cancel
          </button>
          
          <button
            onClick={handleVerifyOtp}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>
        </div>
      </div>
    </div>
  );
}