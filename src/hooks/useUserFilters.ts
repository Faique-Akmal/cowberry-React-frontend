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
      const role = normalizeRole(currentUser.role);

      switch (role) {
        case "manager":
        case "headofdepartment":
        case "head of department":
          if (currentUser.departmentName || currentUser.department) {
            const userDept = normalizeString(
              currentUser.departmentName || currentUser.department,
            );
            filtered = filtered.filter(
              (user) => normalizeString(user.department) === userDept,
            );
          }
          break;
        case "zonalmanager":
        case "zonal manager": {
          // IMPORTANT: currentUser.zoneId (from localStorage/login) is the
          // zone's numeric internal id (e.g. 3), which matches user.zone.id
          // on the list items - NOT user.zone.zoneId (the string code, e.g.
          // "AHM001"). Both fields are unfortunately both called "zoneId"
          // in different parts of the API, so they look interchangeable
          // but are not. We match against zone.id first, and fall back to
          // zoneId / zone.zoneId in case the manager's zone is ever stored
          // that way instead.
          const managerZoneId =
            currentUser.zoneId ||
            currentUser.zone?.id ||
            currentUser.zone?.zoneId ||
            "";

          if (managerZoneId) {
            const normalizedManagerZoneId = normalizeString(
              String(managerZoneId),
            );
            filtered = filtered.filter((user) => {
              const userZoneId =
                user.zone?.id ?? user.zoneId ?? user.zone?.zoneId ?? "";
              return (
                normalizeString(String(userZoneId)) === normalizedManagerZoneId
              );
            });
          } else {
            // No zone on the manager -> they shouldn't see anyone until
            // their zone is set, rather than silently falling through to
            // "see everyone".
            filtered = [];
          }
          break;
        }
        case "hr":
        case "admin":
        default:
          // HR/Admin can see all users
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
        const zoneId = normalizeString(
          String(user.zoneId || user.zone?.zoneId || ""),
        );

        return (
          name.includes(searchTerm) ||
          email.includes(searchTerm) ||
          employeeCode.includes(searchTerm) ||
          department.includes(searchTerm) ||
          role.includes(searchTerm) ||
          zoneId.includes(searchTerm)
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
      filtered = filtered.filter((user) => {
        const userZoneId = user.zoneId || user.zone?.zoneId || "";
        return (
          normalizeString(String(userZoneId)) ===
          normalizeString(String(filterState.zoneFilter))
        );
      });
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
