import { useCallback } from "react";
import { User, CurrentUser } from "../types/user.types";
import { normalizeString, normalizeRole } from "../utils/user.helpers";

export const useUserPermissions = (currentUser: CurrentUser | null) => {
  const canEditUser = useCallback(
    (user: User): boolean => {
      if (!currentUser) return false;

      const userRole = normalizeRole(currentUser.role);

      switch (userRole) {
        case "hr":
        case "admin":
          return true;
        case "manager":
        case "headofdepartment":
        case "head of department": {
          if (!currentUser.departmentName && !currentUser.department)
            return false;

          const managerDept = normalizeString(
            currentUser.departmentName || currentUser.department,
          );
          const userDept = normalizeString(user.department);

          return managerDept === userDept;
        }
        case "zonalmanager":
        case "zonal manager":
          return false; // Zonal managers cannot edit anyone
        default:
          return false;
      }
    },
    [currentUser],
  );

  const canDeleteUser = useCallback(
    (user: User): boolean => {
      if (!currentUser) return false;

      const userRole = normalizeRole(currentUser.role);

      // Only HR/Admin can delete users
      if (userRole !== "hr" && userRole !== "admin") return false;

      // Prevent users from deleting themselves
      if (currentUser.id === user.id || currentUser.id === user.userId) {
        return false;
      }

      // HR/Admin can delete all users except themselves
      return true;
    },
    [currentUser],
  );

  const canViewUser = useCallback(
    (user: User): boolean => {
      if (!currentUser) return false;
      const userRole = normalizeRole(currentUser.role);

      switch (userRole) {
        case "hr":
        case "admin":
          return true;
        case "manager":
        case "headofdepartment":
        case "head of department": {
          if (!currentUser.departmentName && !currentUser.department)
            return false;
          const managerDept = normalizeString(
            currentUser.departmentName || currentUser.department,
          );
          const userDept = normalizeString(user.department);
          return managerDept === userDept;
        }
        case "zonalmanager":
        case "zonal manager": {
          // IMPORTANT: currentUser.zoneId (from localStorage/login) is the
          // zone's numeric internal id (e.g. 3), which matches user.zone.id
          // on the list items - NOT user.zone.zoneId (the string code, e.g.
          // "AHM001"). Match against zone.id first, fall back to zoneId /
          // zone.zoneId in case the manager's zone is ever stored that way.
          const managerZoneId =
            currentUser.zoneId ||
            currentUser.zone?.id ||
            currentUser.zone?.zoneId ||
            "";
          if (!managerZoneId) return false;

          const normalizedManagerZoneId = normalizeString(
            String(managerZoneId),
          );
          const userZoneId = normalizeString(
            String(user.zone?.id ?? user.zoneId ?? user.zone?.zoneId ?? ""),
          );
          return normalizedManagerZoneId === userZoneId;
        }
        default:
          return true;
      }
    },
    [currentUser],
  );

  return {
    canEditUser,
    canDeleteUser,
    canViewUser,
  };
};
