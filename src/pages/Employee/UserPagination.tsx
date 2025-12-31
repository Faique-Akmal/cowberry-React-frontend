import React, { useEffect, useState, useRef, useCallback } from "react";
import { useData } from "../../context/DataProvider";
import API from "../../api/axios.ts";
import * as XLSX from "xlsx"; // Install with: npm install xlsx

interface User {
  id: string;
  userId: string;
  name: string;
  employee_code: string;
  email: string;
  role: string;
  roleId: number;
  is_checkin: boolean;
  department: string;
  profile_image?: string;
  date: string;
  is_online: boolean;
  allocatedArea: string;
  full_name?: string;
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
  departmentId: number;
  name: string;
}

// Role interface
interface Role {
  id: number;
  name: string;
  description: string;
}

// Edit User Form interface
interface EditUserForm {
  username?: string;
  full_name: string;
  email: string;
  mobileNo: string;
  address: string;
  birthDate: string;
  profileImageUrl: string;
  departmentId: number;
  allocatedArea: string;
  roleId: number;
}

const UserList: React.FC = () => {
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
  const [exporting, setExporting] = useState(false);
  
  // Edit form states
  const [editForm, setEditForm] = useState<EditUserForm>({
    full_name: "",
    email: "",
    mobileNo: "",
    address: "",
    birthDate: "",
    profileImageUrl: "",
    departmentId: 0,
    allocatedArea: "",
    roleId: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const limit = 20; 
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch departments from API
  const fetchDepartments = useCallback(async () => {
    try {
      setLoadingDepartments(true);
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        console.warn("No token found for departments API");
        return;
      }
      
      const response = await API.get('/departments/static_departments', {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      console.log("Departments API response:", response.data);
      
      if (response.data?.departments) {
        setDepartments(response.data.departments);
      } else {
        console.error("Unexpected departments response structure:", response.data);
        setDepartments([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch departments:", error);
      if (error.response) {
        console.error("Departments API error response:", error.response.data);
      }
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

  // Fetch roles from API
  const fetchRoles = useCallback(async () => {
    try {
      setLoadingRoles(true);
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        console.warn("No token found for roles API");
        return;
      }
      
      const response = await API.get('/roles/static_roles', {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      console.log("Roles API response:", response.data);
      
      if (response.data?.roles) {
        setRoles(response.data.roles);
      } else {
        console.error("Unexpected roles response structure:", response.data);
        setRoles([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch roles:", error);
      if (error.response) {
        console.error("Roles API error response:", error.response.data);
      }
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  // Function to export users to Excel
  const exportToExcel = async () => {
    try {
      setExporting(true);
      
      // First, fetch all users (not just current page)
      const params: PaginationParams = {
        page: 1,
        limit: 10000, // Large number to get all users
        sort_order: sortOrder
      };
      
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (roleFilter !== "") {
        params.role = roleFilter;
      }
      if (statusFilter !== "") {
        params.status = statusFilter;
      }
      
      const res = await fetchUsers(params);
      const allUsers = res.data || [];
      
      if (allUsers.length === 0) {
        alert("No users to export");
        return;
      }
      
      // Prepare data for Excel
      const excelData = allUsers.map((user: User, index: number) => ({
        "Sr. No": index + 1,
        "Employee Code": user.employee_code || "N/A",
        "Full Name": user.full_name || user.name || "N/A",
        "Email": user.email || "N/A",
        "Role": user.role || "N/A",
        "Department": user.department || "N/A",
        "Allocated Area": user.allocatedArea || "N/A",
        "Mobile Number": user.mobileNo || "N/A",
        "Status": user.is_checkin ? "Online" : "Offline",
        "Date Joined": user.date ? new Date(user.date).toLocaleDateString() : "N/A",
        "Address": user.address || "N/A",
        "Birth Date": user.birthDate ? new Date(user.birthDate).toLocaleDateString() : "N/A"
      }));
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
      
      // Auto-size columns
      const maxWidth = excelData.reduce((w, r) => Math.max(w, Object.values(r).join("").length), 10);
      worksheet["!cols"] = [{ wch: maxWidth }];
      
      // Generate Excel file
      const fileName = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      alert(`Exported ${allUsers.length} users to ${fileName}`);
      
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export users. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // Fetch departments and roles for edit form
  useEffect(() => {
    fetchDepartments();
    fetchRoles();
  }, [fetchDepartments, fetchRoles]);

  // Fixed search implementation
  const fetchPageUsers = useCallback(async (page: number = 1, isLoadMore: boolean = false) => {
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
      
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (roleFilter !== "") {
        params.role = roleFilter;
      }
      if (statusFilter !== "") {
        params.status = statusFilter;
      }
      
      const res = await fetchUsers(params);
      
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
  }, [loading, hasMore, searchTerm, sortOrder, roleFilter, statusFilter, fetchUsers]);

  // Handle edit button click
  const handleEditClick = (user: User) => {
    console.log("Editing user:", user);
    
    setSelectedUser(user);
    
    // Get the correct user ID
    const userId = user.id || user.userId;
    
    // Find the department ID from department name
    const department = departments.find(dept => 
      dept.name.toLowerCase() === user.department?.toLowerCase()
    );
    
    // Find the role ID from role name or use existing roleId
    const role = roles.find(r => 
      r.name.toLowerCase() === user.role?.toLowerCase() || 
      r.id === user.roleId
    );
    
    // Populate edit form with user data
    setEditForm({
      username: user.employee_code || `user_${userId}`,
      full_name: user.full_name || user.name || "",
      email: user.email || "",
      mobileNo: user.mobileNo || "",
      address: user.address || "",
      allocatedArea: user.allocatedArea || "",
      birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : "",
      profileImageUrl: user.profile_image || user.profileImageUrl || "",
      departmentId: department?.departmentId || 0,
      roleId: role?.id || user.roleId || 0
    });
    
    setIsEditModalOpen(true);
  };

  // Handle edit form input changes
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'departmentId' || name === 'roleId' ? parseInt(value) || 0 : value
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
    console.log("Available departments:", departments);
    console.log("Available roles:", roles);
    
    // Validate required fields
    if (!editForm.full_name.trim()) {
      alert("Full name is required");
      return;
    }
    
    if (!editForm.email.trim()) {
      alert("Email is required");
      return;
    }
    
    if (!editForm.departmentId || editForm.departmentId === 0) {
      alert("Please select a department");
      return;
    }
    
    if (!editForm.roleId || editForm.roleId === 0) {
      alert("Please select a role");
      return;
    }
    
    // Validate that selected department exists
    const selectedDepartment = departments.find(d => d.departmentId === editForm.departmentId);
    if (!selectedDepartment) {
      alert("Selected department is invalid. Please refresh and try again.");
      return;
    }
    
    // Validate that selected role exists
    const selectedRole = roles.find(r => r.id === editForm.roleId);
    if (!selectedRole) {
      alert("Selected role is invalid. Please refresh and try again.");
      return;
    }
    
    setIsEditing(true);
    
    try {
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        alert("Authentication token not found. Please login again.");
        return;
      }
      
      // Prepare data for API - ensure all numbers are integers
      const updateData = {
        username: editForm.username?.trim(),
        fullName: editForm.full_name.trim(),
        email: editForm.email.trim(),
        mobileNo: editForm.mobileNo.trim(),
        address: editForm.address.trim(),
        birthDate: editForm.birthDate || null,
        allocatedArea: editForm.allocatedArea.trim() || null,
        profileImageUrl: editForm.profileImageUrl.trim() || null,
        departmentId: Number(editForm.departmentId),
        roleId: Number(editForm.roleId)
      };
      
      console.log("Sending update data:", updateData);
      console.log("Making PUT request to:", `/admin/users/${userId}`);
      
      // Make the API call
      const response = await API.put(
        `/admin/users/${userId}`,
        updateData,
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
        // Find the updated department and role names
        const updatedDepartment = departments.find(d => d.departmentId === editForm.departmentId);
        const updatedRole = roles.find(r => r.id === editForm.roleId);
        
        // Update the user in the local state
        setUsers(prev => prev.map(user => {
          const currentUserId = user.id || user.userId;
          if (currentUserId === userId) {
            return { 
              ...user, 
              name: result.data.fullName || result.data.username || user.name,
              full_name: result.data.fullName || editForm.full_name || user.full_name,
              email: result.data.email || user.email,
              mobileNo: result.data.mobileNo || user.mobileNo,
              address: result.data.address || user.address,
              allocatedArea: result.data.allocatedArea || user.allocatedArea,
              birthDate: result.data.birthDate || user.birthDate,
              profile_image: result.data.profileImageUrl || user.profile_image,
              department: updatedDepartment?.name || user.department,
              role: updatedRole?.name || result.data.role || user.role,
              roleId: editForm.roleId
            };
          }
          return user;
        }));

        // Update selected user in modal if it's open
        if (selectedUser) {
          const updatedSelectedUser = {
            ...selectedUser,
            name: result.data.fullName || result.data.username || selectedUser.name,
            full_name: result.data.fullName || editForm.full_name || selectedUser.full_name,
            email: result.data.email || selectedUser.email,
            mobileNo: result.data.mobileNo || selectedUser.mobileNo,
            address: result.data.address || selectedUser.address,
            birthDate: result.data.birthDate || selectedUser.birthDate,
            allocatedArea: result.data.allocatedArea || selectedUser.allocatedArea,
            profile_image: result.data.profileImageUrl || selectedUser.profile_image,
            department: updatedDepartment?.name || selectedUser.department,
            role: updatedRole?.name || result.data.role || selectedUser.role,
            roleId: editForm.roleId
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
      
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        
        let errorMessage = error.response.data?.message || "Failed to update user";
        
        if (error.response.data?.error?.includes('roleId')) {
          errorMessage += "\n\nPossible issue: Role ID format is incorrect. Please ensure you're sending a numeric role ID.";
        } else if (error.response.data?.error?.includes('departmentId')) {
          errorMessage += "\n\nPossible issue: Department ID format is incorrect.";
        }
        
        alert(`Error: ${errorMessage}`);
      } else if (error.request) {
        console.error("No response received:", error.request);
        alert("No response from server. Please check if your backend server is running.");
      } else {
        console.error("Request setup error:", error.message);
        alert(`Error: ${error.message}`);
      }
    } finally {
      setIsEditing(false);
    }
  };

  // Helper function to get department name from ID
  const getDepartmentName = (departmentId: number): string => {
    if (!departmentId) return "Unknown";
    const dept = departments.find(d => d.departmentId === departmentId);
    return dept ? dept.name : "Unknown";
  };

  // Helper function to get role name from ID
  const getRoleName = (roleId: number): string => {
    if (!roleId) return "Unknown";
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : "Unknown";
  };

  // Fixed intersection observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
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

    const currentSentinel = sentinelRef.current;
    observer.observe(currentSentinel);

    return () => {
      if (observer && currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [currentPage, hasMore, loadingMore, fetchPageUsers]);

  // Fixed search debounce
  useEffect(() => {
    const debounce = setTimeout(() => {
      setCurrentPage(1);
      setHasMore(true);
      fetchPageUsers(1);
    }, 500);
    
    return () => clearTimeout(debounce);
  }, [searchTerm, sortOrder, roleFilter, statusFilter, fetchPageUsers]);

  // Initial fetch
  useEffect(() => {
    fetchPageUsers(1);
  }, [fetchPageUsers]);

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
      full_name: "",
      email: "",
      mobileNo: "",
      address: "",
      birthDate: "",
      allocatedArea: "",
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
          key={`page-${i}`}
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

  // Generate a unique key for each user row
  const getUserKey = (user: User, index: number): string => {
    const userId = user.id || user.userId;
    const baseKey = userId || `user-${index}`;
    const pageIndex = (currentPage - 1) * limit + index;
    return `${baseKey}-${pageIndex}`;
  };

  return (
    <div className="
      w-full
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
      box-border
      max-w-full
    ">
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

        {/* Enhanced Filter Section */}
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
            {/* Search Input - Fixed */}
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
                  placeholder="Search by name, email, or employee code..."
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
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Role Filter - Fixed */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                Filter by Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => {
                  const value = e.target.value === "" ? "" : Number(e.target.value);
                  setRoleFilter(value);
                }}
                disabled={loadingRoles}
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
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23999' viewBox='0 0 256 256'%3E%3Cpath d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z'%3E%3C/path%3E%3C/svg%3E")`
                }}
              >
                <option value="">All Roles</option>
                {loadingRoles ? (
                  <option value="" disabled>Loading roles...</option>
                ) : (
                  roles.map((r) => (
                    <option key={`role-${r.id}`} value={r.id}>
                      {r.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as "" | "online" | "offline");
                }}
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

          {/* Filter Actions - Updated with Export Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="
              text-xs sm:text-sm text-gray-600 dark:text-gray-300
              px-2 sm:px-3 py-1.5 sm:py-2 rounded
              bg-white/40 dark:bg-gray-700/40
              backdrop-blur-sm
              whitespace-nowrap
            ">
              Showing {users.length} of {totalUsers} users • Page {currentPage} of {totalPages}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
                  flex items-center justify-center
                "
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
              
              <button
                onClick={exportToExcel}
                disabled={exporting || users.length === 0}
                className="
                  px-3 sm:px-4 py-2
                  bg-gradient-to-r from-green-500/80 to-green-600/80
                  hover:from-green-600/80 hover:to-green-700/80
                  backdrop-blur-sm
                  border border-green-400/60 dark:border-green-600/60
                  text-white
                  rounded-lg sm:rounded-xl
                  transition-all duration-300
                  w-full sm:w-auto
                  shadow-sm hover:shadow
                  text-sm
                  flex items-center justify-center
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {exporting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export to Excel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main content area with scroll */}
     <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
          flex-1
          relative
          overflow-y-auto
          overflow-x-hidden
        "
      >
        <div className="min-w-full h-full">
          <div className="h-full flex flex-col">
            {/* Table Header - Fixed */}
            <div className="flex-shrink-0 sticky top-0 z-10">
              <table className="w-full table-fixed">
                <thead className="
                  bg-gradient-to-r from-white/60 to-white/40
                  dark:from-gray-800/60 dark:to-gray-900/40
                  backdrop-blur-lg
                ">
                  <tr>
                    <th className="
                      px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-semibold
                      text-gray-600 dark:text-gray-300
                      uppercase tracking-wider
                      border-b border-white/30 dark:border-gray-700/30
                      backdrop-blur-sm
                      whitespace-nowrap
                      w-12
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
                        w-1/5
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
                      w-1/6
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
                      w-1/4
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
                      w-1/8
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
                      w-1/6
                    ">
                     Allocated Area
                    </th>
                    <th className="
                      px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-semibold
                      text-gray-600 dark:text-gray-300
                      uppercase tracking-wider hidden md:table-cell
                      border-b border-white/30 dark:border-gray-700/30
                      backdrop-blur-sm
                      whitespace-nowrap
                      w-1/6
                    ">
                      Department
                    </th>
                  </tr>
                </thead>
              </table>
            </div>

            {/* Table Body - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full table-fixed">
                <tbody className="divide-y divide-white/20 dark:divide-gray-700/20">
                  {users.length > 0 ? (
                    users.map((user, index) => {
                      const userKey = getUserKey(user, index);
                      return (
                        <tr 
                          onClick={() => handleRowClick(user)}
                          key={userKey}
                          className="
                            hover:bg-white/30 dark:hover:bg-gray-800/30
                            transition-all duration-300
                            cursor-pointer
                            backdrop-blur-sm
                          "
                        >
                          <td className="
                         sm:px-3 py-2 sm:py-3 whitespace-nowrap
                            text-xs sm:text-sm text-gray-900 dark:text-gray-100
                          ">
                            {(currentPage - 1) * limit + index + 1}
                          </td>
                          <td className=" py-2 sm:py-3 whitespace-nowrap">
                            <div className="flex items-center mr-2">
                              <div className="flex-shrink-0 ">
                                <div className="
                                  h-8 w-8 rounded-lg
                                  bg-gradient-to-r from-blue-500 to-black-900
                                  dark:from-blue-400 dark:to-black-900
                                  flex items-center justify-center text-white
                                  text-sm font-bold
                                ">
                                  {user.full_name?.charAt(0).toUpperCase() || user.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate leading-tight">
                                  <span className="inline-flex items-center">
                                    <span className="
                                      bg-gradient-to-r from-blue-600 to-purple-600
                                      dark:from-blue-400 dark:to-purple-400
                                      bg-clip-text text-transparent
                                      font-bold
                                    ">
                                      {user.full_name?.charAt(0) || user.name?.charAt(0) || ''}
                                    </span>
                                    <span className="text-gray-900 dark:text-gray-100 ml-0">
                                      {user.full_name?.slice(1) || user.name?.slice(1) || 'N/A'}
                                    </span>
                                  </span>
                                </div>
                                <div className="
                                  text-xs text-gray-600 dark:text-gray-400 sm:hidden
                                  truncate leading-tight mt-0.5
                                ">
                                  {user.employee_code || 'N/A'}
                                </div>
                                <div className="
                                  text-xs text-gray-600 dark:text-gray-400 lg:hidden
                                  truncate leading-tight mt-0.5
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
                              backdrop-blur-sm truncate
                            ">
                              {user.employee_code || 'N/A'}
                            </div>
                          </td>
                          <td className="
                            px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap
                            text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell
                          ">
                            <div className="
                              truncate
                              bg-white/40 dark:bg-gray-800/40 rounded px-2 py-1.5
                              backdrop-blur-sm
                            ">
                              {user.email || "N/A"}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap">
                            <span className="
                              inline-flex items-center px-2 py-1 rounded-lg
                              text-xs font-medium bg-blue-100/50 dark:bg-blue-900/30
                              text-blue-800 dark:text-blue-300 backdrop-blur-sm
                              truncate
                            ">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap">
                            <span className="
                              inline-flex items-center px-2 py-1 rounded-lg
                              text-xs font-medium bg-green-100/50 dark:bg-green-900/30
                              text-green-800 dark:text-green-300 backdrop-blur-sm
                              truncate
                            ">
                              {user.allocatedArea || "N/A"}
                            </span>
                          </td>
                          <td className="
                            px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap
                            text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell
                          ">
                            <div className="
                              truncate
                              bg-white/40 dark:bg-gray-800/40 rounded px-2 py-1.5
                              backdrop-blur-sm
                            ">
                              {user.department || 'N/A'}
                            </div>
                          </td>
                        </tr>
                      );
                    })
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

      {/* User Details Modal */}
    {isModalOpen && selectedUser && (
  <div className="fixed inset-0 z-50 bg-black/70">
    <div className="
      bg-white dark:bg-gray-900
      w-full h-full
      flex flex-col
      overflow-hidden
    ">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
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

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Profile Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              {selectedUser.profile_image || selectedUser.profileImageUrl ? (
                <img
                  src={selectedUser.profile_image || selectedUser.profileImageUrl}
                  alt={selectedUser.name || selectedUser.full_name}
                  className="w-24 h-24 rounded-xl object-cover border-2 border-gray-300 dark:border-gray-700"
                />
              ) : (
                <div className="
                  w-24 h-24 rounded-xl
                  bg-gradient-to-r from-blue-500 to-purple-600
                  flex items-center justify-center text-white text-3xl font-bold
                ">
                  {(selectedUser.name?.charAt(0) || selectedUser.full_name?.charAt(0) || '?').toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {selectedUser.full_name || selectedUser.name || 'N/A'}
                </h3>
                <p className="text-base text-gray-500 dark:text-gray-400 mt-1">
                  {selectedUser.employee_code || 'No employee code'}
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-900 dark:text-white text-base">
                    {selectedUser.full_name || selectedUser.name || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-900 dark:text-white text-base">
                    {selectedUser.email || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mobile Number
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-900 dark:text-white text-base">
                    {selectedUser.mobileNo || 'Not specified'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Birth Date
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-900 dark:text-white text-base">
                    {selectedUser.birthDate ? new Date(selectedUser.birthDate).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Address Section */}
          {selectedUser.address && (
            <div className="mb-8">
              <div>
                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-900 dark:text-white whitespace-pre-line text-base">
                    {selectedUser.address}
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedUser.allocatedArea && (
            <div className="mb-8">
              <div>
                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Allocated Area
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-900 dark:text-white whitespace-pre-line text-base">
                    {selectedUser.allocatedArea || 'NA'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Role & Department Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              Role & Department
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-900 dark:text-white text-base">
                    {selectedUser.department || 'NA'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-900 dark:text-white text-base">
                    {selectedUser.role}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status & Date Section */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              Status & Employment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-3 ${selectedUser.is_checkin ? "bg-green-500" : "bg-red-500"}`}></span>
                    <p className={`font-medium text-base ${selectedUser.is_checkin ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {selectedUser.is_checkin ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Joined
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-900 dark:text-white text-base">
                    {selectedUser.date ? new Date(selectedUser.date).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Action Buttons */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={closeModal}
            className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-base"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => handleEditClick(selectedUser)}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center min-w-[140px] text-base"
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
    <div className="
      bg-white dark:bg-gray-900
      w-full h-full
      flex flex-col
      overflow-hidden
    ">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Edit User
                </h2>
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
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6">
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
                        name="full_name"
                        value={editForm.full_name}
                        onChange={handleEditFormChange}
                        required
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={editForm.address}
                      onChange={handleEditFormChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                      placeholder="Enter address"
                    />
                  </div>
                </div>

                <div className="mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Allocated Area
                    </label>
                    <input
                      type="text"
                      name="allocatedArea"
                      value={editForm.allocatedArea}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Enter allocated area"
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
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="https://example.com/profile.jpg"
                      />
                    </div>
                  </div>
                </div>

                {/* Role & Department Section */}
                <div className="mb-12">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                    Role & Department
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Department *
                      </label>
                      {loadingDepartments ? (
                        <div className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
                          <p className="text-gray-500 dark:text-gray-400">Loading departments...</p>
                        </div>
                      ) : departments.length === 0 ? (
                        <div className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                          <p className="text-red-600 dark:text-red-400">Failed to load departments. Please refresh.</p>
                        </div>
                      ) : (
                        <select
                          name="departmentId"
                          value={editForm.departmentId}
                          onChange={handleEditFormChange}
                          required
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
                        >
                          <option value={0}>Select Department</option>
                          {departments.map((dept) => (
                            <option key={`dept-${dept.departmentId}`} value={dept.departmentId}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Role *
                      </label>
                      {loadingRoles ? (
                        <div className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
                          <p className="text-gray-500 dark:text-gray-400">Loading roles...</p>
                        </div>
                      ) : roles.length === 0 ? (
                        <div className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                          <p className="text-red-600 dark:text-red-400">Failed to load roles. Please refresh.</p>
                        </div>
                      ) : (
                        <select
                          name="roleId"
                          value={editForm.roleId}
                          onChange={handleEditFormChange}
                          required
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
                        >
                          <option value={0}>Select Role</option>
                          {roles.map((role) => (
                            <option key={`role-${role.id}`} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer with Action Buttons */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
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
                  disabled={isEditing || loadingDepartments || loadingRoles || departments.length === 0 || roles.length === 0}
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