// import React, {
//   useEffect,
//   useState,
//   useRef,
//   useCallback,
//   useMemo,
// } from "react";
// // ✅ Import Zustand Stores
// import { useUserStore } from "../../store/useUserStore";
// import { useZoneStore } from "../../store/useZoneStore";
// import API from "../../api/axios";
// import * as XLSX from "xlsx";
// import PageMeta from "../../components/common/PageMeta";
// import LoadingAnimation from "../UiElements/loadingAnimation";

// // Add UserRole type
// type UserRole = "HR" | "Manager" | "ZonalManager" | string;

// // Update User interface to match your backend response
// interface User {
//   id: string;
//   userId: string;
//   name: string;
//   full_name: string;
//   employee_code: string;
//   username: string;
//   email: string;
//   role: string;
//   roleId: number;
//   is_checkin: boolean;
//   department: string;
//   departmentId?: number;
//   profile_image?: string;
//   date: string;
//   is_online: boolean;
//   allocatedArea?: string;
//   mobileNo: string;
//   address?: string;
//   birthDate?: string;
//   profileImageUrl?: string;
//   zoneId?: string; // This is zone.zoneId (string like "DEL001")
//   zoneDatabaseId?: number; // This is the actual foreign key (zone.id)
//   zoneName?: string;
//   zone?: {
//     id: number;
//     zoneId: string;
//     name: string;
//     area: string;
//     city: string;
//     state: string;
//     pincode?: string;
//     description?: string;
//   };
// }

// interface CurrentUser {
//   id: string;
//   role: UserRole;
//   department?: string;
//   departmentName?: string;
//   allocatedArea?: string;
//   zoneId?: string;
// }

// interface Department {
//   departmentId: number;
//   name: string;
// }

// interface Role {
//   id: number;
//   name: string;
//   description: string;
// }

// // Update Zone interface based on API response
// interface Zone {
//   id: number;
//   zoneId: string;
//   name: string;
//   area: string;
//   city: string;
//   state: string;
//   pincode?: string;
//   description?: string;
//   isActive: boolean;
//   createdAt: string;
//   _count?: {
//     employees: number;
//   };
// }

// interface EditUserForm {
//   username: string;
//   full_name: string;
//   email: string;
//   mobileNo: string;
//   address: string;
//   birthDate: string;
//   profileImageUrl: string;
//   departmentId: number;
//   departmentName: string;
//   zoneId: string; // This is zone.zoneId (string)
//   zoneDatabaseId: number; // This is zone.id (integer foreign key)
//   zoneName: string;
//   allocatedArea: string;
//   roleId: number;
//   roleName: string;
// }

// const UserList: React.FC = () => {
//   // ✅ Access Store States & Actions
//   const { users, fetchUsers, isLoading, resetStore } = useUserStore();
//   const { zones, fetchZones } = useZoneStore();

//   // Local UI States
//   const [loadingMore, setLoadingMore] = useState(false);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [selectedUser, setSelectedUser] = useState<User | null>(null);

//   // Filter States
//   const [searchTerm, setSearchTerm] = useState("");
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
//   const [roleFilter, setRoleFilter] = useState<string | "">("");
//   const [departmentFilter, setDepartmentFilter] = useState<string | "">("");
//   const [zoneFilter, setZoneFilter] = useState<string | "">("");
//   const [statusFilter, setStatusFilter] = useState<"" | "online" | "offline">(
//     "",
//   );
//   const [exporting, setExporting] = useState(false);
//   const [deleting, setDeleting] = useState(false);

//   // Current Admin User State
//   const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
//   const [loadingCurrentUser, setLoadingCurrentUser] = useState(true);

//   // Edit form states
//   const [editForm, setEditForm] = useState<EditUserForm>({
//     full_name: "",
//     email: "",
//     mobileNo: "",
//     address: "",
//     birthDate: "",
//     username: "",
//     profileImageUrl: "",
//     departmentId: 0,
//     departmentName: "",
//     zoneId: "",
//     zoneDatabaseId: 0,
//     zoneName: "",
//     allocatedArea: "",
//     roleId: 0,
//     roleName: "",
//   });

//   const [isEditing, setIsEditing] = useState(false);
//   const [departments, setDepartments] = useState<Department[]>([]);
//   const [roles, setRoles] = useState<Role[]>([]);
//   const [loadingDepartments, setLoadingDepartments] = useState(false);
//   const [loadingRoles, setLoadingRoles] = useState(false);
//   const [loadingZones, setLoadingZones] = useState(false);

//   // Pagination states
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalUsersCount, setTotalUsersCount] = useState(0);
//   const [hasMore, setHasMore] = useState(true);

//   const limit = 20;
//   const scrollContainerRef = useRef<HTMLDivElement>(null);
//   const sentinelRef = useRef<HTMLDivElement>(null);

//   // ✅ Enhanced fetchUsers function to include zone and department data
//   const fetchUsersWithDetails = useCallback(async () => {
//     try {
//       setLoadingMore(true);

//       const response = await API.get("/admin/users", {
//         params: {
//           page: currentPage,
//           limit: limit,
//           includeDetails: true,
//         },
//       });

//       if (response.data?.success && response.data?.data) {
//         const usersData = response.data.data.map((user: any) => {
//           const zoneData = user.zone || {};
//           return {
//             id: user.id?.toString() || user.userId?.toString() || "",
//             userId: user.userId?.toString() || user.id?.toString() || "",
//             name: user.name || user.username || "",
//             full_name:
//               user.fullName ||
//               user.full_name ||
//               user.name ||
//               user.username ||
//               "",
//             employee_code: user.employeeCode || user.employee_code || "",
//             username: user.username || "",
//             email: user.email || "",
//             role: user.role?.name || user.role || "",
//             roleId: user.roleId || user.role?.id || 0,
//             is_checkin: user.is_checkin || user.isCheckin || false,
//             department: user.department?.name || user.department || "",
//             departmentId: user.departmentId || user.department?.id || 0,
//             profile_image: user.profileImageUrl || user.profile_image || "",
//             date: user.createdAt || user.date || "",
//             is_online: user.is_online || user.isOnline || false,
//             allocatedArea: user.allocatedArea || zoneData.area || "",
//             mobileNo: user.mobileNo || user.mobile || "",
//             address: user.address || "",
//             birthDate: user.birthDate || "",
//             profileImageUrl: user.profileImageUrl || user.profile_image || "",
//             zoneId: zoneData.zoneId || user.zoneId || "",
//             zoneDatabaseId: zoneData.id || user.zone?.id || 0,
//             zoneName: zoneData.name || user.zoneName || "",
//             zone: zoneData.id
//               ? {
//                   id: zoneData.id,
//                   zoneId: zoneData.zoneId || "",
//                   name: zoneData.name || "",
//                   area: zoneData.area || "",
//                   city: zoneData.city || "",
//                   state: zoneData.state || "",
//                   pincode: zoneData.pincode || "",
//                   description: zoneData.description || "",
//                 }
//               : null,
//           };
//         });

//         useUserStore.setState({
//           users: usersData,
//           isLoading: false,
//         });

//         // Update pagination info
//         if (response.data.pagination) {
//           setTotalPages(response.data.pagination.totalPages || 1);
//           setTotalUsersCount(
//             response.data.pagination.totalItems || usersData.length,
//           );
//           setHasMore(response.data.pagination.hasNextPage || false);
//         }
//       } else {
//         console.error("No data in response:", response.data);
//         useUserStore.setState({ isLoading: false });
//       }
//     } catch (error) {
//       console.error("Failed to fetch users with details:", error);
//       useUserStore.setState({ isLoading: false });
//     } finally {
//       setLoadingMore(false);
//     }
//   }, [currentPage]);

//   // ✅ Fetch Users on Mount using enhanced function
//   useEffect(() => {
//     fetchUsersWithDetails();
//   }, [fetchUsersWithDetails]);

//   // ✅ Fetch Zones on Mount
//   useEffect(() => {
//     const loadZones = async () => {
//       try {
//         setLoadingZones(true);
//         await fetchZones({ page: 1, limit: 100 });
//       } catch (error) {
//         console.error("Failed to fetch zones:", error);
//       } finally {
//         setLoadingZones(false);
//       }
//     };
//     loadZones();
//   }, [fetchZones]);

//   // Helper function to get zone details
//   const getZoneDetails = useCallback(
//     (zoneId: string): Zone | null => {
//       if (!zoneId) return null;
//       const zone = zones.find((z: Zone) => z.zoneId === zoneId);
//       return zone || null;
//     },
//     [zones],
//   );

//   // Helper function to get zone name
//   const getZoneName = useCallback(
//     (zoneId: string): string => {
//       if (!zoneId) return "Not Assigned";
//       const zone = getZoneDetails(zoneId);
//       return zone ? zone.name : "Zone Not Found";
//     },
//     [getZoneDetails],
//   );

//   // Helper function to get zone area
//   const getZoneArea = useCallback(
//     (zoneId: string): string => {
//       if (!zoneId) return "Not Assigned";
//       const zone = getZoneDetails(zoneId);
//       return zone ? zone.area : "Area Not Found";
//     },
//     [getZoneDetails],
//   );

//   // Helper function to get allocated area (user's allocated area, falls back to zone area)
//   const getAllocatedArea = useCallback(
//     (user: User): string => {
//       if (user.allocatedArea && user.allocatedArea.trim() !== "") {
//         return user.allocatedArea;
//       }
//       if (user.zoneId) {
//         return getZoneArea(user.zoneId);
//       }
//       return "Not Assigned";
//     },
//     [getZoneArea],
//   );

//   // Helper function to normalize strings for comparison
//   const normalizeString = (str: string | undefined): string => {
//     if (!str) return "";
//     return str.trim().toLowerCase().replace(/\s+/g, " ");
//   };

//   // Helper function to normalize role names
//   const normalizeRole = (role: string | undefined): string => {
//     if (!role) return "";
//     return role.trim().toLowerCase().replace(/\s+/g, " ");
//   };

//   // Fetch current user info from token or API
//   const fetchCurrentUser = useCallback(async () => {
//     try {
//       setLoadingCurrentUser(true);
//       const localId = localStorage.getItem("userId");
//       const localRole = localStorage.getItem("userRole");
//       const localDepartment = localStorage.getItem("department");
//       const localDepartmentId = localStorage.getItem("departmentId");
//       const localAllocatedArea = localStorage.getItem("allocatedarea");
//       const localZoneId = localStorage.getItem("zoneId");

//       if (localId && localRole) {
//         const normalizedRole = normalizeRole(localRole);

