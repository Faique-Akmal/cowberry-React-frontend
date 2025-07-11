import { useState } from "react";
import axios from "axios";
import Modal from "../ui/modal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";

const API_URL = "https://your-api.com"; // 🔁 Replace with your real API

export default function OtpVerificationModal({ isOpen, onClose, onSuccess }) {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: enter mobile, 2: enter OTP
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
        setError(res.data.message || "Something went wrong.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "OTP sending failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_URL}/auth/verify-otp`, { mobile, otp });
      const { accessToken, refreshToken } = res.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      if (onSuccess) onSuccess(); // Callback if needed
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <div className="space-y-5">
        <h2 className="text-xl font-semibold text-center">OTP Verification</h2>
        {step === 1 ? (
          <>
            <div>
              <Label>Mobile Number</Label>
              <Input
                type="tel"
                placeholder="Enter mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>
            <Button onClick={handleSendOtp} disabled={loading || mobile.length < 10}>
              {loading ? "Sending..." : "Send OTP"}
            </Button>
          </>
        ) : (
          <>
            <div>
              <Label>Enter OTP</Label>
              <Input
                type="text"
                placeholder="Enter the OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <Button onClick={handleVerifyOtp} disabled={loading || otp.length < 4}>
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
          </>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
