// src/utils/travelSessionHelpers.ts
// Pure, side-effect-free helpers extracted from TravelSessions.tsx.
// None of these touch React state or the network, so they are trivially
// testable and reusable from both the Zustand store and the component.

import {
  TravelSession,
  LocationLog,
  PauseInterval,
  GroupedSession,
  UserInfo,
  UserListItem,
} from "../types/travelSession";

// ---------------------------------------------------------------------------
// Log <-> session time-window filtering
// ---------------------------------------------------------------------------
export const filterLogsBySessionTime = (
  logs: LocationLog[],
  sessionStartTime: string,
  sessionEndTime?: string,
): LocationLog[] => {
  if (!logs || logs.length === 0) return [];

  const sessionStart = new Date(sessionStartTime).getTime();
  const sessionEnd = sessionEndTime ? new Date(sessionEndTime).getTime() : null;

  const sessionDate = new Date(sessionStartTime);
  sessionDate.setHours(0, 0, 0, 0);
  const sessionDateStart = sessionDate.getTime();

  return logs.filter((log) => {
    const logTime = new Date(log.timestamp).getTime();

    const logDate = new Date(log.timestamp);
    logDate.setHours(0, 0, 0, 0);
    const logDateOnly = logDate.getTime();

    if (logDateOnly !== sessionDateStart) return false;

    if (sessionEnd) {
      return logTime >= sessionStart && logTime <= sessionEnd;
    }

    const now = new Date().getTime();
    return logTime >= sessionStart && logTime <= now;
  });
};

export const filterAndMapLogsToSession = (
  logs: LocationLog[],
  session: TravelSession | undefined | null,
): LocationLog[] => {
  if (!logs || logs.length === 0) return [];
  if (!session) return logs;
  return filterLogsBySessionTime(
    logs,
    session.startTime,
    session.endTime || undefined,
  );
};

// ---------------------------------------------------------------------------
// Role helpers
// ---------------------------------------------------------------------------
export const normalizeRole = (role?: string): string => {
  if (!role) return "";
  return role.toLowerCase().trim();
};

export const isAdminOrHR = (role?: string): boolean => {
  const normalized = normalizeRole(role);
  return (
    normalized === "admin" ||
    normalized === "superadmin" ||
    normalized === "hr" ||
    normalized === "hr_manager" ||
    normalized.includes("admin") ||
    normalized.includes("hr")
  );
};

export const isManager = (role?: string): boolean => {
  const normalized = normalizeRole(role);
  return normalized === "manager" || normalized.includes("manager");
};

export const isZonalManager = (role?: string): boolean => {
  const normalized = normalizeRole(role);
  return (
    normalized === "zonalmanager" ||
    normalized === "zonal_manager" ||
    normalized === "zonal manager" ||
    normalized.includes("zonal")
  );
};

export const isHOD = (role?: string): boolean => {
  const normalized = normalizeRole(role);
  return (
    normalized === "headofdepartment" || normalized.includes("headofdepartment")
  );
};

/** Role-based query params to send to the API so filtering happens server-side too. */
export const buildRoleScopedParams = (
  userInfo: UserInfo | null,
): Record<string, string> => {
  const params: Record<string, string> = {};
  if (!userInfo?.userRole) return params;

  const role = userInfo.userRole.toLowerCase().trim();

  if (isManager(role) || isHOD(role)) {
    if (userInfo.department) params.department = userInfo.department;
  }

  if (isZonalManager(role)) {
    if (userInfo.allocatedArea) params.allocatedArea = userInfo.allocatedArea;
  }

  return params;
};

