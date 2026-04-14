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
  normalizeString,
  normalizeRole,
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
} from "../../types/user.types";

import LoadingAnimation from "../../pages/UiElements/loadingAnimation";

import EditUserModal from "../../pages/UserList/EditUserModal";
import DeleteUserModal from "../../pages/UserList/DeleteUserModal";
import { useUserFilters } from "../../hooks/useUserFilters";
import { useUserPermissions } from "../../hooks/useUserPermissions";
import UserCard from "../../pages/UserList/UserCard";
import UserDetailsModal from "../../pages/UserList/UserDetailsModal";
import UserTable from "../../pages/UserList/UserTable";
import FilterSection from "../../pages/UserList/FilterSection";

const UserList: React.FC = () => {
  // ✅ Access Store States & Actions
  const { users, isLoading, resetStore } = useUserStore();
  const { zones, fetchZones } = useZoneStore();

  // Local UI States
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

  // Infinite scroll states
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  // Helper functions
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
    return `${baseKey}-${index}`;
  };

  // Hooks
  const filteredUsers = useUserFilters(allUsers, currentUser, filterState);
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
          role: normalizeRole(localRole),
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

  // Fetch users with infinite scroll
  const fetchUsers = useCallback(async (pageToFetch: number, append = true) => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setLoadingMore(true);

    try {
      const response = await API.get("/admin/users", {
        params: {
          page: pageToFetch,
          limit: 20,
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

        if (append) {
          setAllUsers((prev) => [...prev, ...usersData]);
        } else {
          setAllUsers(usersData);
        }

        // Update pagination info
        if (response.data.pagination) {
          const hasNextPage = response.data.pagination.hasNextPage || false;
          const total = response.data.pagination.totalItems || usersData.length;

          setHasMore(hasNextPage);
          setTotalUsersCount(total);

          if (!hasNextPage) {
            // Disconnect observer when no more data
            if (sentinelRef.current && observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        } else {
          setHasMore(false);
        }
      } else {
        console.error("No data in response:", response.data);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setHasMore(false);
    } finally {
      isLoadingRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setPage(1);
    setAllUsers([]);
    fetchUsers(1, false);
  }, []);

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchUsers(page, true);
    }
  }, [page, fetchUsers]);

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

  // Reset everything when filters change
  useEffect(() => {
    setPage(1);
    setAllUsers([]);
    setHasMore(true);
    fetchUsers(1, false);
  }, [
    filterState.searchTerm,
    filterState.roleFilter,
    filterState.departmentFilter,
    filterState.zoneFilter,
    filterState.statusFilter,
  ]);

  // Intersection Observer for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          hasMore &&
          !loadingMore &&
          !isLoadingRef.current
        ) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "200px",
        threshold: 0.1,
      },
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observerRef.current.observe(currentSentinel);
    }

    return () => {
      if (observerRef.current && currentSentinel) {
        observerRef.current.unobserve(currentSentinel);
      }
    };
  }, [hasMore, loadingMore, filteredUsers.length]);

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

  // Sort users based on sortOrder
  const sortedFilteredUsers = useMemo(() => {
    const sorted = [...filteredUsers];
    if (filterState.sortOrder === "asc") {
      sorted.sort((a, b) => {
        const nameA = (a.full_name || a.name || "").toLowerCase();
        const nameB = (b.full_name || b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else {
      sorted.sort((a, b) => {
        const nameA = (a.full_name || a.name || "").toLowerCase();
        const nameB = (b.full_name || b.name || "").toLowerCase();
        return nameB.localeCompare(nameA);
      });
    }
    return sorted;
  }, [filteredUsers, filterState.sortOrder]);

  // Handle row click
  const handleRowClick = async (user: User) => {
    if (!canViewUser(user)) {
      alert("You don't have permission to view this user.");
      return;
    }

    try {
      const userId = user.id || user.userId;
      const response = await API.get(`/admin/users/${userId}`);

      if (response.data?.success && response.data?.data) {
        const userData = response.data.data;
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
      setSelectedUser(user);
      setIsModalOpen(true);
    }
  };

  // Handle edit button click
  const handleEditClick = async (user: User) => {
    if (!canEditUser(user)) {
      alert("You don't have permission to edit this user.");
      return;
    }

    setSelectedUser(user);

    try {
      const userId = user.id || user.userId;
      const response = await API.get(`/admin/users/${userId}`);

      if (response.data?.success && response.data?.data) {
        const userData = response.data.data;

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

        const zoneData = userData.zone || {};
        const zoneId = zoneData.zoneId || userData.zoneId || "";
        const zoneDatabaseId = zoneData.id || userData.zone?.id || 0;
        let zoneName = zoneData.name || userData.zoneName || "";
        let allocatedArea = userData.allocatedArea || "";

        if (zoneId && zones.length === 0) {
          await fetchZones({ page: 1, limit: 100 });
        }

        if (zoneId && !zoneName && zones.length > 0) {
          const zone = zones.find((z: Zone) => z.zoneId === zoneId);
          if (zone) {
            zoneName = zone.name;
            if (!allocatedArea.trim()) {
              allocatedArea = zone.area;
            }
          }
        }

        setEditForm({
          full_name:
            userData.fullName || userData.full_name || userData.name || "",
          username: userData.username || "",
          email: userData.email || "",
          mobileNo: userData.mobileNo || userData.mobile || "",
          address: userData.address || "",
          allocatedArea: allocatedArea,
          zoneId: zoneId,
          zoneDatabaseId: zoneDatabaseId,
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

        // Refresh the entire list
        setPage(1);
        setAllUsers([]);
        setHasMore(true);
        await fetchUsers(1, false);
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
      const selectedZone = zones.find((z: Zone) => z.zoneId === value);
      setEditForm((prev) => ({
        ...prev,
        zoneId: value,
        zoneDatabaseId: selectedZone ? selectedZone.id : 0,
        zoneName: selectedZone ? selectedZone.name : prev.zoneName,
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
      const updateData: any = {
        username: editForm.username?.trim(),
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim(),
        mobileNo: editForm.mobileNo.trim(),
        address: editForm.address.trim(),
        allocatedArea: editForm.allocatedArea.trim() || null,
        zoneId: editForm.zoneDatabaseId || null,
        birthDate: editForm.birthDate || null,
        profileImageUrl: editForm.profileImageUrl.trim() || null,
        hrManagerId: editForm.hrManagerId,
        reporteeId: editForm.reporteeId,
        departmentId: Number(editForm.departmentId) || null,
        roleId: Number(editForm.roleId) || null,
      };

      Object.keys(updateData).forEach((key) => {
        if (
          updateData[key] === null ||
          updateData[key] === undefined ||
          updateData[key] === ""
        ) {
          delete updateData[key];
        }
      });

      if (updateData.zoneId !== null && updateData.zoneId !== undefined) {
        updateData.zoneId = parseInt(updateData.zoneId);
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

        // Refresh the list
        setPage(1);
        setAllUsers([]);
        setHasMore(true);
        await fetchUsers(1, false);

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
      const usersToExport = sortedFilteredUsers;

      if (usersToExport.length === 0) {
        alert(
          `No users to export. Total users: ${allUsers.length}, Filtered: ${sortedFilteredUsers.length}`,
        );
        setExporting(false);
        return;
      }

      const { exportUsersToExcel } = await import("../../utils/excel.export");
      const fileName = await exportUsersToExcel(usersToExport, zones);
      alert(`Users exported successfully to ${fileName}`);
    } catch (error: any) {
      console.error("Error exporting to Excel:", error);
      alert(`Failed to export users: ${error.message || "Please try again."}`);
    } finally {
      setExporting(false);
    }
  };

  // Sync function refresh callback
  const handleSyncComplete = useCallback(async () => {
    setPage(1);
    setAllUsers([]);
    setHasMore(true);
    await fetchUsers(1, false);
  }, [fetchUsers]);

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
      <PageMeta title="Users Directory" description="users list" />
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
        <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col h-full">
          <FilterSection
            filterState={filterState}
            uniqueDepartments={uniqueDepartments}
            uniqueZones={uniqueZones}
            roles={roles}
            loadingRoles={loadingRoles}
            filteredUsersLength={sortedFilteredUsers.length}
            paginatedUsersLength={sortedFilteredUsers.length}
            currentPage={1}
            totalPages={Math.ceil(sortedFilteredUsers.length / 20)}
            exporting={exporting}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            onExport={exportToExcel}
            onSyncComplete={handleSyncComplete}
          />

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {(isLoading && allUsers.length === 0) ||
            (loadingMore && allUsers.length === 0) ? (
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
                  
                    overflow-x-auto
                  "
                >
                  <div className="hidden md:block min-w-full h-full">
                    <UserTable
                      users={sortedFilteredUsers}
                      currentPage={1}
                      limit={sortedFilteredUsers.length}
                      sortOrder={filterState.sortOrder}
                      getZoneName={getZoneName}
                      getAllocatedArea={getAllocatedArea}
                      canViewUser={canViewUser}
                      handleRowClick={handleRowClick}
                      toggleSortOrder={handleToggleSortOrder}
                      getUserKey={getUserKey}
                    />
                  </div>

                  <div className="md:hidden p-4 space-y-4">
                    {sortedFilteredUsers.length > 0 ? (
                      sortedFilteredUsers.map((user, index) => (
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

                  {/* Sentinel element for infinite scroll */}
                  {hasMore && sortedFilteredUsers.length > 0 && (
                    <div
                      ref={sentinelRef}
                      className="h-10 flex justify-center items-center py-4"
                    >
                      {loadingMore && (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Loading more users...
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {!hasMore && sortedFilteredUsers.length > 0 && (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        You've reached the end! Loaded{" "}
                        {sortedFilteredUsers.length} of {totalUsersCount} users
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modals */}
        {isModalOpen && selectedUser && (
          <UserDetailsModal
            user={selectedUser}
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
