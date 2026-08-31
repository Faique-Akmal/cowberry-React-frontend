import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import ForgotPasswordModal from "./ForgotPasswordModal";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

// Access Restriction Modal Component (unchanged)
const AccessRestrictionModal = ({
  isOpen,
  onClose,
  userRole,
}: {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}) => {
  if (!isOpen) return null;

  const getRestrictionMessage = () => {
    if (userRole?.toLowerCase() === "fieldemployee") {
      return {
        title: "Access Restricted",
        message:
          "Field employees cannot login through the web portal. Please use the mobile app to access your account.",
        buttonText: "Okay, Got it",
        showDownloadButton: true,
      };
    } else {
      return {
        title: "Access Denied",
        message: `Your role (${userRole || "Unknown"}) does not have permission to access this application. Please contact your administrator if you believe this is an error.`,
        buttonText: "Okay, Got it",
        showDownloadButton: true,
      };
    }
  };

  const restrictionInfo = getRestrictionMessage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {restrictionInfo.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {restrictionInfo.message}
          </p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {restrictionInfo.buttonText}
            </button>
            {restrictionInfo.showDownloadButton && (
              <button
                onClick={() => {
                  window.open(
                    "https://play.google.com/store/apps/details?id=com.cowberry.lantern360",
                  );
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download Mobile App
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Small inline icons (shared by mobile + desktop layouts)
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-blue-600">
    <path
      d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="m4 7 7.386 5.55a1 1 0 0 0 1.228 0L20 7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-blue-600">
    <rect
      x="5"
      y="10.5"
      width="14"
      height="9"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M8 10.5V7.5a4 4 0 1 1 8 0v3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-blue-600">
    <path
      d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="m9 12 2 2 4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const UserRoundIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-blue-600">
    <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-blue-700">
    <rect
      x="4"
      y="5.5"
      width="16"
      height="14.5"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M4 9.5h16M8 3.5v3M16 3.5v3"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const LeafIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-blue-700">
    <path
      d="M5 19c9 1 14-4 14-13-9 0-14 4-14 13Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M5 19c0-5 2.5-8.5 7-10.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-blue-700">
    <path
      d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="9.5" r="2.3" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

// Right-side illustration for the desktop / tablet layout
const DeliveryIllustration = () => (
  <svg
    viewBox="0 0 600 380"
    className="w-full h-auto max-w-[560px] mx-auto"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* soft glow behind logo */}
    <ellipse cx="300" cy="90" rx="220" ry="90" fill="white" opacity="0.15" />

    {/* city skyline */}
    <g opacity="0.35" fill="#ffffff">
      <rect x="10" y="190" width="34" height="120" rx="2" />
      <rect x="52" y="160" width="26" height="150" rx="2" />
      <rect x="86" y="210" width="30" height="100" rx="2" />
      <rect x="470" y="150" width="30" height="160" rx="2" />
      <rect x="508" y="195" width="26" height="115" rx="2" />
      <rect x="540" y="170" width="34" height="140" rx="2" />
      <rect x="120" y="230" width="22" height="80" rx="2" />
      <rect x="440" y="215" width="22" height="95" rx="2" />
    </g>
    <g opacity="0.25">
      <path
        d="M0 260 Q60 235 120 258 T240 255 T360 260 T480 250 T600 258 V380 H0 Z"
        fill="#ffffff"
      />
    </g>

    {/* trees */}
    <g opacity="0.9">
      <circle cx="60" cy="260" r="16" fill="#1e40af" opacity="0.35" />
      <rect
        x="57"
        y="272"
        width="6"
        height="18"
        fill="#1e40af"
        opacity="0.35"
      />
      <circle cx="540" cy="270" r="18" fill="#1e40af" opacity="0.35" />
      <rect
        x="536"
        y="284"
        width="7"
        height="20"
        fill="#1e40af"
        opacity="0.35"
      />
    </g>

    {/* road */}
    <path
      d="M0 330 Q150 300 300 320 T600 310 V380 H0 Z"
      fill="#ffffff"
      opacity="0.5"
    />
    <path
      d="M0 330 Q150 300 300 320 T600 310"
      stroke="#ffffff"
      strokeOpacity="0.9"
      strokeWidth="3"
      strokeDasharray="14 12"
      fill="none"
    />

    {/* dashed path to pin */}
    <path
      d="M330 316 Q420 300 470 250"
      stroke="#1e3a8a"
      strokeWidth="2.5"
      strokeDasharray="6 6"
      fill="none"
      opacity="0.6"
    />
    {/* destination pin */}
    <g transform="translate(452, 210)">
      <path
        d="M18 0C8 0 0 8 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8 28 0 18 0Z"
        fill="#1e3a8a"
      />
      <circle cx="18" cy="18" r="7" fill="white" />
      <circle cx="18" cy="49" r="4" fill="#1e3a8a" opacity="0.35" />
    </g>

    {/* scooter + rider */}
    <g transform="translate(230, 250)">
      {/* shadow */}
      <ellipse cx="70" cy="86" rx="72" ry="8" fill="#0f2a6b" opacity="0.25" />

      {/* rear wheel */}
      <circle cx="14" cy="78" r="16" fill="#1e3a8a" />
      <circle cx="14" cy="78" r="7" fill="#dbeafe" />
      {/* front wheel */}
      <circle cx="118" cy="78" r="16" fill="#1e3a8a" />
      <circle cx="118" cy="78" r="7" fill="#dbeafe" />

      {/* scooter body */}
      <path
        d="M8 78 Q6 55 30 52 L70 50 Q90 50 96 62 L118 78"
        stroke="#1e3a8a"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="60" y="34" width="20" height="18" rx="4" fill="#f59e0b" />
      <path
        d="M96 62 L110 40"
        stroke="#1e3a8a"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* rider legs */}
      <path
        d="M58 60 Q66 70 60 78"
        stroke="#0f2a6b"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      {/* rider body */}
      <path d="M55 24 Q40 30 46 52 Q50 60 60 60" fill="#2563eb" />
      {/* rider arm to handlebar */}
      <path
        d="M52 30 Q80 26 108 40"
        stroke="#2563eb"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      {/* helmet */}
      <circle cx="50" cy="14" r="14" fill="#1e3a8a" />
      <path d="M38 14a12 12 0 0 1 24 0" fill="#3b82f6" />
      <rect x="46" y="18" width="14" height="7" rx="3" fill="#dbeafe" />

      {/* delivery box */}
      <rect x="0" y="30" width="22" height="22" rx="3" fill="#f59e0b" />
      <path d="M0 38 H22 M11 30 V52" stroke="#b45309" strokeWidth="1.5" />
    </g>
  </svg>
);

export default function SignInForm() {
  const { t } = useTranslation();
  const { login } = useAuth();

  const [loginType, setLoginType] = useState<"user">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(true);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAccessRestrictionModal, setShowAccessRestrictionModal] =
    useState(false);
  const [restrictedUserRole, setRestrictedUserRole] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);

  const navigate = useNavigate();

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const openForgotModal = () => setIsForgotModalOpen(true);
  const closeForgotModal = () => setIsForgotModalOpen(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isAllowedRole = (role: string): boolean => {
    if (!role) return false;
    const normalizedRole = role.toLowerCase().trim();
    const allowedRoles = [
      "admin",
      "hr",
      "zonalmanager",
      "zonal_manager",
      "manager",
      "headofdepartment",
      "head_of_department",
      "hod",
    ];
    return allowedRoles.includes(normalizedRole);
  };

  const getLoginEndpoint = () => {
    return loginType === "admin" ? "/admin/login" : "/auth/login";
  };

  const handleAdminLogin = async (response: any) => {
    const { token, admin, message } = response.data;

    if (!token) {
      console.error("No token received in admin login");
      setMessage("No authentication token received from server.");
      toast.error("No authentication token received from server.", {
        id: loadingToast,
      });
      return;
    }

    const adminRole = admin?.role || "admin";

    if (!isAllowedRole(adminRole)) {
      setRestrictedUserRole(adminRole);
      setShowAccessRestrictionModal(true);
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      toast.error(`Access denied for role: ${adminRole}`, {
        id: loadingToast,
      });
      setIsLoading(false);
      return;
    }

    localStorage.setItem("userRole", adminRole);
    localStorage.setItem("userId", admin?.id || "");
    localStorage.setItem("username", admin?.username || "");
    localStorage.setItem("email", admin?.email || "");

    localStorage.setItem("token", token || "");
    localStorage.setItem("isAdmin", "true");

    try {
      await login(token, token);

      if (isChecked) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      const successMessage = message || t("toast.Logged in successfully");
      setMessage(successMessage);

      toast.success(`Welcome back, ${admin.username} 🍁`, {
        id: loadingToast,
      });

      setTimeout(() => {
        navigate("/home", { replace: true });
      }, 100);
    } catch (loginError) {
      console.error("Error in admin login function:", loginError);
      setMessage("Authentication context error. Please try again.");
      toast.error("Authentication context error. Please try again.", {
        id: loadingToast,
      });
    }
  };

  const handleUserLogin = async (response: any) => {
    const { user, tokens, message } = response.data;
    const userRole = user?.role || "";

    if (!isAllowedRole(userRole)) {
      setRestrictedUserRole(userRole);
      setShowAccessRestrictionModal(true);

      if (tokens?.access) {
        localStorage.removeItem("accessToken");
      }
      if (tokens?.refresh) {
        localStorage.removeItem("refreshToken");
      }

      toast.error(
        `Access denied. Role "${userRole}" does not have permission to use the web portal.`,
        {
          id: loadingToast,
        },
      );

      setIsLoading(false);
      return;
    }

    localStorage.setItem("userRole", userRole);
    localStorage.setItem(
      "full_name",
      user?.full_name || user?.name || user?.username || "",
    );
    localStorage.setItem("userId", user?.id || "");
    localStorage.setItem("profileimg", user?.profileimg || "");
    localStorage.setItem("department", user?.department || "");
    localStorage.setItem("username", user?.username || "");
    localStorage.setItem("employee_code", user?.employee_code || "");
    localStorage.setItem("email", user?.email || "");
    localStorage.setItem("zone", user?.zone.name || "");
    localStorage.setItem("zoneId", user?.zone.id || "");
    localStorage.setItem("mobileNo", user?.mobileNo || "");
    localStorage.setItem("token", tokens?.access || user?.accesstoken || "");
    localStorage.setItem("refreshToken", tokens?.refresh || "");
    localStorage.setItem("allocatedarea", user?.allocatedArea || "");
    localStorage.setItem(
      "isActiveEmployee",
      user?.isActiveEmployee ? "true" : "false",
    );

    if (tokens?.access && tokens?.refresh) {
      try {
        await login(tokens.refresh, tokens.access);

        if (isChecked) {
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberMe");
        }

        const successMessage = message || t("Logged in successfully");
        setMessage(successMessage);
        toast.success(`Welcome back, ${user.full_name || user.username} 🍁`, {
          id: loadingToast,
        });

        setTimeout(() => {
          navigate("/home", { replace: true });
        }, 100);
      } catch (loginError) {
        console.error("Error in login function:", loginError);
        setMessage("Authentication context error. Please try again.");
        toast.error("Authentication context error. Please try again.", {
          id: loadingToast,
        });
      }
    } else {
      console.error("No tokens received in user login:", tokens);
      setMessage("No authentication tokens received from server.");
      toast.error("No authentication tokens received from server.", {
        id: loadingToast,
      });
    }
  };

  let loadingToast: string;
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    loadingToast = toast.loading("Logging in...");
    const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(
      navigator.userAgent,
    );

    if (!email.trim() || !password.trim()) {
      setMessage(t("message.Please enter both email and password."));
      toast.error(t("Please enter both email and password."), {
        id: loadingToast,
      });
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = getLoginEndpoint();

      const response = await API.post(endpoint, {
        email: email.trim(),
        password: password.trim(),
        deviceType: isMobileDevice ? "mobile" : "desktop",
      });

      if (response.status === 200 || response.status === 201) {
        if (loginType === "admin") {
          await handleAdminLogin(response);
        } else {
          await handleUserLogin(response);
        }
      } else {
        if (response.data?.error || response.data?.message) {
          const errorMsg = response.data.error || response.data.message;
          setMessage(errorMsg);
          toast.error(errorMsg, {
            id: loadingToast,
          });
        } else {
          setMessage("Login failed. Please try again.");
          toast.error("Login failed. Please try again.");
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 400 || status === 401) {
          const errorMsg =
            data.error ||
            data.message ||
            data.detail ||
            t("message.Invalid email or password.");
          setMessage(errorMsg);
          toast.error(errorMsg, {
            id: loadingToast,
          });
        } else if (status === 422) {
          const errorMsg = data.message || t("message.Invalid input data.");
          setMessage(errorMsg);
          toast.error(errorMsg, {
            id: loadingToast,
          });
        } else if (status === 500) {
          const errorMsg = t("message.Server error. Please try again later.");
          setMessage(errorMsg);
          toast.error(errorMsg, {
            id: loadingToast,
          });
        } else {
          const errorMsg =
            data.error || data.message || data.detail || `Error: ${status}`;
          setMessage(errorMsg);
          toast.error(errorMsg, {
            id: loadingToast,
          });
        }
      } else if (error.request) {
        const errorMsg = t(
          "message.Cannot connect to server. Please check your connection.",
        );
        setMessage(errorMsg);
        toast.error(errorMsg);
      } else {
        const errorMsg = t(
          "message.An unexpected error occurred. Please try again.",
        );
        setMessage(errorMsg);
        toast.error(errorMsg, {
          id: loadingToast,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* ============ MOBILE / SMALL SCREEN UI (below md) — unchanged ============ */}
      <div className="md:hidden relative min-h-screen overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white dark:from-gray-900 dark:via-black dark:to-black">
        {/* Decorative shapes */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-700 rounded-full opacity-95" />
        <div className="absolute top-[28%] -right-10 w-32 h-32 bg-amber-200 rounded-full opacity-70" />
        <div className="absolute -bottom-24 -left-10 w-full h-56 bg-blue-700 rounded-t-[50%] opacity-95" />

        <div className="relative z-10 flex flex-col items-center px-5 pt-14 pb-10">
          {/* Logo */}
          <img
            src="lantern-logo-full.png"
            alt="lantern-logo"
            className={`h-60 mb-1 transition-all duration-700 ease-out ${
              isMounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-6"
            }`}
          />

          {/* Heading */}
          <h1
            className={`text-2xl font-bold text-gray-900 dark:text-white mt-1 transition-all duration-700 ease-out ${
              isMounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-4"
            }`}
          >
            {t("Welcomes You")}
          </h1>
          <p
            className={`text-sm text-gray-500 dark:text-gray-400 mt-1 mb-7 transition-all duration-700 ease-out ${
              isMounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2"
            }`}
          >
            {t("Sign in to continue to your account")}
          </p>

          {/* Card */}
          <form
            onSubmit={handleLogin}
            className={`w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 space-y-4 transition-all duration-700 ease-out ${
              isMounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
          >
            {/* Email */}
            <div className="space-y-1.5">
              <Label>
                {t("email")} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 bg-blue-50 dark:bg-blue-950 rounded">
                  <MailIcon />
                </span>
                <Input
                  placeholder={t("Enter your email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                  type="email"
                  className="pl-11"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label>
                {t("register.Password")} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 bg-blue-50 dark:bg-blue-950 rounded">
                  <LockIcon />
                </span>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("register.Enter your password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="pl-11 pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-sm font-medium text-blue-600"
                >
                  {showPassword ? (
                    <EyeIcon className="size-4 fill-blue-600" />
                  ) : (
                    <EyeCloseIcon className="size-4 fill-blue-600" />
                  )}
                  {showPassword ? t("Hide") : t("Show")}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Checkbox checked={isChecked} onChange={setIsChecked} />
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {t("Keep me logged in")}
                </span>
              </div>
              <button
                type="button"
                onClick={openForgotModal}
                className="text-xs text-blue-600 hover:underline"
                disabled={isLoading}
              >
                {t("Forgot Password?")}
              </button>
            </div>

            {/* Login button */}
            <Button
              type="submit"
              className="w-full !rounded-xl !bg-gradient-to-r !from-blue-700 !to-blue-500 !py-3 !text-white font-semibold shadow-md active:scale-[0.98] transition-transform"
              disabled={isLoading}
            >
              {isLoading ? t("button.Signing in...") : t("button.Sign in")}
            </Button>
          </form>
        </div>
      </div>

      {/* ============ DESKTOP / TABLET UI (md and up) — matches reference design ============ */}
      <div className="hidden md:flex h-screen w-full items-center justify-center bg-blue-50 dark:bg-gray-950 p-4 overflow-hidden">
        <div
          className={`
      w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr]
      bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl overflow-hidden
      transition-all duration-700 ease-out
      h-[92vh] max-h-[850px]
      ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
    `}
        >
          {/* ---------- LEFT: sign-in card ---------- */}
          <div className="flex flex-col justify-center px-8 py-10 sm:px-12">
            <div className="w-full max-w-sm mx-auto">
              <div className="flex justify-center mb-2">
                <img
                  src="lantern-logo.png"
                  alt="lantern-logo"
                  className="h-28 w-auto"
                />
              </div>

              <h1 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
                {t("Welcome to ")}
                <span className="text-lantern-blue-600">Lantern 360</span>
              </h1>

              <div className="flex items-center justify-center gap-2 my-5">
                <span className="h-px w-10 bg-gray-200 dark:bg-gray-700" />
                <span className="h-1.5 w-1.5 rounded-full bg-blue-700" />
                <span className="h-px w-10 bg-gray-200 dark:bg-gray-700" />
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>
                    {loginType === "admin" ? "Admin Email" : t("email")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 bg-blue-50 dark:bg-blue-950 rounded">
                      <MailIcon />
                    </span>
                    <Input
                      placeholder={
                        loginType === "admin"
                          ? "Enter admin email"
                          : t("Enter your email")
                      }
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      autoComplete="email"
                      type="email"
                      className="pl-11 transition-all duration-300 focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>
                    {t("register.Password")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 bg-blue-50 dark:bg-blue-950 rounded">
                      <LockIcon />
                    </span>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={t("register.Enter your password")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="pl-11 pr-11 transition-all duration-300 focus:ring-2 focus:ring-blue-600"
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform duration-300"
                    >
                      {showPassword ? (
                        <EyeIcon className="size-5 fill-gray-500" />
                      ) : (
                        <EyeCloseIcon className="size-5 fill-gray-500" />
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t("Keep me logged in")}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={openForgotModal}
                    className="text-sm text-red-600 , caring shake, as chargang it logic out or turned flat complex study and check out to automatically job show issue in covering automotivation, automatic battle add personally barely so neither music checking around stuff maybe check into the freshlogic checker in the chicken check out as doing player thin phrase pool original changes file control control control, capitality John dolf, nowadays or ITMP, usually dollar a memory, frequency pencil manually doing show product, you list them flow my Zaphers Pura, usually in charge fancy. hover:underline"
                    disabled={isLoading}
                  >
                    {t("Forgot Password?")}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full !rounded-xl !bg-lantern-blue-600 !py-3 !text-white font-semibold shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading
                    ? loginType === "admin"
                      ? "Signing in as Admin..."
                      : t("button.Signing in...")
                    : loginType === "admin"
                      ? "Sign in as Admin"
                      : t("button.Sign in")}
                </Button>
              </form>

              {/* <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheckIcon />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheckIcon />
                  <span>Reliable</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <UserRoundIcon />
                  <span>Built for You</span>
                </div>
              </div> */}
            </div>
          </div>

          {/* ---------- RIGHT: illustration panel ---------- */}
          <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-100 via-blue-50 to-white dark:from-blue-950 dark:via-gray-900 dark:to-gray-900 px-10 py-10">
            {/* dotted pattern top-right */}
            <div
              className="absolute top-8 right-8 grid grid-cols-8 gap-2 opacity-60"
              aria-hidden="true"
            >
              {Array.from({ length: 32 }).map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-blue-700"
                />
              ))}
            </div>

            {/* soft blob backgrounds */}
            <div className="absolute -top-16 -left-16 w-82 h-72 bg-blue-400 rounded-full opacity-40 blur-2xl" />
            {/* <div className="absolute bottom-0 left-0 w-full h-30 bg-yellow-300  rounded-t-[80%]" /> */}

            <div className="relative z-10 flex flex-col items-center pt-4 ">
              <img
                src="lantern-logo-full.png"
                alt="lantern-logo"
                className="h-100 w-100 Last model, you have drives last simple it's no share ears, a little money started.mb-2"
              />
            </div>

            <div className="relative z-10  -mt-8 a little similar tress. Six draft, ya order in chishen orders space its cores itshopping apply for do a lot photos options si utilized it products driver human marks to barri option and quarter pressure, so orders are doing sharing one three two seven parts in my maritime. Black shows July Prider System barkes human to order deliver snow system under sound two six order number one two six one one two sixdlivered order one six order Shipra order number drive one three three seven order system and one two six dono system dlivers deliveryso it's a contact shirt no apple clear dispatch me call is part collecting our phone merge product plura food story. Do you think while technically बात issuephilip to look in the Issue chart,or platforms flex items-center justify-center">
              <div className="flex items-center gap-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-full shadow-lg px-6 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-200">
                  <CalendarIcon />
                  <span>Attendance</span>
                </div>
                <span className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-200">
                  <LeafIcon />
                  <span>Leaves</span>
                </div>
                <span className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-200">
                  <PinIcon />
                  <span>Tracking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={closeForgotModal}
      />

      <AccessRestrictionModal
        isOpen={showAccessRestrictionModal}
        onClose={() => setShowAccessRestrictionModal(false)}
        userRole={restrictedUserRole}
      />
    </>
  );
}
