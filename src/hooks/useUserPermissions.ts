import { useCallback } from "react";
import { User, CurrentUser } from "../types/user.types";
import { normalizeString, normalizeRole } from "../utils/user.helpers";

export const useUserPermissions = (currentUser: CurrentUser | null) => {
  const canEditUser = useCallback(
    (user: User): boolean => {
      if (!currentUser) return false;

      const userRole = currentUser.role;

      switch (userRole) {
        case "hr":
          return true;
        case "manager": {
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
          return false;
        default:
          return false;
      }
    },
    [currentUser],
  );

  const canDeleteUser = useCallback(
    (user: User): boolean => {
      if (!currentUser) return false;

      const userRole = currentUser.role;
      const normalizedUserRole = normalizeRole(user.role);

      // Only HR and Manager can delete users
      if (userRole !== "hr" && userRole !== "manager") return false;

      // Prevent users from deleting themselves
      if (currentUser.id === user.id || currentUser.id === user.userId) {
        return false;
      }

      switch (userRole) {
        case "hr":
          // HR can delete all users except themselves
          return true;
        case "manager": {
          if (!currentUser.departmentName && !currentUser.department)
            return false;

          const managerDept = normalizeString(
            currentUser.departmentName || currentUser.department,
          );
          const userDept = normalizeString(user.department);

          // Manager can only delete users from their own department
          return managerDept === userDept;
        }
        default:
          return false;
      }
    },
    [currentUser],
  );

  const canViewUser = useCallback(
    (user: User): boolean => {
      if (!currentUser) return false;
      const userRole = currentUser.role;

      switch (userRole) {
        case "hr":
          return true;
        case "manager": {
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
          if (!currentUser.zoneId) return false;
          const managerZoneId = normalizeString(currentUser.zoneId);
          const userZoneId = normalizeString(user.zoneId || "");
          return managerZoneId === userZoneId;
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
