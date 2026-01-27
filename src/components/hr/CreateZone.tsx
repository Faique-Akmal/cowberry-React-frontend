// components/ZoneForm.tsx
import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Loader2,
  MapPin,
  Building,
  Navigation,
  Globe,
  Hash,
  FileText,
  Send,
  Shield,
  AlertCircle,
  Key,
  LogOut,
  Sparkles,
} from "lucide-react";
import API from "../../api/axios";

// types/zone.ts
interface ZoneData {
  name: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  description: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: ZoneData;
  error?: string;
}

const CreateZonePage: React.FC = () => {
  const [formData, setFormData] = useState<ZoneData>({
    name: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [errors, setErrors] = useState<Partial<ZoneData>>({});
  const [authError, setAuthError] = useState<string>("");
  const [userToken, setUserToken] = useState<string | null>(null);

  // Check for token on component mount and when token changes
  useEffect(() => {
    checkToken();
  }, []);

  // Function to check token in localStorage
  const checkToken = () => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");
    setUserToken(token);
    return token;
  };

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field if it exists
    if (errors[name as keyof ZoneData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear auth error when user starts typing
    if (authError) {
      setAuthError("");
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<ZoneData> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.area.trim()) newErrors.area = "Area is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.pincode.trim()) newErrors.pincode = "Pincode is required";

    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Pincode must be 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if user has token
  const hasToken = () => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");
    setUserToken(token);
    return !!token;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasToken()) {
      setAuthError("Authentication required. Please login first.");
      setResponse({
        success: false,
        message: "Authentication failed",
        error: "No access token found. Please login first.",
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setResponse(null);
    setAuthError("");

    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");

      if (!token) {
        throw new Error("Token not found");
      }

      const response = await API.post<ApiResponse>(
        "auth/create-zones",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setResponse(response.data);

      if (response.data.success) {
        setFormData({
          name: "",
          area: "",
          city: "",
          state: "",
          pincode: "",
          description: "",
        });
      } else if (response.data.message === "Only admin can create zones") {
        setAuthError("You don't have admin privileges. Please login as admin.");
      }
    } catch (error: any) {
      console.error("API Error:", error);

      if (error.response) {
        const errorData = error.response.data;
        const statusCode = error.response.status;

        if (statusCode === 401 || statusCode === 403) {
          if (errorData.message === "Only admin can create zones") {
            setAuthError(
              "Admin privileges required. Your current token doesn't have admin access.",
            );
            setResponse({
              success: false,
              message: "Access Denied",
              error:
                "Only administrators can create zones. Please login with admin credentials.",
            });
          } else {
            setAuthError(
              "Session expired or invalid token. Please login again.",
            );
            setResponse({
              success: false,
              message: "Authentication Error",
              error:
                errorData.error ||
                errorData.message ||
                "Invalid or expired token",
            });
          }
        } else {
          setResponse({
            success: false,
            message: "Failed to create zone",
            error: errorData.error || errorData.message || "Server error",
          });
        }
      } else if (error.request) {
        setResponse({
          success: false,
          message: "Network Error",
          error: "Unable to connect to server. Please check your connection.",
        });
      } else {
        setResponse({
          success: false,
          message: "Request Error",
          error: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle admin login redirect
  const handleAdminLogin = () => {
    window.location.href = "/admin/login";
  };

  // Handle regular login redirect
  const handleLogin = () => {
    window.location.href = "/login";
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      area: "",
      city: "",
      state: "",
      pincode: "",
      description: "",
    });
    setResponse(null);
    setErrors({});
    setAuthError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-300/20 to-purple-300/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-r from-cyan-300/20 to-blue-300/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-300/20 to-pink-300/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
        {/* Header with Glassmorphism */}
        <div className="mb-8">
          <div className="glass-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-3xl p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl backdrop-blur-sm">
                    <Sparkles className="w-6 h-6 text-blue-600" />
                  </div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Zone Management
                  </h1>
                </div>
                <p className="text-gray-600/80 text-lg">
                  Create and manage geographical zones with precision
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Authentication Alert */}
        {authError && (
          <div className="mb-8 glass-card backdrop-blur-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/30 rounded-2xl p-6 animate-fadeIn">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-xl backdrop-blur-sm">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-700 mb-2">
                  {userToken
                    ? "Authorization Required"
                    : "Authentication Required"}
                </h3>
                <p className="text-amber-600/90 mb-4">{authError}</p>
                <div className="flex gap-3">
                  {!userToken ? (
                    <button
                      onClick={handleLogin}
                      className="glass-card backdrop-blur-md bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl px-5 py-2.5 hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      Login Now
                    </button>
                  ) : (
                    <button
                      onClick={handleAdminLogin}
                      className="glass-card backdrop-blur-md bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl px-5 py-2.5 hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      Admin Login
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="glass-card backdrop-blur-md bg-gradient-to-r from-gray-400/10 to-gray-500/10 border border-gray-400/20 text-gray-600 font-semibold rounded-xl px-5 py-2.5 hover:bg-gray-400/20 transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    Clear Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div
            className={`glass-card-heavy backdrop-blur-xl bg-white/15 border border-white/25 rounded-2xl p-6 md:p-8 transition-all duration-500 ${!userToken ? "opacity-70" : ""}`}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl backdrop-blur-sm">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Create New Zone
                </h2>
                <p className="text-sm text-gray-600/90 mt-1">
                  {userToken
                    ? "You are authenticated to create zones"
                    : "Please login to enable form"}
                  {userToken && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      Token detected in localStorage
                    </span>
                  )}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Zone Name */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Building className="w-4 h-4 text-blue-500" />
                    Zone Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter zone name"
                      disabled={!userToken || loading}
                      className={`w-full glass-card-light backdrop-blur-sm bg-white/5 border ${
                        errors.name
                          ? "border-rose-400/50 focus:border-rose-500"
                          : "border-white/20 focus:border-blue-400/50"
                      } text-gray-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 placeholder:text-gray-500/70 ${
                        !userToken
                          ? "cursor-not-allowed opacity-60"
                          : "hover:border-white/30"
                      }`}
                    />
                    {errors.name && (
                      <div className="absolute right-3 top-3">
                        <XCircle className="w-5 h-5 text-rose-500" />
                      </div>
                    )}
                  </div>
                  {errors.name && (
                    <p className="text-sm text-rose-600 flex items-center gap-2 animate-fadeIn">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* City */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Building className="w-4 h-4 text-blue-500" />
                    City *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Enter city name"
                      disabled={!userToken || loading}
                      className={`w-full glass-card-light backdrop-blur-sm bg-white/5 border ${
                        errors.city
                          ? "border-rose-400/50 focus:border-rose-500"
                          : "border-white/20 focus:border-blue-400/50"
                      } text-gray-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 placeholder:text-gray-500/70 ${
                        !userToken
                          ? "cursor-not-allowed opacity-60"
                          : "hover:border-white/30"
                      }`}
                    />
                    {errors.city && (
                      <div className="absolute right-3 top-3">
                        <XCircle className="w-5 h-5 text-rose-500" />
                      </div>
                    )}
                  </div>
                  {errors.city && (
                    <p className="text-sm text-rose-600 flex items-center gap-2 animate-fadeIn">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      {errors.city}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Area */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Navigation className="w-4 h-4 text-blue-500" />
                    Area *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="area"
                      value={formData.area}
                      onChange={handleChange}
                      placeholder="Enter area name"
                      disabled={!userToken || loading}
                      className={`w-full glass-card-light backdrop-blur-sm bg-white/5 border ${
                        errors.area
                          ? "border-rose-400/50 focus:border-rose-500"
                          : "border-white/20 focus:border-blue-400/50"
                      } text-gray-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 placeholder:text-gray-500/70 ${
                        !userToken
                          ? "cursor-not-allowed opacity-60"
                          : "hover:border-white/30"
                      }`}
                    />
                    {errors.area && (
                      <div className="absolute right-3 top-3">
                        <XCircle className="w-5 h-5 text-rose-500" />
                      </div>
                    )}
                  </div>
                  {errors.area && (
                    <p className="text-sm text-rose-600 flex items-center gap-2 animate-fadeIn">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      {errors.area}
                    </p>
                  )}
                </div>

                {/* State */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Globe className="w-4 h-4 text-blue-500" />
                    State *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Enter state name"
                      disabled={!userToken || loading}
                      className={`w-full glass-card-light backdrop-blur-sm bg-white/5 border ${
                        errors.state
                          ? "border-rose-400/50 focus:border-rose-500"
                          : "border-white/20 focus:border-blue-400/50"
                      } text-gray-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 placeholder:text-gray-500/70 ${
                        !userToken
                          ? "cursor-not-allowed opacity-60"
                          : "hover:border-white/30"
                      }`}
                    />
                    {errors.state && (
                      <div className="absolute right-3 top-3">
                        <XCircle className="w-5 h-5 text-rose-500" />
                      </div>
                    )}
                  </div>
                  {errors.state && (
                    <p className="text-sm text-rose-600 flex items-center gap-2 animate-fadeIn">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      {errors.state}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pincode */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Hash className="w-4 h-4 text-blue-500" />
                    Pincode *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="6-digit pincode"
                      maxLength={6}
                      disabled={!userToken || loading}
                      className={`w-full glass-card-light backdrop-blur-sm bg-white/5 border ${
                        errors.pincode
                          ? "border-rose-400/50 focus:border-rose-500"
                          : "border-white/20 focus:border-blue-400/50"
                      } text-gray-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 placeholder:text-gray-500/70 ${
                        !userToken
                          ? "cursor-not-allowed opacity-60"
                          : "hover:border-white/30"
                      }`}
                    />
                    {errors.pincode && (
                      <div className="absolute right-3 top-3">
                        <XCircle className="w-5 h-5 text-rose-500" />
                      </div>
                    )}
                  </div>
                  {errors.pincode && (
                    <p className="text-sm text-rose-600 flex items-center gap-2 animate-fadeIn">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      {errors.pincode}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter zone description..."
                  rows={3}
                  disabled={!userToken || loading}
                  className="w-full glass-card-light backdrop-blur-sm bg-white/5 border border-white/20 focus:border-blue-400/50 text-gray-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 placeholder:text-gray-500/70 hover:border-white/30 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  type="submit"
                  disabled={!userToken || loading}
                  className="flex-1 glass-card backdrop-blur-lg bg-lantern-blue-600 hover:bg-green-950 text-white font-semibold  px-6 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-2xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Zone...
                    </>
                  ) : !userToken ? (
                    <>
                      <Key className="w-5 h-5" />
                      Login Required
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Create Zone
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="flex-1 glass-card backdrop-blur-lg bg-gradient-to-r from-gray-400/10 to-gray-500/10 border border-gray-400/20 hover:border-gray-400/30 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
                >
                  Reset Form
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - Response Display */}
          <div className="space-y-8">
            {/* Response Card */}
            {response && (
              <div
                className={`glass-card-heavy backdrop-blur-xl border ${
                  response.success
                    ? "border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-green-500/10"
                    : response.message === "Only admin can create zones" ||
                        response.message === "Access Denied" ||
                        response.message === "Authentication Error"
                      ? "border-rose-400/30 bg-gradient-to-br from-rose-500/10 to-red-500/10"
                      : "border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10"
                } rounded-2xl p-6 md:p-8 animate-slideIn`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-xl backdrop-blur-sm ${
                      response.success
                        ? "bg-emerald-400/20"
                        : response.message === "Only admin can create zones" ||
                            response.message === "Access Denied" ||
                            response.message === "Authentication Error"
                          ? "bg-rose-400/20"
                          : "bg-amber-400/20"
                    }`}
                  >
                    {response.success ? (
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    ) : response.message === "Only admin can create zones" ||
                      response.message === "Access Denied" ||
                      response.message === "Authentication Error" ? (
                      <Shield className="w-6 h-6 text-rose-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`text-xl font-bold mb-3 ${
                        response.success
                          ? "text-emerald-700"
                          : response.message ===
                                "Only admin can create zones" ||
                              response.message === "Access Denied" ||
                              response.message === "Authentication Error"
                            ? "text-rose-700"
                            : "text-amber-700"
                      }`}
                    >
                      {response.success
                        ? "Zone Created Successfully!"
                        : response.message}
                    </h3>

                    {response.error && (
                      <div className="mb-4 glass-card-light backdrop-blur-sm p-4 rounded-xl">
                        <p
                          className={`text-sm ${
                            response.message ===
                              "Only admin can create zones" ||
                            response.message === "Access Denied" ||
                            response.message === "Authentication Error"
                              ? "text-rose-600"
                              : "text-amber-600"
                          }`}
                        >
                          {response.error}
                        </p>
                      </div>
                    )}

                    {response.message === "Only admin can create zones" && (
                      <div className="mt-4">
                        <button
                          onClick={handleAdminLogin}
                          className="glass-card backdrop-blur-md bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-xl px-5 py-2.5 hover:shadow-lg hover:shadow-rose-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                          Go to Admin Login
                        </button>
                      </div>
                    )}

                    {response.data && (
                      <div className="mt-6 pt-6 border-t border-white/20">
                        <h4 className="font-semibold text-gray-700 mb-4">
                          Zone Details:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.entries(response.data).map(([key, value]) => (
                            <div
                              key={key}
                              className="glass-card-light backdrop-blur-sm bg-white/10 border border-white/10 rounded-xl p-3"
                            >
                              <p className="text-xs text-gray-500/90 font-medium capitalize">
                                {key}
                              </p>
                              <p className="font-semibold text-gray-800">
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Preview Card */}
            <div className="glass-card-heavy backdrop-blur-xl bg-white/15 border border-white/25 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg backdrop-blur-sm">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  Zone Preview
                </h3>
              </div>

              <div className="space-y-5">
                {formData.name ? (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <MapPin className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg">
                          {formData.name}
                        </h4>
                        <p className="text-sm text-gray-600/90 mt-1">
                          {formData.area && `${formData.area}, `}
                          {formData.city && `${formData.city}`}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="glass-card-light backdrop-blur-sm bg-white/10 border border-white/10 rounded-xl p-3">
                        <p className="text-xs text-gray-500/90">Location</p>
                        <p className="font-medium text-gray-800">
                          {formData.state || "Not specified"}
                        </p>
                      </div>
                      <div className="glass-card-light backdrop-blur-sm bg-white/10 border border-white/10 rounded-xl p-3">
                        <p className="text-xs text-gray-500/90">Pincode</p>
                        <p className="font-medium text-gray-800">
                          {formData.pincode || "Not specified"}
                        </p>
                      </div>
                    </div>

                    {formData.description && (
                      <div className="glass-card-light backdrop-blur-sm bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-400/20 rounded-xl p-4">
                        <p className="text-xs text-blue-600/90 font-medium mb-2">
                          Description
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {formData.description}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-2xl flex items-center justify-center mb-5 backdrop-blur-sm border border-white/30">
                      <MapPin className="w-10 h-10 text-blue-400/70" />
                    </div>
                    <p className="text-gray-500/80">
                      Fill the form to preview your zone details
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
      </div>
    </div>
  );
};

export default CreateZonePage;
