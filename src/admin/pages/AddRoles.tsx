import { AxiosError } from "axios";
import React, { useState, useEffect } from "react";
import API from "../../api/axios";

interface Role {
  id: number;
  name: string;
  description: string;
}

interface RoleFormData {
  name: string;
  description: string;
}

interface ApiResponse {
  message: string;
  role: Role;
}

interface AddRoleFormProps {
  onRoleAdded?: (role: Role) => void;
}

const AddRoleForm: React.FC<AddRoleFormProps> = ({ onRoleAdded }) => {
  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    description: "",
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingRoles, setLoadingRoles] = useState<boolean>(true);
  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [adminToken, setAdminToken] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setAdminToken(token);
      fetchRoles(token);
    } else {
      setError("Admin token not found. Please login first.");
    }
  }, []);

  const fetchRoles = async (token: string) => {
    setLoadingRoles(true);
    setError("");

    try {
      const response = await API.get("/roles/static_roles", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (Array.isArray(response.data)) {
        setRoles(response.data);
      } else if (response.data.roles) {
        setRoles(response.data.roles);
      } else {
        setRoles([]);
      }
    } catch (err) {
      handleApiError(err, "Failed to fetch roles");
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("Role name is required");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Role description is required");
      return false;
    }
    return true;
  };

  const handleApiError = (err: unknown, defaultMessage: string) => {
    if (err instanceof AxiosError) {
      if (err.response) {
        setError(err.response.data?.message || `Error: ${err.response.status}`);

        if (err.response.status === 401 || err.response.status === 403) {
          localStorage.removeItem("token");
          setAdminToken("");
        }
      } else if (err.request) {
        setError(
          "No response received from server. Please check your connection.",
        );
      } else {
        setError(err.message);
      }
    } else {
      setError(err instanceof Error ? err.message : defaultMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    if (!adminToken) {
      setError("Admin token is required. Please login first.");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("admin/add_roles", formData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      });

      setSuccess(response.data.message);

      setFormData({
        name: "",
        description: "",
      });

      fetchRoles(adminToken);

      if (onRoleAdded) {
        onRoleAdded(response.data.role);
      }
    } catch (err) {
      handleApiError(err, "Failed to add role");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this role? This action cannot be undone.",
      )
    ) {
      return;
    }

    setDeletingRoleId(roleId);
    setError("");
    setSuccess("");

    try {
      await API.post(`/admin/delete_role/${roleId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      setSuccess("Role deleted successfully");

      setRoles((prevRoles) => prevRoles.filter((role) => role.id !== roleId));
    } catch (err) {
      handleApiError(err, "Failed to delete role");
    } finally {
      setDeletingRoleId(null);
    }
  };

  if (!adminToken) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please login to access role management features
            </p>
            <button
              onClick={() => (window.location.href = "/login")}
              className="bg-amber-600 hover:bg-amber-700 text-white w-full py-3 rounded-lg font-medium transition-colors duration-300"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Role Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage system roles and permissions with full control
              </p>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        <div className="mb-8 space-y-4">
          {error && (
            <div className="border-l-4 border-rose-500 bg-rose-50 rounded-lg animate-fadeIn">
              <div className="p-5 flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-rose-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-rose-700 font-medium">Action Required</p>
                  <p className="text-rose-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="border-l-4 border-emerald-500 bg-emerald-50 rounded-lg animate-fadeIn">
              <div className="p-5 flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-emerald-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-emerald-700 font-medium">Success</p>
                  <p className="text-emerald-600 mt-1">{success}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Role Form */}
          <div>
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 lg:p-8 mb-8">
              <div className="mb-8">
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mr-5">
                    <svg
                      className="w-7 h-7 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Create New Role
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Define permissions and responsibilities
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Role Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Moderator, Editor, Admin"
                      disabled={loading}
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Description <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe role permissions and scope"
                      disabled={loading}
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full py-4 rounded-lg font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Creating Role...
                      </div>
                    ) : (
                      <span className="flex items-center justify-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Create Role
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Stats Card */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mr-4">
                    <svg
                      className="w-6 h-6 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-700">
                      Total Roles
                    </h3>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {roles.length}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => fetchRoles(adminToken)}
                  disabled={loadingRoles}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors duration-300 flex items-center"
                >
                  <svg
                    className={`w-4 h-4 mr-2 ${loadingRoles ? "animate-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {loadingRoles ? "Loading..." : "Refresh"}
                </button>
              </div>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(roles.length * 10, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Roles List */}
          <div>
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 lg:p-8 h-full">
              <div className="mb-8">
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mr-5">
                    <svg
                      className="w-7 h-7 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Existing Roles
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      {roles.length} role{roles.length !== 1 ? "s" : ""}{" "}
                      configured
                    </p>
                  </div>
                </div>
              </div>

              {loadingRoles ? (
                <div className="py-16 text-center">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 border-4 border-gray-100 rounded-full"></div>
                    <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <p className="text-gray-500 mt-6 font-medium">
                    Loading roles...
                  </p>
                </div>
              ) : roles.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No roles configured
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Create your first role to get started
                  </p>
                  <div className="w-16 h-1 bg-gray-300 rounded-full mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-300"
                    >
                      <div className="p-5">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div>
                                <h4 className="text-lg font-bold text-gray-800">
                                  {role.name}
                                </h4>
                                <div className="flex items-center mt-1">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                    ID: {role.id}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed pl-13">
                              {role.description}
                            </p>
                          </div>
                          <div className="ml-4">
                            <button
                              onClick={() => handleDeleteRole(role.id)}
                              disabled={deletingRoleId === role.id}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingRoleId === role.id ? (
                                <span className="flex items-center">
                                  <svg
                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-rose-600"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Deleting...
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                  Delete
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add these styles to your global CSS or a style tag */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        @media (max-width: 640px) {
          .glass-card {
            margin: 0 -0.5rem;
            border-radius: 16px;
          }

          .glass-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AddRoleForm;