//         setCurrentUser({
//           id: localId,
//           role: normalizedRole,
//           department: localDepartment || undefined,
//           departmentName: localDepartment || undefined,
//           allocatedArea: localAllocatedArea || undefined,
//           zoneId: localZoneId || undefined,
//         });
//       }
//     } catch (error) {
//       console.error("Failed to fetch current user:", error);
//     } finally {
//       setLoadingCurrentUser(false);
//     }
//   }, []);

//   // Check if current user can edit a specific user
//   const canEditUser = useCallback(
//     (user: User): boolean => {
//       if (!currentUser) return false;

//       const userRole = currentUser.role;

//       switch (userRole) {
//         case "hr":
//           return true;
//         case "manager": {
//           if (!currentUser.departmentName && !currentUser.department)
//             return false;

//           const managerDept = normalizeString(
//             currentUser.departmentName || currentUser.department,
//           );
//           const userDept = normalizeString(user.department);

//           return managerDept === userDept;
//         }
//         case "zonalmanager":
//         case "zonal manager":
//           return false;
//         default:
//           return false;
//       }
//     },
//     [currentUser],
//   );

//   // Check if current user can delete a specific user
//   const canDeleteUser = useCallback(
//     (user: User): boolean => {
//       if (!currentUser) return false;

//       const userRole = currentUser.role;
//       const normalizedUserRole = normalizeRole(user.role);

//       // Only HR and Manager can delete users
//       if (userRole !== "hr" && userRole !== "manager") return false;

//       // Prevent users from deleting themselves
//       if (currentUser.id === user.id || currentUser.id === user.userId) {
//         return false;
//       }

//       switch (userRole) {
//         case "hr":
//           // HR can delete all users except themselves
//           return true;
//         case "manager": {
//           if (!currentUser.departmentName && !currentUser.department)
//             return false;

//           const managerDept = normalizeString(
//             currentUser.departmentName || currentUser.department,
//           );
//           const userDept = normalizeString(user.department);

//           // Manager can only delete users from their own department
//           return managerDept === userDept;
//         }
//         default:
//           return false;
//       }
//     },
//     [currentUser],
//   );

//   // Check if current user can view a specific user
//   const canViewUser = useCallback(
//     (user: User): boolean => {
//       if (!currentUser) return false;
//       const userRole = currentUser.role;

//       switch (userRole) {
//         case "hr":
//           return true;
//         case "manager": {
//           if (!currentUser.departmentName && !currentUser.department)
//             return false;
//           const managerDept = normalizeString(
//             currentUser.departmentName || currentUser.department,
//           );
//           const userDept = normalizeString(user.department);
//           return managerDept === userDept;
//         }
//         case "zonalmanager":
//         case "zonal manager": {
//           if (!currentUser.zoneId) return false;
//           const managerZoneId = normalizeString(currentUser.zoneId);
//           const userZoneId = normalizeString(user.zoneId || "");
//           return managerZoneId === userZoneId;
//         }
//         default:
//           return true;
//       }
//     },
//     [currentUser],
//   );

//   // ✅ Enhanced Filter & Sort Logic
//   const filteredUsers = useMemo(() => {
//     const storeUsers = users as unknown as User[];
//     if (!storeUsers || storeUsers.length === 0) return [];

//     let result = [...storeUsers];

//     // Permission Filtering
//     if (currentUser) {
//       result = result.filter((user) => canViewUser(user));
//     }

//     // Search Filtering
//     if (searchTerm.trim()) {
//       const searchLower = searchTerm.toLowerCase().trim();
//       result = result.filter(
//         (user) =>
//           user.full_name?.toLowerCase().includes(searchLower) ||
//           user.name?.toLowerCase().includes(searchLower) ||
//           user.employee_code?.toLowerCase().includes(searchLower) ||
//           user.employee_code?.includes(searchTerm.trim()) ||
//           user.email?.toLowerCase().includes(searchLower) ||
//           (user.zoneId && user.zoneId.toLowerCase().includes(searchLower)) ||
//           (user.zoneName &&
//             user.zoneName.toLowerCase().includes(searchLower)) ||
//           (user.department &&
//             user.department.toLowerCase().includes(searchLower)) ||
//           (user.role && user.role.toLowerCase().includes(searchLower)) ||
//           (user.mobileNo && user.mobileNo.includes(searchTerm.trim())) ||
//           (user.allocatedArea &&
//             user.allocatedArea.toLowerCase().includes(searchLower)),
//       );
//     }

//     // Role Filtering
//     if (roleFilter !== "") {
//       result = result.filter((user) => user.role === roleFilter);
//     }

//     // Department Filtering
//     if (departmentFilter !== "") {
//       result = result.filter((user) => user.department === departmentFilter);
//     }

//     // Zone Filtering
//     if (zoneFilter !== "") {
//       result = result.filter((user) => user.zoneId === zoneFilter);
//     }

//     // Status Filtering
//     if (statusFilter !== "") {
//       result = result.filter((user) => {
//         if (statusFilter === "online") return user.is_checkin;
//         if (statusFilter === "offline") return !user.is_checkin;
//         return true;
//       });
//     }

//     // Sorting
//     result.sort((a, b) => {
//       const nameA = (a.full_name || a.name || "").toLowerCase();
//       const nameB = (b.full_name || b.name || "").toLowerCase();

//       if (sortOrder === "asc") {
//         return nameA.localeCompare(nameB);
//       } else {
//         return nameB.localeCompare(nameA);
//       }
//     });

//     return result;
//   }, [
//     users,
//     currentUser,
//     canViewUser,
//     searchTerm,
//     roleFilter,
//     departmentFilter,
//     zoneFilter,
//     statusFilter,
//     sortOrder,
//   ]);

//   // ✅ Calculate Pagination from filtered results
//   const paginatedUsers = useMemo(() => {
//     const startIndex = (currentPage - 1) * limit;
//     const endIndex = startIndex + limit;
//     return filteredUsers.slice(startIndex, endIndex);
//   }, [filteredUsers, currentPage, limit]);

//   // Update total pages when filtered list changes
//   useEffect(() => {
//     const totalFiltered = filteredUsers.length;
//     setTotalUsersCount(totalFiltered);
//     setTotalPages(Math.ceil(totalFiltered / limit));
//     setHasMore(currentPage < Math.ceil(totalFiltered / limit));

//     if (currentPage > Math.ceil(totalFiltered / limit)) {
//       setCurrentPage(1);
//     }
//   }, [filteredUsers, currentPage, limit]);

//   // Fetch Departments
//   const fetchDepartments = useCallback(async () => {
//     try {
//       setLoadingDepartments(true);
//       const response = await API.get("/departments/static_departments");
//       if (response.data?.departments) {
//         setDepartments(response.data.departments);
//       } else {
//         setDepartments([]);
//       }
//     } catch (error) {
//       console.error("Failed to fetch departments:", error);
//       setDepartments([]);
//     } finally {
//       setLoadingDepartments(false);
//     }
//   }, []);

//   // Fetch Roles
//   const fetchRoles = useCallback(async () => {
//     try {
//       setLoadingRoles(true);
//       const response = await API.get("/roles/static_roles");
//       if (response.data?.roles) {
//         setRoles(response.data.roles);
//       } else {
//         setRoles([]);
//       }
//     } catch (error) {
//       console.error("Failed to fetch roles:", error);
//       setRoles([]);
//     } finally {
//       setLoadingRoles(false);
//     }
//   }, []);

//   // Handle delete button click
//   const handleDeleteClick = (user: User) => {
//     if (!canDeleteUser(user)) {
//       alert("You don't have permission to delete this user.");
//       return;
//     }

//     if (
//       currentUser &&
//       (currentUser.id === user.id || currentUser.id === user.userId)
//     ) {
//       alert("You cannot delete yourself.");
//       return;
//     }

//     setSelectedUser(user);
//     setIsDeleteModalOpen(true);
//   };

//   // Handle delete confirmation
//   const handleDeleteConfirm = async () => {
//     if (!selectedUser) return;

//     if (!canDeleteUser(selectedUser)) {
//       alert("You don't have permission to delete this user.");
//       setIsDeleteModalOpen(false);
//       return;
//     }

//     if (
//       currentUser &&
//       (currentUser.id === selectedUser.id ||
//         currentUser.id === selectedUser.userId)
//     ) {
//       alert("You cannot delete yourself.");
//       setIsDeleteModalOpen(false);
//       return;
//     }

//     setDeleting(true);
//     try {
//       const userId = selectedUser.id || selectedUser.userId;
//       const response = await API.delete(`/admin/users/${userId}`);

//       if (response.data?.success) {
//         alert("User deleted successfully!");
//         setIsDeleteModalOpen(false);

//         // Refresh data from API
//         await fetchUsersWithDetails();
//       } else {
//         alert(response.data?.message || "Failed to delete user");
//       }
//     } catch (error: any) {
//       console.error("Error deleting user:", error);
//       const msg =
//         error.response?.data?.message ||
//         error.message ||
//         "Failed to delete user";
//       alert(`Error: ${msg}`);
//     } finally {
//       setDeleting(false);
//     }
//   };

//   // Handle edit button click - IMPROVED with zone fetching
//   const handleEditClick = async (user: User) => {
//     if (!canEditUser(user)) {
//       alert("You don't have permission to edit this user.");
//       return;
//     }

//     setSelectedUser(user);

//     try {
//       // Fetch fresh user data from API
//       const userId = user.id || user.userId;
//       const response = await API.get(`/admin/users/${userId}`);

//       if (response.data?.success && response.data?.data) {
//         const userData = response.data.data;

//         // Extract department information
//         let departmentId = 0;
//         let departmentName =
//           userData.department?.name || userData.department || "";

//         if (departmentName && departments.length === 0) {
//           await fetchDepartments();
//         }

//         if (departmentName && departments.length > 0) {
//           const dept = departments.find(
//             (d) => d.name.toLowerCase() === departmentName.toLowerCase(),
//           );
//           departmentId = dept?.departmentId || 0;
//         }

//         // Extract role information
//         let roleId = 0;
//         let roleName = userData.role?.name || userData.role || "";

//         if (roleName && roles.length === 0) {
//           await fetchRoles();
//         }

//         if (roleName && roles.length > 0) {
//           const role = roles.find(
//             (r) => r.name.toLowerCase() === roleName.toLowerCase(),
//           );
//           roleId = role?.id || 0;
//         }

//         // Extract zone information
//         const zoneData = userData.zone || {};
//         const zoneId = zoneData.zoneId || userData.zoneId || "";
//         const zoneDatabaseId = zoneData.id || userData.zone?.id || 0;
//         let zoneName = zoneData.name || userData.zoneName || "";
//         let allocatedArea = userData.allocatedArea || "";

