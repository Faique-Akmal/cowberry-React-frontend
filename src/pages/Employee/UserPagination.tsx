import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useData } from "../../context/DataProvider";
import API from "../../api/axios.ts";
import * as XLSX from "xlsx"; 

interface User {
  id: string;
  userId: string;
  name: string;
  full_name: string;
  employee_code: string;
  username: string;
  email: string;
  role: string;
  roleId: number;
  is_checkin: boolean;
  department: string;
  profile_image?: string;
  date: string;
  is_online: boolean;
  allocatedArea: string;
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
  username: string;
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
  const [allUsers, setAllUsers] = useState<User[]>([]); // Store all fetched users
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
    username: "",
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

  // Filter users based on search term, role, and status
  const filteredUsers = useMemo(() => {
    if (!allUsers.length) return [];
    
    let filtered = [...allUsers];
    
    // Filter by search term (full_name OR employee_code)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user => 
        (user.full_name?.toLowerCase().includes(searchLower) || 
         user.name?.toLowerCase().includes(searchLower) ||
         user.employee_code?.toLowerCase().includes(searchLower) ||
         user.employee_code?.includes(searchTerm.trim()))
      );
    }
    
    // Filter by role
    if (roleFilter !== "") {
      filtered = filtered.filter(user => user.roleId === roleFilter);
    }
    
    // Filter by status
    if (statusFilter !== "") {
      filtered = filtered.filter(user => {
        if (statusFilter === "online") return user.is_checkin;
        if (statusFilter === "offline") return !user.is_checkin;
        return true;
      });
    }
    
