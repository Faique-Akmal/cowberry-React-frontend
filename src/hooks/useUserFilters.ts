// hooks/useUserFilters.ts
import { useMemo } from "react";
import { User, CurrentUser, FilterState } from "../types/user.types";
import { normalizeString, normalizeRole } from "../utils/user.helpers";

export const useUserFilters = (
  users: User[],
  currentUser: CurrentUser | null,
  filterState: FilterState,
): User[] => {
  return useMemo(() => {
    if (!users || users.length === 0) return [];

    let filtered = [...users];

    // 1. Apply role-based permissions first
    if (currentUser) {
      switch (currentUser.role) {
        case "manager":
          filtered = filtered.filter(
            (user) =>
              normalizeString(user.department) ===
                normalizeString(currentUser.department) ||
              (user.department && currentUser.department
                ? user.department
                    .toLowerCase()
                    .includes(currentUser.department.toLowerCase())
                : false),
          );
          break;
        case "zonalmanager":
        case "zonal manager":
          if (currentUser.zoneId) {
            filtered = filtered.filter(
              (user) => user.zoneId === currentUser.zoneId,
            );
          }
          break;
        default:
          // HR and other roles can see all users
          break;
      }
    }

    // 2. Apply search filter
    if (filterState.searchTerm.trim()) {
      const searchTerm = normalizeString(filterState.searchTerm);
      filtered = filtered.filter((user) => {
        const name = normalizeString(user.full_name || user.name);
        const email = normalizeString(user.email);
        const employeeCode = normalizeString(user.employee_code);
        const department = normalizeString(user.department);
        const role = normalizeRole(user.role);
        const zoneId = user.zoneId || "";

        return (
          name.includes(searchTerm) ||
          email.includes(searchTerm) ||
          employeeCode.includes(searchTerm) ||
          department.includes(searchTerm) ||
          role.includes(searchTerm) ||
          zoneId.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // 3. Apply role filter
    if (filterState.roleFilter) {
      filtered = filtered.filter(
        (user) =>
          normalizeRole(user.role) === normalizeRole(filterState.roleFilter),
      );
    }

    // 4. Apply department filter
    if (filterState.departmentFilter) {
      filtered = filtered.filter(
        (user) =>
          normalizeString(user.department) ===
          normalizeString(filterState.departmentFilter),
      );
    }

    // 5. Apply zone filter
    if (filterState.zoneFilter) {
      filtered = filtered.filter(
        (user) => user.zoneId === filterState.zoneFilter,
      );
    }

    // 6. Apply status filter
    if (filterState.statusFilter) {
      if (filterState.statusFilter === "online") {
        filtered = filtered.filter((user) => user.is_checkin);
      } else if (filterState.statusFilter === "offline") {
        filtered = filtered.filter((user) => !user.is_checkin);
      }
    }

    // 7. Apply sorting
    filtered.sort((a, b) => {
      const nameA = normalizeString(a.full_name || a.name);
      const nameB = normalizeString(b.full_name || b.name);

      if (filterState.sortOrder === "asc") {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

    return filtered;
  }, [users, currentUser, filterState]);
};