//         // If we have zoneId but zones not loaded, fetch zones
//         if (zoneId && zones.length === 0) {
//           await fetchZones({ page: 1, limit: 100 });
//         }

//         // If we have zoneId but not zoneName, get it from zones
//         if (zoneId && !zoneName && zones.length > 0) {
//           const zone = zones.find((z: Zone) => z.zoneId === zoneId);
//           if (zone) {
//             zoneName = zone.name;
//             // Only set allocatedArea from zone if user doesn't have one
//             if (!allocatedArea.trim()) {
//               allocatedArea = zone.area;
//             }
//           }
//         }

//         // Prepare the edit form with fresh API data
//         setEditForm({
//           full_name:
//             userData.fullName || userData.full_name || userData.name || "",
//           username: userData.username || "",
//           email: userData.email || "",
//           mobileNo: userData.mobileNo || userData.mobile || "",
//           address: userData.address || "",
//           allocatedArea: allocatedArea,
//           zoneId: zoneId,
//           zoneDatabaseId: zoneDatabaseId,
//           zoneName: zoneName,
//           birthDate: userData.birthDate
//             ? new Date(userData.birthDate).toISOString().split("T")[0]
//             : "",
//           profileImageUrl:
//             userData.profileImageUrl || userData.profile_image || "",
//           departmentId: departmentId,
//           departmentName: departmentName,
//           roleId: roleId,
//           roleName: roleName,
//         });
//       } else {
//         throw new Error("Failed to fetch user data");
//       }
//     } catch (error) {
//       console.error("Failed to prepare edit form:", error);
//       // Fallback to existing user data
//       setEditForm({
//         full_name: user.full_name || user.name || "",
//         username: user.username || "",
//         email: user.email || "",
//         mobileNo: user.mobileNo || "",
//         address: user.address || "",
//         allocatedArea: user.allocatedArea || "",
//         zoneId: user.zoneId || "",
//         zoneDatabaseId: user.zoneDatabaseId || 0,
//         zoneName: user.zoneName || "",
//         birthDate: user.birthDate
//           ? new Date(user.birthDate).toISOString().split("T")[0]
//           : "",
//         profileImageUrl: user.profileImageUrl || user.profile_image || "",
//         departmentId: 0,
//         departmentName: user.department || "",
//         roleId: 0,
//         roleName: user.role || "",
//       });
//     }

//     setIsEditModalOpen(true);
//   };

//   const handleEditFormChange = (
//     e: React.ChangeEvent<
//       HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
//     >,
//   ) => {
//     const { name, value } = e.target;

//     if (name === "zoneId") {
//       // When zoneId changes, update zoneDatabaseId and zoneName
//       const selectedZone = zones.find((z: Zone) => z.zoneId === value);
//       setEditForm((prev) => ({
//         ...prev,
//         zoneId: value,
//         zoneDatabaseId: selectedZone ? selectedZone.id : 0,
//         zoneName: selectedZone ? selectedZone.name : prev.zoneName,
//         // Do NOT update allocatedArea automatically - keep it separate
//       }));
//     } else if (name === "departmentId") {
//       const selectedDept = departments.find(
//         (d) => d.departmentId === parseInt(value),
//       );
//       setEditForm((prev) => ({
//         ...prev,
//         departmentId: parseInt(value) || 0,
//         departmentName: selectedDept ? selectedDept.name : prev.departmentName,
//       }));
//     } else if (name === "roleId") {
//       const selectedRole = roles.find((r) => r.id === parseInt(value));
//       setEditForm((prev) => ({
//         ...prev,
//         roleId: parseInt(value) || 0,
//         roleName: selectedRole ? selectedRole.name : prev.roleName,
//       }));
//     } else {
//       setEditForm((prev) => ({
//         ...prev,
//         [name]: value,
//       }));
//     }
//   };

//   // FIXED: Updated handleEditSubmit to send correct zoneId (integer)
//   const handleEditSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedUser) return;

//     if (!canEditUser(selectedUser)) {
//       alert("You don't have permission to edit this user.");
//       return;
//     }

//     const userId = selectedUser.id || selectedUser.userId;
//     setIsEditing(true);

//     try {
//       // Create update data object
//       const updateData: any = {
//         username: editForm.username?.trim(),
//         full_name: editForm.full_name.trim(), // Changed from fullName to full_name
//         email: editForm.email.trim(),
//         mobileNo: editForm.mobileNo.trim(),
//         address: editForm.address.trim(),
//         allocatedArea: editForm.allocatedArea.trim() || null,
//         zoneId: editForm.zoneDatabaseId || null, // Send the integer zone database ID
//         birthDate: editForm.birthDate || null,
//         profileImageUrl: editForm.profileImageUrl.trim() || null,
//         departmentId: Number(editForm.departmentId) || null,
//         roleId: Number(editForm.roleId) || null,
//       };

//       // Remove empty fields
//       Object.keys(updateData).forEach((key) => {
//         if (
//           updateData[key] === null ||
//           updateData[key] === undefined ||
//           updateData[key] === ""
//         ) {
//           delete updateData[key];
//         }
//       });

//       console.log("Updating user with data:", updateData);

//       const response = await API.put(
//         `/admin/usersUpdate/${userId}`,
//         updateData,
//       );
//       const result = response.data;

//       if (result.success) {
//         alert("User updated successfully!");
//         setIsEditModalOpen(false);

//         // Refresh the data from API
//         await fetchUsersWithDetails();

//         // Also refresh zones if zone was changed
//         if (updateData.zoneId) {
//           await fetchZones({ page: 1, limit: 100 });
//         }
//       } else {
//         alert(result.message || "Failed to update user");
//       }
//     } catch (error: any) {
//       console.error("Error updating user:", error);
//       const msg =
//         error.response?.data?.message ||
//         error.message ||
//         "Failed to update user";
//       alert(`Error: ${msg}`);
//     } finally {
//       setIsEditing(false);
//     }
//   };

//   // Function to export users to Excel
//   const exportToExcel = async () => {
//     try {
//       setExporting(true);
//       const usersToExport = filteredUsers;

//       if (usersToExport.length === 0) {
//         alert("No users to export");
//         return;
//       }

//       const excelData = usersToExport.map((user: User, index: number) => {
//         const zoneDetails = getZoneDetails(user.zoneId || "");
//         const allocatedArea = getAllocatedArea(user);

//         return {
//           "Sr. No": index + 1,
//           "Employee Code": user.employee_code || "N/A",
//           "Full Name": user.full_name || user.name || "N/A",
//           Username: user.username || "N/A",
//           Email: user.email || "N/A",
//           Role: user.role || "N/A",
//           Department: user.department || "N/A",
//           "Zone ID": user.zoneId || "N/A",
//           "Zone Name": zoneDetails?.name || user.zoneName || "N/A",
//           "Allocated Area": allocatedArea,
//           "Mobile Number": user.mobileNo || "N/A",
//           Status: user.is_checkin ? "Online" : "Offline",
//           "Date Joined": user.date
//             ? new Date(user.date).toLocaleDateString()
//             : "N/A",
//           Address: user.address || "N/A",
//           "Birth Date": user.birthDate
//             ? new Date(user.birthDate).toLocaleDateString()
//             : "N/A",
//         };
//       });

//       const worksheet = XLSX.utils.json_to_sheet(excelData);
//       const workbook = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

//       const maxWidth = excelData.reduce(
//         (w, r) => Math.max(w, Object.values(r).join("").length),
//         10,
//       );
//       worksheet["!cols"] = [{ wch: maxWidth }];

//       const fileName = `users_export_${
//         new Date().toISOString().split("T")[0]
//       }.xlsx`;
//       XLSX.writeFile(workbook, fileName);

//       alert(`Exported ${usersToExport.length} users to ${fileName}`);
//     } catch (error) {
//       console.error("Error exporting to Excel:", error);
//       alert("Failed to export users. Please try again.");
//     } finally {
//       setExporting(false);
//     }
//   };

//   // Initial Data Load
//   useEffect(() => {
//     fetchCurrentUser();
//     fetchDepartments();
//     fetchRoles();
//   }, [fetchCurrentUser, fetchDepartments, fetchRoles]);

//   // Infinite Scroll Observer
//   useEffect(() => {
//     if (!sentinelRef.current || !hasMore || loadingMore) return;

//     const observer = new IntersectionObserver(
//       (entries) => {
//         const [entry] = entries;
//         if (entry.isIntersecting && hasMore && !loadingMore) {
//           setCurrentPage((prev) => prev + 1);
//         }
//       },
//       {
//         root: scrollContainerRef.current,
//         rootMargin: "100px",
//         threshold: 0.1,
//       },
//     );

//     const currentSentinel = sentinelRef.current;
//     observer.observe(currentSentinel);

//     return () => {
//       if (observer && currentSentinel) {
//         observer.unobserve(currentSentinel);
//       }
//     };
//   }, [hasMore, loadingMore]);

//   // Handlers for Filters
//   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setSearchTerm(e.target.value);
//   };

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm, roleFilter, departmentFilter, zoneFilter, statusFilter]);

//   const toggleSortOrder = () => {
//     setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
//   };

//   const clearFilters = () => {
//     setSearchTerm("");
//     setRoleFilter("");
//     setDepartmentFilter("");
//     setZoneFilter("");
//     setStatusFilter("");
//   };

//   const handleRowClick = (user: User) => {
//     if (!canViewUser(user)) {
//       alert("You don't have permission to view this user.");
//       return;
//     }
//     setSelectedUser(user);
//     setIsModalOpen(true);
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     setSelectedUser(null);
//   };

//   const closeEditModal = () => {
//     setIsEditModalOpen(false);
//     setEditForm({
//       full_name: "",
//       email: "",
//       username: "",
//       mobileNo: "",
//       address: "",
//       birthDate: "",
//       allocatedArea: "",
//       zoneId: "",
//       zoneDatabaseId: 0,
//       zoneName: "",
//       profileImageUrl: "",
//       departmentId: 0,
//       departmentName: "",
//       roleId: 0,
//       roleName: "",
//     });
//   };

//   const closeDeleteModal = () => {
//     setIsDeleteModalOpen(false);
//     setSelectedUser(null);
//   };

//   const handleGoToPage = (page: number) => {
//     if (page < 1 || page > totalPages || page === currentPage) return;
//     setCurrentPage(page);
//     if (scrollContainerRef.current) {
//       scrollContainerRef.current.scrollTop = 0;
//     }
//   };

//   const renderPagination = () => {
//     if (totalPages <= 1) return null;

