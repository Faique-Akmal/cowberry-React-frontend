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
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  // inside UserList component
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedUser, setSelectedUser] = useState<any>(null);


  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [roleFilter, setRoleFilter] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<"" | "online" | "offline">("");

  // Infinite scroll observer
  const observer = useRef<IntersectionObserver>();
  const lastUserElementRef = useCallback(
    (node: HTMLTableRowElement) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreUsers();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, loadingMore]
  );

const fetchPageUsers = async () => {
  setLoading(true);
  try {
    const res = await fetchUsers({}, true); // no page/limit
    setUsers(res);
    setHasMore(false); // ✅ no more pages to load
  } catch (err) {
    console.error("❌ Failed to fetch users:", err);
  } finally {
    setLoading(false);
  }
};

  const loadMoreUsers = () => fetchPageUsers(currentPage + 1, false);

  // Filters
  useEffect(() => {
    let filtered = users;
    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (roleFilter !== "") filtered = filtered.filter((u) => u.role === roleFilter);
    if (statusFilter) {
      filtered = filtered.filter((u) => (statusFilter === "online" ? u.is_online : !u.is_online));
    }
    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Initial & on filter change
  useEffect(() => {
    const debounce = setTimeout(() => {
      setCurrentPage(1);
      setHasMore(true);
      fetchPageUsers(1, true);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, sortOrder]);

  useEffect(() => {
    fetchPageUsers(1, true);
  }, []);

  const getRoleName = (roleId: number): string => {
    const r = role.find((r) => r.id === roleId);
    return r ? r.name : "Unknown";
  };

  // Filter users based on search term, role, and status
  useEffect(() => {
    let filtered = users;

    // Filter by search term (username or email)
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== "") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filter by status
    if (statusFilter !== "") {
      filtered = filtered.filter(user => 
        statusFilter === "online" ? user.is_online : !user.is_online
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Reset and fetch when search or sort changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      setCurrentPage(1);
      setHasMore(true);
      fetchUsers(1, true);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, sortOrder]);

  // Initial load
  useEffect(() => {
    fetchUsers(1, true);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("");
    setStatusFilter("");
  };

  const handleRowClick = (user) => {
  setSelectedUser(user);
  setIsModalOpen(true);
};

const closeModal = () => {
  setIsModalOpen(false);
  setSelectedUser(null);
};

  return (
   <div
    style={{
        backgroundColor: themeConfig.content.background,
        color: themeConfig.content.text,
      }}  
   className="max-w-4xl mx-auto rounded-2xl border p-2 w-full border-gray-200 bg-white dark:border-gray-800 dark:bg-black dark:text-white shadow-lg">

      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200">
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
                  placeholder={t("user.Search by username or email...")}
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
                          <span>{t("register.Username")}</span>
                          <span className="text-blue-600 dark:text-blue-400">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        {t("register.Email")}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        {t("register.Mobile No")}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        {t("location.Employee Code")}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        {t("register.Role")}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        {t("user.Status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user, index) => (
                        <tr 
                          onClick={() => handleRowClick(user)}
                          key={user.id}
                          ref={index === filteredUsers.length - 1 ? lastUserElementRef : null}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {index+1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                                  {user.username.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {user.username}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {user.mobile_no || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {user.employee_code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 uppercase">
                              {getRoleName(user.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.is_online 
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                user.is_online ? "bg-green-400" : "bg-red-400"
                              }`}></span>
                              {user.is_online ? "Online" : "Offline"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
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

            {/* Loading More Indicator */}
            {loadingMore && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading more users...</span>
              </div>
            )}

            {/* End of Results Indicator */}
            {!hasMore && users.length > 0 && (
              <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                You've reached the end of the list
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
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        ✕
      </button>

      <div className="flex items-center space-x-4">
        {selectedUser.profile_image ? (
          <img
            src={selectedUser.profile_image}
            alt={selectedUser.username}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
            {selectedUser.username.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {selectedUser.first_name} {selectedUser.last_name}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            @{selectedUser.username}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-gray-800 dark:text-gray-200">
        <p><strong>Email:</strong> {selectedUser.email}</p>
        <p><strong>Mobile:</strong> {selectedUser.mobile_no || "N/A"}</p>
        <p><strong>Employee Code:</strong> {selectedUser.employee_code}</p>
        <p><strong>Role:</strong> {getRoleName(selectedUser.role)}</p>
        <p><strong>Department:</strong> {selectedUser.department || "N/A"}</p>
        <p><strong>Branch:</strong> {selectedUser.branch || "N/A"}</p>
        <p><strong>Birth Date:</strong> {selectedUser.birth_date || "N/A"}</p>
        <p><strong>Address:</strong> {selectedUser.address || "N/A"}</p>
        <p>
          <strong>Status:</strong>{" "}
          {selectedUser.is_online ? "Online" : "Offline"}
        </p>
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
      `}</style>
    </div>
  );
};

export default UserList;