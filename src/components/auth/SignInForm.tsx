import { useState } from "react";
import {  useNavigate } from "react-router";
import {  EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import ForgotPasswordModal from "./ForgotPasswordModal";
// import Home from "../../pages/Dashboard/Home";
import toast, { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";


export default function SignInForm() {

  const { t } = useTranslation();
  const { login } = useAuth();

  const [employeeCode, setEmployeeCode] = useState("");
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
    if (!employeeCode.trim() || !password.trim()) {
      setMessage(t("message.Please enter both employee code and password."));
      toast.error(t("toast.Please enter both employee code and password."));
      setIsLoading(false);
      return;
    }

    try {
      const response = await API.post(
        "/login/",
        {
          employee_code: employeeCode.trim(),
          password: password.trim(),
          deviceType: isMobileDevice ? "mobile" : "desktop"
        }
      );

    if (response.data?.message?.toLowerCase().includes("login successful")) {
  const userRole = response.data.role?.toLowerCase();
        
        // Check if employee is trying to login from desktop/laptop
        // if (userRole === "employee" && !isMobileDevice) {
        //   setMessage("YOU CAN LOGIN IN MOBILE DEVICE ONLY");
        //   setIsLoading(false);
        //   return;
        // }
        
localStorage.setItem("userRole", response.data.role);
  localStorage.setItem("userId", response.data.userid); 
  localStorage.setItem("department", response.data.department); 
  localStorage.setItem("profile-img", response.data.profile_image); 

  login(response.data?.refresh, response.data?.access);

  const isVerified = response.data?.is_employee_code_verified || false;

  setTimeout(() => {
    if (userRole === "employee") {
      if (isVerified) {
           setMessage(t("toast.Logged in successfully"));
        toast.success(t("toast.Logged in successfully")); 
        navigate("/attandanceStart-page", { replace: true });  
      } else {
           setMessage(t("toast.Logged in successfully"));
        navigate("/LoginWithOtp", { replace: true });
      }
    } else if (["admin","hr","department_head","manager","executive"].includes(userRole)) {
      if (isVerified) {
        navigate("/home", { replace: true });  
        setMessage(t("toast.Logged in successfully"));
        toast.success(t("toast.Logged in successfully")); 
      } else {
        navigate("/LoginWithOtp", { replace: true });
      }
    }
  }, 1000);
} else {
        setMessage(response.data.message || "Login failed.");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        console.log("Error response:", data);
        
        if (status === 401) {
          setMessage(t("message.Invalid employee code or password."));
        } else if (status === 422) {
          setMessage(t(data.message || "message.Invalid input data."));
        } else if (status === 500) {
          setMessage(t("message.Server error. Please try again later."));
        } else {
          setMessage(data.message || `Error: ${status}`);
        }
      } else if (error.request) {
        // Request was made but no response received
        console.log("No response received:", error.request);
        setMessage(t("message.Cannot connect to server. Please check your connection."));
      } else {
        // Something else happened
        console.log("Request error:", error.message);
        setMessage(t("message.An unexpected error occurred. Please try again."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 dark:bg-black dark:text-white bg-white rounded-2xl shadow-lg p-6">
      <div className="w-20 h-20 mx-auto mb-6 mt-6">
        <img src="logo-cowberry.png" alt="cowberry-logo" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700" />
      </div>
      <div className="flex items-center justify-center w-full h-20">
        <h1>{t("WELCOME TO COWBERRY")}</h1>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <form onSubmit={handleLogin}>
          <div className="space-y-6">
            <div className="capitalize">
              <Label>{t("register.Employee Code")} <span className="text-red-500">*</span></Label>
              <Input
                placeholder={t("register.Enter your Employee code")}
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                disabled={isLoading}
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
                message.includes("successful") 
                  ? "text-green-500" 
                  : message === t("YOU CAN LOGIN IN MOBILE DEVICE ONLY")
                    ? "text-red-600 bg-red-50 p-3 rounded-md border border-red-200"
                    : "text-red-500"
              }`}>
                {message}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}