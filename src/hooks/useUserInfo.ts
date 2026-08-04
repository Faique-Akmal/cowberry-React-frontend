// src/hooks/useUserInfo.ts
import { useEffect, useState } from "react";

interface UserInfo {
  userRole?: string;
  department?: string;
  allocatedArea?: string;
}

export const useUserInfo = () => {
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const getUserInfo = () => {
      try {
        const userDataStr = localStorage.getItem("user");
        let userData = null;
        if (userDataStr) {
          try {
            userData = JSON.parse(userDataStr);
          } catch (e) {
            console.error("Error parsing user data:", e);
          }
        }

        // Try multiple sources for role
        let userRole = "";
        if (localStorage.getItem("userRole")) {
          userRole = localStorage.getItem("userRole") || "";
        } else if (localStorage.getItem("role")) {
          userRole = localStorage.getItem("role") || "";
        } else if (localStorage.getItem("user_role")) {
          userRole = localStorage.getItem("user_role") || "";
        } else if (userData?.userRole) {
          userRole = userData.userRole;
        } else if (userData?.role) {
          userRole = userData.role;
        } else if (userData?.user_role) {
          userRole = userData.user_role;
        }

        // Try multiple sources for department
        let department = localStorage.getItem("department") || "";
        if (!department && userData?.department) {
          department = userData.department;
        } else if (!department && userData?.dept) {
          department = userData.dept;
        }

        // Try multiple sources for allocated area
        let allocatedArea = localStorage.getItem("allocatedarea") || "";
        if (!allocatedArea && userData?.allocatedArea) {
          allocatedArea = userData.allocatedArea;
        } else if (!allocatedArea && userData?.area) {
          allocatedArea = userData.area;
        } else if (!allocatedArea && userData?.allocated_area) {
          allocatedArea = userData.allocated_area;
        }

        setCurrentUserInfo({
          userRole: userRole.toLowerCase().trim(),
          department: department.toLowerCase().trim(),
          allocatedArea: allocatedArea.toLowerCase().trim(),
        });
      } catch (error) {
        console.error("Error getting user info from localStorage:", error);
        setCurrentUserInfo(null);
      }
    };

    getUserInfo();
  }, []);

  return currentUserInfo;
};
