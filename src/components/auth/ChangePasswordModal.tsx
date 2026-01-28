import { useState } from "react";
import { axiosPostChangePassword } from "../../services/userStore";
import toast from "react-hot-toast";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import { useTranslation } from "react-i18next";

interface ChangePasswordModalProps {
  onClose: () => void;
  userId: number;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  onClose,
  userId,
}) => {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
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
        userId: userId,
        currentPassword: currentPassword,
        newPassword: newPassword,
      });

      toast.success(t("toast.Password changed successfully!"));
      setMessage(t("message.Password changed successfully!"));
      setIsError(false);

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error: any) {
      console.error("Error:", error);

      let errorMessage = t("toast.Something went wrong. Please try again.");
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
    if (loading) return;
    setCurrentPassword("");
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

  // Prevent body scroll when modal is open
  useState(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  });

  return (
    <div className="fixed inset-0 z-50 top-90 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl mx-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()} // Prevent click from closing modal
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {t("header.Change Password")}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
            disabled={loading}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Current Password Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("header.Current Password")}
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? "text" : "password"}
              className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              placeholder={t("header.Enter your current password")}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500 hover:text-gray-700"
              disabled={loading}
              aria-label={
                showCurrentPassword ? "Hide password" : "Show password"
              }
            >
              {showCurrentPassword ? (
                <EyeIcon className="size-5" />
              ) : (
                <EyeCloseIcon className="size-5" />
              )}
            </button>
          </div>
        </div>

        {/* New Password Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("header.New Password")}
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              placeholder={t("header.Enter new password (min 8 characters)")}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500 hover:text-gray-700"
              disabled={loading}
              aria-label={showNewPassword ? "Hide password" : "Show password"}
            >
              {showNewPassword ? (
                <EyeIcon className="size-5" />
              ) : (
                <EyeCloseIcon className="size-5" />
              )}
            </button>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm text-center ${
              isError
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-green-50 text-green-800 border border-green-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {t("button.cancel")}
          </button>
          <button
            onClick={handleChangePassword}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
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