export const filterSessionsByRole = (
  sessions: TravelSession[],
  userInfo: UserInfo | null,
): TravelSession[] => {
  if (!userInfo?.userRole) return sessions;
  const userRole = userInfo.userRole.toLowerCase().trim();

  if (isAdminOrHR(userRole)) return sessions;

  if (isManager(userRole) || isHOD(userRole)) {
    const managerDepartment = userInfo.department?.toLowerCase().trim();
    if (!managerDepartment) return [];
    return sessions.filter(
      (s) => (s.department || "").toLowerCase().trim() === managerDepartment,
    );
  }

  if (isZonalManager(userRole)) {
    const zonalArea = userInfo.allocatedArea?.toLowerCase().trim();
    if (!zonalArea) return [];
    return sessions.filter(
      (s) => (s.allocatedArea || "").toLowerCase().trim() === zonalArea,
    );
  }

  return sessions;
};

export const filterUsersByRole = (
  usersList: UserListItem[],
  userInfo: UserInfo | null,
): UserListItem[] => {
  if (!userInfo?.userRole) return usersList;
  const userRole = userInfo.userRole.toLowerCase().trim();

  if (isAdminOrHR(userRole)) return usersList;

  if (isManager(userRole) || isHOD(userRole)) {
    const managerDepartment = userInfo.department?.toLowerCase().trim();
    if (!managerDepartment) return [];
    return usersList.filter(
      (u) => (u.department || "").toLowerCase().trim() === managerDepartment,
    );
  }

  if (isZonalManager(userRole)) {
    const zonalArea = userInfo.allocatedArea?.toLowerCase().trim();
    if (!zonalArea) return [];
    return usersList.filter(
      (u) => (u.allocatedArea || "").toLowerCase().trim() === zonalArea,
    );
  }

  return usersList;
};

export const hasPermissionToViewSession = (
  session: TravelSession,
  userInfo: UserInfo | null,
): boolean => {
  if (!userInfo?.userRole) return true;
  const userRole = userInfo.userRole.toLowerCase().trim();

  if (isAdminOrHR(userRole)) return true;

  if (isManager(userRole) || isHOD(userRole)) {
    const managerDepartment = userInfo.department?.toLowerCase().trim();
    if (!managerDepartment) return false;
    return (
      (session.department || "").toLowerCase().trim() === managerDepartment
    );
  }

  if (isZonalManager(userRole)) {
    const zonalArea = userInfo.allocatedArea?.toLowerCase().trim();
    if (!zonalArea) return false;
    return (session.allocatedArea || "").toLowerCase().trim() === zonalArea;
  }

  return true;
};

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
export const formatDateOnly = (dateTimeStr: string): string => {
  if (!dateTimeStr) return "";
  return new Date(dateTimeStr).toISOString().split("T")[0];
};

export const formatDateTime = (dateTimeStr: string): string => {
  if (!dateTimeStr) return "-";
  return new Date(dateTimeStr).toLocaleString();
};