//     const pages = [];
//     const maxVisiblePages = 5;
//     let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
//     const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

//     if (endPage - startPage + 1 < maxVisiblePages) {
//       startPage = Math.max(1, endPage - maxVisiblePages + 1);
//     }

//     for (let i = startPage; i <= endPage; i++) {
//       pages.push(
//         <button
//           key={`page-${i}`}
//           onClick={() => handleGoToPage(i)}
//           className={`
//             min-w-8 h-8 px-2 mx-1 rounded-lg sm:rounded-xl
//             text-xs font-medium transition-all duration-300
//             ${
//               currentPage === i
//                 ? "bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-md"
//                 : "bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-600/80"
//             }
//             backdrop-blur-sm border border-white/60 dark:border-gray-600/60
//           `}
//         >
//           {i}
//         </button>,
//       );
//     }

//     return (
//       <div className="flex items-center justify-center space-x-1 sm:space-x-2 mt-4">
//         <button
//           onClick={() => handleGoToPage(1)}
//           disabled={currentPage === 1}
//           className={`
//             px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-medium
//             backdrop-blur-sm border transition-all duration-300
//             ${
//               currentPage === 1
//                 ? "bg-white/30 dark:bg-gray-800/30 text-gray-400 dark:text-gray-600 border-white/30 dark:border-gray-700/30 cursor-not-allowed"
//                 : "bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-600/80 border-white/60 dark:border-gray-600/60"
//             }
//           `}
//         >
//           « First
//         </button>

//         <button
//           onClick={() => handleGoToPage(currentPage - 1)}
//           disabled={currentPage === 1}
//           className={`
//             px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-medium
//             backdrop-blur-sm border transition-all duration-300
//             ${
//               currentPage === 1
//                 ? "bg-white/30 dark:bg-gray-800/30 text-gray-400 dark:text-gray-600 border-white/30 dark:border-gray-700/30 cursor-not-allowed"
//                 : "bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-600/80 border-white/60 dark:border-gray-600/60"
//             }
//           `}
//         >
//           ‹ Prev
//         </button>

//         {startPage > 1 && (
//           <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
//         )}

//         {pages}

//         {endPage < totalPages && (
//           <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
//         )}

//         <button
//           onClick={() => handleGoToPage(currentPage + 1)}
//           disabled={currentPage === totalPages}
//           className={`
//             px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-medium
//             backdrop-blur-sm border transition-all duration-300
//             ${
//               currentPage === totalPages
//                 ? "bg-white/30 dark:bg-gray-800/30 text-gray-400 dark:text-gray-600 border-white/30 dark:border-gray-700/30 cursor-not-allowed"
//                 : "bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-600/80 border-white/60 dark:border-gray-600/60"
//             }
//           `}
//         >
//           Next ›
//         </button>

//         <button
//           onClick={() => handleGoToPage(totalPages)}
//           disabled={currentPage === totalPages}
//           className={`
//             px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-medium
//             backdrop-blur-sm border transition-all duration-300
//             ${
//               currentPage === totalPages
//                 ? "bg-white/30 dark:bg-gray-800/30 text-gray-400 dark:text-gray-600 border-white/30 dark:border-gray-700/30 cursor-not-allowed"
//                 : "bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-600/80 border-white/60 dark:border-gray-600/60"
//             }
//           `}
//         >
//           Last »
//         </button>
//       </div>
//     );
//   };

//   const getUserKey = (user: User, index: number): string => {
//     const userId = user.id || user.userId;
//     const baseKey = userId || `user-${index}`;
//     const pageIndex = (currentPage - 1) * limit + index;
//     return `${baseKey}-${pageIndex}`;
//   };

//   // Get unique departments for filter
//   const uniqueDepartments = useMemo(() => {
//     const deptSet = new Set<string>();
//     filteredUsers.forEach((user) => {
//       if (user.department) {
//         deptSet.add(user.department);
//       }
//     });
//     return Array.from(deptSet).sort();
//   }, [filteredUsers]);

//   // Get unique zones for filter
//   const uniqueZones = useMemo(() => {
//     const zoneSet = new Set<string>();
//     filteredUsers.forEach((user) => {
//       if (user.zoneId) {
//         zoneSet.add(user.zoneId);
//       }
//     });
//     return Array.from(zoneSet).sort();
//   }, [filteredUsers]);

//   // Show loading for current user info
//   if (loadingCurrentUser) {
//     return (
//       <div className="flex justify-center items-center h-full">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//         <span className="ml-2 text-gray-600 dark:text-gray-300">
//           Loading user info...
//         </span>
//       </div>
//     );
//   }

//   return (
//     <>
//       <PageMeta title="Users Directory" description="users list " />
//       <div
//         className="
//       w-full max-w-full mx-auto
//       px-2 sm:px-3 md:px-4
//       rounded-2xl sm:rounded-3xl
//       bg-linear-to-br from-white/20 via-white/10 to-white/5
//       dark:from-gray-900/30 dark:via-gray-800/20 dark:to-gray-900/10
//       backdrop-blur-2xl
//       border border-white/40 dark:border-gray-700/40
//       p-3 sm:p-4 lg:p-6
//       shadow-[0_8px_32px_rgba(31,38,135,0.15)]
//       dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]
//       overflow-hidden
//       relative
//       flex flex-col
//       h-[85vh]
//       box-border
//     "
//       >
//         {/* Background gradient overlay */}
//         <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
//         <div className="relative z-10 flex flex-col h-full">
//           <h2
//             className="
//           text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-center
//           text-dark
//           bg-clip-text
//           px-2
//         "
//           >
//             Users Directory
//           </h2>

//           {/* Filter Section - Enhanced with more filters */}
//           <div
//             className="
//           bg-linear-to-br from-white/40 to-white/20
//           dark:from-gray-800/40 dark:to-gray-900/20
//           backdrop-blur-xl
//           border border-white/40 dark:border-gray-700/40
//           rounded-xl sm:rounded-2xl p-2 sm:p-3 mb-3 sm:mb-4
//           shadow-[0_4px_20px_rgba(0,0,0,0.1)]
//           dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]
//           shrink-0
//         "
//           >
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 mb-2">
//               {/* Search Input */}
//               <div className="sm:col-span-2">
//                 <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
//                   Search Users
//                 </label>
//                 <div className="relative">
//                   <div
//                     className="
//                   absolute left-2 top-1/2 transform -translate-y-1/2
//                   p-1 rounded
//                   bg-white/50 dark:bg-gray-700/50
//                   backdrop-blur-sm
//                 "
//                   >
//                     <svg
//                       className="h-3 w-3 text-gray-500"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//                       />
//                     </svg>
//                   </div>
//                   <input
//                     type="text"
//                     placeholder="Search by name, code, email, zone..."
//                     value={searchTerm}
//                     onChange={handleSearchChange}
//                     className="
//                     w-full pl-8 pr-2 py-1.5
//                     bg-white/50 dark:bg-gray-700/50
//                     backdrop-blur-sm
//                     border border-white/60 dark:border-gray-600/60
//                     rounded-lg
//                     text-gray-900 dark:text-gray-100
//                     focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
//                     focus:outline-none
//                     placeholder-gray-500 dark:placeholder-gray-400
//                     text-sm
//                     transition-all duration-300
//                   "
//                   />
//                   {searchTerm && (
//                     <button
//                       onClick={() => setSearchTerm("")}
//                       className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                     >
//                       ✕
//                     </button>
//                   )}
//                 </div>
//               </div>

//               {/* Role Filter */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
//                   Filter by Role
//                 </label>
//                 <select
//                   value={roleFilter}
//                   onChange={(e) => setRoleFilter(e.target.value)}
//                   disabled={loadingRoles}
//                   className="
//                   w-full py-1.5 px-2
//                   bg-white/50 dark:bg-gray-700/50
//                   backdrop-blur-sm
//                   border border-white/60 dark:border-gray-600/60
//                   rounded-lg
//                   text-gray-900 dark:text-gray-100
//                   focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
//                   focus:outline-none
//                   text-sm
//                   transition-all duration-300
//                   appearance-none
//                   disabled:opacity-50 disabled:cursor-not-allowed
//                 "
//                   style={{
//                     backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23999' viewBox='0 0 256 256'%3E%3Cpath d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z'%3E%3C/path%3E%3C/svg%3E")`,
//                     backgroundRepeat: "no-repeat",
//                     backgroundPosition: "right 0.5rem center",
//                     backgroundSize: "0.75em",
//                   }}
//                 >
//                   <option value="">All Roles</option>
//                   {loadingRoles ? (
//                     <option value="" disabled>
//                       Loading roles...
//                     </option>
//                   ) : (
//                     roles.map((r) => (
//                       <option key={`role-${r.id}`} value={r.name}>
//                         {r.name}
//                       </option>
//                     ))
//                   )}
//                 </select>
//               </div>

//               {/* Department Filter */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
//                   Filter by Department
//                 </label>
//                 <select
//                   value={departmentFilter}
//                   onChange={(e) => setDepartmentFilter(e.target.value)}
//                   className="
//                   w-full py-1.5 px-2
//                   bg-white/50 dark:bg-gray-700/50
//                   backdrop-blur-sm
//                   border border-white/60 dark:border-gray-600/60
//                   rounded-lg
//                   text-gray-900 dark:text-gray-100
//                   focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
//                   focus:outline-none
//                   text-sm
//                   transition-all duration-300
//                   appearance-none
//                 "
//                   style={{
//                     backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23999' viewBox='0 0 256 256'%3E%3Cpath d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z'%3E%3C/path%3E%3C/svg%3E")`,
//                     backgroundRepeat: "no-repeat",
//                     backgroundPosition: "right 0.5rem center",
//                     backgroundSize: "0.75em",
//                   }}
//                 >
//                   <option value="">All Departments</option>
//                   {uniqueDepartments.map((dept) => (
//                     <option key={`dept-${dept}`} value={dept}>
//                       {dept}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Zone Filter */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
//                   Filter by Zone
//                 </label>
//                 <select
//                   value={zoneFilter}
//                   onChange={(e) => setZoneFilter(e.target.value)}
//                   className="
//                   w-full py-1.5 px-2
//                   bg-white/50 dark:bg-gray-700/50
//                   backdrop-blur-sm
//                   border border-white/60 dark:border-gray-600/60
//                   rounded-lg
//                   text-gray-900 dark:text-gray-100
//                   focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
//                   focus:outline-none
//                   text-sm
//                   transition-all duration-300
//                   appearance-none
//                 "
//                   style={{
//                     backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23999' viewBox='0 0 256 256'%3E%3Cpath d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z'%3E%3C/path%3E%3C/svg%3E")`,
//                     backgroundRepeat: "no-repeat",
//                     backgroundPosition: "right 0.5rem center",
//                     backgroundSize: "0.75em",
//                   }}
//                 >
//                   <option value="">All Zones</option>
//                   {uniqueZones.map((zoneId) => (
//                     <option key={`zone-${zoneId}`} value={zoneId}>
//                       {zoneId}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             {/* Actions: Clear & Export */}
//             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
//               <div
//                 className="
//               text-xs text-gray-600 dark:text-gray-300
//               px-2 py-1 rounded
//               bg-white/40 dark:bg-gray-700/40
//               backdrop-blur-sm
//               whitespace-nowrap
//             "
//               >
//                 Showing {paginatedUsers.length} of {filteredUsers.length}{" "}
//                 filtered users • Page {currentPage} of {totalPages}
//               </div>

