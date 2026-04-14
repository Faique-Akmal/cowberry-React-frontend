import { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import API from "../../api/axios";

interface AnnouncementFormData {
  title: string;
  description: string;
  content: string;
  priority: "low" | "medium" | "high";
  category: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: any;
}

const CreateAnnouncement = () => {
  const { themeConfig } = useTheme();
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: "",
    description: "",
    content: "",
    priority: "medium",
    category: "general",
    startDate: "",
    endDate: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [categories] = useState([
    { value: "general", label: "General", icon: "📢" },
    { value: "maintenance", label: "Maintenance", icon: "🛠️" },
    { value: "update", label: "Update", icon: "🔄" },
    { value: "security", label: "Security", icon: "🔒" },
    { value: "event", label: "Event", icon: "🎉" },
    { value: "urgent", label: "Urgent", icon: "🚨" },
  ]);

  useEffect(() => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("adminToken") ||
      sessionStorage.getItem("token");

    setAuthToken(token);
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePriorityClick = (priority: "low" | "medium" | "high") => {
    setFormData((prev) => ({
      ...prev,
      priority,
    }));
  };

  const handleCategoryClick = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      category,
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token =
      authToken ||
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("adminToken");

    if (!token) {
      setError("Authentication required. Please log in as admin first.");
      setLoading(false);
      return;
    }

    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.content.trim()
    ) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError("Please select both start and end dates");
      setLoading(false);
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate <= startDate) {
      setError("End date must be after start date");
      setLoading(false);
      return;
    }

    try {
      const submissionData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      const response = await API.post<ApiResponse>(
        "/auth/announcements",
        submissionData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        setSuccess(true);
        setFormData({
          title: "",
          description: "",
          content: "",
          priority: "medium",
          category: "general",
          startDate: "",
          endDate: "",
          isActive: true,
        });
      } else {
        setError(response.data.message || "Failed to create announcement");
      }
    } catch (err: any) {
      console.error("API Error:", err);

      if (axios.isAxiosError(err)) {
        if (err.response) {
          const errorMessage =
            err.response.data?.message || err.response.statusText;

          if (err.response.status === 401) {
            setError("Session expired or invalid token. Please log in again.");
            localStorage.removeItem("token");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("adminToken");
            setAuthToken(null);
          } else if (err.response.status === 403) {
            setError("Access denied. Admin privileges required.");
          } else if (err.response.status === 404) {
            setError("Endpoint not found. Please check the API URL.");
          } else {
            setError(`Server error: ${errorMessage}`);
          }
        } else if (err.request) {
          setError("No response from server. Please check your connection.");
        } else {
          setError(`Request error: ${err.message}`);
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const redirectToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">📢</span>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Create New Announcement
                </h1>
                <p className="text-gray-600 mt-2">
                  Share important updates and information with your team
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-4 p-5">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <span className="text-white text-lg">✓</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-gray-900">
                  Announcement Created Successfully!
                </h3>
                <p className="text-gray-600 mt-1">
                  Your announcement has been published and is now visible to
                  users.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-rose-50 rounded-xl border border-rose-200">
            <div className="flex items-center gap-4 p-5">
              <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center">
                  <span className="text-white text-lg">⚠</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-gray-900">
                  {error.includes("Authentication")
                    ? "Authentication Error"
                    : "Error"}
                </h3>
                <p className="text-gray-600 mt-1">{error}</p>
                {error.includes("Authentication") && !authToken && (
                  <button
                    onClick={redirectToLogin}
                    className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                  >
                    Go to Login
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Form Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            {/* Basic Information Section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📄</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Basic Information
                </h3>
              </div>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Announcement Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter a clear and descriptive title..."
                    disabled={!authToken}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description *
                  </label>
                  <input
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief summary of what this announcement is about..."
                    disabled={!authToken}
                  />
                </div>

                {/* Full Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Content *
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Write the complete announcement content here..."
                    disabled={!authToken}
                  />
                </div>
              </div>
            </div>

            {/* Settings Section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">⚙️</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Settings & Configuration
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Priority Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Priority Level
                  </label>
                  <div className="flex gap-3">
                    {(["low", "medium", "high"] as const).map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => handlePriorityClick(priority)}
                        disabled={!authToken}
                        className={`flex-1 p-4 rounded-lg border transition-all duration-200 ${
                          formData.priority === priority
                            ? `${getPriorityColor(priority)} border-2 shadow-sm`
                            : "bg-white border-gray-300 hover:border-gray-400"
                        } ${!authToken ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              priority === "high"
                                ? "bg-red-100"
                                : priority === "medium"
                                  ? "bg-yellow-100"
                                  : "bg-green-100"
                            }`}
                          >
                            <span className="text-xl">
                              {priority === "high"
                                ? "🔴"
                                : priority === "medium"
                                  ? "🟡"
                                  : "🟢"}
                            </span>
                          </div>
                          <span className="font-medium text-gray-800 capitalize">
                            {priority}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => handleCategoryClick(cat.value)}
                        disabled={!authToken}
                        className={`p-3 rounded-lg border transition-all duration-200 ${
                          formData.category === cat.value
                            ? "bg-blue-50 border-blue-300 shadow-sm"
                            : "bg-white border-gray-300 hover:border-gray-400"
                        } ${!authToken ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-lg">{cat.icon}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-800">
                            {cat.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📅</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Schedule & Timing
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!authToken}
                  />
                  {formData.startDate && (
                    <p className="text-sm text-gray-500 mt-2">
                      Starts: {new Date(formData.startDate).toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!authToken}
                  />
                  {formData.endDate && (
                    <p className="text-sm text-gray-500 mt-2">
                      Ends: {new Date(formData.endDate).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button Section */}
            <div className="pt-8 border-t border-gray-200">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🚀</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      Ready to Publish
                    </h3>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !authToken}
                  className={`bg-lantern-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-sm transition-all duration-300 ${
                    loading || !authToken ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Publishing...</span>
                    </span>
                  ) : !authToken ? (
                    <span className="flex items-center gap-2">
                      <span className="text-xl">🔒</span>
                      <span>Login Required</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="text-xl">✨</span>
                      <span className="text-lg">Publish Announcement</span>
                      <span className="text-xl">📢</span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAnnouncement;