export const formatTimeOnly = (dateTimeStr: string): string => {
  if (!dateTimeStr) return "-";
  return new Date(dateTimeStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const calculateDuration = (startTime: string, endTime: string) => {
  if (!startTime) return { hours: 0, minutes: 0 };
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const durationMs = end.getTime() - start.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  return { hours, minutes };
};

// ---------------------------------------------------------------------------
// Coordinates
// ---------------------------------------------------------------------------
export const parseCoordinate = (coord: string | number): number => {
  if (coord === null || coord === undefined) return 0;
  if (typeof coord === "number") return Math.abs(coord) > 180 ? 0 : coord;

  const str = String(coord).trim();
  if (!str) return 0;

  const cleaned = str.replace(/[^\d.-]/g, "");
  if (!cleaned) return 0;

  const parsed = parseFloat(cleaned);
  if (Math.abs(parsed) > 90) return 0;

  return isNaN(parsed) ? 0 : parsed;
};

export const isValidCoordinate = (
  lat: string | number,
  lng: string | number,
): boolean => {
  const latNum = parseCoordinate(lat);
  const lngNum = parseCoordinate(lng);
  return (
    latNum !== 0 &&
    lngNum !== 0 &&
    Math.abs(latNum) <= 90 &&
    Math.abs(lngNum) <= 180 &&
    !isNaN(latNum) &&
    !isNaN(lngNum)
  );
};

export const smoothPath = (points: [number, number][]): [number, number][] => {
  if (points.length < 3) return points;

  const smoothed: [number, number][] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const current = points[i];
    const next = points[i + 1];
    smoothed.push([
      (prev[0] + current[0] + next[0]) / 3,
      (prev[1] + current[1] + next[1]) / 3,
    ]);
  }
  smoothed.push(points[points.length - 1]);
  return smoothed;
};

export const buildPolylinePath = (
  session: TravelSession,
  sessionLogs: Record<number, LocationLog[]>,
): [number, number][] => {
  const logs = sessionLogs[session.sessionId] || [];
  const filteredLogs = filterAndMapLogsToSession(logs, session);
  if (filteredLogs.length === 0) return [];

  const sortedLogs = [...filteredLogs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const path: [number, number][] = [];
  sortedLogs.forEach((log) => {
    if (isValidCoordinate(log.latitude, log.longitude)) {
      path.push([
        parseCoordinate(log.latitude),
        parseCoordinate(log.longitude),
      ]);
    }
  });

  return smoothPath(path);
};

export const getMapCenter = (
  session: TravelSession | null,
  sessionLogs: Record<number, LocationLog[]>,
): [number, number] => {
  const DEFAULT: [number, number] = [21.1702, 72.8311];
  if (!session) return DEFAULT;

  if (isValidCoordinate(session.startLatitude, session.startLongitude)) {
    return [
      parseCoordinate(session.startLatitude),
      parseCoordinate(session.startLongitude),
    ];
  }

  const logs = sessionLogs[session.sessionId] || [];
  const filteredLogs = filterAndMapLogsToSession(logs, session);
  const validLogs = filteredLogs.filter((l) =>
    isValidCoordinate(l.latitude, l.longitude),
  );

  if (validLogs.length > 0) {
    const sumLat = validLogs.reduce(
      (s, l) => s + parseCoordinate(l.latitude),
      0,
    );
    const sumLng = validLogs.reduce(
      (s, l) => s + parseCoordinate(l.longitude),
      0,
    );
    return [sumLat / validLogs.length, sumLng / validLogs.length];
  }

  return DEFAULT;
};

export const getMapZoom = (
  session: TravelSession | null,
  sessionLogs: Record<number, LocationLog[]>,
): number => {
  if (!session) return 13;

  const validPoints: [number, number][] = [];

  if (isValidCoordinate(session.startLatitude, session.startLongitude)) {
    validPoints.push([
      parseCoordinate(session.startLatitude),
      parseCoordinate(session.startLongitude),
    ]);
  }
  if (isValidCoordinate(session.endLatitude, session.endLongitude)) {
    validPoints.push([
      parseCoordinate(session.endLatitude),
      parseCoordinate(session.endLongitude),
    ]);
  }

  const logs = sessionLogs[session.sessionId] || [];
  filterAndMapLogsToSession(logs, session).forEach((log) => {
    if (isValidCoordinate(log.latitude, log.longitude)) {
      validPoints.push([
        parseCoordinate(log.latitude),
        parseCoordinate(log.longitude),
      ]);
    }
  });

  if (validPoints.length < 2) return 13;

  const lats = validPoints.map((p) => p[0]);
  const lngs = validPoints.map((p) => p[1]);
  const maxRange = Math.max(
    Math.max(...lats) - Math.min(...lats),
    Math.max(...lngs) - Math.min(...lngs),
  );

  if (maxRange > 0.1) return 10;
  if (maxRange > 0.05) return 12;
  if (maxRange > 0.01) return 14;
  if (maxRange > 0.005) return 15;
  return 16;
};

// ---------------------------------------------------------------------------
// Grouping / distance / pauses
// ---------------------------------------------------------------------------
export const calculateAdjustedGroupDistance = (sessions: TravelSession[]) => {
  if (sessions.length === 0) {
    return {
      totalDistance: 0,
      firstSessionDistance: 0,
      originalTotalDistance: 0,
      excludedSessions: 0,
    };
  }

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  const originalTotalDistance = sortedSessions.reduce(
    (sum, s) => sum + (s.totalDistance || 0),
    0,
  );
  const firstSessionDistance = sortedSessions[0]?.totalDistance || 0;

  // All sessions included for all roles - no exclusions.
  return {
    totalDistance: originalTotalDistance,
    firstSessionDistance,
    originalTotalDistance,
    excludedSessions: 0,
  };
};

export const groupSessionsByUserAndDate = (
  sessions: TravelSession[],
  sessionLogs: Record<number, LocationLog[]>,
): GroupedSession[] => {
  const groupedMap = new Map<string, GroupedSession>();

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
  );

  sortedSessions.forEach((session) => {
    const dateKey = formatDateOnly(session.startTime);
    const groupKey = `${session.userId}-${dateKey}`;

    if (!groupedMap.has(groupKey)) {
      groupedMap.set(groupKey, {
        userId: session.userId,
        username: session.username,
        employeeCode: session.employeeCode,
        fullName: session.fullName,
        date: dateKey,
        sessions: [session],
        totalSessions: 1,
        totalDistance: 0,
        firstSessionDistance: 0,
        originalTotalDistance: 0,
        activeSessions: session.endTime ? 0 : 1,
        startTime: session.startTime,
        endTime: session.endTime || session.startTime,
        totalPoints: 0,
        isLoading: false,
        hasMoreSessions: false,
        allSessionsLoaded: true,
      });
    } else {
      const existingGroup = groupedMap.get(groupKey)!;
      const sessionExists = existingGroup.sessions.some(
        (s) => s.sessionId === session.sessionId,
      );

      if (!sessionExists) {
        const insertIndex = existingGroup.sessions.findIndex(
          (s) =>
            new Date(s.startTime).getTime() >
            new Date(session.startTime).getTime(),
        );

        if (insertIndex === -1) existingGroup.sessions.push(session);
        else existingGroup.sessions.splice(insertIndex, 0, session);

        existingGroup.totalSessions += 1;
        existingGroup.activeSessions += session.endTime ? 0 : 1;

        if (new Date(session.startTime) < new Date(existingGroup.startTime)) {
          existingGroup.startTime = session.startTime;
        }

        const sessionEndTime = session.endTime || session.startTime;
        if (new Date(sessionEndTime) > new Date(existingGroup.endTime)) {
          existingGroup.endTime = sessionEndTime;
        }
      }
    }
  });

  const groups = Array.from(groupedMap.values()).map((group) => {
    const distanceData = calculateAdjustedGroupDistance(group.sessions);

    let totalPoints = 0;
    group.sessions.forEach((session) => {
      const logs = sessionLogs[session.sessionId] || [];
      totalPoints += filterAndMapLogsToSession(logs, session).length;
    });

    return {
      ...group,
      totalDistance: distanceData.totalDistance,
      firstSessionDistance: distanceData.firstSessionDistance,
      originalTotalDistance: distanceData.originalTotalDistance,
      totalPoints,
    };
  });

  return groups.sort((a, b) => {
    const getLatestSessionTime = (group: GroupedSession): Date => {
      const latestSession = group.sessions.reduce(
        (latest, current) =>
          new Date(current.startTime).getTime() >
          new Date(latest.startTime).getTime()
            ? current
            : latest,
        group.sessions[0],
      );
      return new Date(latestSession.startTime);
    };
    return (
      getLatestSessionTime(b).getTime() - getLatestSessionTime(a).getTime()
    );
  });
};

export const detectPauses = (
  sessionId: number,
  sessionLogs: Record<number, LocationLog[]>,
  travelSessions: TravelSession[],
  sessionsMap: Record<string, TravelSession>,
): PauseInterval[] => {
  const logs = sessionLogs[sessionId] || [];
  const session =
    travelSessions.find((s) => s.sessionId === sessionId) ||
    sessionsMap[`${sessionId}`];

  const filteredLogs = session
    ? filterAndMapLogsToSession(logs, session)
    : logs;
  if (filteredLogs.length < 2) return [];

  const pauses: PauseInterval[] = [];
  let currentPause: PauseInterval | null = null;

  for (let i = 0; i < filteredLogs.length; i++) {
    const log = filteredLogs[i];

    if (log.pause === true) {
      if (!currentPause) {
        currentPause = { start: log, end: log, durationMinutes: 0 };
      } else {
        currentPause.end = log;
      }
    } else if (currentPause) {
      const startTime = new Date(currentPause.start.timestamp);
      const endTime = new Date(currentPause.end.timestamp);
      currentPause.durationMinutes =
        (endTime.getTime() - startTime.getTime()) / 60000;
      if (currentPause.durationMinutes >= 1) pauses.push(currentPause);
      currentPause = null;
    }
  }

  if (currentPause) {
    const startTime = new Date(currentPause.start.timestamp);
    const endTime = new Date(currentPause.end.timestamp);
    currentPause.durationMinutes =
      (endTime.getTime() - startTime.getTime()) / 60000;
    if (currentPause.durationMinutes >= 1) pauses.push(currentPause);
  }

  return pauses;
};

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
export const SESSION_COLORS = [
  "#FF0000",
  "#0000FF",
  "#00FF00",
  "#FFA500",
  "#800080",
  "#FF69B4",
  "#00FFFF",
  "#FFD700",
  "#008000",
  "#FF4500",
  "#4B0082",
  "#FF1493",
  "#00FF7F",
  "#8B4513",
  "#000080",
  "#808000",
  "#DC143C",
  "#FF8C00",
  "#9932CC",
  "#20B2CD",
];

export const getSessionColor = (index: number): string =>
  SESSION_COLORS[index % SESSION_COLORS.length];

// ---------------------------------------------------------------------------
// Glassmorphism classes (moved here purely so the component file is smaller)
// ---------------------------------------------------------------------------
export const glassmorphismClasses = {
  card: "backdrop-blur-lg bg-white/10 dark:bg-gray-800/30 border border-white/20 dark:border-gray-700/50 shadow-xl",
  cardHover:
    "hover:bg-white/15 dark:hover:bg-gray-800/40 hover:border-white/30 dark:hover:border-gray-600/50 transition-all duration-300",
  input:
    "backdrop-blur-sm bg-white/5 dark:bg-gray-800/20 border border-white/10 dark:border-gray-700/30 focus:border-white/30 dark:focus:border-blue-500/50 focus:ring-2 focus:ring-white/20 dark:focus:ring-blue-500/30",
  button: {
    primary:
      "backdrop-blur-sm bg-lantern-blue-600 hover:from-blue-600 hover:to-indigo-700 border border-blue-400/20 dark:border-blue-500/30 text-white shadow-lg hover:shadow-xl transition-all duration-300",
    secondary:
      "backdrop-blur-sm bg-gradient-to-r from-purple-500/90 to-pink-600/90 hover:from-purple-600 hover:to-pink-700 border border-purple-400/20 dark:border-purple-500/30 text-white shadow-lg hover:shadow-xl transition-all duration-300",
    outline:
      "backdrop-blur-sm bg-white/5 dark:bg-gray-800/20 border border-white/20 dark:border-gray-600/50 text-gray-800 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-800/30 transition-all duration-300",
  },
  statCard:
    "backdrop-blur-lg bg-gradient-to-br from-white/15 to-white/5 dark:from-gray-800/30 dark:to-gray-900/20 border border-white/20 dark:border-gray-700/50 shadow-lg",
  modal:
    "backdrop-blur-xl bg-white/20 dark:bg-gray-900/30 border border-white/30 dark:border-gray-700/50 shadow-2xl",
};