//               <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
//                 <button
//                   onClick={clearFilters}
//                   className="
//                   px-3 py-1.5
//                   bg-linear-to-r from-white/40 to-white/20
//                   dark:from-gray-700/40 dark:to-gray-800/20
//                   backdrop-blur-sm
//                   border border-white/60 dark:border-gray-600/60
//                   text-gray-700 dark:text-gray-300
//                   rounded-lg hover:from-white/60 hover:to-white/40
//                   dark:hover:from-gray-600/60 dark:hover:to-gray-700/40
//                   transition-all duration-300
//                   w-full sm:w-auto
//                   shadow-sm hover:shadow
//                   text-xs
//                   flex items-center justify-center
//                 "
//                 >
//                   <svg
//                     className="w-3 h-3 mr-1"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M6 18L18 6M6 6l12 12"
//                     />
//                   </svg>
//                   Clear Filters
//                 </button>

//                 <button
//                   onClick={exportToExcel}
//                   disabled={exporting || filteredUsers.length === 0}
//                   className="
//                   px-3 py-1.5
//                   bg-lantern-blue-600
//                   text-white
//                   rounded-lg
//                   transition-all duration-300
//                   w-full sm:w-auto
//                   shadow-sm hover:shadow
//                   text-xs
//                   flex items-center justify-center
//                   disabled:opacity-50 disabled:cursor-not-allowed
//                 "
//                 >
//                   {exporting ? (
//                     <>
//                       <svg
//                         className="animate-spin -ml-1 mr-1 h-3 w-3 text-white"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                       >
//                         <circle
//                           className="opacity-25"
//                           cx="12"
//                           cy="12"
//                           r="10"
//                           stroke="currentColor"
//                           strokeWidth="4"
//                         />
//                         <path
//                           className="opacity-75"
//                           fill="currentColor"
//                           d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                         />
//                       </svg>
//                       Exporting...
//                     </>
//                   ) : (
//                     <>
//                       <svg
//                         className="w-3 h-3 mr-1"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
//                         />
//                       </svg>
//                       Export to Excel
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Main content area with scroll */}
//           <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
//             {/* Check store isLoading instead of local loading */}
//             {isLoading && users.length === 0 ? (
//               <div
//                 className="
//                 flex flex-col justify-center items-center py-8 sm:py-12
//                 bg-linear-to-br from-white/30 to-white/10
//                 dark:from-gray-800/30 dark:to-gray-900/10
//                 backdrop-blur-lg
//                 rounded-xl sm:rounded-2xl border border-white/40 dark:border-gray-700/40
//                 text-center
//                 flex-1
//               "
//               >
//                 <LoadingAnimation />
//                 <span className="text-gray-600 dark:text-gray-300 text-sm">
//                   Loading users...
//                 </span>
//               </div>
//             ) : (
//               <>
//                 {/* Debug info for Manager */}
//                 {currentUser?.role === "manager" &&
//                   filteredUsers.length === 0 &&
//                   users.length > 0 && (
//                     <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
//                       <p className="text-yellow-700 dark:text-yellow-300 text-sm font-medium">
//                         ⚠️ No users found in your department.
//                       </p>
//                       <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">
//                         Your department:{" "}
//                         <strong>
//                           {currentUser.departmentName ||
//                             currentUser.department ||
//                             "Not set"}
//                         </strong>
//                       </p>
//                       <p className="text-yellow-600 dark:text-yellow-400 text-xs">
//                         Total users in system: {users.length}
//                       </p>
//                     </div>
//                   )}

//                 {/* Debug info for Zonal Manager */}
//                 {currentUser &&
//                   (currentUser.role === "zonalmanager" ||
//                     currentUser.role === "zonal manager") &&
//                   filteredUsers.length === 0 &&
//                   users.length > 0 && (
//                     <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
//                       <p className="text-yellow-700 dark:text-yellow-300 text-sm font-medium">
//                         ⚠️ No users found in your zone.
//                       </p>
//                       <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">
//                         Your zone ID:{" "}
//                         <strong>{currentUser.zoneId || "Not set"}</strong>
//                       </p>
//                       <p className="text-yellow-600 dark:text-yellow-400 text-xs">
//                         Total users in system: {users.length}
//                       </p>
//                     </div>
//                   )}

//                 {/* Users Table Container with Scroll */}
//                 <div
//                   ref={scrollContainerRef}
//                   className="
//                   overflow-hidden rounded-xl sm:rounded-2xl
//                   bg-linear-to-br from-white/40 to-white/20
//                   dark:from-gray-800/40 dark:to-gray-900/20
//                   backdrop-blur-xl
//                   border border-white/40 dark:border-gray-700/40
//                   shadow-[0_8px_32px_rgba(31,38,135,0.1)]
//                   dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
//                   flex-1
//                   relative
//                   overflow-y-auto
//                   overflow-x-auto
//                 "
//                 >
//                   {/* Desktop Table - 9 columns including Department */}
//                   <div className="hidden md:block min-w-full h-full">
//                     <div className="h-full flex flex-col">
//                       {/* Table Header - 9 columns */}
//                       <div className="shrink-0 sticky top-0 z-10">
//                         <div
//                           className="
//       grid grid-cols-9
//       px-2 md:px-4 py-3
//       bg-gradient-to-r from-white/60 to-white/40
//       dark:from-gray-800/60 dark:to-gray-900/40
//       backdrop-blur-lg
//       border-b border-white/30 dark:border-gray-700/30
//       gap-1 md:gap-2
//     "
//                         >
//                           <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap flex justify-center items-center">
//                             Sr.no
//                           </div>
//                           <div
//                             className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-white/30 dark:hover:bg-gray-800/30 transition-colors duration-300 whitespace-nowrap"
//                             onClick={toggleSortOrder}
//                           >
//                             <div className="flex items-center space-x-1">
//                               <span>Name</span>
//                               <span className="text-blue-600 dark:text-blue-400 text-xs bg-blue-100/50 dark:bg-blue-900/30 rounded-full p-0.5">
//                                 {sortOrder === "asc" ? "↑" : "↓"}
//                               </span>
//                             </div>
//                           </div>
//                           <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
//                             Emp Code
//                           </div>
//                           <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
//                             Email
//                           </div>
//                           <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
//                             Role
//                           </div>
//                           <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
//                             Department
//                           </div>
//                           <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
//                             Zone ID
//                           </div>
//                           <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
//                             Zone Name
//                           </div>
//                           <div className="px-1 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
//                             Allocated Area
//                           </div>
//                         </div>
//                       </div>

//                       {/* Table Body */}
//                       <div className="flex-1 overflow-y-auto">
//                         <div className="divide-y divide-white/20 dark:divide-gray-700/20">
//                           {paginatedUsers.length > 0 ? (
//                             paginatedUsers.map((user, index) => {
//                               const userKey = getUserKey(user, index);
//                               const canEdit = canEditUser(user);
//                               const canDelete = canDeleteUser(user);
//                               const canView = canViewUser(user);
//                               const zoneId = user.zoneId || "";
//                               const zoneName = getZoneName(zoneId);
//                               const allocatedArea = getAllocatedArea(user);

//                               if (!canView) return null;

//                               return (
//                                 <div
//                                   key={userKey}
//                                   className="
//     grid grid-cols-1 sm:grid-cols-9
//     gap-1 md:gap-2
//     px-2 md:px-4 py-3
//     hover:bg-white/30 dark:hover:bg-gray-800/30
//     transition-all duration-300
//     backdrop-blur-sm
//     items-center
//   "
//                                 >
//                                   <div
//                                     onClick={() => handleRowClick(user)}
//                                     className="px-1 py-1 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 cursor-pointer flex justify-center"
//                                   >
//                                     <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium">
//                                       {(currentPage - 1) * limit + index + 1}
//                                     </span>
//                                   </div>

//                                   <div
//                                     onClick={() => handleRowClick(user)}
//                                     className="px-1 py-1 cursor-pointer"
//                                   >
//                                     <div className="flex items-center">
//                                       <div className="shrink-0">
//                                         <div className="h-8 w-8 rounded-lg bg-lantern-blue-600 flex items-center justify-center text-white text-sm font-bold">
//                                           {user.full_name
//                                             ?.charAt(0)
//                                             .toUpperCase() ||
//                                             user.name
//                                               ?.charAt(0)
//                                               .toUpperCase() ||
//                                             "?"}
//                                         </div>
//                                       </div>
//                                       <div className="min-w-0 flex-1 ml-2">
//                                         <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
//                                           {user.full_name || user.name || "N/A"}
//                                         </div>
//                                       </div>
//                                     </div>
//                                   </div>

//                                   <div
//                                     onClick={() => handleRowClick(user)}
//                                     className="px-1 py-1 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
//                                   >
//                                     <div className="bg-white/40 dark:bg-gray-800/40 rounded px-2 md:px-3 py-1.5 backdrop-blur-sm truncate text-center">
//                                       {user.employee_code || "N/A"}
//                                     </div>
//                                   </div>

//                                   <div
//                                     onClick={() => handleRowClick(user)}
//                                     className="px-1 py-1 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
//                                   >
//                                     <div className="truncate bg-white/40 dark:bg-gray-800/40 rounded px-2 md:px-3 py-1.5 backdrop-blur-sm">
//                                       {user.email || "N/A"}
//                                     </div>
//                                   </div>

//                                   <div
//                                     onClick={() => handleRowClick(user)}
//                                     className="px-1 py-1 whitespace-nowrap cursor-pointer"
//                                   >
//                                     <span className="inline-flex items-center justify-center px-2 md:px-3 py-1 rounded-lg text-xs font-medium bg-blue-100/50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 backdrop-blur-sm truncate w-full">
//                                       {user.role || "N/A"}
//                                     </span>
//                                   </div>

