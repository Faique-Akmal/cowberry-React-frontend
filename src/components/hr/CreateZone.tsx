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
  Sparkles,
  Eye,
  Edit,
  Users,
  Clock,
  Check,
  X,
  List,
  Plus,
  Search,
  ChevronRight,
  Filter,
  MoreVertical,
  Calendar,
  Mail,
  Phone,
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

interface ZoneItem {
  id: number;
  zoneId: string;
  name: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    employees: number;
  };
}

interface ZonesResponse {
  success: boolean;
  data: ZoneItem[];
  message?: string;
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

  // New states for zones list
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [showZones, setShowZones] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [selectedZone, setSelectedZone] = useState<ZoneItem | null>(null);

  // Check for token on component mount and when token changes
  useEffect(() => {
    checkToken();
    fetchZones(); // Fetch zones on component mount
  }, []);

  // Fetch zones function
  const fetchZones = async () => {
    try {
      setLoadingZones(true);
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");

      if (!token) {
        setAuthError("Authentication required to fetch zones");
        return;
      }

      const response = await API.get<ZonesResponse>("/auth/zones", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success && response.data.data) {
        setZones(response.data.data);
      } else {
        console.error("Failed to fetch zones:", response.data.message);
      }
    } catch (error: any) {
      console.error("Error fetching zones:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        setAuthError("Session expired. Please login again.");
      }
    } finally {
      setLoadingZones(false);
    }
  };

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
        // Refresh zones list after successful creation
        fetchZones();
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

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    setUserToken(null);
    setAuthError("");
    setResponse(null);
    setZones([]);
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

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filtered zones based on search and filter
  const filteredZones = zones.filter((zone) => {
    // Search filter
    const matchesSearch =
      zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.zoneId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.area.toLowerCase().includes(searchTerm.toLowerCase());

    // Active status filter
    if (activeFilter === "active") return matchesSearch && zone.isActive;
    if (activeFilter === "inactive") return matchesSearch && !zone.isActive;
    return matchesSearch;
  });

  // Zone actions
  const handleViewZone = (zone: ZoneItem) => {
    setSelectedZone(zone);
  };

