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
import toast, { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function SignInForm() {
  const { t } = useTranslation();
  const { login } = useAuth();

  const [email, setEmail] = useState(""); // Changed variable name for consistency
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // forgotPasswordModal 
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const openForgotModal = () => setIsForgotModalOpen(true);
  const closeForgotModal = () => setIsForgotModalOpen(false);

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setMessage("");
  
  const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  // Basic validation
  if (!email.trim() || !password.trim()) {
    setMessage(t("message.Please enter both email and password."));
    toast.error(t("toast.Please enter both email and password."));
    setIsLoading(false);
    return;
  }

  try {
    console.log("Sending login request with:", { email: email.trim(), password: "***" });
    
    const response = await API.post(
      "/auth/login/",
      {
        email: email.trim(),
        password: password.trim(),
        deviceType: isMobileDevice ? "mobile" : "desktop"
      }
    );

    console.log("Login API Response:", response);
    console.log("Full response data:", response.data);

    // Check for successful login based on status code
    if (response.status === 200 || response.status === 201) {
      const { user, tokens, message } = response.data;
      
      console.log("User data:", user);
      console.log("Tokens:", tokens);
      console.log("Server message:", message);

      // Store user data in localStorage
      localStorage.setItem("userRole", user?.role || "employee");
      localStorage.setItem("userId", user?.id || "");
      localStorage.setItem("department", user?.department || "");
      localStorage.setItem("username", user?.username || "");
      localStorage.setItem("employee_code", user?.employee_code || "");
      localStorage.setItem("email", user?.email || "");
      localStorage.setItem("mobileNo", user?.mobileNo || "");
      localStorage.setItem("isActiveEmployee", user?.isActiveEmployee ? "true" : "false");
      
      console.log("LocalStorage after saving user data:");
      console.log("userRole:", localStorage.getItem("userRole"));
      console.log("userId:", localStorage.getItem("userId"));
      console.log("email:", localStorage.getItem("email"));

      // Set tokens in auth context and WAIT for it to complete
      if (tokens?.access && tokens?.refresh) {
        try {
          console.log("Calling login function with tokens...");
          
          // WAIT for login to complete (this should store tokens in context)
          await login(tokens.refresh, tokens.access);
          console.log("Login function completed successfully");
          
          // Store "Keep me logged in" preference
          if (isChecked) {
            localStorage.setItem('rememberMe', 'true');
            console.log("Remember me enabled");
          } else {
            localStorage.removeItem('rememberMe');
          }
          
          // Show success message
          const successMessage = message || t("toast.Logged in successfully");
          setMessage(successMessage);
          toast.success(successMessage);
          
          // Debug: Check if tokens are stored
          console.log("Access token in localStorage:", localStorage.getItem("accessToken") ? "Yes" : "No");
          console.log("Refresh token in localStorage:", localStorage.getItem("refreshToken") ? "Yes" : "No");
          
          // Get user role and normalize it (handle case sensitivity)
          const userRole = user?.role || "employee";
          const normalizedRole = userRole.toLowerCase();
          console.log("User role for navigation:", userRole, "(normalized:", normalizedRole, ")");
          
          // Role-based navigation logic
          let targetRoute = "/home"; // Default for HR and admin
          
          if (normalizedRole === "employee") {
            targetRoute = "/employee-dashboard";
          } else if (normalizedRole === "hr" || normalizedRole === "admin") {
            targetRoute = "/home";
          }
          
          console.log(`Navigating ${userRole} user to: ${targetRoute}`);
          
          // Small delay to ensure state updates (optional, can remove if not needed)
          setTimeout(() => {
            navigate(targetRoute, { replace: true });
          }, 100);
          
        } catch (loginError) {
          console.error("Error in login function:", loginError);
          setMessage("Authentication context error. Please try again.");
          toast.error("Authentication context error. Please try again.");
        }
      } else {
        console.error("No tokens in response:", response.data);
        setMessage("No authentication tokens received from server.");
        toast.error("No authentication tokens received from server.");
      }
    } else {
      // If we have a message, show it
      if (response.data?.error || response.data?.message) {
        const errorMsg = response.data.error || response.data.message;
        setMessage(errorMsg);
        toast.error(errorMsg);
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
      
      console.log("Error response status:", status);
      console.log("Error response data:", data);
      
      if (status === 400 || status === 401) {
        const errorMsg = data.error || data.message || data.detail || t("message.Invalid email or password.");
        setMessage(errorMsg);
        toast.error(errorMsg);
      } else if (status === 422) {
        const errorMsg = data.message || t("message.Invalid input data.");
        setMessage(errorMsg);
        toast.error(errorMsg);
      } else if (status === 500) {
        const errorMsg = t("message.Server error. Please try again later.");
        setMessage(errorMsg);
        toast.error(errorMsg);
      } else {
        const errorMsg = data.error || data.message || data.detail || `Error: ${status}`;
        setMessage(errorMsg);
        toast.error(errorMsg);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.log("No response received:", error.request);
      const errorMsg = t("message.Cannot connect to server. Please check your connection.");
      setMessage(errorMsg);
      toast.error(errorMsg);
    } else {
      // Something else happened
      console.log("Request setup error:", error.message);
      const errorMsg = t("message.An unexpected error occurred. Please try again.");
      setMessage(errorMsg);
      toast.error(errorMsg);
    }
  } finally {
    setIsLoading(false);
  }
};
  return (
    <div className="flex flex-col flex-1 dark:bg-black dark:text-white bg-white rounded-2xl shadow-lg p-6">
      <Toaster position="top-right" />
      
      <div className="w-20 h-20 mx-auto mb-6 mt-6">
        <img src="logo-cowberry.png" alt="cowberry-logo" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700" />
      </div>
      <div className="flex items-center justify-center w-full h-20">
        <h1 className="text-xl font-bold">{t("WELCOME TO COWBERRY")}</h1>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <form onSubmit={handleLogin}>
          <div className="space-y-6">
            <div className="capitalize">
              <Label>{t("register.email")} <span className="text-red-500">*</span></Label>
              <Input
                placeholder={t("register.Enter your email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                type="email"
              />
            </div>

            <div className="capitalize">
              <Label>{t("register.Password")} <span className="text-red-500">*</span></Label>
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
                <span className="text-sm text-gray-700">{t("Keep me logged in")}</span>
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
            
            <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={closeForgotModal} />
            
            {message && (
              <p className={`text-sm text-center font-medium ${
                message.toLowerCase().includes("success") 
                  ? "text-green-500" 
                  : "text-red-500"
              }`}>
                {message}
              </p>
            )}
            
            {/* Debug info - Remove in production */}
            {/* {process.env.NODE_ENV === 'development' && (
              <div className="p-2 mt-4 text-xs text-gray-500 border border-gray-200 rounded">
                <p className="font-semibold">Debug Info:</p>
                <p>Email: {email}</p>
                <p>Access Token: {localStorage.getItem('accessToken') ? '✅ Present' : '❌ Missing'}</p>
                <p>Refresh Token: {localStorage.getItem('refreshToken') ? '✅ Present' : '❌ Missing'}</p>
                <p>User Role: {localStorage.getItem('userRole') || 'Not set'}</p>
                <p>User ID: {localStorage.getItem('userId') || 'Not set'}</p>
                <button 
                  onClick={() => {
                    console.log("LocalStorage dump:", {
                      accessToken: localStorage.getItem('accessToken'),
                      refreshToken: localStorage.getItem('refreshToken'),
                      userRole: localStorage.getItem('userRole'),
                      userId: localStorage.getItem('userId'),
                      email: localStorage.getItem('email')
                    });
                  }}
                  className="mt-1 p-1 bg-gray-200 rounded"
                >
                  Log Storage
                </button>
              </div>
            )} */}
          </div>
        </form>
      </div>
    </div>
  );
}