import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
// ✅ Import Zustand Store
import { useUserStore } from "../../store/useUserStore";
import API from "../../api/axios";
import * as XLSX from "xlsx";

// Add UserRole type
type UserRole = "HR" | "Manager" | "ZonalManager" | string;

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
  mobileNo: string;
  address?: string;
  birthDate?: string;
  profileImageUrl?: string;
}

// Add current user interface
interface CurrentUser {
  id: string;
  role: UserRole;
  department?: string;
  departmentName?: string;
  allocatedArea?: string;
}

// interface PaginationParams {
//   page: number;
//   limit: number;
//   search?: string;
//   sort_order?: "asc" | "desc";
//   role?: number;
//   status?: "online" | "offline";
// }

interface Department {
  departmentId: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
}

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
  // ✅ Access Store State & Actions
  const { users, fetchUsers, isLoading, resetStore } = useUserStore();

  // Local UI States
  const [loadingMore, setLoadingMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [roleFilter, setRoleFilter] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<"" | "online" | "offline">(
    ""
  );
  const [exporting, setExporting] = useState(false);

  // Current Admin User State
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingCurrentUser, setLoadingCurrentUser] = useState(true);

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
    roleId: 0,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const limit = 20;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ✅ Fetch Users on Mount using Store
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch current user info from token or API
  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoadingCurrentUser(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.warn("No token found");
        setLoadingCurrentUser(false);
        return;
      }

      // Try to decode JWT token first
      try {
        const tokenParts = token.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));

          setCurrentUser({
            id: payload.userId || payload.id || payload.sub || "",
            role: payload.role || payload.userRole || payload.roles?.[0] || "",
            department:
              payload.departmentId ||
              payload.department ||
              localStorage.getItem("department") ||
              "",
            departmentName: payload.departmentName || payload.department || "",
            allocatedArea:
              payload.allocatedArea ||
              payload.zone ||
              localStorage.getItem("allocatedarea") ||
              "",
          });
        }
      } catch (decodeError) {
        console.warn("Could not decode token:", decodeError);
      }

      // ALSO try to fetch from API endpoint for more accurate data
      try {
        const response = await API.get("/auth/me");
        const userData = response.data?.data || response.data;
        if (userData) {
          setCurrentUser({
            id: userData.id || userData.userId || "",
            role: userData.role || userData.userRole || "",
            department: userData.departmentId || userData.department || "",
            departmentName:
              userData.departmentName || userData.department || "",
            allocatedArea: userData.allocatedArea || userData.zone || "",
          });
        }
      } catch (apiError) {
        console.warn("Could not fetch from /auth/me endpoint:", apiError);
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error);
    } finally {
      setLoadingCurrentUser(false);
    }
  }, []);

  // Helper function to normalize strings for comparison
  const normalizeString = (str: string | undefined): string => {
    if (!str) return "";
    return str.trim().toLowerCase().replace(/\s+/g, " ");
  };

  // Check if current user can edit a specific user
  const canEditUser = useCallback(
    (user: User): boolean => {
      if (!currentUser) return false;

      const userRole = currentUser.role;

      switch (userRole) {
        case "HR":
          return true;

        case "Manager":
          if (!currentUser.departmentName && !currentUser.department)
            return false;

          const managerDept = normalizeString(
            currentUser.departmentName || currentUser.department
          );
          const userDept = normalizeString(user.department);

          return managerDept === userDept;

        case "ZonalManager":
          return false;

        default:
          return false;
      }
    },
    [currentUser]
  );

  // Check if current user can view a specific user
  const canViewUser = useCallback(
    (user: User): boolean => {
      if (!currentUser) return false;
      const userRole = currentUser.role;

      switch (userRole) {
        case "HR":
          return true;

        case "Manager":
          if (!currentUser.departmentName && !currentUser.department)
            return false;
          const managerDept = normalizeString(
            currentUser.departmentName || currentUser.department
          );
          const userDept = normalizeString(user.department);
          return managerDept === userDept;

        case "ZonalManager":
          if (!currentUser.allocatedArea) return false;
          const managerZone = normalizeString(currentUser.allocatedArea);
          const userZone = normalizeString(user.allocatedArea);
          return managerZone === userZone;

        default:
          return true;
      }
    },
    [currentUser]
  );

  // ✅ Filter & Sort Logic (Using Store Data)
  // This replaces the backend filtering since we fetch all users once
  const filteredUsers = useMemo(() => {
    // 1. Cast generic store users to local User type if needed
    const storeUsers = users as unknown as User[];
    if (!storeUsers.length) return [];

    let result = [...storeUsers];

    // 2. Permission Filtering
    if (currentUser) {
      result = result.filter((user) => canViewUser(user));
    }

    // 3. Search Filtering
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(searchLower) ||
          user.name?.toLowerCase().includes(searchLower) ||
          user.employee_code?.toLowerCase().includes(searchLower) ||
          user.employee_code?.includes(searchTerm.trim())
      );
    }

    // 4. Role Filtering
    if (roleFilter !== "") {
      result = result.filter((user) => user.roleId === roleFilter);
    }

    // 5. Status Filtering
    if (statusFilter !== "") {
      result = result.filter((user) => {
        if (statusFilter === "online") return user.is_checkin;
        if (statusFilter === "offline") return !user.is_checkin;
        return true;
      });
    }

    // 6. Sorting
    result.sort((a, b) => {
      const nameA = (a.full_name || a.name || "").toLowerCase();
      const nameB = (b.full_name || b.name || "").toLowerCase();

      if (sortOrder === "asc") {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

    return result;
  }, [
    users,
    currentUser,
    canViewUser,
    searchTerm,
    roleFilter,
    statusFilter,
    sortOrder,
  ]);

  // ✅ Calculate Pagination from filtered results
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, limit]);

  // Update total pages when filtered list changes
  useEffect(() => {
    const totalFiltered = filteredUsers.length;
    setTotalUsersCount(totalFiltered);
    setTotalPages(Math.ceil(totalFiltered / limit));
    setHasMore(currentPage < Math.ceil(totalFiltered / limit));

    if (currentPage > Math.ceil(totalFiltered / limit)) {
      setCurrentPage(1);
    }
  }, [filteredUsers, currentPage, limit]);

  // Fetch Departments
  const fetchDepartments = useCallback(async () => {
    try {
      setLoadingDepartments(true);
      const response = await API.get("/departments/static_departments");
      if (response.data?.departments) {
        setDepartments(response.data.departments);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

  // Fetch Roles
  const fetchRoles = useCallback(async () => {
    try {
      setLoadingRoles(true);
      const response = await API.get("/roles/static_roles");
      if (response.data?.roles) {
        setRoles(response.data.roles);
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  // Function to export users to Excel
  const exportToExcel = async () => {
    try {
      setExporting(true);
      const usersToExport = filteredUsers;

      if (usersToExport.length === 0) {
        alert("No users to export");
        return;
      }

      const excelData = usersToExport.map((user: User, index: number) => ({
        "Sr. No": index + 1,
        "Employee Code": user.employee_code || "N/A",
        "Full Name": user.full_name || user.name || "N/A",
        Username: user.username || "N/A",
        Email: user.email || "N/A",
        Role: user.role || "N/A",
        Department: user.department || "N/A",
        "Allocated Area": user.allocatedArea || "N/A",
        "Mobile Number": user.mobileNo || "N/A",
        Status: user.is_checkin ? "Online" : "Offline",
        "Date Joined": user.date
          ? new Date(user.date).toLocaleDateString()
          : "N/A",
        Address: user.address || "N/A",
        "Birth Date": user.birthDate
          ? new Date(user.birthDate).toLocaleDateString()
          : "N/A",
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

      const maxWidth = excelData.reduce(
        (w, r) => Math.max(w, Object.values(r).join("").length),
        10
      );
      worksheet["!cols"] = [{ wch: maxWidth }];

      const fileName = `users_export_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(workbook, fileName);

      alert(`Exported ${usersToExport.length} users to ${fileName}`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export users. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // Initial Data Load
  useEffect(() => {
    fetchCurrentUser();
    fetchDepartments();
    fetchRoles();
  }, [fetchCurrentUser, fetchDepartments, fetchRoles]);

  // Handle edit button click
  const handleEditClick = async (user: User) => {
    if (!canEditUser(user)) {
      alert("You don't have permission to edit this user.");
      return;
    }

    setSelectedUser(user);
    const userId = user.id || user.userId;

    try {
      // Fetch fresh details for editing
      const response = await API.get(`/admin/users/${userId}`);
      const userDetails = response.data?.data || response.data;

      let departmentId = 0;
      if (userDetails.department) {
        const dept = departments.find(
          (d) => d.name.toLowerCase() === userDetails.department.toLowerCase()
        );
        departmentId = dept?.departmentId || 0;
      }

      let roleId = user.roleId || 0;
      if (userDetails.role) {
        const role = roles.find(
          (r) => r.name.toLowerCase() === userDetails.role.toLowerCase()
        );
        roleId = role?.id || user.roleId || 0;
      }

      setEditForm({
        full_name:
          userDetails.full_name || userDetails.name || user.full_name || "",
        username: userDetails.username || user.username || user.name || "",
        email: userDetails.email || user.email || "",
        mobileNo: userDetails.mobileNo || user.mobileNo || "",
        address: userDetails.address || user.address || "",
        allocatedArea: userDetails.allocatedArea || user.allocatedArea || "",
        birthDate: userDetails.birthDate
          ? new Date(userDetails.birthDate).toISOString().split("T")[0]
          : "",
        profileImageUrl:
          userDetails.profileImageUrl ||
          userDetails.profile_image ||
          user.profile_image ||
          "",
        departmentId: departmentId,
        roleId: roleId,
      });
    } catch (error) {
      console.error("Failed to fetch user details, using list data:", error);
      // Fallback
      const department = departments.find(
        (dept) => dept.name.toLowerCase() === user.department?.toLowerCase()
      );
      const role = roles.find(
        (r) =>
          r.name.toLowerCase() === user.role?.toLowerCase() ||
          r.id === user.roleId
      );

      setEditForm({
        full_name: user.full_name || "",
        username: user.username || user.name || "",
        email: user.email || "",
        mobileNo: user.mobileNo || "",
        address: user.address || "",
        allocatedArea: user.allocatedArea || "",
        birthDate: user.birthDate
          ? new Date(user.birthDate).toISOString().split("T")[0]
          : "",
        profileImageUrl: user.profile_image || user.profileImageUrl || "",
        departmentId: department?.departmentId || 0,
        roleId: role?.id || user.roleId || 0,
      });
    }

    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]:
        name === "departmentId" || name === "roleId"
          ? parseInt(value) || 0
          : value,
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!canEditUser(selectedUser)) {
      alert("You don't have permission to edit this user.");
      return;
    }

    const userId = selectedUser.id || selectedUser.userId;
    setIsEditing(true);

    try {
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
        roleId: Number(editForm.roleId),
      };

      const response = await API.put(`/admin/users/${userId}`, updateData);
      const result = response.data;

      if (result.success) {
        alert("User updated successfully!");
        setIsEditModalOpen(false);

        // ✅ REFRESH STORE: Invalidate cache and re-fetch to show updated data
        resetStore();
        fetchUsers();
      } else {
        alert(result.message || "Failed to update user");
      }
    } catch (error: any) {
      console.error("Error updating user:", error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to update user";
      alert(`Error: ${msg}`);
    } finally {
      setIsEditing(false);
    }
  };

  // Infinite Scroll Observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loadingMore) {
          setCurrentPage((prev) => prev + 1);
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

  // Handlers for Filters
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("");
    setStatusFilter("");
  };

  const handleRowClick = (user: User) => {
    if (!canViewUser(user)) {
      alert("You don't have permission to view this user.");
      return;
    }
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    // Reset form
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
      roleId: 0,
    });
  };

  const handleGoToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
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
            min-w-8 h-8 px-2 mx-1 rounded-lg sm:rounded-xl
            text-xs font-medium transition-all duration-300
            ${
              currentPage === i
                ? "bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-md"
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
            ${
              currentPage === 1
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
            ${
              currentPage === 1
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
            ${
              currentPage === totalPages
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
            ${
              currentPage === totalPages
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

  const getUserKey = (user: User, index: number): string => {
    const userId = user.id || user.userId;
    const baseKey = userId || `user-${index}`;
    const pageIndex = (currentPage - 1) * limit + index;
    return `${baseKey}-${pageIndex}`;
  };

  // Show loading for current user info
  if (loadingCurrentUser) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-300">
          Loading user info...
        </span>
      </div>
    );
  }

  return (
    <div
      className="
      w-full max-w-full mx-auto
      px-2 sm:px-3 md:px-4
      rounded-2xl sm:rounded-3xl
      bg-linear-to-br from-white/20 via-white/10 to-white/5
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
    "
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
      <div className="relative z-10 flex flex-col h-full">
        <h2
          className="
          text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-center
          text-dark
          bg-clip-text 
          px-2
        "
        >
          Users Directory
        </h2>

        {/* Filter Section */}
        <div
          className="
          bg-linear-to-br from-white/40 to-white/20
          dark:from-gray-800/40 dark:to-gray-900/20
          backdrop-blur-xl
          border border-white/40 dark:border-gray-700/40
          rounded-xl sm:rounded-2xl p-2 sm:p-3 mb-3 sm:mb-4
          shadow-[0_4px_20px_rgba(0,0,0,0.1)]
          dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]
          shrink-0
        "
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
            {/* Search Input */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Users (Name or Employee Code)
              </label>
              <div className="relative">
                <div
                  className="
                  absolute left-2 top-1/2 transform -translate-y-1/2
                  p-1 rounded
                  bg-white/50 dark:bg-gray-700/50
                  backdrop-blur-sm
                "
                >
                  <svg
                    className="h-3 w-3 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
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

            {/* Role Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => {
                  const value =
                    e.target.value === "" ? "" : Number(e.target.value);
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
                  bg-no-repeat bg-position-[right_0.5rem_center] bg-size-[0.75em]
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23999' viewBox='0 0 256 256'%3E%3Cpath d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z'%3E%3C/path%3E%3C/svg%3E")`,
                }}
              >
                <option value="">All Roles</option>
                {loadingRoles ? (
                  <option value="" disabled>
                    Loading roles...
                  </option>
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
                  bg-no-repeat bg-position-[right_0.5rem_center] bg-size-[0.75em]
                "
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23999' viewBox='0 0 256 256'%3E%3Cpath d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z'%3E%3C/path%3E%3C/svg%3E")`,
                }}
              >
                <option value="">All Status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>

          {/* Actions: Clear & Export */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div
              className="
              text-xs text-gray-600 dark:text-gray-300
              px-2 py-1 rounded
              bg-white/40 dark:bg-gray-700/40
              backdrop-blur-sm
              whitespace-nowrap
            "
            >
              Showing {paginatedUsers.length} of {filteredUsers.length} filtered
              users • Page {currentPage} of {totalPages}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={clearFilters}
                className="
                  px-3 py-1.5
                  bg-linear-to-r from-white/40 to-white/20
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
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Clear Filters
              </button>

              <button
                onClick={exportToExcel}
                disabled={exporting || filteredUsers.length === 0}
                className="
                  px-3 py-1.5
                  bg-linear-to-r from-green-500/80 to-green-600/80
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
                    <svg
                      className="animate-spin -ml-1 mr-1 h-3 w-3 text-white"
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
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
          {/* ✅ Check store isLoading instead of local loading */}
          {isLoading && users.length === 0 ? (
            <div
              className="
              flex flex-col justify-center items-center py-8 sm:py-12
              bg-linear-to-br from-white/30 to-white/10
              dark:from-gray-800/30 dark:to-gray-900/10
              backdrop-blur-lg
              rounded-xl sm:rounded-2xl border border-white/40 dark:border-gray-700/40
              text-center
              flex-1
            "
            >
              <div
                className="
                animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-500
                backdrop-blur-sm mb-2 sm:mb-3
              "
              ></div>
              <span className="text-gray-600 dark:text-gray-300 text-sm">
                Loading users...
              </span>
            </div>
          ) : (
            <>
              {/* Debug info for Manager */}
              {currentUser?.role === "Manager" &&
                filteredUsers.length === 0 &&
                users.length > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm font-medium">
                      ⚠️ No users found in your department.
                    </p>
                    <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">
                      Your department:{" "}
                      <strong>
                        {currentUser.departmentName ||
                          currentUser.department ||
                          "Not set"}
                      </strong>
                    </p>
                    <p className="text-yellow-600 dark:text-yellow-400 text-xs">
                      Total users in system: {users.length}
                    </p>
                  </div>
                )}

              {/* Users Table Container with Scroll */}
              <div
                ref={scrollContainerRef}
                className="
                  overflow-hidden rounded-xl sm:rounded-2xl
                  bg-linear-to-br from-white/40 to-white/20
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
                    {/* Table Header */}
                    <div className="shrink-0 sticky top-0 z-10">
                      <div
                        className="
                        grid grid-cols-[40px_1fr_120px_1fr_100px_120px_120px_80px]
                        px-2 py-2
                        bg-linear-to-r from-white/60 to-white/40
                        dark:from-gray-800/60 dark:to-gray-900/40
                        backdrop-blur-lg
                        border-b border-white/30 dark:border-gray-700/30
                      "
                      >
                        <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                          Sr.no
                        </div>
                        <div
                          className="px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-white/30 dark:hover:bg-gray-800/30 transition-colors duration-300 whitespace-nowrap"
                          onClick={toggleSortOrder}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Name</span>
                            <span className="text-blue-600 dark:text-blue-400 text-xs bg-blue-100/50 dark:bg-blue-900/30 rounded-full p-0.5">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          </div>
                        </div>
                        <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell whitespace-nowrap">
                          Employee Code
                        </div>
                        <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell whitespace-nowrap">
                          Email
                        </div>
                        <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                          Role
                        </div>
                        <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                          Allocated Area
                        </div>
                        <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell whitespace-nowrap">
                          Department
                        </div>
                        <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                          Actions
                        </div>
                      </div>
                    </div>

                    {/* Table Body */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="divide-y divide-white/20 dark:divide-gray-700/20">
                        {paginatedUsers.length > 0 ? (
                          paginatedUsers.map((user, index) => {
                            const userKey = getUserKey(user, index);
                            const canEdit = canEditUser(user);

                            return (
                              <div
                                key={userKey}
                                className="
                                  grid grid-cols-[40px_1fr_120px_1fr_100px_120px_120px_80px]
                                  px-2 py-2
                                  hover:bg-white/30 dark:hover:bg-gray-800/30
                                  transition-all duration-300
                                  backdrop-blur-sm
                                "
                              >
                                <div
                                  onClick={() => handleRowClick(user)}
                                  className="px-1 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100 cursor-pointer"
                                >
                                  {(currentPage - 1) * limit + index + 1}
                                </div>
                                <div
                                  onClick={() => handleRowClick(user)}
                                  className="py-2 whitespace-nowrap cursor-pointer"
                                >
                                  <div className="flex items-center">
                                    <div className="shrink-0">
                                      <div className="h-8 w-8 rounded-lg bg-linear-to-r from-blue-500 to-black-900 dark:from-blue-400 dark:to-black-900 flex items-center justify-center text-white text-sm font-bold">
                                        {user.full_name
                                          ?.charAt(0)
                                          .toUpperCase() ||
                                          user.name?.charAt(0).toUpperCase() ||
                                          "?"}
                                      </div>
                                    </div>
                                    <div className="min-w-0 flex-1 ml-2">
                                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate leading-tight">
                                        <span className="inline-flex items-center">
                                          <span className="bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent font-bold">
                                            {user.full_name?.charAt(0) ||
                                              user.name?.charAt(0) ||
                                              ""}
                                          </span>
                                          <span className="text-gray-900 dark:text-gray-100 ml-0">
                                            {user.full_name?.slice(1) ||
                                              user.name?.slice(1) ||
                                              "N/A"}
                                          </span>
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400 sm:hidden truncate leading-tight mt-0.5">
                                        {user.employee_code || "N/A"}
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400 lg:hidden truncate leading-tight mt-0.5">
                                        {user.email || "N/A"}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div
                                  onClick={() => handleRowClick(user)}
                                  className="px-1 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100 hidden sm:table-cell cursor-pointer"
                                >
                                  <div className="bg-white/40 dark:bg-gray-800/40 rounded px-2 py-1.5 backdrop-blur-sm truncate">
                                    {user.employee_code || "N/A"}
                                  </div>
                                </div>
                                <div
                                  onClick={() => handleRowClick(user)}
                                  className="px-1 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400 hidden lg:table-cell cursor-pointer"
                                >
                                  <div className="truncate bg-white/40 dark:bg-gray-800/40 rounded px-2 py-1.5 backdrop-blur-sm">
                                    {user.email || "N/A"}
                                  </div>
                                </div>
                                <div
                                  onClick={() => handleRowClick(user)}
                                  className="px-1 py-2 whitespace-nowrap cursor-pointer"
                                >
                                  <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-100/50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 backdrop-blur-sm truncate">
                                    {user.role}
                                  </span>
                                </div>
                                <div
                                  onClick={() => handleRowClick(user)}
                                  className="px-1 py-2 whitespace-nowrap cursor-pointer"
                                >
                                  <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-green-100/50 dark:bg-green-900/30 text-green-800 dark:text-green-300 backdrop-blur-sm truncate">
                                    {user.allocatedArea || "N/A"}
                                  </span>
                                </div>
                                <div
                                  onClick={() => handleRowClick(user)}
                                  className="px-1 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400 hidden md:table-cell cursor-pointer"
                                >
                                  <div className="truncate bg-white/40 dark:bg-gray-800/40 rounded px-2 py-1.5 backdrop-blur-sm">
                                    {user.department || "N/A"}
                                  </div>
                                </div>
                                <div className="px-1 py-2 whitespace-nowrap flex items-center">
                                  <button
                                    onClick={() => handleEditClick(user)}
                                    disabled={!canEdit}
                                    className={`
                                      px-3 py-1.5 rounded-lg text-xs font-medium
                                      transition-all duration-300
                                      ${
                                        canEdit
                                          ? "bg-blue-500/80 hover:bg-blue-600/80 text-white cursor-pointer"
                                          : "bg-gray-300/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                      }
                                      flex items-center justify-center
                                    `}
                                    title={
                                      canEdit
                                        ? "Edit user"
                                        : "No permission to edit"
                                    }
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="col-span-8 px-2 py-6 text-center bg-linear-to-br from-white/30 to-white/10 dark:from-gray-800/30 dark:to-gray-900/10">
                            <div className="p-4 rounded-xl bg-linear-to-br from-white/40 to-white/20 dark:from-gray-800/40 dark:to-gray-900/20 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 inline-block max-w-[90%]">
                              <div className="w-12 h-12 mx-auto mb-3 bg-linear-to-br from-gray-200/50 to-gray-300/30 dark:from-gray-700/50 dark:to-gray-800/30 backdrop-blur-sm border border-gray-300/60 dark:border-gray-600/60 rounded-xl flex items-center justify-center">
                                <svg
                                  className="w-6 h-6 text-gray-400 dark:text-gray-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                  />
                                </svg>
                              </div>
                              <p className="text-sm font-medium bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                                No users found
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {currentUser?.role === "Manager"
                                  ? `No users found in your department (${
                                      currentUser.departmentName ||
                                      currentUser.department ||
                                      "Not set"
                                    })`
                                  : currentUser?.role === "ZonalManager"
                                  ? `No users found in your zone (${
                                      currentUser.allocatedArea || "Not set"
                                    })`
                                  : "Try adjusting your search or filter criteria"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Infinite scroll sentinel */}
                      <div ref={sentinelRef} className="h-1"></div>

                      {/* Loading more indicator */}
                      {loadingMore && (
                        <div className="flex justify-center items-center py-3 bg-linear-to-br from-white/30 to-white/10 dark:from-gray-800/30 dark:to-gray-900/10 backdrop-blur-lg rounded-xl border border-white/40 dark:border-gray-700/40 my-2 mx-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 backdrop-blur-sm mr-2"></div>
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
          <div className="bg-white dark:bg-gray-900 w-full h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  User Details
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ID: {selectedUser.id || selectedUser.userId || "N/A"}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="mb-8">
                  <div className="flex items-center space-x-4">
                    {selectedUser.profile_image ||
                    selectedUser.profileImageUrl ? (
                      <img
                        src={
                          selectedUser.profile_image ||
                          selectedUser.profileImageUrl
                        }
                        alt={
                          selectedUser.full_name || selectedUser.name || "N/A"
                        }
                        className="w-24 h-24 rounded-xl object-cover border-2 border-gray-300 dark:border-gray-700"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-linear-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                        {(
                          selectedUser.name?.charAt(0) ||
                          selectedUser.full_name?.charAt(0) ||
                          "?"
                        ).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {selectedUser.full_name || selectedUser.name || "N/A"}
                      </h3>
                      <p className="text-base text-gray-500 dark:text-gray-400 mt-1">
                        {selectedUser.employee_code || "No employee code"}
                      </p>
                    </div>
                  </div>
                </div>

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
                          {selectedUser.full_name || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-gray-900 dark:text-white text-base">
                          {selectedUser.email || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Mobile Number
                      </label>
                      <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-gray-900 dark:text-white text-base">
                          {selectedUser.mobileNo || "Not specified"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Birth Date
                      </label>
                      <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-gray-900 dark:text-white text-base">
                          {selectedUser.birthDate
                            ? new Date(
                                selectedUser.birthDate
                              ).toLocaleDateString()
                            : "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

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
                          {selectedUser.allocatedArea || "NA"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                          {selectedUser.department || "NA"}
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
                          <span
                            className={`w-3 h-3 rounded-full mr-3 ${
                              selectedUser.is_checkin
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          ></span>
                          <p
                            className={`font-medium text-base ${
                              selectedUser.is_checkin
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
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
                          {selectedUser.date
                            ? new Date(selectedUser.date).toLocaleDateString()
                            : "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0">
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-base"
                >
                  Close
                </button>
                {canEditUser(selectedUser) ? (
                  <button
                    type="button"
                    onClick={() => handleEditClick(selectedUser)}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center min-w-[140px] text-base"
                  >
                    Edit User
                  </button>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 px-4 py-2 italic">
                    No permission to edit this user
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && canEditUser(selectedUser) && (
        <div className="fixed inset-0 z-50 bg-black/70">
          <div className="bg-white dark:bg-gray-900 w-full h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Edit User
                </h2>
              </div>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleEditSubmit}
              className="flex-1 overflow-y-auto"
            >
              <div className="p-6">
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
                          <p className="text-gray-500 dark:text-gray-400">
                            Loading departments...
                          </p>
                        </div>
                      ) : departments.length === 0 ? (
                        <div className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                          <p className="text-red-600 dark:text-red-400">
                            Failed to load departments. Please refresh.
                          </p>
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
                            <option
                              key={`dept-${dept.departmentId}`}
                              value={dept.departmentId}
                            >
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
                          <p className="text-gray-500 dark:text-gray-400">
                            Loading roles...
                          </p>
                        </div>
                      ) : roles.length === 0 ? (
                        <div className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                          <p className="text-red-600 dark:text-red-400">
                            Failed to load roles. Please refresh.
                          </p>
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

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0">
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
                  disabled={
                    isEditing ||
                    loadingDepartments ||
                    loadingRoles ||
                    departments.length === 0 ||
                    roles.length === 0
                  }
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                >
                  {isEditing ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
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
