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

// Small inline icons for the mobile layout (avoids depending on an icon lib you may not have)
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
      {/* ============ MOBILE / SMALL SCREEN UI (below md) ============ */}
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

      {/* ============ EXISTING DESKTOP / TABLET UI (md and up) — unchanged ============ */}
      <div
        className="
          hidden md:flex
          p-3 mx-3 my-4
          sm:p-0 sm:mx-0 sm:my-0
          sm:border-0 sm:rounded-none
          px-4 sm:px-6 flex-col flex-1 dark:bg-black dark:text-white bg-white rounded-2xl shadow-lg"
      >
        <div
          className={`
            transition-all duration-700 ease-out
            ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"}
          `}
        >
          <div className="max-w-90 h-60 mx-auto pt-8 sm:pt-12 flex items-center justify-center">
            <img
              src="lantern-logo.png"
              alt="cowberry-logo"
              className={`
                inline-flex items-center justify-center text-sm text-gray-500 hover:text-gray-700
                transition-all duration-800 ease-out
                ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"}
                hover:scale-105 transition-transform duration-300
              `}
              style={{
                animation: isMounted
                  ? "logoDrop 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
                  : "none",
              }}
            />
          </div>

          <div className="flex items-center justify-center w-full h-10 pb-4 ">
            <h1
              className={`
                text-2xl font-bold relative
                transition-all duration-900 ease-out
                ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-12"}
              `}
              style={{
                animation: isMounted
                  ? "welcomeDrop 1.1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
                  : "none",
              }}
            >
              {t("Welcome to Lantern ")}
              <sub
                className={`
                  text-xs text-black dark:text-white
                  transition-all duration-1000 ease-out
                  ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"}
                `}
                style={{
                  animationDelay: isMounted ? "0.2s" : "0s",
                }}
              >
                360
              </sub>
            </h1>
          </div>

          <div
            className={`
              flex flex-col justify-center flex-1 w-full max-w-md mx-auto
              transition-all duration-700 ease-out
              ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
            `}
            style={{
              animationDelay: isMounted ? "0.3s" : "0s",
            }}
          >
            <form onSubmit={handleLogin}>
              <div className="space-y-3">
                <div
                  className="capitalize space-y-2"
                  style={{
                    animation: isMounted
                      ? "formElementDrop 0.6s ease-out 0.4s forwards"
                      : "none",
                    opacity: isMounted ? 1 : 0,
                    transform: isMounted ? "translateY(0)" : "translateY(20px)",
                  }}
                >
                  <Label>
                    {loginType === "admin" ? "Admin Email" : t("email")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
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
                    className="transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] focus:ring-2 focus:ring-lantern-blue-600"
                  />
                </div>

                <div
                  className="capitalize space-y-2"
                  style={{
                    animation: isMounted
                      ? "formElementDrop 0.6s ease-out 0.5s forwards"
                      : "none",
                    opacity: isMounted ? 1 : 0,
                    transform: isMounted ? "translateY(0)" : "translateY(20px)",
                  }}
                >
                  <Label>
                    {t("register.Password")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={t("register.Enter your password")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] focus:ring-2 focus:ring-lantern-blue-600"
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 hover:scale-110 transition-transform duration-300"
                    >
                      {showPassword ? (
                        <EyeIcon className="size-5 fill-gray-500" />
                      ) : (
                        <EyeCloseIcon className="size-5 fill-gray-500" />
                      )}
                    </span>
                  </div>
                </div>

                <div
                  className="flex items-center justify-between"
                  style={{
                    animation: isMounted
                      ? "formElementDrop 0.6s ease-out 0.6s forwards"
                      : "none",
                    opacity: isMounted ? 1 : 0,
                    transform: isMounted ? "translateY(0)" : "translateY(20px)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isChecked}
                      onChange={setIsChecked}
                      className="hover:scale-110 transition-transform duration-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t("Keep me logged in")}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={openForgotModal}
                    className="text-sm text-lantern-blue-600 hover:underline hover:scale-105 transition-all duration-300"
                    disabled={isLoading}
                  >
                    {t("Forgot Password?")}
                  </button>
                </div>

                <div
                  style={{
                    animation: isMounted
                      ? "formElementDrop 0.6s ease-out 0.7s forwards"
                      : "none",
                    opacity: isMounted ? 1 : 0,
                    transform: isMounted ? "translateY(0)" : "translateY(20px)",
                  }}
                >
                  <Button
                    type="submit"
                    className="w-full transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg"
                    size="sm"
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
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* CSS Animations (only used by desktop UI) */}
      <style>{`
        @keyframes logoDrop {
          0% { opacity: 0; transform: translateY(-40px) scale(0.9); }
          60% { opacity: 1; transform: translateY(10px) scale(1.05); }
          80% { transform: translateY(-2px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes welcomeDrop {
          0% { opacity: 0; transform: translateY(-60px) scale(0.85) rotateX(-90deg); text-shadow: 0 10px 20px rgba(0,0,0,0.3); }
          50% { opacity: 1; transform: translateY(15px) scale(1.08) rotateX(10deg); text-shadow: 0 15px 30px rgba(0,0,0,0.4); }
          70% { transform: translateY(-5px) scale(1.03) rotateX(-5deg); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotateX(0); text-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        }
        @keyframes formElementDrop {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

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
