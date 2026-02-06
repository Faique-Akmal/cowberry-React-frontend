import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useUserStore } from "../../store/useUserStore";
import { useZoneStore } from "../../store/useZoneStore";
import API from "../../api/axios";

import PageMeta from "../../components/common/PageMeta";
import {
  getUniqueDepartments,
  getUniqueZones,
  normalizeString, // ADD THIS IMPORT
  normalizeRole, // ADD THIS IMPORT
} from "../../utils/user.helpers";

// Import types and hooks
import {
  User,
  CurrentUser,
  Department,
  Role,
  Zone,
  EditUserForm,
  FilterState,
  PaginationState,
} from "../../types/user.types";

import LoadingAnimation from "../../pages/UiElements/loadingAnimation";

// import FilterSection from "../../pages/UserList/filterSection";
// import UserTable from "../../pages/UserList/userTable";
// import Pagination from "../../pages/UserList/pagination";
import EditUserModal from "../../pages/UserList/EditUserModal";
import DeleteUserModal from "../../pages/UserList/DeleteUserModal"; // ADD THIS IMPORT
import { useUserFilters } from "../../hooks/useUserFilters";
import { useUserPermissions } from "../../hooks/useUserPermissions";
import UserCard from "../../pages/UserList/UserCard";
import UserDetailsModal from "../../pages/UserList/UserDetailsModal";
import Pagination from "../../pages/UserList/Pagination";
import UserTable from "../../pages/UserList/UserTable";
import FilterSection from "../../pages/UserList/FilterSection";

