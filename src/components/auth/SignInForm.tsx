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

// Field Employee Restriction Modal Component
const FieldEmployeeRestrictionModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

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
            Access Restricted
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Field employees cannot login through the web portal. Please use the
            mobile app to access your account.
          </p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Okay, Got it
            </button>
            <button
              onClick={() => {
                // You can add logic to redirect to app store or show download links
                window.open(
                  "https://your-mobile-app-download-link.com",
                  "_blank",
                );
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Download Mobile App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SignInForm() {
  const { t } = useTranslation();
  const { login } = useAuth();

  const [loginType, setLoginType] = useState<"user" | "admin">("user"); // 'user' or 'admin'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(true);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFieldEmployeeModal, setShowFieldEmployeeModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const navigate = useNavigate();

  // forgotPasswordModal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const openForgotModal = () => setIsForgotModalOpen(true);
  const closeForgotModal = () => setIsForgotModalOpen(false);

  useEffect(() => {
    // Trigger animation after component mounts
    setIsMounted(true);
  }, []);

  // Function to check if user is a field employee
  const isFieldEmployee = (role: string): boolean => {
    if (!role) return false;

    const normalizedRole = role.toLowerCase().trim();

    // Check for various possible field employee role names
    return (
      normalizedRole === "fieldemployee" ||
      normalizedRole === "field employee" ||
      normalizedRole === "field_employee" ||
      (normalizedRole.includes("field") &&
        normalizedRole.includes("employee")) ||
      normalizedRole === "fieldstaff" ||
      normalizedRole === "field staff"
    );
  };

  // Function to determine login endpoint based on login type
  const getLoginEndpoint = () => {
    return loginType === "admin" ? "/admin/login" : "/auth/login";
  };

  // Function to handle admin login with the correct response format
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

    // Store admin-specific data in localStorage
    localStorage.setItem("userRole", admin?.role || "admin");
    localStorage.setItem("userId", admin?.id || "");
    localStorage.setItem("username", admin?.username || "");
    localStorage.setItem("email", admin?.email || "");
    localStorage.setItem("token", token || "");
    localStorage.setItem("isAdmin", "true");

    try {
      await login(token, token); // Using same token for both refresh and access

      // Store "Keep me logged in" preference
      if (isChecked) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      // Show success message
      const successMessage = message || t("toast.Logged in successfully");
      setMessage(successMessage);

      // Update the loading toast to success
      toast.success(`Welcome back, ${admin.username} 🍁`, {
        id: loadingToast,
      });

      // Navigate to home for admin
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

  // Function to handle user login (HR, Manager, Zonal Manager)
  const handleUserLogin = async (response: any) => {
    const { user, tokens, message } = response.data;

    // Check if user is a field employee BEFORE storing anything
    const userRole = user?.role || "";

    if (isFieldEmployee(userRole)) {
      // Show field employee restriction modal
      setShowFieldEmployeeModal(true);

      // Clear any tokens that might have been set
      if (tokens?.access) {
        localStorage.removeItem("accessToken");
      }
      if (tokens?.refresh) {
        localStorage.removeItem("refreshToken");
      }

      // Show error toast
      toast.error("Field employees must use the mobile app to login", {
        id: loadingToast,
      });

      setIsLoading(false);
      return; // Stop further execution
    }

    // Store user data in localStorage (only if not field employee)
    localStorage.setItem("userRole", user?.role || "employee");
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

    // Set tokens in auth context
    if (tokens?.access && tokens?.refresh) {
      try {
        await login(tokens.refresh, tokens.access);

        // Store "Keep me logged in" preference
        if (isChecked) {
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberMe");
        }

        // Show success message
        const successMessage = message || t("toast.Logged in successfully");
        setMessage(successMessage);
        toast.success(`Welcome back, ${user.username} 🍁`, {
          id: loadingToast,
        });

        // Navigate to home
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

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setMessage(t("message.Please enter both email and password."));
      toast.error(t("toast.Please enter both email and password."), {
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
        // If we have a message, show it
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
        // Server responded with error status
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
        // Request was made but no response received
        const errorMsg = t(
          "message.Cannot connect to server. Please check your connection.",
        );
        setMessage(errorMsg);
        toast.error(errorMsg);
      } else {
        // Something else happened
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
      // Don't dismiss toast here - let the success/error handlers do it
    }
  };

  return (
    <>
      <div className="flex flex-col flex-1 dark:bg-black dark:text-white bg-white rounded-2xl shadow-lg ">
        {/* Main animated container with dropping effect */}
        <div
          className={`
            transition-all duration-700 ease-out
            ${
              isMounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-8"
            }
          `}
        >
          {/* Logo with bounce animation */}
          <div className="w-40 h-40 mx-auto ">
            <img
              src="cowberry_organics_1.png"
              alt="cowberry-logo"
              className={`
                inline-flex items-center text-sm text-gray-500 hover:text-gray-700
                transition-all duration-800 ease-out
                ${
                  isMounted
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-10"
                }
                hover:scale-105 transition-transform duration-300
              `}
              style={{
                animation: isMounted
                  ? "logoDrop 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
                  : "none",
              }}
            />
          </div>

          {/* Welcome text with enhanced dropping effect */}
          <div className="flex items-center justify-center w-full h-10 mb-4">
            <h1
              className={`
                text-2xl font-bold relative
                transition-all duration-900 ease-out
                ${
                  isMounted
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-12"
                }
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
                  ${
                    isMounted
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 -translate-y-6"
                  }
                `}
                style={{
                  animationDelay: isMounted ? "0.2s" : "0s",
                }}
              >
                360
              </sub>
            </h1>
          </div>

          {/* Login Type Selector */}
          {/* <div className="flex justify-center">
            <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => {
                  setLoginType('user');
                  setEmail('');
                  setPassword('');
                  setMessage('');
                }}
                className={`
                  px-4 py-2 text-sm font-medium rounded-md transition-all duration-300
                  ${loginType === 'user' 
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                  }
                `}
              >
                Employee Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginType('admin');
                  setEmail('');
                  setPassword('');
                  setMessage('');
                }}
                className={`
                  px-4 py-2 text-sm font-medium rounded-md transition-all duration-300
                  ${loginType === 'admin' 
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                  }
                `}
              >
                Admin Login
              </button>
            </div>
          </div> */}

          {/* Login type indicator */}
          {/* <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {loginType === 'admin' 
                ? 'Sign in as Administrator' 
                : 'Sign in as Employee/Manager/HR'
              }
            </p>
          </div>
           */}
          {/* Form container with staggered animation */}
          <div
            className={`
              flex flex-col justify-center flex-1 w-full max-w-md mx-auto
              transition-all duration-700 ease-out
              ${
                isMounted
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }
            `}
            style={{
              animationDelay: isMounted ? "0.3s" : "0s",
            }}
          >
            <form onSubmit={handleLogin}>
              <div className="space-y-6">
                {/* Email Input with animation */}
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
                    className="transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Password Input with animation */}
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
                      className="transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] focus:ring-2 focus:ring-blue-500"
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

                {/* Checkbox and Forgot Password with animation */}
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
                    className="text-sm text-brand-500 hover:underline hover:scale-105 transition-all duration-300"
                    disabled={isLoading}
                  >
                    {t("Forgot Password?")}
                  </button>
                </div>

                {/* Submit Button with animation */}
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

      {/* CSS Animations */}
      <style>{`
        @keyframes logoDrop {
          0% {
            opacity: 0;
            transform: translateY(-40px) scale(0.9);
          }
          60% {
            opacity: 1;
            transform: translateY(10px) scale(1.05);
          }
          80% {
            transform: translateY(-2px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes welcomeDrop {
          0% {
            opacity: 0;
            transform: translateY(-60px) scale(0.85) rotateX(-90deg);
            text-shadow: 0 10px 20px rgba(0,0,0,0.3);
          }
          50% {
            opacity: 1;
            transform: translateY(15px) scale(1.08) rotateX(10deg);
            text-shadow: 0 15px 30px rgba(0,0,0,0.4);
          }
          70% {
            transform: translateY(-5px) scale(1.03) rotateX(-5deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotateX(0);
            text-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
        }
        
        @keyframes formElementDrop {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Modals */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={closeForgotModal}
      />

      <FieldEmployeeRestrictionModal
        isOpen={showFieldEmployeeModal}
        onClose={() => setShowFieldEmployeeModal(false)}
      />
    </>
  );
}
