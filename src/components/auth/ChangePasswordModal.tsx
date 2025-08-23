import { useState } from "react";
import { axiosPostChangePassword } from "../../store/userStore";
import toast from "react-hot-toast";
import {  EyeCloseIcon, EyeIcon } from "../../icons";

import { useTranslation } from "react-i18next";

interface ChangePasswordModalProps {
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
   const [showPassword, setShowPassword] = useState(false);

  // Moved handleClose above handleChangePassword so it exists when called
  
  const handleChangePassword = async () => {
  if (!oldPassword || !newPassword) {
    setMessage(t("message.Both fields are required."));
    setIsError(true);
    return;
  }

  if (newPassword.length < 8) {
    setMessage(t("message.New password must be at least 8 characters long."));
    setIsError(true);
    return;
  }

  setLoading(true);
  setMessage("");
  setIsError(false);

  try {
    const res = await axiosPostChangePassword({
      old_password: oldPassword,
      new_password: newPassword,
    });

    // axios will only reach here if status is 2xx
    toast.success(t("toast.Password changed successfully!"));
    // setMessage("Password changed successfully!");
    setIsError(false);

    setTimeout(() => {
      handleClose();
    }, 1500);

  } catch (error: any) {
    console.error("Error:", error);

    let errorMessage =(t( "toast.Something went wrong. Please try again."));
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }

    toast.error(errorMessage);
    setMessage(errorMessage);
    setIsError(true);
  } finally {
    setLoading(false);
  }
};


  const handleClose = () => {
    if (loading) return; // prevent closing while loading
    setOldPassword("");
    setNewPassword("");
    setMessage("");
    setIsError(false);
    onClose();
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleChangePassword();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-black">{t("header.Change Password")}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

       <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    {t("header.Current Password")}
  </label>
  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      value={oldPassword}
      onChange={(e) => setOldPassword(e.target.value)}
      onKeyPress={handleKeyPress}
      disabled={loading}
      placeholder={t("header.Enter your current password")}
    />
    <span
      onClick={() => setShowPassword(!showPassword)}
      className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
    >
      {showPassword ? (
        <EyeIcon className="size-5 fill-gray-500" />
      ) : (
        <EyeCloseIcon className="size-5 fill-gray-500" />
      )}
    </span>
  </div>
</div>

<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
   {t("header.New Password")}
  </label>
  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
      onKeyPress={handleKeyPress}
      disabled={loading}
      placeholder={t("header.Enter new password (min 8 characters)")}
    />
    <span
      onClick={() => setShowPassword(!showPassword)}
      className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
    >
      {showPassword ? (
        <EyeIcon className="size-5 fill-gray-500" />
      ) : (
        <EyeCloseIcon className="size-5 fill-gray-500" />
      )}
    </span>
  </div>
</div>


        {/* {message && (
          <div
            className={`mt-4 p-3 rounded-md text-sm text-center ${
              isError
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-green-50 text-green-800 border border-green-200"
            }`}
          >
            {message}
          </div>
       )} */}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            disabled={loading}
          >
            {t("button.cancel")}
          </button>
          <button
            onClick={handleChangePassword}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            disabled={loading}
          >
            {loading ? t("button.Changing...") : t("button.Change Password")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