//                                   {/* Department Column */}
//                                   <div
//                                     onClick={() => handleRowClick(user)}
//                                     className="px-1 py-1 whitespace-nowrap cursor-pointer"
//                                   >
//                                     <span className="inline-flex items-center justify-center px-2 md:px-3 py-1 rounded-lg text-xs font-medium bg-indigo-100/50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 backdrop-blur-sm truncate w-full">
//                                       {user.department || "N/A"}
//                                     </span>
//                                   </div>

//                                   {/* Zone ID Column */}
//                                   <div
//                                     onClick={() => handleRowClick(user)}
//                                     className="px-1 py-1 whitespace-nowrap cursor-pointer"
//                                   >
//                                     <span
//                                       className="inline-flex items-center justify-center px-2 md:px-3 py-1 rounded-lg text-xs font-medium bg-purple-100/50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 backdrop-blur-sm truncate w-full"
//                                       title={zoneId}
//                                     >
//                                       {zoneId || "Not Assigned"}
//                                     </span>
//                                   </div>

//                                   {/* Zone Name Column */}
//                                   <div
//                                     onClick={() => handleRowClick(user)}
//                                     className="px-1 py-1 whitespace-nowrap cursor-pointer"
//                                   >
//                                     <span
//                                       className="inline-flex items-center truncate justify-center px-2 md:px-3 py-1 rounded-lg text-xs font-medium bg-green-100/50 dark:bg-green-900/30 text-green-800 dark:text-green-300 backdrop-blur-sm truncate w-full"
//                                       title={zoneName}
//                                     >
//                                       {zoneName}
//                                     </span>
//                                   </div>

//                                   {/* Allocated Area Column - Shows user's allocatedArea or zone area */}
//                                   <div
//                                     onClick={() => handleRowClick(user)}
//                                     className="px-1 py-1 whitespace-nowrap cursor-pointer"
//                                   >
//                                     <span
//                                       className="inline-flex items-center justify-center px-2 md:px-3 py-1 rounded-lg text-xs font-medium bg-yellow-100/50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 backdrop-blur-sm truncate w-full"
//                                       title={allocatedArea}
//                                     >
//                                       {allocatedArea}
//                                     </span>
//                                   </div>
//                                 </div>
//                               );
//                             })
//                           ) : (
//                             <div className="col-span-9 px-2 py-6 text-center bg-linear-to-br from-white/30 to-white/10 dark:from-gray-800/30 dark:to-gray-900/10">
//                               <div className="p-4 rounded-xl bg-linear-to-br from-white/40 to-white/20 dark:from-gray-800/40 dark:to-gray-900/20 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 inline-block max-w-[90%]">
//                                 <div className="w-12 h-12 mx-auto mb-3 bg-linear-to-br from-gray-200/50 to-gray-300/30 dark:from-gray-700/50 dark:to-gray-800/30 backdrop-blur-sm border border-gray-300/60 dark:border-gray-600/60 rounded-xl flex items-center justify-center">
//                                   <svg
//                                     className="w-6 h-6 text-gray-400 dark:text-gray-500"
//                                     fill="none"
//                                     stroke="currentColor"
//                                     viewBox="0 0 24 24"
//                                   >
//                                     <path
//                                       strokeLinecap="round"
//                                       strokeLinejoin="round"
//                                       strokeWidth={2}
//                                       d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
//                                     />
//                                   </svg>
//                                 </div>
//                                 <p className="text-sm font-medium bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
//                                   No users found
//                                 </p>
//                                 <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
//                                   {currentUser?.role === "manager"
//                                     ? `No users found in your department (${currentUser.departmentName || currentUser.department || "Not set"})`
//                                     : currentUser &&
//                                         (currentUser.role === "zonalmanager" ||
//                                           currentUser.role === "zonal manager")
//                                       ? `No users found in your zone (${currentUser.zoneId || "Not set"})`
//                                       : "Try adjusting your search or filter criteria"}
//                                 </p>
//                               </div>
//                             </div>
//                           )}
//                         </div>

//                         {/* Infinite scroll sentinel */}
//                         <div ref={sentinelRef} className="h-1"></div>

//                         {/* Loading more indicator */}
//                         {loadingMore && (
//                           <div className="flex justify-center items-center py-3 bg-linear-to-br from-white/30 to-white/10 dark:from-gray-800/30 dark:to-gray-900/10 backdrop-blur-lg rounded-xl border border-white/40 dark:border-gray-700/40 my-2 mx-2">
//                             <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 backdrop-blur-sm mr-2"></div>
//                             <span className="text-gray-600 dark:text-gray-300 text-xs">
//                               Loading more users...
//                             </span>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Mobile Cards View */}
//                   <div className="md:hidden p-4 space-y-4">
//                     {paginatedUsers.length > 0 ? (
//                       paginatedUsers.map((user, index) => {
//                         const userKey = getUserKey(user, index);
//                         const canEdit = canEditUser(user);
//                         const canDelete = canDeleteUser(user);
//                         const canView = canViewUser(user);
//                         const zoneId = user.zoneId || "";
//                         const zoneName = getZoneName(zoneId);
//                         const allocatedArea = getAllocatedArea(user);

//                         if (!canView) return null;

//                         return (
//                           <div
//                             key={userKey}
//                             className="
//                             bg-linear-to-br from-white/40 to-white/20
//                             dark:from-gray-800/40 dark:to-gray-900/20
//                             backdrop-blur-xl
//                             border border-white/40 dark:border-gray-700/40
//                             rounded-xl p-4
//                             shadow-[0_4px_16px_rgba(31,38,135,0.1)]
//                             dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)]
//                           "
//                           >
//                             {/* Card Header */}
//                             <div
//                               className="flex items-start justify-between mb-3 cursor-pointer"
//                               onClick={() => handleRowClick(user)}
//                             >
//                               <div className="flex items-center space-x-3">
//                                 <div className="h-10 w-10 rounded-lg bg-lantern-blue-600 flex items-center justify-center text-white text-sm font-bold">
//                                   {user.full_name?.charAt(0).toUpperCase() ||
//                                     user.name?.charAt(0).toUpperCase() ||
//                                     "?"}
//                                 </div>
//                                 <div>
//                                   <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
//                                     {user.full_name || user.name || "N/A"}
//                                   </h3>
//                                   <p className="text-xs text-gray-600 dark:text-gray-400">
//                                     {user.employee_code || "N/A"}
//                                   </p>
//                                 </div>
//                               </div>
//                               <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-100/50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
//                                 {user.role || "N/A"}
//                               </span>
//                             </div>

//                             {/* Card Body */}
//                             <div
//                               className="space-y-2 cursor-pointer"
//                               onClick={() => handleRowClick(user)}
//                             >
//                               <div className="grid grid-cols-2 gap-2">
//                                 <div>
//                                   <p className="text-xs text-gray-500 dark:text-gray-400">
//                                     Email
//                                   </p>
//                                   <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
//                                     {user.email || "N/A"}
//                                   </p>
//                                 </div>
//                                 <div>
//                                   <p className="text-xs text-gray-500 dark:text-gray-400">
//                                     Department
//                                   </p>
//                                   <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
//                                     {user.department || "N/A"}
//                                   </p>
//                                 </div>
//                               </div>
//                               <div className="grid grid-cols-2 gap-2">
//                                 <div>
//                                   <p className="text-xs text-gray-500 dark:text-gray-400">
//                                     Zone ID
//                                   </p>
//                                   <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
//                                     {zoneId || "Not Assigned"}
//                                   </p>
//                                 </div>
//                                 <div>
//                                   <p className="text-xs text-gray-500 dark:text-gray-400">
//                                     Zone Name
//                                   </p>
//                                   <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
//                                     {zoneName}
//                                   </p>
//                                 </div>
//                               </div>
//                               <div>
//                                 <p className="text-xs text-gray-500 dark:text-gray-400">
//                                   Allocated Area
//                                 </p>
//                                 <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
//                                   {allocatedArea}
//                                 </p>
//                               </div>
//                             </div>

//                             {/* Card Footer */}
//                             <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/30 dark:border-gray-700/30">
//                               <div className="flex items-center space-x-2">
//                                 <span
//                                   className={`w-2 h-2 rounded-full ${user.is_checkin ? "bg-green-500" : "bg-red-500"}`}
//                                 ></span>
//                                 <span className="text-xs text-gray-600 dark:text-gray-400">
//                                   {user.is_checkin ? "Online" : "Offline"}
//                                 </span>
//                               </div>
//                               {/* Mobile action buttons */}
//                               <div className="flex space-x-2">
//                                 {canEdit && (
//                                   <button
//                                     onClick={() => handleEditClick(user)}
//                                     className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/80 hover:bg-blue-600/80 text-white transition-all duration-300"
//                                   >
//                                     Edit
//                                   </button>
//                                 )}
//                                 {canDelete && (
//                                   <button
//                                     onClick={() => handleDeleteClick(user)}
//                                     className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/80 hover:bg-red-600/80 text-white transition-all duration-300"
//                                   >
//                                     Delete
//                                   </button>
//                                 )}
//                               </div>
//                             </div>
//                           </div>
//                         );
//                       })
//                     ) : (
//                       <div className="text-center py-8">
//                         <div className="p-4 rounded-xl bg-linear-to-br from-white/40 to-white/20 dark:from-gray-800/40 dark:to-gray-900/20 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 inline-block max-w-[90%]">
//                           <div className="w-12 h-12 mx-auto mb-3 bg-linear-to-br from-gray-200/50 to-gray-300/30 dark:from-gray-700/50 dark:to-gray-800/30 backdrop-blur-sm border border-gray-300/60 dark:border-gray-600/60 rounded-xl flex items-center justify-center">
//                             <svg
//                               className="w-6 h-6 text-gray-400 dark:text-gray-500"
//                               fill="none"
//                               stroke="currentColor"
//                               viewBox="0 0 24 24"
//                             >
//                               <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth={2}
//                                 d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
//                               />
//                             </svg>
//                           </div>
//                           <p className="text-sm font-medium bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
//                             No users found
//                           </p>
//                           <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
//                             Try adjusting your search or filter criteria
//                           </p>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Pagination Controls */}
//                 {renderPagination()}
//               </>
//             )}
//           </div>
//         </div>

