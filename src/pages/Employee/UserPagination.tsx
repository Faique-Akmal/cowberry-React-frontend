import React, { useEffect, useState, useCallback, useRef } from "react";
import { role } from "../../store/store";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext.tsx";
import { useData } from "../../context/DataProvider";

const UserList: React.FC = () => {
  const { themeConfig } = useTheme();
  const { t } = useTranslation();
  const { fetchUsers } = useData();

  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [roleFilter, setRoleFilter] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<"" | "online" | "offline">("");

  // FIXED: Removed pagination states since your API doesn't support pagination
  const [hasMore] = useState(false);
  const [loadingMore] = useState(false);

  // FIXED: Simplified intersection observer since no pagination
  const observer = useRef<IntersectionObserver>();
  const lastUserElementRef = useCallback(
    (node: HTMLTableRowElement) => {
      // No infinite scroll since API doesn't support pagination
    },
    []
  );

  // FIXED: Updated to match your API response structure
  const fetchPageUsers = async () => {
    setLoading(true);
    try {
      // Your fetchUsers returns { data: [], success: boolean, ... }
      const res = await fetchUsers({ 
        search: searchTerm, 
        sort_order: sortOrder 
      }, true);
      
      // FIXED: Extract data from response
      const userData = res.data || [];
      setUsers(userData);
    } catch (err) {
      console.error("❌ Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Filter users based on search term, role, and status
  useEffect(() => {
    let filtered = users;

    // Filter by search term (name or employee_code)
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.employee_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== "") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filter by status (assuming is_online field exists)
    if (statusFilter !== "") {
      filtered = filtered.filter(user => 
        statusFilter === "online" ? user.is_online : !user.is_online
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  // FIXED: Fetch users when search or sort changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchPageUsers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, sortOrder]);

  // FIXED: Initial load
  useEffect(() => {
    fetchPageUsers();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("");
    setStatusFilter("");
  };

  const handleRowClick = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const getRoleName = (roleId: number): string => {
    const r = role.find((r) => r.id === roleId);
    return r ? r.name : "Unknown";
  };

  // FIXED: Search placeholder text
  const searchPlaceholder = t("user.Search by name or employee code...");

  return (
  <div
  style={{
    backgroundColor: themeConfig.content.background,
    color: themeConfig.content.text,
  }}
  className="
    w-full
    max-w-7xl         
    mx-2   
    min-w-5xl            
    sm:mx-2
    lg:mx-6
    xl:mx-auto         

    rounded-2xl
    border border-gray-200 dark:border-gray-800
    p-2 lg:p-6
    bg-white dark:bg-black dark:text-white
    shadow-lg
  "
>

      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-white">
          {t("user.Users Directory")}
        </h2>

        {/* Enhanced Filter Section */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search Input */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("user.Search Users")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder-gray-500 dark:placeholder-gray-400"
                />
                <svg className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("user.Filter by Role")}
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t("user.All Roles")}</option>
                {role.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("user.Filter by Status")}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "" | "online" | "offline")}
                className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t("user.All Status")}</option>
                <option value="online">{t("user.Online")}</option>
                <option value="offline">{t("user.Offline")}</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t("user.showingUsers", { count: filteredUsers.length, total: users.length })}
            </div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                       bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                       rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              {t("user.Clear Filters")}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading users...</span>
          </div>
        ) : (
          <>
            {/* Users Table */}
            <div className="overflow-hidden max-w-5xl rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar">
                <table className="min-w-md divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        {t("location.Sr.no")}
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={toggleSortOrder}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{t("user.Name")}</span>
                          <span className="text-blue-600 dark:text-blue-400">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        {t("location.Employee Code")}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        {t("register.Email")}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        {t("register.Role")}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        {t("user.Status")}
                      </th>
                       <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        {t("user.department")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user, index) => (
                        <tr 
                          onClick={() => handleRowClick(user)}
                          key={user.userId || user.id}
                          ref={index === filteredUsers.length - 1 ? lastUserElementRef : null}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                                  {user.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {user.name || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {user.employee_code || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {user.email || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 uppercase">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.is_online 
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                user.is_checkin ? "bg-green-400" : "bg-red-400"
                              }`}></span>
                              {user.is_checkin ? t("user.Online") : t("user.Offline")}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {user.department || 'N/A'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="text-gray-500 dark:text-gray-400">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-lg font-medium">{t("user.No users found")}</p>
                            <p className="text-sm">{t("user.Try adjusting your search or filter criteria")}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* End of Results Indicator */}
            {users.length > 0 && (
              <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            )}
          </>
        )}
      </div>

      {/* User Details Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-lg"
            >
              ✕
            </button>

            <div className="flex items-center space-x-4">
              {selectedUser.profile_image ? (
                <img
                  src={selectedUser.profile_image}
                  alt={selectedUser.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {selectedUser.name?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {selectedUser.name || 'N/A'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedUser.employee_code || 'No employee code'}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-800 dark:text-gray-200">
              <p><strong>Email:</strong> {selectedUser.email || 'N/A'}</p>
              <p><strong>Employee Code:</strong> {selectedUser.employee_code || 'N/A'}</p>
              <p><strong>Role:</strong> {getRoleName(selectedUser.role)}</p>
              <p><strong>Department:</strong> {selectedUser.department || 'N/A'}</p>
              <p><strong>Date Joined:</strong> {new Date(selectedUser.date).toLocaleDateString()}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className={`inline-flex items-center ml-1`}>
                  <span className={`w-2 h-2 rounded-full mr-1.5 ${selectedUser.is_online ? "bg-green-400" : "bg-red-400"}`}></span>
                  {selectedUser.is_online ? "Online" : "Offline"}
                </span>
              </p>
              <p><strong>User ID:</strong> {selectedUser.userId}</p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        @media (prefers-color-scheme: dark) {
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #2d3748;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4a5568;
          }
        }
      `}</style>
    </div>
  );
};

export default UserList;