    // Sort by name
    filtered.sort((a, b) => {
      const nameA = (a.full_name || a.name || "").toLowerCase();
      const nameB = (b.full_name || b.name || "").toLowerCase();
      
      if (sortOrder === "asc") {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
    
    return filtered;
  }, [allUsers, searchTerm, roleFilter, statusFilter, sortOrder]);

  // Calculate paginated users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, limit]);

  // Update total pages when filtered users change
  useEffect(() => {
    const totalFiltered = filteredUsers.length;
    setTotalUsers(totalFiltered);
    setTotalPages(Math.ceil(totalFiltered / limit));
    setHasMore(currentPage < Math.ceil(totalFiltered / limit));
    
    // Reset to page 1 if current page exceeds total pages
    if (currentPage > Math.ceil(totalFiltered / limit)) {
      setCurrentPage(1);
    }
  }, [filteredUsers, currentPage, limit]);

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
      
      // Use filtered users for export
      const usersToExport = filteredUsers;
      
      if (usersToExport.length === 0) {
        alert("No users to export");
        return;
      }
      
      // Prepare data for Excel
      const excelData = usersToExport.map((user: User, index: number) => ({
        "Sr. No": index + 1,
        "Employee Code": user.employee_code || "N/A",
        "Full Name": user.full_name || user.name || "N/A",
        "Username": user.username || "N/A",
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
      
      alert(`Exported ${usersToExport.length} users to ${fileName}`);
      
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

  // Fetch all users once
  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
    
    try {
      const params: PaginationParams = {
        page: 1,
        limit: 1000, // Fetch all users at once
        sort_order: sortOrder
      };
      
      console.log("Fetching all users with params:", params);
      
      const res = await fetchUsers(params);
      
      const userData = res.data || [];
      const total = res.total || 0;
      
      console.log(`Fetched ${userData.length} users out of ${total} total`);
      
      setAllUsers(userData);
      setTotalUsers(total);
      setCurrentPage(1); // Reset to first page
      
    } catch (err) {
      console.error("❌ Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, sortOrder]);

  // Initial fetch
  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  // Handle edit button click
  const handleEditClick = async (user: User) => {
    console.log("Editing user:", user);
    
    setSelectedUser(user);
    
    // Get the correct user ID
    const userId = user.id || user.userId;
    
    try {
      // Fetch complete user details from API
      const token = localStorage.getItem("accessToken");
      if (token && userId) {
        const response = await API.get(`/admin/users/${userId}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        const userDetails = response.data?.data || response.data;
        console.log("Fetched user details:", userDetails);
        
        // Find department ID
        let departmentId = 0;
        if (userDetails.department) {
          const dept = departments.find(d => 
            d.name.toLowerCase() === userDetails.department.toLowerCase()
          );
          departmentId = dept?.departmentId || 0;
        }
        
        // Find role ID
        let roleId = user.roleId || 0;
        if (userDetails.role) {
          const role = roles.find(r => 
            r.name.toLowerCase() === userDetails.role.toLowerCase()
          );
          roleId = role?.id || user.roleId || 0;
        }
        
        // Populate edit form with fetched user data
        setEditForm({
          full_name: userDetails.full_name || userDetails.name || user.full_name || "",
          username: userDetails.username || user.username || "",
          email: userDetails.email || user.email || "",
          mobileNo: userDetails.mobileNo || user.mobileNo || "",
          address: userDetails.address || user.address || "",
          allocatedArea: userDetails.allocatedArea || user.allocatedArea || "",
          birthDate: userDetails.birthDate ? new Date(userDetails.birthDate).toISOString().split('T')[0] : "",
          profileImageUrl: userDetails.profileImageUrl || userDetails.profile_image || user.profile_image || "",
          departmentId: departmentId,
          roleId: roleId
        });
      } else {
        // Fallback to existing user data if API fails
        const department = departments.find(dept => 
          dept.name.toLowerCase() === user.department?.toLowerCase()
        );
        
        const role = roles.find(r => 
          r.name.toLowerCase() === user.role?.toLowerCase() || 
          r.id === user.roleId
        );
        
        setEditForm({
          full_name: user.full_name || "",
          username: user.username || "",
          email: user.email || "",
          mobileNo: user.mobileNo || "",
          address: user.address || "",
          allocatedArea: user.allocatedArea || "",
          birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : "",
          profileImageUrl: user.profile_image || user.profileImageUrl || "",
          departmentId: department?.departmentId || 0,
          roleId: role?.id || user.roleId || 0
        });
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      // Fallback to existing user data
      const department = departments.find(dept => 
        dept.name.toLowerCase() === user.department?.toLowerCase()
      );
      
      const role = roles.find(r => 
        r.name.toLowerCase() === user.role?.toLowerCase() || 
        r.id === user.roleId
      );
      
      setEditForm({
        full_name: user.full_name || "",
        username: user.username || "",
        email: user.email || "",
        mobileNo: user.mobileNo || "",
        address: user.address || "",
        allocatedArea: user.allocatedArea || "",
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : "",
        profileImageUrl: user.profile_image || user.profileImageUrl || "",
        departmentId: department?.departmentId || 0,
        roleId: role?.id || user.roleId || 0
      });
    }
    
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
        const updatedFullName = result.data.fullName || editForm.full_name;
        
        // Update the user in the allUsers state
        setAllUsers(prev => prev.map(user => {
          const currentUserId = user.id || user.userId;
          if (currentUserId === userId) {
            return { 
              ...user, 
              name: updatedFullName,
              full_name: updatedFullName,
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
            name: updatedFullName,
            full_name: updatedFullName,
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
          setCurrentPage(prev => prev + 1);
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
  }, [hasMore, loadingMore]);

  // Handle search change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    // Re-fetch users with new sort order
    fetchAllUsers();
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
      username: "",
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
    setCurrentPage(page);
    
    // Scroll to top
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
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
      w-[100%] max-w-[100%] mx-auto
      px-2 sm:px-3 md:px-4
      rounded-2xl sm:rounded-3xl
      bg-gradient-to-br from-white/20 via-white/10 to-white/5
      dark:from-gray-900/30 dark:via-gray-800/20 dark:to-gray-900/10
      backdrop-blur-2xl
      border border-white/40 dark:border-gray-700/40
      p-3 sm:p-4 lg:p-6
      shadow-[0_8px_32px_rgba(31,38,135,0.15)]
      dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]
      overflow-hidden
      relative
      flex flex-col
      h-[85vh]
      box-border
    ">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
      <div className="relative z-10 flex flex-col h-full">
        <h2 className="
          text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-center
          text-dark
          bg-clip-text 
          px-2
        ">
          Users Directory
        </h2>

        {/* Enhanced Filter Section - Reduced Height */}
        <div className="
          bg-gradient-to-br from-white/40 to-white/20
          dark:from-gray-800/40 dark:to-gray-900/20
          backdrop-blur-xl
          border border-white/40 dark:border-gray-700/40
          rounded-xl sm:rounded-2xl p-2 sm:p-3 mb-3 sm:mb-4
          shadow-[0_4px_20px_rgba(0,0,0,0.1)]
          dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]
          flex-shrink-0
        ">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
            {/* Search Input - Search by full_name OR employee_code */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Users (Name or Employee Code)
              </label>
              <div className="relative">
                <div className="
                  absolute left-2 top-1/2 transform -translate-y-1/2
                  p-1 rounded
                  bg-white/50 dark:bg-gray-700/50
                  backdrop-blur-sm
                ">
                  <svg className="h-3 w-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by name or employee code..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="
                    w-full pl-8 pr-2 py-1.5
                    bg-white/50 dark:bg-gray-700/50
                    backdrop-blur-sm
                    border border-white/60 dark:border-gray-600/60
                    rounded-lg
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
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Role Filter - Fixed to use API */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  w-full py-1.5 px-2
                  bg-white/50 dark:bg-gray-700/50
                  backdrop-blur-sm
                  border border-white/60 dark:border-gray-600/60
                  rounded-lg
                  text-gray-900 dark:text-gray-100
                  focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
                  focus:outline-none
                  text-sm
                  transition-all duration-300
                  appearance-none
                  bg-no-repeat bg-[right_0.5rem_center] bg-[length:0.75em]
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
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as "" | "online" | "offline");
                }}
                className="
                  w-full py-1.5 px-2
                  bg-white/50 dark:bg-gray-700/50
                  backdrop-blur-sm
                  border border-white/60 dark:border-gray-600/60
                  rounded-lg
                  text-gray-900 dark:text-gray-100
                  focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
                  focus:outline-none
                  text-sm
                  transition-all duration-300
                  appearance-none
                  bg-no-repeat bg-[right_0.5rem_center] bg-[length:0.75em]
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="
              text-xs text-gray-600 dark:text-gray-300
              px-2 py-1 rounded
              bg-white/40 dark:bg-gray-700/40
              backdrop-blur-sm
              whitespace-nowrap
            ">
              Showing {paginatedUsers.length} of {filteredUsers.length} filtered users • Page {currentPage} of {totalPages}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={clearFilters}
                className="
                  px-3 py-1.5
                  bg-gradient-to-r from-white/40 to-white/20
                  dark:from-gray-700/40 dark:to-gray-800/20
                  backdrop-blur-sm
                  border border-white/60 dark:border-gray-600/60
                  text-gray-700 dark:text-gray-300 
                  rounded-lg hover:from-white/60 hover:to-white/40
                  dark:hover:from-gray-600/60 dark:hover:to-gray-700/40
                  transition-all duration-300
                  w-full sm:w-auto
                  shadow-sm hover:shadow
                  text-xs
                  flex items-center justify-center
                "
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
              
              <button
                onClick={exportToExcel}
                disabled={exporting || filteredUsers.length === 0}
                className="
                  px-3 py-1.5
                  bg-gradient-to-r from-green-500/80 to-green-600/80
                  hover:from-green-600/80 hover:to-green-700/80
                  backdrop-blur-sm
                  border border-green-400/60 dark:border-green-600/60
                  text-white
                  rounded-lg
                  transition-all duration-300
                  w-full sm:w-auto
                  shadow-sm hover:shadow
                  text-xs
                  flex items-center justify-center
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {exporting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export to Excel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main content area with scroll - Increased Height */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {loading && allUsers.length === 0 ? (
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
                    {/* Table Header - Fixed with corrected spacing */}
                    <div className="flex-shrink-0 sticky top-0 z-10">
                      <div className="
                        grid grid-cols-[40px_1fr_120px_1fr_100px_120px_120px]
                        px-2 py-2
                        bg-gradient-to-r from-white/60 to-white/40
                        dark:from-gray-800/60 dark:to-gray-900/40
                        backdrop-blur-lg
                        border-b border-white/30 dark:border-gray-700/30
                      ">
                        <div className="
                          px-1 text-left text-xs font-semibold
                          text-gray-600 dark:text-gray-300
                          uppercase tracking-wider
                          whitespace-nowrap
                        ">
                          Sr.no
                        </div>
                        <div 
                          className="
                            px-6 text-left text-xs font-semibold
                            text-gray-600 dark:text-gray-300
                            uppercase tracking-wider cursor-pointer
                            hover:bg-white/30 dark:hover:bg-gray-800/30
                            transition-colors duration-300
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
                        </div>
                        <div className="
                          px-1 text-left text-xs font-semibold
                          text-gray-600 dark:text-gray-300
                          uppercase tracking-wider hidden sm:table-cell
                          whitespace-nowrap
                        ">
                          Employee Code
                        </div>
                        <div className="
                          px-1 text-left text-xs font-semibold
                          text-gray-600 dark:text-gray-300
                          uppercase tracking-wider hidden lg:table-cell
                          whitespace-nowrap
                        ">
                          Email
                        </div>
                        <div className="
                          px-1 text-left text-xs font-semibold
                          text-gray-600 dark:text-gray-300
                          uppercase tracking-wider
                          whitespace-nowrap
                        ">
                          Role
                        </div>
                        <div className="
                          px-1 text-left text-xs font-semibold
                          text-gray-600 dark:text-gray-300
                          uppercase tracking-wider
                          whitespace-nowrap
                        ">
                         Allocated Area
                        </div>
                        <div className="
                          px-1 text-left text-xs font-semibold
                          text-gray-600 dark:text-gray-300
                          uppercase tracking-wider hidden md:table-cell
                          whitespace-nowrap
                        ">
                          Department
                        </div>
                      </div>
                    </div>

                    {/* Table Body - Scrollable with corrected spacing */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="divide-y divide-white/20 dark:divide-gray-700/20">
                        {paginatedUsers.length > 0 ? (
                          paginatedUsers.map((user, index) => {
                            const userKey = getUserKey(user, index);
                            return (
                              <div 
                                onClick={() => handleRowClick(user)}
                                key={userKey}
                                className="
                                  grid grid-cols-[40px_1fr_120px_1fr_100px_120px_120px]
                                  px-2 py-2
                                  hover:bg-white/30 dark:hover:bg-gray-800/30
                                  transition-all duration-300
                                  cursor-pointer
                                  backdrop-blur-sm
                                "
                              >
                                <div className="
                                  px-1 py-2 whitespace-nowrap
                                  text-xs text-gray-900 dark:text-gray-100
                                ">
                                  {(currentPage - 1) * limit + index + 1}
                                </div>
                                <div className="py-2 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0">
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
                                    <div className="min-w-0 flex-1 ml-2">
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
                                </div>
                                <div className="
                                  px-1 py-2 whitespace-nowrap
                                  text-xs text-gray-900 dark:text-gray-100 hidden sm:table-cell
                                ">
                                  <div className="
                                    bg-white/40 dark:bg-gray-800/40 rounded px-2 py-1.5
                                    backdrop-blur-sm truncate
                                  ">
                                    {user.employee_code || 'N/A'}
                                  </div>
                                </div>
                                <div className="
                                  px-1 py-2 whitespace-nowrap
                                  text-xs text-gray-600 dark:text-gray-400 hidden lg:table-cell
                                ">
                                  <div className="
                                    truncate
                                    bg-white/40 dark:bg-gray-800/40 rounded px-2 py-1.5
                                    backdrop-blur-sm
                                  ">
                                    {user.email || "N/A"}
                                  </div>
                                </div>
                                <div className="px-1 py-2 whitespace-nowrap">
                                  <span className="
                                    inline-flex items-center px-2 py-1 rounded-lg
                                    text-xs font-medium bg-blue-100/50 dark:bg-blue-900/30
                                    text-blue-800 dark:text-blue-300 backdrop-blur-sm
                                    truncate
                                  ">
                                    {user.role}
                                  </span>
                                </div>
                                <div className="px-1 py-2 whitespace-nowrap">
                                  <span className="
                                    inline-flex items-center px-2 py-1 rounded-lg
                                    text-xs font-medium bg-green-100/50 dark:bg-green-900/30
                                    text-green-800 dark:text-green-300 backdrop-blur-sm
                                    truncate
                                  ">
                                    {user.allocatedArea || "N/A"}
                                  </span>
                                </div>
                                <div className="
                                  px-1 py-2 whitespace-nowrap
                                  text-xs text-gray-600 dark:text-gray-400 hidden md:table-cell
                                ">
                                  <div className="
                                    truncate
                                    bg-white/40 dark:bg-gray-800/40 rounded px-2 py-1.5
                                    backdrop-blur-sm
                                  ">
                                    {user.department || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="
                            col-span-7 px-2 py-6 text-center
                            bg-gradient-to-br from-white/30 to-white/10
                            dark:from-gray-800/30 dark:to-gray-900/10
                          ">
                            <div className="
                              p-4 rounded-xl
                              bg-gradient-to-br from-white/40 to-white/20
                              dark:from-gray-800/40 dark:to-gray-900/20
                              backdrop-blur-xl
                              border border-white/40 dark:border-gray-700/40
                              inline-block max-w-[90%]
                            ">
                              <div className="
                                w-12 h-12 mx-auto mb-3
                                bg-gradient-to-br from-gray-200/50 to-gray-300/30
                                dark:from-gray-700/50 dark:to-gray-800/30
                                backdrop-blur-sm
                                border border-gray-300/60 dark:border-gray-600/60
                                rounded-xl flex items-center justify-center
                              ">
                                <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </div>
                              <p className="
                                text-sm font-medium
                                bg-gradient-to-r from-blue-600 to-purple-600
                                dark:from-blue-400 dark:to-purple-400
                                bg-clip-text text-transparent
                              ">
                                No users found
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Try adjusting your search or filter criteria
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Infinite scroll sentinel */}
                      <div ref={sentinelRef} className="h-1"></div>
                      
                      {/* Loading more indicator */}
                      {loadingMore && (
                        <div className="
                          flex justify-center items-center py-3
                          bg-gradient-to-br from-white/30 to-white/10
                          dark:from-gray-800/30 dark:to-gray-900/10
                          backdrop-blur-lg
                          rounded-xl border border-white/40 dark:border-gray-700/40
                          my-2 mx-2
                        ">
                          <div className="
                            animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500
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
                        alt={ selectedUser.full_name || selectedUser.name || 'N/A' }
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
                          {selectedUser.full_name ||  'N/A'}
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
                      Username
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={editForm.username}
                        onChange={handleEditFormChange}
                        required
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Enter username"
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