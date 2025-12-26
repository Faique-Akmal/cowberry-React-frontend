import React, { useEffect, useState, useRef, useCallback } from "react";
import { role } from "../../store/store";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext.tsx";
import { useData } from "../../context/DataProvider";

interface User {
  id: string;
  userId: string;
  name: string;
  employee_code: string;
  email: string;
  role: number;
  is_checkin: boolean;
  department: string;
  profile_image?: string;
  date: string;
  is_online: boolean;
}

interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sort_order?: "asc" | "desc";
  role?: number;
  status?: "online" | "offline";
}

const UserList: React.FC = () => {
  const { themeConfig } = useTheme();
  const { t } = useTranslation();
  const { fetchUsers } = useData();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [roleFilter, setRoleFilter] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<"" | "online" | "offline">("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const limit = 20; // Users per page
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPageUsers = async (page: number = 1, isLoadMore: boolean = false) => {
    if (loading || (isLoadMore && !hasMore)) return;
    
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      const params: PaginationParams = {
        page,
        limit,
        sort_order: sortOrder
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      if (roleFilter !== "") {
        params.role = roleFilter;
      }
      if (statusFilter !== "") {
        params.status = statusFilter;
      }
      
      const res = await fetchUsers(params, true);
      
      const userData = res.data || [];
      const total = res.total || 0;
      
      setTotalUsers(total);
      setTotalPages(Math.ceil(total / limit));
      setHasMore(page < Math.ceil(total / limit));
      
      if (isLoadMore) {
        setUsers(prev => [...prev, ...userData]);
      } else {
        setUsers(userData);
        // Reset scroll position when fetching new data (not loading more)
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }
      
      setCurrentPage(page);
    } catch (err) {
      console.error("❌ Failed to fetch users:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initialize intersection observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loadingMore) {
          fetchPageUsers(currentPage + 1, true);
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "100px",
        threshold: 0.1,
      }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [currentPage, hasMore, loadingMore]);

  // Debounced search effect
  useEffect(() => {
    const debounce = setTimeout(() => {
      setCurrentPage(1);
      fetchPageUsers(1);
    }, 300);
    
    return () => clearTimeout(debounce);
  }, [searchTerm, sortOrder, roleFilter, statusFilter]);

  // Initial fetch
  useEffect(() => {
    fetchPageUsers(1);
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

  const handleRowClick = (user: User) => {
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

  const handleGoToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    fetchPageUsers(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handleGoToPage(i)}
          className={`
            min-w-[32px] h-8 px-2 mx-1 rounded-lg sm:rounded-xl
            text-xs font-medium transition-all duration-300
            ${currentPage === i
              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md"
              : "bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-600/80"
            }
            backdrop-blur-sm border border-white/60 dark:border-gray-600/60
          `}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-center space-x-1 sm:space-x-2 mt-4">
        <button
          onClick={() => handleGoToPage(1)}
          disabled={currentPage === 1}
          className={`
            px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-medium
            backdrop-blur-sm border transition-all duration-300
            ${currentPage === 1
              ? "bg-white/30 dark:bg-gray-800/30 text-gray-400 dark:text-gray-600 border-white/30 dark:border-gray-700/30 cursor-not-allowed"
              : "bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-600/80 border-white/60 dark:border-gray-600/60"
            }
          `}
        >
          « First
        </button>
        
        <button
          onClick={() => handleGoToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className={`
            px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-medium
            backdrop-blur-sm border transition-all duration-300
            ${currentPage === 1
              ? "bg-white/30 dark:bg-gray-800/30 text-gray-400 dark:text-gray-600 border-white/30 dark:border-gray-700/30 cursor-not-allowed"
              : "bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-600/80 border-white/60 dark:border-gray-600/60"
            }
          `}
        >
          ‹ Prev
        </button>
        
        {startPage > 1 && (
          <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
        )}
        
        {pages}
        
        {endPage < totalPages && (
          <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
        )}
        
        <button
          onClick={() => handleGoToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`
            px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-medium
            backdrop-blur-sm border transition-all duration-300
            ${currentPage === totalPages
              ? "bg-white/30 dark:bg-gray-800/30 text-gray-400 dark:text-gray-600 border-white/30 dark:border-gray-700/30 cursor-not-allowed"
              : "bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-600/80 border-white/60 dark:border-gray-600/60"
            }
          `}
        >
          Next ›
        </button>
        
        <button
          onClick={() => handleGoToPage(totalPages)}
          disabled={currentPage === totalPages}
          className={`
            px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-medium
            backdrop-blur-sm border transition-all duration-300
            ${currentPage === totalPages
              ? "bg-white/30 dark:bg-gray-800/30 text-gray-400 dark:text-gray-600 border-white/30 dark:border-gray-700/30 cursor-not-allowed"
              : "bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-600/80 border-white/60 dark:border-gray-600/60"
            }
          `}
        >
          Last »
        </button>
      </div>
    );
  };

  return (
    <div
      className="
        w-full
        max-w-full
        mx-auto
        px-2
        sm:px-3
        md:px-4
        lg:px-6
        rounded-2xl
        sm:rounded-3xl
        bg-gradient-to-br from-white/20 via-white/10 to-white/5
        dark:from-gray-900/30 dark:via-gray-800/20 dark:to-gray-900/10
        backdrop-blur-2xl
        border border-white/40 dark:border-gray-700/40
        p-3
        sm:p-4
        lg:p-6
        shadow-[0_8px_32px_rgba(31,38,135,0.15)]
        dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]
        overflow-hidden
        relative
        flex flex-col
        h-[calc(100vh-100px)] sm:h-[calc(100vh-120px)]
      "
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <h2 className="
          text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 text-center
          text-dark
          bg-clip-text 
          px-2
        ">
          Users Directory
        </h2>

        {/* Enhanced Filter Section with Glassmorphism */}
        <div className="
          bg-gradient-to-br from-white/40 to-white/20
          dark:from-gray-800/40 dark:to-gray-900/20
          backdrop-blur-xl
          border border-white/40 dark:border-gray-700/40
          rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 mb-4 sm:mb-6
          shadow-[0_4px_20px_rgba(0,0,0,0.1)]
          dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]
          flex-shrink-0
        ">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3 sm:mb-4">
            {/* Search Input */}
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                Search Users
              </label>
              <div className="relative">
                <div className="
                  absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2
                  p-1 sm:p-1.5 rounded
                  bg-white/50 dark:bg-gray-700/50
                  backdrop-blur-sm
                ">
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="
                    w-full pl-9 sm:pl-12 pr-3 py-2 sm:py-3
                    bg-white/50 dark:bg-gray-700/50
                    backdrop-blur-sm
                    border border-white/60 dark:border-gray-600/60
                    rounded-lg sm:rounded-xl
                    text-gray-900 dark:text-gray-100
                    focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
                    focus:outline-none
                    placeholder-gray-500 dark:placeholder-gray-400
                    text-sm
                    transition-all duration-300
                  "
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                Filter by Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value === "" ? "" : Number(e.target.value))}
                className="
                  w-full py-2 sm:py-3 px-3 sm:px-4
                  bg-white/50 dark:bg-gray-700/50
                  backdrop-blur-sm
                  border border-white/60 dark:border-gray-600/60
                  rounded-lg sm:rounded-xl
                  text-gray-900 dark:text-gray-100
                  focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
                  focus:outline-none
                  text-sm
                  transition-all duration-300
                  appearance-none
                  bg-no-repeat bg-[right_0.75rem_center] sm:bg-[right_1rem_center] bg-[length:0.75em] sm:bg-[length:1em]
                "
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23999' viewBox='0 0 256 256'%3E%3Cpath d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z'%3E%3C/path%3E%3C/svg%3E")`
                }}
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
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="
                  w-full py-2 sm:py-3 px-3 sm:px-4
                  bg-white/50 dark:bg-gray-700/50
                  backdrop-blur-sm
                  border border-white/60 dark:border-gray-600/60
                  rounded-lg sm:rounded-xl
                  text-gray-900 dark:text-gray-100
                  focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
                  focus:outline-none
                  text-sm
                  transition-all duration-300
                  appearance-none
                  bg-no-repeat bg-[right_0.75rem_center] sm:bg-[right_1rem_center] bg-[length:0.75em] sm:bg-[length:1em]
                "
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23999' viewBox='0 0 256 256'%3E%3Cpath d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z'%3E%3C/path%3E%3C/svg%3E")`
                }}
              >
                <option value="">All Status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="
              text-xs sm:text-sm text-gray-600 dark:text-gray-300
              px-2 sm:px-3 py-1.5 sm:py-2 rounded
              bg-white/40 dark:bg-gray-700/40
              backdrop-blur-sm
              whitespace-nowrap
            ">
              Showing {users.length} of {totalUsers} users • Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={clearFilters}
              className="
                px-3 sm:px-4 py-2
                bg-gradient-to-r from-white/40 to-white/20
                dark:from-gray-700/40 dark:to-gray-800/20
                backdrop-blur-sm
                border border-white/60 dark:border-gray-600/60
                text-gray-700 dark:text-gray-300 
                rounded-lg sm:rounded-xl hover:from-white/60 hover:to-white/40
                dark:hover:from-gray-600/60 dark:hover:to-gray-700/40
                transition-all duration-300
                w-full sm:w-auto
                shadow-sm hover:shadow
                text-sm
              "
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Main content area with scroll */}
        <div className="flex-1 flex flex-col min-h-0">
          {loading && users.length === 0 ? (
            <div className="
              flex flex-col justify-center items-center py-8 sm:py-12
              bg-gradient-to-br from-white/30 to-white/10
              dark:from-gray-800/30 dark:to-gray-900/10
              backdrop-blur-lg
              rounded-xl sm:rounded-2xl border border-white/40 dark:border-gray-700/40
              text-center
              flex-1
            ">
              <div className="
                animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-500
                backdrop-blur-sm mb-2 sm:mb-3
              "></div>
              <span className="text-gray-600 dark:text-gray-300 text-sm">
                Loading users...
              </span>
            </div>
          ) : (
            <>
              {/* Users Table Container with Scroll */}
              <div
                ref={scrollContainerRef}
                className="
                  overflow-hidden rounded-xl sm:rounded-2xl
                  bg-gradient-to-br from-white/40 to-white/20
                  dark:from-gray-800/40 dark:to-gray-900/20
                  backdrop-blur-xl
                  border border-white/40 dark:border-gray-700/40
                  shadow-[0_8px_32px_rgba(31,38,135,0.1)]
                  dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                  max-w-full
                  overflow-x-auto
                  flex-1
                  relative
                "
              >
                <div className="min-w-[640px] sm:min-w-0 h-full">
                  <div className="h-full flex flex-col">
                    {/* Table Header - Fixed */}
                    <div className="flex-shrink-0">
                      <table className="w-full">
                        <thead className="
                          bg-gradient-to-r from-white/60 to-white/40
                          dark:from-gray-800/60 dark:to-gray-900/40
                          backdrop-blur-lg
                          sticky top-0 z-10
                        ">
                          <tr>
                            <th className="
                              px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-semibold
                              text-gray-600 dark:text-gray-300
                              uppercase tracking-wider
                              border-b border-white/30 dark:border-gray-700/30
                              backdrop-blur-sm
                              whitespace-nowrap
                            ">
                              Sr.no
                            </th>
                            <th 
                              className="
                                px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-semibold
                                text-gray-600 dark:text-gray-300
                                uppercase tracking-wider cursor-pointer
                                hover:bg-white/30 dark:hover:bg-gray-800/30
                                transition-colors duration-300
                                border-b border-white/30 dark:border-gray-700/30
                                backdrop-blur-sm
                                whitespace-nowrap
                              "
                              onClick={toggleSortOrder}
                            >
                              <div className="flex items-center space-x-1">
                                <span>Name</span>
                                <span className="
                                  text-blue-600 dark:text-blue-400 text-xs
                                  bg-blue-100/50 dark:bg-blue-900/30
                                  rounded-full p-0.5
                                ">
                                  {sortOrder === "asc" ? "↑" : "↓"}
                                </span>
                              </div>
                            </th>
                            <th className="
                              px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-semibold
                              text-gray-600 dark:text-gray-300
                              uppercase tracking-wider hidden sm:table-cell
                              border-b border-white/30 dark:border-gray-700/30
                              backdrop-blur-sm
                              whitespace-nowrap
                            ">
                              Employee Code
                            </th>
                            <th className="
                              px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-semibold
                              text-gray-600 dark:text-gray-300
                              uppercase tracking-wider hidden lg:table-cell
                              border-b border-white/30 dark:border-gray-700/30
                              backdrop-blur-sm
                              whitespace-nowrap
                            ">
                              Email
                            </th>
                            <th className="
                              px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-semibold
                              text-gray-600 dark:text-gray-300
                              uppercase tracking-wider
                              border-b border-white/30 dark:border-gray-700/30
                              backdrop-blur-sm
                              whitespace-nowrap
                            ">
                              Role
                            </th>
                            <th className="
                              px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-semibold
                              text-gray-600 dark:text-gray-300
                              uppercase tracking-wider
                              border-b border-white/30 dark:border-gray-700/30
                              backdrop-blur-sm
                              whitespace-nowrap
                            ">
                              Status
                            </th>
                            <th className="
                              px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-semibold
                              text-gray-600 dark:text-gray-300
                              uppercase tracking-wider hidden md:table-cell
                              border-b border-white/30 dark:border-gray-700/30
                              backdrop-blur-sm
                              whitespace-nowrap
                            ">
                              Department
                            </th>
                          </tr>
                        </thead>
                      </table>
                    </div>

                    {/* Table Body - Scrollable */}
                    <div className="flex-1 overflow-y-auto">
                      <table className="w-full">
                        <tbody className="divide-y divide-white/20 dark:divide-gray-700/20">
                          {users.length > 0 ? (
                            users.map((user, index) => (
                              <tr 
                                onClick={() => handleRowClick(user)}
                                key={user.userId || user.id}
                                className="
                                  hover:bg-white/30 dark:hover:bg-gray-800/30
                                  transition-all duration-300
                                  cursor-pointer
                                  backdrop-blur-sm
                                "
                              >
                                <td className="
                                  px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap
                                  text-xs sm:text-sm text-gray-900 dark:text-gray-100
                                ">
                                  {(currentPage - 1) * limit + index + 1}
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap">
                                  <div className="flex items-center min-w-0">
                                    <div className="flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10">
                                      <div className="
                                        h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 rounded-lg sm:rounded-xl
                                        bg-gradient-to-r from-green-500/80 to-green-600/80
                                        border border-blue-400/50 dark:border-purple-500/50
                                        flex items-center justify-center text-white text-xs sm:text-sm md:text-base font-medium
                                        shadow
                                      ">
                                        {user.name?.charAt(0).toUpperCase() || '?'}
                                      </div>
                                    </div>
                                    <div className="ml-2 min-w-0 flex-1">
                                      <div className="
                                        text-xs sm:text-sm md:text-base font-medium
                                        text-gray-900 dark:text-gray-100
                                        truncate
                                      ">
                                        {user.name || 'N/A'}
                                      </div>
                                      <div className="
                                        text-xs text-gray-600 dark:text-gray-400 sm:hidden
                                        bg-white/30 dark:bg-gray-800/30 rounded px-1 py-0.5 mt-0.5
                                        truncate
                                      ">
                                        {user.employee_code || 'N/A'}
                                      </div>
                                      <div className="
                                        text-xs text-gray-600 dark:text-gray-400 lg:hidden
                                        truncate bg-white/30 dark:bg-gray-800/30
                                        rounded px-1 py-0.5 mt-0.5
                                      ">
                                        {user.email || 'N/A'}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="
                                  px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap
                                  text-xs sm:text-sm text-gray-900 dark:text-gray-100 hidden sm:table-cell
                                ">
                                  <div className="
                                    bg-white/40 dark:bg-gray-800/40 rounded px-2 py-1.5
                                    backdrop-blur-sm truncate max-w-[100px] md:max-w-[120px]
                                  ">
                                    {user.employee_code || 'N/A'}
                                  </div>
                                </td>
                                <td className="
                                  px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap
                                  text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell
                                ">
                                  <div className="
                                    truncate max-w-[120px] md:max-w-[150px] xl:max-w-[200px]
                                    bg-white/40 dark:bg-gray-800/40 rounded px-2 py-1.5
                                    backdrop-blur-sm
                                  ">
                                    {user.email || 'N/A'}
                                  </div>
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap">
                                  <span className="
                                    inline-flex items-center px-2 py-1 rounded-lg sm:rounded-xl
                                    text-xs font-medium
                                    bg-gradient-to-r from-blue-100/60 to-cyan-100/40
                                    dark:from-blue-900/40 dark:to-cyan-900/30
                                    border border-blue-200/60 dark:border-blue-700/40
                                    text-blue-800 dark:text-blue-300
                                    backdrop-blur-sm
                                    uppercase truncate max-w-[80px] sm:max-w-[100px]
                                  ">
                                    {getRoleName(user.role)}
                                  </span>
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap">
                                  <span className={`
                                    inline-flex items-center px-2 py-1 rounded-lg sm:rounded-xl text-xs font-medium
                                    backdrop-blur-sm border truncate max-w-[80px] sm:max-w-[100px]
                                    ${user.is_checkin 
                                      ? "bg-gradient-to-r from-green-100/60 to-emerald-100/40 border-green-200/60 text-green-800 dark:from-green-900/40 dark:to-emerald-900/30 dark:border-green-700/40 dark:text-green-300" 
                                      : "bg-gradient-to-r from-red-100/60 to-pink-100/40 border-red-200/60 text-red-800 dark:from-red-900/40 dark:to-pink-900/30 dark:border-red-700/40 dark:text-red-300"
                                    }
                                  `}>
                                    <span className={`
                                      w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1.5 flex-shrink-0
                                      ${user.is_checkin ? "bg-green-400" : "bg-red-400"}
                                    `}></span>
                                    <span className="truncate">
                                      {user.is_checkin ? "Online" : "Offline"}
                                    </span>
                                  </span>
                                </td>
                                <td className="
                                  px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap
                                  text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell
                                ">
                                  <div className="
                                    truncate max-w-[80px] md:max-w-[100px] lg:max-w-[150px]
                                    bg-white/40 dark:bg-gray-800/40 rounded px-2 py-1.5
                                    backdrop-blur-sm
                                  ">
                                    {user.department || 'N/A'}
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="
                                px-2 sm:px-4 py-6 sm:py-8 md:py-12 text-center
                                bg-gradient-to-br from-white/30 to-white/10
                                dark:from-gray-800/30 dark:to-gray-900/10
                              ">
                                <div className="
                                  p-4 sm:p-6 rounded-xl sm:rounded-2xl
                                  bg-gradient-to-br from-white/40 to-white/20
                                  dark:from-gray-800/40 dark:to-gray-900/20
                                  backdrop-blur-xl
                                  border border-white/40 dark:border-gray-700/40
                                  inline-block max-w-[90%] sm:max-w-none
                                ">
                                  <div className="
                                    w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-3 sm:mb-4
                                    bg-gradient-to-br from-gray-200/50 to-gray-300/30
                                    dark:from-gray-700/50 dark:to-gray-800/30
                                    backdrop-blur-sm
                                    border border-gray-300/60 dark:border-gray-600/60
                                    rounded-xl sm:rounded-2xl flex items-center justify-center
                                  ">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                  </div>
                                  <p className="
                                    text-sm sm:text-base md:text-lg font-medium
                                    bg-gradient-to-r from-blue-600 to-purple-600
                                    dark:from-blue-400 dark:to-purple-400
                                    bg-clip-text text-transparent
                                  ">
                                    No users found
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Try adjusting your search or filter criteria
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      
                      {/* Infinite scroll sentinel */}
                      <div ref={sentinelRef} className="h-1"></div>
                      
                      {/* Loading more indicator */}
                      {loadingMore && (
                        <div className="
                          flex justify-center items-center py-4
                          bg-gradient-to-br from-white/30 to-white/10
                          dark:from-gray-800/30 dark:to-gray-900/10
                          backdrop-blur-lg
                          rounded-xl border border-white/40 dark:border-gray-700/40
                          my-2 mx-4
                        ">
                          <div className="
                            animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500
                            backdrop-blur-sm mr-2
                          "></div>
                          <span className="text-gray-600 dark:text-gray-300 text-xs">
                            Loading more users...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pagination Controls */}
              {renderPagination()}
            </>
          )}
        </div>
      </div>

      {/* User Details Modal with Glassmorphism */}
      {isModalOpen && selectedUser && (
        <div className="
          fixed inset-0 flex items-center justify-center z-50
          bg-black/50 backdrop-blur-sm
          p-2 sm:p-4
        ">
          <div className="
            bg-gradient-to-br from-white/80 to-white/60
            dark:from-gray-900/80 dark:to-gray-800/60
            backdrop-blur-2xl
            border border-white/40 dark:border-gray-700/40
            rounded-xl sm:rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]
            w-full max-w-sm sm:max-w-md p-3 sm:p-4 md:p-6 m-2 sm:m-4 relative
            max-h-[90vh] overflow-y-auto
          ">
            <button
              onClick={closeModal}
              className="
                absolute top-2 right-2 sm:top-3 sm:right-3
                p-1.5 sm:p-2 rounded
                bg-white/40 dark:bg-gray-700/40
                backdrop-blur-sm
                border border-white/60 dark:border-gray-600/60
                text-gray-600 hover:text-gray-900
                dark:text-gray-400 dark:hover:text-gray-300
                hover:bg-white/60 dark:hover:bg-gray-600/60
                transition-all duration-300
                text-base sm:text-lg
              "
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              {selectedUser.profile_image ? (
                <img
                  src={selectedUser.profile_image}
                  alt={selectedUser.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-18 md:h-18 rounded-lg sm:rounded-xl object-cover border-2 border-white/50 dark:border-gray-700/50"
                />
              ) : (
                <div className="
                  w-12 h-12 sm:w-14 sm:h-14 md:w-18 md:h-18 rounded-lg sm:rounded-xl
                  bg-gradient-to-r from-green-500/80 to-green-600/80
                  border-2 border-blue-400/50 dark:border-purple-500/50
                  flex items-center justify-center text-white text-lg sm:text-xl md:text-2xl font-bold
                  shadow
                ">
                  {selectedUser.name?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="
                  text-base sm:text-lg md:text-xl font-bold
                  bg-gradient-to-r from-blue-600 to-purple-600
                  dark:from-blue-400 dark:to-purple-400
                  bg-clip-text text-transparent
                  truncate
                ">
                  {selectedUser.name || 'N/A'}
                </h2>
                <p className="
                  text-xs sm:text-sm text-gray-600 dark:text-gray-400
                  bg-white/40 dark:bg-gray-800/40 rounded px-2 py-1 mt-1
                  backdrop-blur-sm inline-block truncate max-w-full
                ">
                  {selectedUser.employee_code || 'No employee code'}
                </p>
              </div>
            </div>

            <div className="
              space-y-2 sm:space-y-3 text-xs sm:text-sm md:text-base
              bg-gradient-to-br from-white/40 to-white/20
              dark:from-gray-800/40 dark:to-gray-900/20
              backdrop-blur-xl
              border border-white/40 dark:border-gray-700/40
              rounded-lg sm:rounded-xl p-3 sm:p-4
            ">
              <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-gray-800 dark:text-gray-200">
                <strong className="
                  bg-gradient-to-r from-blue-500/20 to-purple-500/20
                  rounded px-2 py-1 min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm
                ">
                  Email:
                </strong>
                <span className="flex-1 truncate">{selectedUser.email || 'N/A'}</span>
              </p>
              <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-gray-800 dark:text-gray-200">
                <strong className="
                  bg-gradient-to-r from-blue-500/20 to-purple-500/20
                  rounded px-2 py-1 min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm
                ">
                  Role:
                </strong>
                <span className="flex-1 truncate">{getRoleName(selectedUser.role)}</span>
              </p>
              <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-gray-800 dark:text-gray-200">
                <strong className="
                  bg-gradient-to-r from-blue-500/20 to-purple-500/20
                  rounded px-2 py-1 min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm
                ">
                  Department:
                </strong>
                <span className="flex-1 truncate">{selectedUser.department || 'N/A'}</span>
              </p>
              <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-gray-800 dark:text-gray-200">
                <strong className="
                  bg-gradient-to-r from-blue-500/20 to-purple-500/20
                  rounded px-2 py-1 min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm
                ">
                  Date Joined:
                </strong>
                <span className="flex-1 truncate">{new Date(selectedUser.date).toLocaleDateString()}</span>
              </p>
              <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-gray-800 dark:text-gray-200">
                <strong className="
                  bg-gradient-to-r from-blue-500/20 to-purple-500/20
                  rounded px-2 py-1 min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm
                ">
                  Status:
                </strong>
                <span className={`
                  inline-flex items-center px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl text-xs font-medium
                  backdrop-blur-sm border truncate
                  ${selectedUser.is_checkin
                    ? "bg-gradient-to-r from-green-100/60 to-emerald-100/40 border-green-200/60 text-green-800 dark:from-green-900/40 dark:to-emerald-900/30 dark:border-green-700/40 dark:text-green-300"
                    : "bg-gradient-to-r from-red-100/60 to-pink-100/40 border-red-200/60 text-red-800 dark:from-red-900/40 dark:to-pink-900/30 dark:border-red-700/40 dark:text-red-300"
                  }
                `}>
                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1.5 flex-shrink-0 ${selectedUser.is_checkin ? "bg-green-400" : "bg-red-400"}`}></span>
                  {selectedUser.is_checkin ? "Online" : "Offline"}
                </span>
              </p>
              <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-gray-800 dark:text-gray-200">
                <strong className="
                  bg-gradient-to-r from-blue-500/20 to-purple-500/20
                  rounded px-2 py-1 min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm
                ">
                  User ID:
                </strong>
                <span className="flex-1 font-mono text-xs truncate">{selectedUser.userId}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;