  const handleEditZone = (zone: ZoneItem) => {
    // Implement edit functionality
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Sparkles className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                      Zone Management
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Create and manage geographical zones
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowZones(!showZones)}
                  className="bg-lantern-blue-600 text-white font-medium rounded-lg px-4 py-2.5 hover:bg-lantern-yellow-400 transition-colors duration-300 flex items-center gap-2 text-sm"
                >
                  {showZones ? (
                    <>
                      <Plus className="w-4 h-4" />
                      Create New Zone
                    </>
                  ) : (
                    <>
                      <List className="w-4 h-4" />
                      View Zones ({zones.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Authentication Alert */}
        {authError && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 mb-1">
                  {userToken
                    ? "Authorization Required"
                    : "Authentication Required"}
                </h3>
                <p className="text-amber-700 text-sm mb-3">{authError}</p>
                <div className="flex gap-2">
                  {!userToken ? (
                    <button
                      onClick={handleLogin}
                      className="bg-emerald-600 text-white font-medium rounded-lg px-4 py-2 text-sm hover:bg-emerald-700 transition-colors"
                    >
                      Login Now
                    </button>
                  ) : (
                    <button
                      onClick={handleAdminLogin}
                      className="bg-amber-600 text-white font-medium rounded-lg px-4 py-2 text-sm hover:bg-amber-700 transition-colors"
                    >
                      Admin Login
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="bg-gray-200 text-gray-700 font-medium rounded-lg px-4 py-2 text-sm hover:bg-gray-300 transition-colors"
                  >
                    Clear Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {showZones ? (
          // Zones List View
          <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search zones by name, ID, city, or area..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white border border-gray-300 text-gray-800 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">
                    Status:
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setActiveFilter("all")}
                      className={`px-3 py-1.5 rounded-lg transition-colors duration-300 text-sm ${
                        activeFilter === "all"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setActiveFilter("active")}
                      className={`px-3 py-1.5 rounded-lg transition-colors duration-300 text-sm flex items-center gap-1 ${
                        activeFilter === "active"
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      Active
                    </button>
                    <button
                      onClick={() => setActiveFilter("inactive")}
                      className={`px-3 py-1.5 rounded-lg transition-colors duration-300 text-sm flex items-center gap-1 ${
                        activeFilter === "inactive"
                          ? "bg-rose-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <X className="w-3 h-3" />
                      Inactive
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone Statistics */}
            {zones.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        Total Zones
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {zones.length}
                      </p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        Active Zones
                      </p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {zones.filter((z) => z.isActive).length}
                      </p>
                    </div>
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Check className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        Inactive Zones
                      </p>
                      <p className="text-2xl font-bold text-amber-700">
                        {zones.filter((z) => !z.isActive).length}
                      </p>
                    </div>
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <X className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        Total Employees
                      </p>
                      <p className="text-2xl font-bold text-purple-700">
                        {zones.reduce(
                          (sum, zone) => sum + zone._count.employees,
                          0,
                        )}
                      </p>
                    </div>
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Zones Table */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Zones List
                  </h3>
                  <span className="text-sm text-gray-600">
                    {filteredZones.length} zone
                    {filteredZones.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {loadingZones ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading zones...</p>
                </div>
              ) : filteredZones.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Zone Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employees
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredZones.map((zone) => (
                        <tr
                          key={zone.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => handleViewZone(zone)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg ${zone.isActive ? "bg-emerald-100" : "bg-rose-100"}`}
                              >
                                {zone.isActive ? (
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <X className="w-4 h-4 text-rose-600" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900">
                                    {zone.name}
                                  </h4>
                                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                    {zone.zoneId}
                                  </span>
                                </div>
                                {zone.description && (
                                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                    {zone.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm text-gray-900">
                                <Navigation className="w-3 h-3 text-gray-400" />
                                {zone.area}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Building className="w-3 h-3 text-gray-400" />
                                {zone.city}, {zone.state}
                              </div>
                              <div className="text-xs text-gray-500">
                                Pincode: {zone.pincode}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {zone._count.employees}
                              </span>
                              <span className="text-sm text-gray-500">
                                employees
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                zone.isActive
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {zone.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              {formatDate(zone.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditZone(zone);
                                }}
                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Zone"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewZone(zone);
                                }}
                                className="p-1.5 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No zones found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || activeFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "No zones have been created yet"}
                  </p>
                  <button
                    onClick={() => {
                      setShowZones(false);
                      setSearchTerm("");
                      setActiveFilter("all");
                    }}
                    className="bg-blue-600 text-white font-medium rounded-lg px-5 py-2.5 hover:bg-blue-700 transition-colors duration-300"
                  >
                    Create Your First Zone
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Create Zone Form View (Keep existing form)
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div
              className={`bg-white border border-gray-200 rounded-lg shadow-sm p-6 ${!userToken ? "opacity-70" : ""}`}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Create New Zone
                  </h2>
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
                        className={`w-full bg-white border ${
                          errors.name
                            ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                        } text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-300 placeholder:text-gray-500 ${
                          !userToken
                            ? "cursor-not-allowed opacity-60"
                            : "hover:border-gray-400"
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
                        className={`w-full bg-white border ${
                          errors.city
                            ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                        } text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-300 placeholder:text-gray-500 ${
                          !userToken
                            ? "cursor-not-allowed opacity-60"
                            : "hover:border-gray-400"
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
                        className={`w-full bg-white border ${
                          errors.area
                            ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                        } text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-300 placeholder:text-gray-500 ${
                          !userToken
                            ? "cursor-not-allowed opacity-60"
                            : "hover:border-gray-400"
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
                        className={`w-full bg-white border ${
                          errors.state
                            ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                        } text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-300 placeholder:text-gray-500 ${
                          !userToken
                            ? "cursor-not-allowed opacity-60"
                            : "hover:border-gray-400"
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
                        className={`w-full bg-white border ${
                          errors.pincode
                            ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                        } text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-300 placeholder:text-gray-500 ${
                          !userToken
                            ? "cursor-not-allowed opacity-60"
                            : "hover:border-gray-400"
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
                    className="w-full bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-gray-900 rounded-lg px-4 py-3 focus:outline-none transition-all duration-300 placeholder:text-gray-500 hover:border-gray-400 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    type="submit"
                    disabled={!userToken || loading}
                    className="flex-1 bg-cowberry-green-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    Reset Form
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column - Response Display and Quick Stats */}
            <div className="space-y-8">
              {/* Response Card */}
              {response && (
                <div
                  className={`border ${
                    response.success
                      ? "border-emerald-200 bg-emerald-50"
                      : response.message === "Only admin can create zones" ||
                          response.message === "Access Denied" ||
                          response.message === "Authentication Error"
                        ? "border-rose-200 bg-rose-50"
                        : "border-amber-200 bg-amber-50"
                  } rounded-lg shadow-sm p-6`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        response.success
                          ? "bg-emerald-100"
                          : response.message ===
                                "Only admin can create zones" ||
                              response.message === "Access Denied" ||
                              response.message === "Authentication Error"
                            ? "bg-rose-100"
                            : "bg-amber-100"
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
                            ? "text-emerald-800"
                            : response.message ===
                                  "Only admin can create zones" ||
                                response.message === "Access Denied" ||
                                response.message === "Authentication Error"
                              ? "text-rose-800"
                              : "text-amber-800"
                        }`}
                      >
                        {response.success
                          ? "Zone Created Successfully!"
                          : response.message}
                      </h3>

                      {response.error && (
                        <div className="mb-4 bg-white/50 p-4 rounded-lg">
                          <p
                            className={`text-sm ${
                              response.message ===
                                "Only admin can create zones" ||
                              response.message === "Access Denied" ||
                              response.message === "Authentication Error"
                                ? "text-rose-700"
                                : "text-amber-700"
                            }`}
                          >
                            {response.error}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stats Card */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Zone Statistics
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MapPin className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Zones</p>
                        <p className="text-lg font-bold text-gray-900">
                          {zones.length}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowZones(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      View All →
                    </button>
                  </div>

                  {zones.length > 0 && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                          <p className="text-xs text-emerald-700 font-medium">
                            Active
                          </p>
                          <p className="text-lg font-bold text-emerald-800">
                            {zones.filter((z) => z.isActive).length}
                          </p>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                          <p className="text-xs text-amber-700 font-medium">
                            Inactive
                          </p>
                          <p className="text-lg font-bold text-amber-800">
                            {zones.filter((z) => !z.isActive).length}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Zone Details Modal */}
        {selectedZone && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${selectedZone.isActive ? "bg-emerald-100" : "bg-rose-100"}`}
                    >
                      {selectedZone.isActive ? (
                        <Check className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <X className="w-6 h-6 text-rose-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedZone.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Zone ID: {selectedZone.zoneId}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedZone(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        Location Details
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {selectedZone.area}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {selectedZone.city}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {selectedZone.state}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            Pincode: {selectedZone.pincode}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        Zone Information
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {selectedZone._count.employees} Employees
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            Created: {formatDate(selectedZone.createdAt)}
                          </span>
                        </div>
                        <div>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              selectedZone.isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {selectedZone.isActive
                              ? "Active Zone"
                              : "Inactive Zone"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedZone.description && (
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">
                      Description
                    </h4>
                    <p className="text-gray-700">{selectedZone.description}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedZone(null)}
                    className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleEditZone(selectedZone);
                      setSelectedZone(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Zone
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateZonePage;
