import { useState } from "react";
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
const FieldEmployeeRestrictionModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <svg className="h-6 w-6 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Access Restricted
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Field employees cannot login through the web portal. Please use the mobile app to access your account.
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
                window.open('https://your-mobile-app-download-link.com', '_blank');
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

  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(true);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFieldEmployeeModal, setShowFieldEmployeeModal] = useState(false);

  const navigate = useNavigate();

  // forgotPasswordModal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const openForgotModal = () => setIsForgotModalOpen(true);
  const closeForgotModal = () => setIsForgotModalOpen(false);

  // Function to check if user is a field employee
  const isFieldEmployee = (role: string): boolean => {
    if (!role) return false;
    
    const normalizedRole = role.toLowerCase().trim();
    
    // Check for various possible field employee role names
    return (
      normalizedRole === "fieldemployee" ||
      normalizedRole === "field employee" ||
      normalizedRole === "field_employee" ||
      normalizedRole.includes("field") && normalizedRole.includes("employee") ||
      normalizedRole === "fieldstaff" ||
      normalizedRole === "field staff"
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const loadingToast = toast.loading("Logging in...");
    const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(
      navigator.userAgent
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
      const response = await API.post("/auth/login", {
        email: email.trim(),
        password: password.trim(),
        deviceType: isMobileDevice ? "mobile" : "desktop",
      });

      if (response.status === 200 || response.status === 201) {
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
        localStorage.setItem("token", user?.accesstoken || "");
        localStorage.setItem(
          "isActiveEmployee",
          user?.isActiveEmployee ? "true" : "false"
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

            // Get user role and normalize it
            const userRole = user?.role ;
            const normalizedRole = userRole.toLowerCase().trim();

            // Role-based navigation logic (excluding field employees)
            let targetRoute = "/home";

            if (normalizedRole === "admin") {
              targetRoute = "/home";
            } else if (normalizedRole === "hr" || normalizedRole === "manager" || normalizedRole === "zonalmanager") {
              targetRoute = "/home";
            } else {
              targetRoute = "/";
            }

            // Navigate after a short delay
            setTimeout(() => {
              navigate(targetRoute, { replace: true });
            }, 100);
          } catch (loginError) {
            console.error("Error in login function:", loginError);
            setMessage("Authentication context error. Please try again.");
            toast.error("Authentication context error. Please try again.", {
              id: loadingToast,
            });
          }
        } else {
          setMessage("No authentication tokens received from server.");
          toast.error("No authentication tokens received from server.");
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
          "message.Cannot connect to server. Please check your connection."
        );
        setMessage(errorMsg);
        toast.error(errorMsg);
      } else {
        // Something else happened
        const errorMsg = t(
          "message.An unexpected error occurred. Please try again."
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
      <div className="flex flex-col flex-1 dark:bg-black dark:text-white bg-white rounded-2xl shadow-lg p-6">
        <div className="w-50 h-50 mx-auto mb-8 mt-1">
          <img
            src="cowberry_organics_1.png"
            alt="cowberry-logo"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          />
        </div>
        <div className="flex items-center justify-center w-full h-10 ">
          <h1 className="text-2xl font-bold">{t("Welcome to Lantern ")} <sub className="text-xs text-black">365</sub> </h1>
          <br></br>
        </div>
        
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <form onSubmit={handleLogin}>
            <div className="space-y-6">
              <div className="capitalize">
                <Label>
                  {t("email")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder={t("Enter your email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                  type="email"
                />
              </div>

              <div className="capitalize">
                <Label>
                  {t("register.Password")} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={t("register.Enter your password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="size-5 fill-gray-500" />
                    ) : (
                      <EyeCloseIcon className="size-5 fill-gray-500" />
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox checked={isChecked} onChange={setIsChecked} />
                  <span className="text-sm text-gray-700">
                    {t("Keep me logged in")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={openForgotModal}
                  className="text-sm text-brand-500 hover:underline"
                  disabled={isLoading}
                >
                  {t("Forgot Password?")}
                </button>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  size="sm"
                  disabled={isLoading}
                >
                  {isLoading ? t("button.Signing in...") : t("button.Sign in")}
                </Button>
              </div>

              {message && (
                <p
                  className={`text-sm text-center font-medium ${
                    message.toLowerCase().includes("success")
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {message}
                </p>
              )}

              {/* Field Employee Notice */}
              {/* <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <span className="font-semibold">Note for Field Employees:</span> If you're a field employee, please use the mobile app to login. Web portal access is restricted for field roles.
                  </p>
                </div>
              </div> */}
            </div>
          </form>
        </div>
      </div>

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