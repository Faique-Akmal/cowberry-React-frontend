import { useState } from "react";
import OtpVerificationModal from "./OtpVerification";

export default function LoginWithOtp() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-8">
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-md"
      >
        Login with Mobile OTP
      </button>

      <OtpVerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => alert("OTP Verified!")}
      />
    </div>
  );
}
