import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";

export default function SignInForm() {
  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!employeeCode.trim() || !password.trim()) {
      setMessage("Please enter both employee code and password.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      // Configure axios request with proper headers
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000, // 10 seconds timeout
      };

      const response = await axios.post(
        "http://192.168.0.136:8000/api/login/",
        {
          employee_code: employeeCode.trim(),
          password: password,
        },
        config
      );

      console.log("Response:", response.data); // For debugging

      console.log(response.data.message)

      if (response.data.message === "Login successful") {
        setMessage("Login successful!");
        
       
        // Save token if provided
        if (response.data.refresh) {
          console.log("Referesh Token:", response.data.refresh)  // For debugging
          localStorage.setItem("refreshToken", response.data.refresh);
        }
         if (response.data.access) {
          localStorage.setItem("accessToken", response.data.access);
            console.log("Access Token:", response.data.access); // For debugging
        }
      
       
        // Save user data if provided
        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }

        // Get user role from response
        const userRole = response.data.user?.role?.toLowerCase() || response.data.role?.toLowerCase();
        console.log("User Role:", userRole); // For debugging
        
        // Navigate based on user role
        setTimeout(() => {
          if (userRole === "admin" || userRole === "hr" ||  userRole === "department head") {
            navigate("/dashboard", { replace: true });
          } else {
            // For other roles, show an error message
            setMessage("Access denied. Invalid user role.");
            setIsLoading(false);
            return;
          }
        }, 1000); // Small delay to show success message

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
          setMessage("Invalid employee code or password.");
        } else if (status === 422) {
          setMessage(data.message || "Invalid input data.");
        } else if (status === 500) {
          setMessage("Server error. Please try again later.");
        } else {
          setMessage(data.message || `Error: ${status}`);
        }
      } else if (error.request) {
        // Request was made but no response received
        console.log("No response received:", error.request);
        setMessage("Cannot connect to server. Please check your connection.");
      } else {
        // Something else happened
        console.log("Request error:", error.message);
        setMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      {/* <div className="w-full max-w-md pt-10 mx-auto">
        <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div> */}

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <form onSubmit={handleLogin}>
          <div className="space-y-6">
            <div className="capitalize">
              <Label>Employee code <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Enter your Employee code"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="capitalize">
              <Label>Password <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
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
                <span className="text-sm text-gray-700">Keep me logged in</span>
              </div>
              <Link to="/forgot-password" className="text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            <div>
              <Button 
                type="submit" 
                className="w-full" 
                size="sm"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </div>

            {message && (
              <p className={`text-sm text-center ${
                message.includes("successful") ? "text-green-500" : "text-red-500"
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