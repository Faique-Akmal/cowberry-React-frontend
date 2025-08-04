import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { role } from "../../store/store";
import API from "../../api/axios";

type User = {
  id: number;
  username: string;
  email: string;
  mobile_no: string | null;
  employee_code: string;
  role: number;
  profile_image: string | null;
  is_online: boolean;
};

type PaginationResponse = {
  results: User[];
  current_page: number;
  total_pages: number;
  total_count?: number;
};

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [roleFilter, setRoleFilter] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<"" | "online" | "offline">("");

  const observer = useRef<IntersectionObserver>();
  const lastUserElementRef = useCallback((node: HTMLTableRowElement) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadMoreUsers();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadingMore]);

  const fetchUsers = async (page: number, reset: boolean = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const accessToken = localStorage.getItem("accessToken");
      const res = await API.get<PaginationResponse>(
        "/users/",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            page,
            limit: 10, // Smaller limit for better infinite scroll experience
            username: searchTerm || "",
            sort_by: "username",
            sort_order: sortOrder,
          },
        }
      );

      if (reset) {
        setUsers(res.data.results);
      } else {
        setUsers(prev => [...prev, ...res.data.results]);
      }
      
      setCurrentPage(res.data.current_page);
      setTotalPages(res.data.total_pages);
      // Check if we have more pages to load
      setHasMore(res.data.current_page < res.data.total_pages);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreUsers = () => {
    if (!loadingMore && hasMore) {
      fetchUsers(currentPage + 1, false);
    }
  };

  const getRoleName = (roleId: number): string => {
    const roleObj = role.find((r) => r.id === roleId);
    return roleObj ? roleObj.name : "Unknown";
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

  return (
    <div className="rounded-2xl border p-6  max-w-6xl mx-auto border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-lg">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200">
          Users Directory
        </h2>

        {/* Enhanced Filter Section */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search Input */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Users
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by username or email..."
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
                Filter by Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
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
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "" | "online" | "offline")}
                className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredUsers.length} of {users.length} users
            </div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                       bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                       rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Clear Filters
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
            <div className="overflow-hidden max-w-6xl rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                       Sr.no
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={toggleSortOrder}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Username</span>
                          <span className="text-blue-600 dark:text-blue-400">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        Mobile
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        Employee Code
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user, index) => (
                        <tr 
                          key={user.id}
                          ref={index === filteredUsers.length - 1 ? lastUserElementRef : null}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                            <p className="text-lg font-medium">No users found</p>
                            <p className="text-sm">Try adjusting your search or filter criteria</p>
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