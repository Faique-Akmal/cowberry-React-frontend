import React, { useEffect, useState, useRef, useCallback } from "react";
import { role } from "../../store/store";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext.tsx";
import { useData } from "../../context/DataProvider";
import API from "../../api/axios.ts";

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
  // New fields for editing
  fullName?: string;
  mobileNo?: string;
  address?: string;
  birthDate?: string;
  profileImageUrl?: string;
}

interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sort_order?: "asc" | "desc";
  role?: number;
  status?: "online" | "offline";
}

// Department interface
interface Department {
  id: number;
  name: string;
}

// Role interface
interface Role {
  id: number;
  name: string;
}

// Edit User Form interface
interface EditUserForm {
  username?: string;
  fullName: string;
  email: string;
  mobileNo: string;
  address: string;
  birthDate: string;
  profileImageUrl: string;
  departmentId: number;
  roleId: number;
}

const UserList: React.FC = () => {
  const { themeConfig } = useTheme();
  const { t } = useTranslation();
  const { fetchUsers } = useData();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [roleFilter, setRoleFilter] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<"" | "online" | "offline">("");
  
  // Edit form states
  const [editForm, setEditForm] = useState<EditUserForm>({
    fullName: "",
    email: "",
    mobileNo: "",
    address: "",
    birthDate: "",
    profileImageUrl: "",
    departmentId: 0,
    roleId: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const limit = 20; 
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch departments and roles for edit form
  useEffect(() => {
    const fetchDepartmentsAndRoles = async () => {
      try {
        // Replace with your actual API endpoints
        // const departmentsRes = await fetch('http://localhost:5000/api/departments');
        // const rolesRes = await fetch('http://localhost:5000/api/roles');
        
        // For now, using mock data based on your response structure
        setDepartments([
          { id: 1, name: "IT" },
          { id: 2, name: "HR" },
          { id: 3, name: "Sales" },
          { id: 4, name: "Marketing" }
        ]);
        
        setRoles([
          { id: 1, name: "Admin" },
          { id: 2, name: "HR" },
          { id: 3, name: "Employee" },
          { id: 4, name: "Manager" }
        ]);
      } catch (error) {
        console.error("Failed to fetch departments/roles:", error);
      }
    };
    
    fetchDepartmentsAndRoles();
  }, []);

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

  // Handle edit button click
  const handleEditClick = (user: User) => {
    console.log("Editing user:", user);
    console.log("User ID:", user.id);
    console.log("User userId:", user.userId);
    
    setSelectedUser(user);
    
    // Get the correct user ID
    const userId = user.id || user.userId;
    
    // Populate edit form with user data
    setEditForm({
      username: user.employee_code || `user_${userId}`,
      fullName: user.name || "",
      email: user.email || "",
      mobileNo: user.mobileNo || "",
      address: user.address || "",
      birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : "",
      profileImageUrl: user.profile_image || user.profileImageUrl || "",
      departmentId: getDepartmentId(user.department) || 0,
      roleId: user.role || 0
    });
    
    setIsEditModalOpen(true);
  };

  // Handle edit form input changes
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'departmentId' || name === 'roleId' ? parseInt(value) : value
    }));
  };

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      console.error("No user selected");
      alert("No user selected");
      return;
    }
    
    // Get the correct user ID
    const userId = selectedUser.id || selectedUser.userId;
    
    if (!userId) {
      console.error("User ID is undefined. Selected user:", selectedUser);
      alert("Cannot update user: User ID is missing");
      return;
    }
    
    console.log("Updating user with ID:", userId);
    console.log("Edit form data:", editForm);
    
    setIsEditing(true);
    
    try {
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        alert("Authentication token not found. Please login again.");
        return;
      }
      
      console.log("Making PUT request to:", `/admin/users/${userId}`);
      
      // Make the API call
      const response = await API.put(
        `/admin/users/${userId}`,
        editForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = response.data;

      console.log("Update response:", result);

      if (result.success) {
        // Update the user in the local state
        setUsers(prev => prev.map(user => {
          const currentUserId = user.id || user.userId;
          if (currentUserId === userId) {
            return { 
              ...user, 
              name: result.data.fullName || result.data.username || user.name,
              email: result.data.email || user.email,
              mobileNo: result.data.mobileNo || user.mobileNo,
              address: result.data.address || user.address,
              birthDate: result.data.birthDate || user.birthDate,
              profile_image: result.data.profileImageUrl || user.profile_image,
              department: result.data.department?.name || user.department,
              role: result.data.role?.id || user.role
            };
          }
          return user;
        }));

        // Update selected user in modal if it's open
        if (selectedUser) {
          const updatedSelectedUser = {
            ...selectedUser,
            name: result.data.fullName || result.data.username || selectedUser.name,
            email: result.data.email || selectedUser.email,
            mobileNo: result.data.mobileNo || selectedUser.mobileNo,
            address: result.data.address || selectedUser.address,
            birthDate: result.data.birthDate || selectedUser.birthDate,
            profile_image: result.data.profileImageUrl || selectedUser.profile_image,
            department: result.data.department?.name || selectedUser.department,
            role: result.data.role?.id || selectedUser.role
          };
          setSelectedUser(updatedSelectedUser);
        }

        alert("User updated successfully!");
        setIsEditModalOpen(false);
      } else {
        alert(result.message || "Failed to update user");
      }
    } catch (error: any) {
      console.error("Error updating user:", error);
      
      // Detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
        
        alert(`Error: ${error.response.data?.message || "Failed to update user. Please check the console for details."}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
        alert("No response from server. Please check if your backend server is running.");
      } else {
        // Something happened in setting up the request
        console.error("Request setup error:", error.message);
        alert(`Error: ${error.message}`);
      }
    } finally {
      setIsEditing(false);
    }
  };

  // Helper function to get department ID from name
  const getDepartmentId = (departmentName: string): number => {
    if (!departmentName) return 0;
    const dept = departments.find(d => d.name === departmentName);
    return dept ? dept.id : 0;
  };

  // Helper function to get role name from ID
  const getRoleName = (roleId: number): string => {
    const r = roles.find((r) => r.id === roleId) || role.find((r) => r.id === roleId);
    return r ? r.name : "Unknown";
  };

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

  useEffect(() => {
    const debounce = setTimeout(() => {
      setCurrentPage(1);
      fetchPageUsers(1);
    }, 300);
    
    return () => clearTimeout(debounce);
  }, [searchTerm, sortOrder, roleFilter, statusFilter]);

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
    console.log("Row clicked, user:", user);
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditForm({
      fullName: "",
      email: "",
      mobileNo: "",
      address: "",
      birthDate: "",
      profileImageUrl: "",
      departmentId: 0,
      roleId: 0
    });
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
                {roles.map((r) => (
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
                                    inline-flex items-center  rounded-lg sm:rounded-xl
                                    text-xs font-medium
                                    
                                    backdrop-blur-sm
                                    uppercase truncate max-w-[80px] sm:max-w-[100px]
                                  ">
                                    {user.role}
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
  <div className="fixed inset-0 z-50 bg-black/70">
    {/* Header */}
    <div className="flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          User Details
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          ID: {selectedUser.id || selectedUser.userId || 'N/A'}
        </p>
      </div>
      <button
        onClick={closeModal}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    {/* Content - Scrollable (shorter height to make room for footer) */}
    <div className="h-[calc(100vh-160px)] overflow-y-auto bg-gray-50 dark:bg-gray-800">
      <div className="max-w-4xl mx-auto p-6">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            {selectedUser.profile_image || selectedUser.profileImageUrl ? (
              <img
                src={selectedUser.profile_image || selectedUser.profileImageUrl}
                alt={selectedUser.name || selectedUser.fullName}
                className="w-20 h-20 rounded-xl object-cover border-2 border-gray-300 dark:border-gray-700"
              />
            ) : (
              <div className="
                w-20 h-20 rounded-xl
                bg-gradient-to-r from-blue-500 to-purple-600
                flex items-center justify-center text-white text-2xl font-bold
              ">
                {(selectedUser.name?.charAt(0) || selectedUser.fullName?.charAt(0) || '?').toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedUser.name || selectedUser.fullName || 'N/A'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedUser.employee_code || 'No employee code'}
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <div className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg">
                <p className="text-gray-900 dark:text-white">
                  {selectedUser.name || selectedUser.fullName || 'N/A'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg">
                <p className="text-gray-900 dark:text-white">
                  {selectedUser.email || 'N/A'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mobile Number
              </label>
              <div className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg">
                <p className="text-gray-900 dark:text-white">
                  {selectedUser.mobileNo || 'Not specified'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Birth Date
              </label>
              <div className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg">
                <p className="text-gray-900 dark:text-white">
                  {selectedUser.birthDate ? new Date(selectedUser.birthDate).toLocaleDateString() : 'Not specified'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Address Section */}
        {selectedUser.address && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              Address
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <div className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg">
                <p className="text-gray-900 dark:text-white whitespace-pre-line">
                  {selectedUser.address}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Role & Department Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Role & Department
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Department
              </label>
              <div className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg">
                <p className="text-gray-900 dark:text-white">
                  {selectedUser.department ||'NA'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <div className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg">
                <p className="text-gray-900 dark:text-white">
                  {selectedUser.role ||  'NA'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status & Date Section */}
        <div className="mb-12 p-15"> {/* Increased margin-bottom to create space */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Status & Employment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <div className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg">
                <div className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${selectedUser.is_checkin ? "bg-green-500" : "bg-red-500"}`}></span>
                  <p className={`font-medium ${selectedUser.is_checkin ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {selectedUser.is_checkin ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Joined
              </label>
              <div className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg">
                <p className="text-gray-900 dark:text-white">
                  {selectedUser.date ? new Date(selectedUser.date).toLocaleDateString() : 'Not specified'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Fixed Footer with Action Buttons - MOVED OUTSIDE scrollable area */}
    <div className="absolute bottom-0 left-0 right-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={closeModal}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => handleEditClick(selectedUser)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center min-w-[120px]"
          >
            Edit User
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Edit User Modal */}
{isEditModalOpen && selectedUser && (
  <div className="fixed inset-0 z-50 bg-black/70">
    {/* Header */}
    <div className="flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Edit User
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          ID: {selectedUser.id || selectedUser.userId || 'N/A'}
        </p>
      </div>
      <button
        onClick={closeEditModal}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    {/* Form Content - Scrollable */}
    <div className="h-[calc(100vh-160px)] overflow-y-auto bg-gray-50 dark:bg-gray-800">
      <form onSubmit={handleEditSubmit} className="max-w-4xl mx-auto p-6">
        {/* Basic Information Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={editForm.fullName}
                onChange={handleEditFormChange}
                required
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={editForm.email}
                onChange={handleEditFormChange}
                required
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                name="mobileNo"
                value={editForm.mobileNo}
                onChange={handleEditFormChange}
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter mobile number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Birth Date
              </label>
              <input
                type="date"
                name="birthDate"
                value={editForm.birthDate}
                onChange={handleEditFormChange}
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Address
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={editForm.address}
              onChange={handleEditFormChange}
              rows={3}
              className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              placeholder="Enter address"
            />
          </div>
        </div>

        {/* Profile & Preferences Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Profile & Preferences
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Profile Image URL
              </label>
              <input
                type="url"
                name="profileImageUrl"
                value={editForm.profileImageUrl}
                onChange={handleEditFormChange}
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="https://example.com/profile.jpg"
              />
            </div>
          </div>
        </div>

        {/* Role & Department Section */}
        <div className="mb-12 p-9"> {/* Increased margin-bottom to create space above buttons */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Role & Department
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Department *
              </label>
              <select
                name="departmentId"
                value={editForm.departmentId}
                onChange={handleEditFormChange}
                required
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
              >
                <option value={0}>Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role *
              </label>
              <select
                name="roleId"
                value={editForm.roleId}
                onChange={handleEditFormChange}
                required
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
              >
                <option value={0}>Select Role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </form>
    </div>

    {/* Fixed Footer with Action Buttons - MOVED OUTSIDE scrollable area */}
    <div className="absolute bottom-0 left-0 right-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-4xl mx-auto px-6 py-1">
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={closeEditModal}
            disabled={isEditing}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleEditSubmit}
            disabled={isEditing}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
          >
            {isEditing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Updating...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default UserList;