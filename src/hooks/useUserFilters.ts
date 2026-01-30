import { useMemo } from "react";
import { User, FilterState } from "../types/user.types";
import { useUserPermissions } from "./useUserPermissions";

export const useUserFilters = (
  users: User[],
  currentUser: any,
  filterState: FilterState,
) => {
  const { canViewUser } = useUserPermissions(currentUser);

  const filteredUsers = useMemo(() => {
    if (!users || users.length === 0) return [];

    let result = [...users];

    // Permission Filtering
    if (currentUser) {
      result = result.filter((user) => canViewUser(user));
    }

    const {
      searchTerm,
      roleFilter,
      departmentFilter,
      zoneFilter,
      statusFilter,
      sortOrder,
    } = filterState;

    // Search Filtering
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(searchLower) ||
          user.name?.toLowerCase().includes(searchLower) ||
          user.employee_code?.toLowerCase().includes(searchLower) ||
          user.employee_code?.includes(searchTerm.trim()) ||
          user.email?.toLowerCase().includes(searchLower) ||
          (user.zoneId && user.zoneId.toLowerCase().includes(searchLower)) ||
          (user.zoneName &&
            user.zoneName.toLowerCase().includes(searchLower)) ||
          (user.department &&
            user.department.toLowerCase().includes(searchLower)) ||
          (user.role && user.role.toLowerCase().includes(searchLower)) ||
          (user.mobileNo && user.mobileNo.includes(searchTerm.trim())) ||
          (user.allocatedArea &&
            user.allocatedArea.toLowerCase().includes(searchLower)),
      );
    }

    // Role Filtering
    if (roleFilter !== "") {
      result = result.filter((user) => user.role === roleFilter);
    }

    // Department Filtering
    if (departmentFilter !== "") {
      result = result.filter((user) => user.department === departmentFilter);
    }

    // Zone Filtering
    if (zoneFilter !== "") {
      result = result.filter((user) => user.zoneId === zoneFilter);
    }

    // Status Filtering
    if (statusFilter !== "") {
      result = result.filter((user) => {
        if (statusFilter === "online") return user.is_checkin;
        if (statusFilter === "offline") return !user.is_checkin;
        return true;
      });
    }

    // Sorting
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
  }, [users, currentUser, canViewUser, filterState]);

  return filteredUsers;
};