const UserList: React.FC = () => {
  // ✅ Access Store States & Actions
  const { users, fetchUsers, isLoading, resetStore } = useUserStore();
  const { zones, fetchZones } = useZoneStore();

  // Local UI States
  const [loadingMore, setLoadingMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Filter States
  const [filterState, setFilterState] = useState<FilterState>({
    searchTerm: "",
    sortOrder: "asc",
    roleFilter: "",
    departmentFilter: "",
    zoneFilter: "",
    statusFilter: "",
  });

  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    departmentName: "",
    zoneId: "",
    zoneName: "",
    allocatedArea: "",
    roleId: 0,
    roleName: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);

  // Pagination states
  const [paginationState, setPaginationState] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalUsersCount: 0,
    hasMore: true,
    limit: 20,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Get derived values
  const { limit, currentPage, totalPages, hasMore } = paginationState;

  // Helper functions - REMOVE THE DUPLICATE ONES AT THE TOP
  const getZoneArea = useCallback(
    (zoneId: string): string => {
      if (!zoneId) return "Not Assigned";
      const zone = zones.find((z: Zone) => z.zoneId === zoneId);
      return zone ? zone.area : "Area Not Found";
    },
    [zones],
  );

  const getZoneName = useCallback(
    (zoneId: string): string => {
      if (!zoneId) return "Not Assigned";
      const zone = zones.find((z: Zone) => z.zoneId === zoneId);
      return zone ? zone.name : "Zone Not Found";
    },
    [zones],
  );

  const getAllocatedArea = useCallback(
    (user: User): string => {
      if (user.allocatedArea && user.allocatedArea.trim() !== "") {
        return user.allocatedArea;
      }
      if (user.zoneId) {
        return getZoneArea(user.zoneId);
      }
      return "Not Assigned";
    },
    [getZoneArea],
  );

  const getUserKey = (user: User, index: number): string => {
    const userId = user.id || user.userId;
    const baseKey = userId || `user-${index}`;
    const pageIndex = (currentPage - 1) * limit + index;
    return `${baseKey}-${pageIndex}`;
  };

  // Hooks
  const filteredUsers = useUserFilters(users, currentUser, filterState);
  const { canEditUser, canDeleteUser, canViewUser } =
    useUserPermissions(currentUser);

  // Unique values for filters
  const uniqueDepartments = useMemo(
    () => getUniqueDepartments(filteredUsers),
    [filteredUsers],
  );
  const uniqueZones = useMemo(
    () => getUniqueZones(filteredUsers),
    [filteredUsers],
  );

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, limit]);

  // Fetch current user info
  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoadingCurrentUser(true);
      const localId = localStorage.getItem("userId");
      const localRole = localStorage.getItem("userRole");
      const localDepartment = localStorage.getItem("department");
      const localDepartmentId = localStorage.getItem("departmentId");
      const localAllocatedArea = localStorage.getItem("allocatedarea");
      const localZoneId = localStorage.getItem("zoneId");

      if (localId && localRole) {
        setCurrentUser({
          id: localId,
          role: normalizeRole(localRole), // Use normalizeRole here
          department: localDepartment || undefined,
          departmentName: localDepartment || undefined,
          allocatedArea: localAllocatedArea || undefined,
          zoneId: localZoneId || undefined,
        });
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error);
    } finally {
      setLoadingCurrentUser(false);
    }
  }, []);

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

  // Enhanced fetchUsers function
  const fetchUsersWithDetails = useCallback(async () => {
    try {
      setLoadingMore(true);
      const response = await API.get("/admin/users", {
        params: {
          page: currentPage,
          limit: limit,
          includeDetails: true,
        },
      });

      if (response.data?.success && response.data?.data) {
        const usersData = response.data.data.map((user: any) => {
          const zoneData = user.zone || {};
          return {
            id: user.id?.toString() || user.userId?.toString() || "",
            userId: user.userId?.toString() || user.id?.toString() || "",
            name: user.name || user.username || "",
            full_name:
              user.fullName ||
              user.full_name ||
              user.name ||
              user.username ||
              "",
            employee_code: user.employeeCode || user.employee_code || "",
            username: user.username || "",
            email: user.email || "",
            role: user.role?.name || user.role || "",
            roleId: user.roleId || user.role?.id || 0,
            is_checkin: user.is_checkin || user.isCheckin || false,
            department: user.department?.name || user.department || "",
            departmentId: user.departmentId || user.department?.id || 0,
            profile_image: user.profileImageUrl || user.profile_image || "",
            date: user.createdAt || user.date || "",
            is_online: user.is_online || user.isOnline || false,
            allocatedArea: user.allocatedArea || zoneData.area || "",
            mobileNo: user.mobileNo || user.mobile || "",
            address: user.address || "",
            birthDate: user.birthDate || "",
            profileImageUrl: user.profileImageUrl || user.profile_image || "",
            zoneId: zoneData.zoneId || user.zoneId || "",
            zoneName: zoneData.name || user.zoneName || "",
            hrManagerId: user.hrManagerId || null,
            reporteeId: user.reporteeId || null,
            hrManager: user.hrManager || null,
            reportee: user.reportee || null,
            zone: zoneData.id
              ? {
                  id: zoneData.id,
                  zoneId: zoneData.zoneId || "",
                  name: zoneData.name || "",
                  area: zoneData.area || "",
                  city: zoneData.city || "",
                  state: zoneData.state || "",
                  pincode: zoneData.pincode || "",
                  description: zoneData.description || "",
                }
              : null,
          };
        });

        useUserStore.setState({
          users: usersData,
          isLoading: false,
        });

        // Update pagination info
        if (response.data.pagination) {
          setPaginationState((prev) => ({
            ...prev,
            totalPages: response.data.pagination.totalPages || 1,
            totalUsersCount:
              response.data.pagination.totalItems || usersData.length,
            hasMore: response.data.pagination.hasNextPage || false,
          }));
        }
      } else {
        console.error("No data in response:", response.data);
        useUserStore.setState({ isLoading: false });
      }
    } catch (error) {
      console.error("Failed to fetch users with details:", error);
      useUserStore.setState({ isLoading: false });
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, limit]);

  // ✅ Fetch Users on Mount using enhanced function
  useEffect(() => {
    fetchUsersWithDetails();
  }, [fetchUsersWithDetails]);

  // ✅ Fetch Zones on Mount
  useEffect(() => {
    const loadZones = async () => {
      try {
        setLoadingZones(true);
        await fetchZones({ page: 1, limit: 100 });
      } catch (error) {
        console.error("Failed to fetch zones:", error);
      } finally {
        setLoadingZones(false);
      }
    };
    loadZones();
  }, [fetchZones]);

  // Initial Data Load
  useEffect(() => {
    fetchCurrentUser();
    fetchDepartments();
    fetchRoles();
  }, [fetchCurrentUser, fetchDepartments, fetchRoles]);

  // Update total pages when filtered list changes
  useEffect(() => {
    const totalFiltered = filteredUsers.length;
    setPaginationState((prev) => ({
      ...prev,
      totalUsersCount: totalFiltered,
      totalPages: Math.ceil(totalFiltered / limit),
      hasMore: currentPage < Math.ceil(totalFiltered / limit),
    }));

    if (currentPage > Math.ceil(totalFiltered / limit)) {
      setPaginationState((prev) => ({ ...prev, currentPage: 1 }));
    }
  }, [filteredUsers, currentPage, limit]);

  // Event Handlers
  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilterState((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilterState({
      searchTerm: "",
      sortOrder: "asc",
      roleFilter: "",
      departmentFilter: "",
      zoneFilter: "",
      statusFilter: "",
    });
  };

  const handleToggleSortOrder = () => {
    setFilterState((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setPaginationState((prev) => ({ ...prev, currentPage: page }));
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  // In your UserList component, update the handleRowClick function to fetch user details:
  const handleRowClick = async (user: User) => {
    if (!canViewUser(user)) {
      alert("You don't have permission to view this user.");
      return;
    }

    try {
      // Fetch fresh user details from API
      const userId = user.id || user.userId;
      const response = await API.get(`/admin/users/${userId}`);

      if (response.data?.success && response.data?.data) {
        const userData = response.data.data;

        // Map the API response to your User type
        const detailedUser: User = {
          id: userData.id?.toString() || userData.userId?.toString() || "",
          userId: userData.userId?.toString() || userData.id?.toString() || "",
          name: userData.name || userData.username || "",
          full_name:
            userData.fullName || userData.full_name || userData.name || "",
          employee_code: userData.employeeCode || userData.employee_code || "",
          username: userData.username || "",
          email: userData.email || "",
          role: userData.role?.name || userData.role || "",
          roleId: userData.roleId || userData.role?.id || 0,
          is_checkin: userData.is_checkin || userData.isCheckin || false,
          department: userData.department?.name || userData.department || "",
          departmentId: userData.departmentId || userData.department?.id || 0,
          profile_image:
            userData.profileImageUrl || userData.profile_image || "",
          date: userData.createdAt || userData.date || "",
          is_online: userData.is_online || userData.isOnline || false,
          allocatedArea: userData.allocatedArea || "",
          mobileNo: userData.mobileNo || userData.mobile || "",
          address: userData.address || "",
          birthDate: userData.birthDate || "",
          profileImageUrl:
            userData.profileImageUrl || userData.profile_image || "",
          zoneId: userData.zone?.zoneId || userData.zoneId || "",
          zoneName: userData.zone?.name || userData.zoneName || "",
          hrManagerId: user.hrManagerId,
          reporteeId: user.reporteeId,
          hrManager: user.hrManager || null,
          reportee: user.reportee || null,

          zone: userData.zone || null,
        };

        setSelectedUser(detailedUser);
        setIsModalOpen(true);
      } else {
        throw new Error("Failed to fetch user details");
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      // Fallback to basic user data
      setSelectedUser(user);
      setIsModalOpen(true);
    }
  };

  // Handle edit button click - IMPROVED with zone fetching
  const handleEditClick = async (user: User) => {
    if (!canEditUser(user)) {
      alert("You don't have permission to edit this user.");
      return;
    }

    setSelectedUser(user);

    try {
      // Fetch fresh user data from API
      const userId = user.id || user.userId;
      const response = await API.get(`/admin/users/${userId}`);

      if (response.data?.success && response.data?.data) {
        const userData = response.data.data;

        // Extract department information
        let departmentId = 0;
        let departmentName =
          userData.department?.name || userData.department || "";

        if (departmentName && departments.length === 0) {
          await fetchDepartments();
        }

        if (departmentName && departments.length > 0) {
          const dept = departments.find(
            (d) => d.name.toLowerCase() === departmentName.toLowerCase(),
          );
          departmentId = dept?.departmentId || 0;
        }

        // Extract role information
        let roleId = 0;
        let roleName = userData.role?.name || userData.role || "";

        if (roleName && roles.length === 0) {
          await fetchRoles();
        }

        if (roleName && roles.length > 0) {
          const role = roles.find(
            (r) => r.name.toLowerCase() === roleName.toLowerCase(),
          );
          roleId = role?.id || 0;
        }

        // Extract zone information
        const zoneData = userData.zone || {};
        const zoneId = zoneData.zoneId || userData.zoneId || "";
        const zoneDatabaseId = zoneData.id || userData.zone?.id || 0; // Get the integer ID
        let zoneName = zoneData.name || userData.zoneName || "";
        let allocatedArea = userData.allocatedArea || "";

        // If we have zoneId but zones not loaded, fetch zones
        if (zoneId && zones.length === 0) {
          await fetchZones({ page: 1, limit: 100 });
        }

        // If we have zoneId but not zoneName, get it from zones
        if (zoneId && !zoneName && zones.length > 0) {
          const zone = zones.find((z: Zone) => z.zoneId === zoneId);
          if (zone) {
            zoneName = zone.name;
            // Only set allocatedArea from zone if user doesn't have one
            if (!allocatedArea.trim()) {
              allocatedArea = zone.area;
            }
          }
        }

        // Prepare the edit form with fresh API data
        setEditForm({
          full_name:
            userData.fullName || userData.full_name || userData.name || "",
          username: userData.username || "",
          email: userData.email || "",
          mobileNo: userData.mobileNo || userData.mobile || "",
          address: userData.address || "",
          allocatedArea: allocatedArea,
          zoneId: zoneId,
          zoneDatabaseId: zoneDatabaseId, // Make sure this is set correctly
          zoneName: zoneName,
          birthDate: userData.birthDate
            ? new Date(userData.birthDate).toISOString().split("T")[0]
            : "",
          profileImageUrl:
            userData.profileImageUrl || userData.profile_image || "",
          departmentId: departmentId,
          HRMANAGERId: userData.hrManagerId || 0,
          departmentName: departmentName,
          roleId: roleId,
          roleName: roleName,
        });
      } else {
        throw new Error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Failed to prepare edit form:", error);
      // Fallback to existing user data
      setEditForm({
        full_name: user.full_name || user.name || "",
        username: user.username || "",
        email: user.email || "",
        mobileNo: user.mobileNo || "",
        address: user.address || "",
        allocatedArea: user.allocatedArea || "",
        zoneId: user.zoneId || "",
        zoneDatabaseId: user.zoneDatabaseId || 0,
        zoneName: user.zoneName || "",
        birthDate: user.birthDate
          ? new Date(user.birthDate).toISOString().split("T")[0]
          : "",
        profileImageUrl: user.profileImageUrl || user.profile_image || "",
        departmentId: 0,
        departmentName: user.department || "",
        roleId: 0,
        roleName: user.role || "",
      });
    }

    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    if (!canDeleteUser(user)) {
      alert("You don't have permission to delete this user.");
      return;
    }

    if (
      currentUser &&
      (currentUser.id === user.id || currentUser.id === user.userId)
    ) {
      alert("You cannot delete yourself.");
      return;
    }

    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    if (!canDeleteUser(selectedUser)) {
      alert("You don't have permission to delete this user.");
      setIsDeleteModalOpen(false);
      return;
    }

    if (
      currentUser &&
      (currentUser.id === selectedUser.id ||
        currentUser.id === selectedUser.userId)
    ) {
      alert("You cannot delete yourself.");
      setIsDeleteModalOpen(false);
      return;
    }

    setDeleting(true);
    try {
      const userId = selectedUser.id || selectedUser.userId;
      const response = await API.delete(`/admin/users/${userId}`);

      if (response.data?.success) {
        alert("User deleted successfully!");
        setIsDeleteModalOpen(false);

        // Refresh data from API
        await fetchUsersWithDetails();
      } else {
        alert(response.data?.message || "Failed to delete user");
      }
    } catch (error: any) {
      console.error("Error deleting user:", error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete user";
      alert(`Error: ${msg}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleEditFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name === "zoneId") {
      // When zoneId changes, update zoneDatabaseId and zoneName
      const selectedZone = zones.find((z: Zone) => z.zoneId === value);
      setEditForm((prev) => ({
        ...prev,
        zoneId: value,
        zoneDatabaseId: selectedZone ? selectedZone.id : 0, // Make sure this is set
        zoneName: selectedZone ? selectedZone.name : prev.zoneName,
        // Do NOT update allocatedArea automatically - keep it separate
      }));
    } else if (name === "departmentId") {
      const selectedDept = departments.find(
        (d) => d.departmentId === parseInt(value),
      );
      setEditForm((prev) => ({
        ...prev,
        departmentId: parseInt(value) || 0,
        departmentName: selectedDept ? selectedDept.name : prev.departmentName,
      }));
    } else if (name === "roleId") {
      const selectedRole = roles.find((r) => r.id === parseInt(value));
      setEditForm((prev) => ({
        ...prev,
        roleId: parseInt(value) || 0,
        roleName: selectedRole ? selectedRole.name : prev.roleName,
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // FIXED: Updated handleEditSubmit to send correct zoneId (integer)
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
      // Create update data object
      const updateData: any = {
        username: editForm.username?.trim(),
        full_name: editForm.full_name.trim(), // Changed from fullName to full_name
        email: editForm.email.trim(),
        mobileNo: editForm.mobileNo.trim(),
        address: editForm.address.trim(),
        allocatedArea: editForm.allocatedArea.trim() || null,
        zoneId: editForm.zoneDatabaseId || null, // Send the integer zone database ID - CORRECT
        birthDate: editForm.birthDate || null,
        profileImageUrl: editForm.profileImageUrl.trim() || null,
        hrManagerId: editForm.hrManagerId,
        reporteeId: editForm.reporteeId,
        departmentId: Number(editForm.departmentId) || null,
        roleId: Number(editForm.roleId) || null,
      };

      // Remove empty fields
      Object.keys(updateData).forEach((key) => {
        if (
          updateData[key] === null ||
          updateData[key] === undefined ||
          updateData[key] === ""
        ) {
          delete updateData[key];
        }
      });

      // Ensure zoneId is an integer if it exists
      if (updateData.zoneId !== null && updateData.zoneId !== undefined) {
        updateData.zoneId = parseInt(updateData.zoneId);

        // If zoneId is 0 or invalid, set to null
        if (isNaN(updateData.zoneId) || updateData.zoneId <= 0) {
          updateData.zoneId = null;
        }
      }

      const response = await API.put(
        `/admin/usersUpdate/${userId}`,
        updateData,
      );
      const result = response.data;

      if (result.success) {
        alert("User updated successfully!");
        setIsEditModalOpen(false);

        // Refresh the data from API
        await fetchUsersWithDetails();

        // Also refresh zones if zone was changed
        if (updateData.zoneId) {
          await fetchZones({ page: 1, limit: 100 });
        }
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

  // Function to export users to Excel
  const exportToExcel = async () => {
    try {
      setExporting(true);
      const usersToExport = filteredUsers;

      if (usersToExport.length === 0) {
        alert(
          `No users to export. Total users: ${users.length}, Filtered: ${filteredUsers.length}`,
        );
        setExporting(false);
        return;
      }

      // Import the export function
      const { exportUsersToExcel } = await import("../../utils/excel.export");

      // Call the export function with both users and zones
      const fileName = await exportUsersToExcel(usersToExport, zones);
    } catch (error: any) {
      console.error("Error exporting to Excel:", error);
      alert(`Failed to export users: ${error.message || "Please try again."}`);
    } finally {
      setExporting(false);
    }
  };
  // Infinite Scroll Observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loadingMore) {
          setPaginationState((prev) => ({
            ...prev,
            currentPage: prev.currentPage + 1,
          }));
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "100px",
        threshold: 0.1,
      },
    );

    const currentSentinel = sentinelRef.current;
    observer.observe(currentSentinel);

    return () => {
      if (observer && currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, loadingMore]);

  // Reset current page when filters change
  useEffect(() => {
    setPaginationState((prev) => ({ ...prev, currentPage: 1 }));
  }, [
    filterState.searchTerm,
    filterState.roleFilter,
    filterState.departmentFilter,
    filterState.zoneFilter,
    filterState.statusFilter,
  ]);

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
    <>
      <PageMeta title="Users Directory" description="users list " />
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
          <FilterSection
            filterState={filterState}
            roles={roles}
            zones={zones}
            uniqueDepartments={uniqueDepartments}
            uniqueZones={uniqueZones}
            loadingRoles={loadingRoles}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            exportToExcel={exportToExcel}
            filteredUsersLength={filteredUsers.length}
            exporting={exporting}
            onExport={exportToExcel}
            paginatedUsersLength={paginatedUsers.length}
            currentPage={currentPage}
            totalPages={totalPages}
          />

          {/* Main content area with scroll */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Check store isLoading instead of local loading */}
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
                <LoadingAnimation />
                <span className="text-gray-600 dark:text-gray-300 text-sm">
                  Loading users...
                </span>
              </div>
            ) : (
              <>
                {/* Debug info for Manager */}
                {currentUser?.role === "manager" &&
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

                {/* Debug info for Zonal Manager */}
                {currentUser &&
                  (currentUser.role === "zonalmanager" ||
                    currentUser.role === "zonal manager") &&
                  filteredUsers.length === 0 &&
                  users.length > 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                      <p className="text-yellow-700 dark:text-yellow-300 text-sm font-medium">
                        ⚠️ No users found in your zone.
                      </p>
                      <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">
                        Your zone ID:{" "}
                        <strong>{currentUser.zoneId || "Not set"}</strong>
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
                  overflow-x-auto
                "
                >
                  {/* Desktop Table */}
                  <div className="hidden md:block min-w-full h-full">
                    <UserTable
                      users={paginatedUsers}
                      currentPage={currentPage}
                      limit={limit}
                      sortOrder={filterState.sortOrder}
                      getZoneName={getZoneName}
                      getAllocatedArea={getAllocatedArea}
                      canViewUser={canViewUser}
                      handleRowClick={handleRowClick}
                      toggleSortOrder={handleToggleSortOrder}
                      getUserKey={getUserKey}
                    />
                  </div>

                  {/* Mobile Cards View */}
                  <div className="md:hidden p-4 space-y-4">
                    {paginatedUsers.length > 0 ? (
                      paginatedUsers.map((user, index) => (
                        <UserCard
                          key={getUserKey(user, index)}
                          user={user}
                          getZoneName={getZoneName}
                          getAllocatedArea={getAllocatedArea}
                          canViewUser={canViewUser}
                          canEditUser={canEditUser}
                          canDeleteUser={canDeleteUser}
                          handleRowClick={handleRowClick}
                          handleEditClick={handleEditClick}
                          handleDeleteClick={handleDeleteClick}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8">
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
                            Try adjusting your search or filter criteria
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pagination Controls */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>

        {/* Modals */}
        {isModalOpen && selectedUser && (
          <UserDetailsModal
            user={selectedUser}
            zones={zones}
            getZoneName={getZoneName}
            getAllocatedArea={getAllocatedArea}
            canEditUser={canEditUser(selectedUser)}
            canDeleteUser={canDeleteUser(selectedUser)}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedUser(null);
            }}
            onEditClick={() => handleEditClick(selectedUser)}
            onDeleteClick={() => handleDeleteClick(selectedUser)}
          />
        )}

        {isEditModalOpen && selectedUser && canEditUser(selectedUser) && (
          <EditUserModal
            user={selectedUser}
            editForm={editForm}
            zones={zones}
            departments={departments}
            roles={roles}
            loadingDepartments={loadingDepartments}
            loadingRoles={loadingRoles}
            loadingZones={loadingZones}
            isEditing={isEditing}
            onFormChange={handleEditFormChange}
            onSubmit={handleEditSubmit}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditForm({
                full_name: "",
                email: "",
                username: "",
                mobileNo: "",
                address: "",
                birthDate: "",
                allocatedArea: "",
                zoneId: "",
                zoneName: "",
                profileImageUrl: "",
                departmentId: 0,
                departmentName: "",
                roleId: 0,
                roleName: "",
              });
            }}
          />
        )}

        {isDeleteModalOpen && selectedUser && (
          <DeleteUserModal
            user={selectedUser}
            zones={zones}
            getZoneName={getZoneName}
            getAllocatedArea={getAllocatedArea}
            deleting={deleting}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedUser(null);
            }}
            onConfirm={handleDeleteConfirm}
          />
        )}
      </div>
    </>
  );
};

export default UserList;
