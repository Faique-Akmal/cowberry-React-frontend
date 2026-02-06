import { User, Zone } from "../types/user.types";

// Helper function to normalize strings for comparison
export const normalizeString = (str: string | undefined): string => {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove accents
};

// Helper function to normalize role names
export const normalizeRole = (role: string | undefined): string => {
  if (!role) return "";
  return role.trim().toLowerCase().replace(/\s+/g, " ");
};

// Helper function to get zone details
export const getZoneDetails = (zoneId: string, zones: Zone[]): Zone | null => {
  if (!zoneId) return null;
  const zone = zones.find((z: Zone) => z.zoneId === zoneId);
  return zone || null;
};

// Helper function to get zone name
export const getZoneName = (zoneId: string, zones: Zone[]): string => {
  if (!zoneId) return "Not Assigned";
  const zone = getZoneDetails(zoneId, zones);
  return zone ? zone.name : "Zone Not Found";
};

// Helper function to get zone area
export const getZoneArea = (zoneId: string, zones: Zone[]): string => {
  if (!zoneId) return "Not Assigned";
  const zone = getZoneDetails(zoneId, zones);
  return zone ? zone.area : "Area Not Found";
};

// Helper function to get allocated area (user's allocated area, falls back to zone area)
export const getAllocatedArea = (user: User, zones: Zone[]): string => {
  if (user.allocatedArea && user.allocatedArea.trim() !== "") {
    return user.allocatedArea;
  }
  if (user.zoneId) {
    return getZoneArea(user.zoneId, zones);
  }
  return "Not Assigned";
};

// Get unique departments for filter
export const getUniqueDepartments = (users: User[]): string[] => {
  const deptSet = new Set<string>();
  users.forEach((user) => {
    if (user.department) {
      deptSet.add(user.department);
    }
  });
  return Array.from(deptSet).sort();
};

// Get unique zones for filter
export const getUniqueZones = (users: User[]): string[] => {
  const zoneSet = new Set<string>();
  users.forEach((user) => {
    if (user.zoneId) {
      zoneSet.add(user.zoneId);
    }
  });
  return Array.from(zoneSet).sort();
};

// Get user key for React lists
export const getUserKey = (
  user: User,
  index: number,
  currentPage: number,
  limit: number,
): string => {
  const userId = user.id || user.userId;
  const baseKey = userId || `user-${index}`;
  const pageIndex = (currentPage - 1) * limit + index;
  return `${baseKey}-${pageIndex}`;
};