//         {/* User Details Modal */}
//         {isModalOpen && selectedUser && (
//           <div className="fixed inset-0 z-50 bg-black/70">
//             <div className="bg-white dark:bg-gray-900 w-full h-full flex flex-col overflow-hidden">
//               {/* Header */}
//               <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0">
//                 <div>
//                   <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
//                     User Details
//                   </h2>
//                   <p className="text-sm text-gray-500 dark:text-gray-400">
//                     ID: {selectedUser.id || selectedUser.userId || "N/A"}
//                   </p>
//                 </div>
//                 <button
//                   onClick={closeModal}
//                   className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
//                 >
//                   <svg
//                     className="w-6 h-6 text-gray-500 dark:text-gray-400"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M6 18L18 6M6 6l12 12"
//                     />
//                   </svg>
//                 </button>
//               </div>

//               {/* Content */}
//               <div className="flex-1 overflow-y-auto">
//                 <div className="p-6">
//                   <div className="mb-8">
//                     <div className="flex items-center space-x-4">
//                       {selectedUser.profileImageUrl ||
//                       selectedUser.profile_image ? (
//                         <img
//                           src={
//                             selectedUser.profileImageUrl ||
//                             selectedUser.profile_image
//                           }
//                           alt={
//                             selectedUser.full_name || selectedUser.name || "N/A"
//                           }
//                           className="w-24 h-24 rounded-xl object-cover border-2 border-gray-300 dark:border-gray-700"
//                         />
//                       ) : (
//                         <div className="w-24 h-24 rounded-xl bg-lantern-blue-600 flex items-center justify-center text-white text-3xl font-bold">
//                           {(
//                             selectedUser.name?.charAt(0) ||
//                             selectedUser.full_name?.charAt(0) ||
//                             "?"
//                           ).toUpperCase()}
//                         </div>
//                       )}
//                       <div>
//                         <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
//                           {selectedUser.full_name || selectedUser.name || "N/A"}
//                         </h3>
//                         <p className="text-base text-gray-500 dark:text-gray-400 mt-1">
//                           {selectedUser.employee_code || "No employee code"}
//                         </p>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="mb-8">
//                     <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
//                       Basic Information
//                     </h3>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Full Name
//                         </label>
//                         <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
//                           <p className="text-gray-900 dark:text-white text-base">
//                             {selectedUser.full_name || "N/A"}
//                           </p>
//                         </div>
//                       </div>
//                       <div>
//                         <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Email Address
//                         </label>
//                         <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
//                           <p className="text-gray-900 dark:text-white text-base">
//                             {selectedUser.email || "N/A"}
//                           </p>
//                         </div>
//                       </div>
//                       <div>
//                         <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Mobile Number
//                         </label>
//                         <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
//                           <p className="text-gray-900 dark:text-white text-base">
//                             {selectedUser.mobileNo || "Not specified"}
//                           </p>
//                         </div>
//                       </div>
//                       <div>
//                         <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Birth Date
//                         </label>
//                         <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
//                           <p className="text-gray-900 dark:text-white text-base">
//                             {selectedUser.birthDate
//                               ? new Date(
//                                   selectedUser.birthDate,
//                                 ).toLocaleDateString()
//                               : "Not specified"}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   {selectedUser.address && (
//                     <div className="mb-8">
//                       <div>
//                         <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Address
//                         </label>
//                         <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
//                           <p className="text-gray-900 dark:text-white whitespace-pre-line text-base">
//                             {selectedUser.address}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {/* Department & Role Information */}
//                   <div className="mb-8">
//                     <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
//                       Role & Department
//                     </h3>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Department
//                         </label>
//                         <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
//                           <p className="text-gray-900 dark:text-white text-base">
//                             {selectedUser.department || "N/A"}
//                           </p>
//                         </div>
//                       </div>
//                       <div>
//                         <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Role
//                         </label>
//                         <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
//                           <p className="text-gray-900 dark:text-white text-base">
//                             {selectedUser.role || "N/A"}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Zone Information Section */}
//                   <div className="mb-8">
//                     <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
//                       Zone & Location Information
//                     </h3>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Zone ID
//                         </label>
//                         <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
//                           <p className="text-gray-900 dark:text-white text-base">
//                             {selectedUser.zoneId || "Not Assigned"}
//                           </p>
//                         </div>
//                       </div>
//                       <div>
//                         <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Zone Name
//                         </label>
//                         <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
//                           <p className="text-gray-900 dark:text-white text-base">
//                             {getZoneName(selectedUser.zoneId || "")}
//                           </p>
//                         </div>
//                       </div>
//                       <div>
//                         <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Allocated Area
//                         </label>
//                         <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
//                           <p className="text-gray-900 dark:text-white text-base">
//                             {getAllocatedArea(selectedUser)}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="mb-12">
//                     <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
//                       Status & Employment
//                     </h3>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Status
//                         </label>
//                         <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
//                           <div className="flex items-center">
//                             <span
//                               className={`w-3 h-3 rounded-full mr-3 ${selectedUser.is_checkin ? "bg-green-500" : "bg-red-500"}`}
//                             ></span>
//                             <p
//                               className={`font-medium text-base ${selectedUser.is_checkin ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
//                             >
//                               {selectedUser.is_checkin ? "Online" : "Offline"}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                       <div>
//                         <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Date Joined
//                         </label>
//                         <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
//                           <p className="text-gray-900 dark:text-white text-base">
//                             {selectedUser.date
//                               ? new Date(selectedUser.date).toLocaleDateString()
//                               : "Not specified"}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Footer */}
//               <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0">
//                 <div className="flex justify-end space-x-4">
//                   <button
//                     type="button"
//                     onClick={closeModal}
//                     className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-base"
//                   >
//                     Close
//                   </button>
//                   {canEditUser(selectedUser) && (
//                     <button
//                       type="button"
//                       onClick={() => handleEditClick(selectedUser)}
//                       className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center min-w-[140px] text-base"
//                     >
//                       Edit User
//                     </button>
//                   )}
//                   {canDeleteUser(selectedUser) && (
//                     <button
//                       type="button"
//                       onClick={() => handleDeleteClick(selectedUser)}
//                       className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all flex items-center justify-center min-w-[140px] text-base"
//                     >
//                       Delete User
//                     </button>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Edit User Modal - UPDATED with separate allocatedArea field */}
//         {isEditModalOpen && selectedUser && canEditUser(selectedUser) && (
//           <div className="fixed inset-0 z-50 bg-black/70">
//             <div className="bg-white dark:bg-gray-900 w-full h-full flex flex-col overflow-hidden">
//               {/* Header */}
//               <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0">
//                 <div>
//                   <h2 className="text-xl font-bold text-gray-900 dark:text-white">
//                     Edit User
//                   </h2>
//                 </div>
//                 <button
//                   onClick={closeEditModal}
//                   className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
//                 >
//                   <svg
//                     className="w-6 h-6 text-gray-500 dark:text-gray-400"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M6 18L18 6M6 6l12 12"
//                     />
//                   </svg>
//                 </button>
//               </div>

//               {/* Form */}
//               <form
//                 onSubmit={handleEditSubmit}
//                 className="flex-1 overflow-y-auto"
//               >
//                 <div className="p-6">
//                   <div className="mb-8">
//                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
//                       Basic Information
//                     </h3>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Full Name *
//                         </label>
//                         <input
//                           type="text"
//                           name="full_name"
//                           value={editForm.full_name}
//                           onChange={handleEditFormChange}
//                           required
//                           className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//                           placeholder="Enter full name"
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Username
//                         </label>
//                         <input
//                           type="text"
//                           name="username"
//                           value={editForm.username}
//                           onChange={handleEditFormChange}
//                           required
//                           className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//                           placeholder="Enter username"
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Email Address *
//                         </label>
//                         <input
//                           type="email"
//                           name="email"
//                           value={editForm.email}
//                           onChange={handleEditFormChange}
//                           required
//                           className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//                           placeholder="Enter email address"
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Mobile Number
//                         </label>
//                         <input
//                           type="tel"
//                           name="mobileNo"
//                           value={editForm.mobileNo}
//                           onChange={handleEditFormChange}
//                           className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//                           placeholder="Enter mobile number"
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Birth Date
//                         </label>
//                         <input
//                           type="date"
//                           name="birthDate"
//                           value={editForm.birthDate}
//                           onChange={handleEditFormChange}
//                           className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//                         />
//                       </div>
//                     </div>
//                   </div>

//                   <div className="mb-8">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                         Address
//                       </label>
//                       <textarea
//                         name="address"
//                         value={editForm.address}
//                         onChange={handleEditFormChange}
//                         rows={3}
//                         className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
//                         placeholder="Enter address"
//                       />
//                     </div>
//                   </div>

//                   <div className="mb-8">
//                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
//                       Department & Role
//                     </h3>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Department *
//                         </label>
//                         {loadingDepartments ? (
//                           <div className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
//                             <p className="text-gray-500 dark:text-gray-400">
//                               Loading departments...
//                             </p>
//                           </div>
//                         ) : departments.length === 0 ? (
//                           <div className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
//                             <p className="text-red-600 dark:text-red-400">
//                               Failed to load departments. Please refresh.
//                             </p>
//                           </div>
//                         ) : (
//                           <select
//                             name="departmentId"
//                             value={editForm.departmentId}
//                             onChange={handleEditFormChange}
//                             required
//                             className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
//                           >
//                             <option value={0}>Select Department</option>
//                             {departments.map((dept) => (
//                               <option
//                                 key={`dept-${dept.departmentId}`}
//                                 value={dept.departmentId}
//                               >
//                                 {dept.name}
//                               </option>
//                             ))}
//                           </select>
//                         )}
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Role *
//                         </label>
//                         {loadingRoles ? (
//                           <div className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
//                             <p className="text-gray-500 dark:text-gray-400">
//                               Loading roles...
//                             </p>
//                           </div>
//                         ) : roles.length === 0 ? (
//                           <div className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
//                             <p className="text-red-600 dark:text-red-400">
//                               Failed to load roles. Please refresh.
//                             </p>
//                           </div>
//                         ) : (
//                           <select
//                             name="roleId"
//                             value={editForm.roleId}
//                             onChange={handleEditFormChange}
//                             required
//                             className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
//                           >
//                             <option value={0}>Select Role</option>
//                             {roles.map((role) => (
//                               <option key={`role-${role.id}`} value={role.id}>
//                                 {role.name}
//                               </option>
//                             ))}
//                           </select>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   <div className="mb-8">
//                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
//                       Zone Assignment
//                     </h3>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Zone *
//                         </label>
//                         {loadingZones ? (
//                           <div className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
//                             <p className="text-gray-500 dark:text-gray-400">
//                               Loading zones...
//                             </p>
//                           </div>
//                         ) : zones.length === 0 ? (
//                           <div className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
//                             <p className="text-red-600 dark:text-red-400">
//                               Failed to load zones. Please refresh.
//                             </p>
//                           </div>
//                         ) : (
//                           <select
//                             name="zoneId"
//                             value={editForm.zoneId}
//                             onChange={handleEditFormChange}
//                             required
//                             className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
//                           >
//                             <option value="">Select Zone</option>
//                             {zones.map((zone: Zone) => (
//                               <option
//                                 key={`zone-${zone.id}`}
//                                 value={zone.zoneId}
//                               >
//                                 {zone.zoneId} - {zone.name} ({zone.area},{" "}
//                                 {zone.city})
//                               </option>
//                             ))}
//                           </select>
//                         )}
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Allocated Area
//                         </label>
//                         <input
//                           type="text"
//                           name="allocatedArea"
//                           value={editForm.allocatedArea}
//                           onChange={handleEditFormChange}
//                           className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//                           placeholder="Enter allocated area (optional)"
//                         />
//                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//                           {editForm.zoneId && zones.length > 0
//                             ? `Zone area: ${getZoneArea(editForm.zoneId)}`
//                             : "Leave empty to use zone area"}
//                         </p>
//                       </div>
//                     </div>
//                     {editForm.zoneId && (
//                       <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
//                         <p className="text-xs text-blue-600 dark:text-blue-300">
//                           Selected Zone: <strong>{editForm.zoneName}</strong> (
//                           {editForm.zoneId})
//                           <br />
//                           Zone Area:{" "}
//                           <strong>{getZoneArea(editForm.zoneId)}</strong>
//                         </p>
//                       </div>
//                     )}
//                   </div>

