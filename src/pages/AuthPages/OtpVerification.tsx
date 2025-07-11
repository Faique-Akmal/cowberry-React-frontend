import { useState } from "react";
import axios from "axios";

const API_URL = "https://your-api.com"; // 🔁 Replace with your actual API

export default function OtpVerificationModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: mobile input, 2: otp input
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_URL}/auth/send-otp`, { mobile });
      if (res.data.success) {
        setStep(2);
      } else {
        setError(res.data.message || "Failed to send OTP.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Server error while sending OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_URL}/auth/verify-otp`, {
        mobile,
        otp,
      });
      const { accessToken, refreshToken } = res.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-lg relative">
        <button
          className="absolute top-2 right-3 text-xl font-bold text-gray-600 hover:text-red-500"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center text-gray-800 dark:text-white">
          OTP Verification
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            step === 1 ? handleSendOtp() : handleVerifyOtp();
          }}
          className="space-y-4"
        >
          {step === 1 ? (
            <>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mobile Number
              </label>
              <input
                type="tel"
                className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Enter mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading || mobile.length !== 10}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </>
          ) : (
            <>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Enter OTP
              </label>
              <input
                type="text"
                className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading || otp.length < 4}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </>
          )}

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="button"
            onClick={onClose}
            className="w-full mt-2 py-2 px-4 border border-gray-400 rounded-md hover:bg-gray-100 dark:text-white dark:border-gray-600 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