//                   <div className="mb-8">
//                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
//                       Profile & Preferences
//                     </h3>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Profile Image URL
//                         </label>
//                         <input
//                           type="url"
//                           name="profileImageUrl"
//                           value={editForm.profileImageUrl}
//                           onChange={handleEditFormChange}
//                           className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//                           placeholder="https://example.com/profile.jpg"
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </form>

//               {/* Footer */}
//               <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0">
//                 <div className="flex justify-end space-x-4">
//                   <button
//                     type="button"
//                     onClick={closeEditModal}
//                     disabled={isEditing}
//                     className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     onClick={handleEditSubmit}
//                     disabled={
//                       isEditing ||
//                       loadingDepartments ||
//                       loadingRoles ||
//                       loadingZones ||
//                       departments.length === 0 ||
//                       roles.length === 0 ||
//                       zones.length === 0
//                     }
//                     className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
//                   >
//                     {isEditing ? (
//                       <>
//                         <svg
//                           className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
//                           fill="none"
//                           viewBox="0 0 24 24"
//                         >
//                           <circle
//                             className="opacity-25"
//                             cx="12"
//                             cy="12"
//                             r="10"
//                             stroke="currentColor"
//                             strokeWidth="4"
//                           />
//                           <path
//                             className="opacity-75"
//                             fill="currentColor"
//                             d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                           />
//                         </svg>
//                         Updating...
//                       </>
//                     ) : (
//                       "Save Changes"
//                     )}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Delete Confirmation Modal */}
//         {isDeleteModalOpen && selectedUser && (
//           <div className="fixed inset-0 z-[9999] bg-black/70">
//             <div className="bg-white dark:bg-gray-900 w-full h-full flex flex-col overflow-hidden">
//               {/* Header */}
//               <div className="flex items-center justify-between border-b border-red-100 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-6 py-4 shrink-0">
//                 <div className="flex items-center gap-3">
//                   <svg
//                     className="w-6 h-6 text-red-600 dark:text-red-400"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z"
//                     />
//                   </svg>
//                   <h2 className="text-xl font-bold text-red-700 dark:text-red-300">
//                     Delete User
//                   </h2>
//                   <span className="text-sm text-gray-600 dark:text-gray-400">
//                     • Confirm deletion of user account
//                   </span>
//                 </div>
//                 <button
//                   onClick={closeDeleteModal}
//                   className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
//                   disabled={deleting}
//                 >
//                   <svg
//                     className="w-6 h-6 text-gray-500 dark:text-gray-400"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M6 18L18 6M6 6l12 12"
//                     />
//                   </svg>
//                 </button>
//               </div>

//               {/* Content - Scrollable */}
//               <div className="flex-1 overflow-y-auto p-6">
//                 <div className="max-w-4xl mx-auto">
//                   {/* Warning Banner */}
//                   <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
//                     <div className="flex items-start gap-3">
//                       <svg
//                         className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z"
//                         />
//                       </svg>
//                       <div>
//                         <h3 className="font-bold text-red-800 dark:text-red-300 text-lg mb-1">
//                           Permanent Action Required
//                         </h3>
//                         <p className="text-red-700 dark:text-red-400">
//                           This will permanently delete the user account and all
//                           associated data including access logs, permissions,
//                           and activity history. This action cannot be undone.
//                         </p>
//                       </div>
//                     </div>
//                   </div>

//                   {/* User Information Section */}
//                   <div className="mb-8">
//                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
//                       User Information
//                     </h3>

//                     {/* User Profile Card */}
//                     <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 mb-6">
//                       <div className="flex items-start gap-4 mb-6">
//                         <div className="h-16 w-16 rounded-lg bg-lantern-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
//                           {(
//                             selectedUser.full_name?.charAt(0) ||
//                             selectedUser.name?.charAt(0) ||
//                             "?"
//                           ).toUpperCase()}
//                         </div>
//                         <div className="flex-1">
//                           <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
//                             {selectedUser.full_name ||
//                               selectedUser.name ||
//                               "N/A"}
//                           </h4>
//                           <p className="text-gray-600 dark:text-gray-400 mb-3">
//                             {selectedUser.employee_code || "No employee code"}
//                           </p>
//                           <div className="flex flex-wrap gap-2">
//                             <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
//                               {selectedUser.role || "N/A"}
//                             </span>
//                             <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium">
//                               {selectedUser.department || "N/A"}
//                             </span>
//                           </div>
//                         </div>
//                       </div>

//                       {/* Details Grid */}
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                         {/* Contact Information */}
//                         <div>
//                           <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
//                             Contact Information
//                           </h4>
//                           <div className="space-y-3">
//                             <div>
//                               <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
//                                 Email Address
//                               </p>
//                               <p className="font-medium text-gray-900 dark:text-white">
//                                 {selectedUser.email || "N/A"}
//                               </p>
//                             </div>
//                           </div>
//                         </div>

//                         {/* Zone Information */}
//                         <div>
//                           <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
//                             Zone Information
//                           </h4>
//                           <div className="space-y-3">
//                             <div>
//                               <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
//                                 Zone ID
//                               </p>
//                               <p className="font-medium text-gray-900 dark:text-white">
//                                 {selectedUser.zoneId || "Not Assigned"}
//                               </p>
//                             </div>
//                             <div>
//                               <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
//                                 Zone Name
//                               </p>
//                               <p className="font-medium text-gray-900 dark:text-white">
//                                 {getZoneName(selectedUser.zoneId || "")}
//                               </p>
//                             </div>
//                             <div>
//                               <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
//                                 Allocated Area
//                               </p>
//                               <p className="font-medium text-gray-900 dark:text-white">
//                                 {getAllocatedArea(selectedUser)}
//                               </p>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     {/* User ID Section */}
//                     <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div>
//                           <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
//                             User ID
//                           </p>
//                           <p className="font-mono text-gray-900 dark:text-white font-medium">
//                             {selectedUser.id || selectedUser._id || "N/A"}
//                           </p>
//                         </div>
//                         {selectedUser.createdAt && (
//                           <div>
//                             <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
//                               Account Created
//                             </p>
//                             <p className="text-gray-900 dark:text-white">
//                               {new Date(
//                                 selectedUser.createdAt,
//                               ).toLocaleDateString("en-US", {
//                                 year: "numeric",
//                                 month: "long",
//                                 day: "numeric",
//                               })}
//                             </p>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Impact Warning Section */}
//                   <div className="mb-8">
//                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
//                       Impact of Deletion
//                     </h3>
//                     <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
//                       <div className="flex items-start gap-3">
//                         <svg
//                           className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                           />
//                         </svg>
//                         <div>
//                           <ul className="text-yellow-700 dark:text-yellow-300 space-y-2">
//                             <li className="flex items-start gap-2">
//                               <span className="text-yellow-600 dark:text-yellow-400 mt-1">
//                                 •
//                               </span>
//                               <span>
//                                 All user data will be permanently removed from
//                                 the system
//                               </span>
//                             </li>
//                             <li className="flex items-start gap-2">
//                               <span className="text-yellow-600 dark:text-yellow-400 mt-1">
//                                 •
//                               </span>
//                               <span>
//                                 Access permissions and credentials will be
//                                 revoked immediately
//                               </span>
//                             </li>
//                             <li className="flex items-start gap-2">
//                               <span className="text-yellow-600 dark:text-yellow-400 mt-1">
//                                 •
//                               </span>
//                               <span>
//                                 Any ongoing sessions and tasks will be
//                                 terminated
//                               </span>
//                             </li>
//                             <li className="flex items-start gap-2">
//                               <span className="text-yellow-600 dark:text-yellow-400 mt-1">
//                                 •
//                               </span>
//                               <span>
//                                 This action is irreversible and cannot be
//                                 recovered
//                               </span>
//                             </li>
//                           </ul>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Confirmation Note */}
//                   <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
//                     <div className="flex items-start gap-3">
//                       <svg
//                         className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                         />
//                       </svg>
//                       <div>
//                         <p className="text-blue-700 dark:text-blue-300">
//                           <strong>
//                             Please review all information carefully
//                           </strong>{" "}
//                           before proceeding with deletion. Make sure this is the
//                           correct user account and you understand the
//                           consequences of this action.
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Footer */}
//               <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0">
//                 <div className="flex justify-end space-x-4">
//                   <button
//                     type="button"
//                     onClick={closeDeleteModal}
//                     disabled={deleting}
//                     className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="button"
//                     onClick={handleDeleteConfirm}
//                     disabled={deleting}
//                     className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
//                   >
//                     {deleting ? (
//                       <>
//                         <svg
//                           className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
//                           fill="none"
//                           viewBox="0 0 24 24"
//                         >
//                           <circle
//                             className="opacity-25"
//                             cx="12"
//                             cy="12"
//                             r="10"
//                             stroke="currentColor"
//                             strokeWidth="4"
//                           />
//                           <path
//                             className="opacity-75"
//                             fill="currentColor"
//                             d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                           />
//                         </svg>
//                         Deleting...
//                       </>
//                     ) : (
//                       "Delete User"
//                     )}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </>
//   );
// };

// export default UserList;
