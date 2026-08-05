// src/utils/exportTravelSessionsToExcel.ts
import ExcelJS from "exceljs";
import API from "../api/axios";
import { GroupedSession } from "../types/travelSession";
import {
  formatDateTime,
  formatTimeOnly,
  formatDateOnly,
} from "./travelSessionHelpers";

export interface ExportFilters {
  startDate?: string;
  endDate?: string;
  selectedUser?: string;
  appliedSearch?: string;
}

interface SessionDetail {
  sessionNumber: number;
  sessionId: number;
  sessionStartTime: string;
  startDescription: string;
  endDescription: string;
  sessionEndTime: string;
  sessionDistance: string;
  farmersCount: number;
  farmerDescriptions: string;
}

interface ExportRow {
  fullName: string;
  "Employee Code": string;
  Department: string;
  Role: string;
  "Allocated Area": string;
  Date: string;
  "Formatted Date": string;
  "Start Time": string;
  "End Time": string;
  "Payable Distance(km)": number;
  "Payable Amount (₹)": number;
  "Total Sessions": number;
  "Active Sessions": number;
  "First Session Distance (km)": string;
  "Total Farmers Met": number;
  "Duration (minutes)": number;
  sessionDetails: SessionDetail[];
}

// API Response Interfaces
interface ApiFarmerDetail {
  id: number;
  farmerName: string;
  farmerDescription: string;
  createdAt: string;
}

interface ApiTravelSession {
  sessionId: number;
  user: {
    id: number;
    username: string;
    fullName: string;
    email: string;
    employeeCode: string;
    role: string;
    departmentName?: string;
    allocatedArea?: string;
  };
  startTime: string;
  startDescription: string;
  endDescription: string;
  endTime: string | null;
  status: string;
  isActive: boolean;
  totalDistance: number;
  date: string;
  durationMinutes: number;
  farmerData: {
    count: number;
    data: ApiFarmerDetail[];
  };
}

interface ApiUserBlock {
  user: {
    id: number;
    username: string;
    fullName: string;
    email: string;
    employeeCode: string;
    role: string;
    departmentName?: string;
    allocatedArea?: string;
  };
  sessions: ApiTravelSession[];
}

interface ApiResponse {
  success: boolean;
  users: {
    count: number;
    data: Array<{
      user: {
        id: number;
        username: string;
        fullName: string;
        email: string;
        employeeCode: string;
        role: string;
        departmentName?: string;
        allocatedArea?: string;
      };
      sessions?: ApiTravelSession[];
    }>;
  };
}

// Shared workbook builder
async function buildAndDownloadWorkbook(
  rows: ExportRow[],
  filters: ExportFilters = {},
): Promise<void> {
  if (rows.length === 0) {
    throw new Error("No data to export.");
  }

  const sortedData = [...rows].sort(
    (a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime(),
  );

  const maxSessions = Math.max(...rows.map((r) => r.sessionDetails.length), 1);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Travel Sessions");

  const baseHeaders = [
    "FullName",
    "Employee Code",
    "Department",
    "Role",
    "Allocated Area",
    "Date",
    "Formatted Date",
    "Start Time",
    "End Time",
    "Payable Distance(km)",
    "Payable Amount (₹)",
    "Total Sessions",
    "Active Sessions",
    "First Session Distance (km)",
    "Total Farmers Met",
    "Duration (minutes)",
  ];

  const sessionHeaders: string[] = [];
  for (let i = 1; i <= maxSessions; i++) {
    sessionHeaders.push(
      `Session ${i} ID`,
      `Session ${i} Start Time`,
      `Session ${i} Start Description`,
      `Session ${i} End Time`,
      `Session ${i} End Description`,
      `Session ${i} Distance (km)`,
      `Session ${i} Farmers Count`,
      `Session ${i} Farmer Descriptions`,
    );
  }

  const allHeaders = [...baseHeaders, ...sessionHeaders];

  sheet.columns = allHeaders.map((header) => ({
    header,
    key: header,
    width: header.toLowerCase().includes("description") ? 30 : 18,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F4E78" },
    };
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  sortedData.forEach((row) => {
    const rowData: Record<string, any> = {};
    baseHeaders.forEach((h) => {
      rowData[h] = (row as any)[h] ?? "";
    });

    if (row.sessionDetails && Array.isArray(row.sessionDetails)) {
      row.sessionDetails.forEach((session) => {
        const prefix = `Session ${session.sessionNumber}`;
        rowData[`${prefix} ID`] = session.sessionId;
        rowData[`${prefix} Start Time`] = session.sessionStartTime;
        rowData[`${prefix} Start Description`] = session.startDescription || "";
        rowData[`${prefix} End Time`] = session.sessionEndTime;
        rowData[`${prefix} End Description`] = session.endDescription || "";
        rowData[`${prefix} Distance (km)`] = session.sessionDistance;
        rowData[`${prefix} Farmers Count`] = session.farmersCount;
        rowData[`${prefix} Farmer Descriptions`] = session.farmerDescriptions;
      });
    }

    sheet.addRow(rowData);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);

  const filterInfo: string[] = [];
  if (filters.startDate) filterInfo.push(`from-${filters.startDate}`);
  if (filters.endDate) filterInfo.push(`to-${filters.endDate}`);
  if (filters.selectedUser) filterInfo.push(`user-${filters.selectedUser}`);
  if (filters.appliedSearch) filterInfo.push(`search-${filters.appliedSearch}`);

  const filename = `travel_sessions_${filterInfo.length ? filterInfo.join("_") : "all"}_${dateStr}.xlsx`;

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Legacy export function
export async function exportTravelSessionsToExcel(
  groupedData: GroupedSession[],
  farmerDataByKey: Record<string, any>,
  detectPauses: (sessionId: number) => { durationMinutes: number }[],
  filters: ExportFilters = {},
): Promise<void> {
  if (groupedData.length === 0) {
    throw new Error("No grouped sessions to export.");
  }

  const rows: ExportRow[] = groupedData.map((group) => {
    const userDateKey = `${group.userId}-${group.date}`;
    const sessionFarmerData = farmerDataByKey[userDateKey] || [];

    const firstSessionStart = new Date(group.startTime);
    const lastSessionEnd = new Date(group.endTime);
    const totalDuration = Math.round(
      (lastSessionEnd.getTime() - firstSessionStart.getTime()) / 60000,
    );
    const totalDistanceExcludingFirst = group.totalDistance;
    const reimbursementAmount = (
      (totalDistanceExcludingFirst / 1000) *
      3.5
    ).toFixed(2);

    let totalFarmersMet = 0;
    const sessionDetails: SessionDetail[] = group.sessions.map(
      (session, sessionIndex) => {
        const matchingFarmerData = sessionFarmerData.find(
          (f: any) => f.sessionId === session.sessionId,
        );

        const farmerCount = matchingFarmerData?.farmerData?.count || 0;
        totalFarmersMet += farmerCount;
        const farmers = matchingFarmerData?.farmerData?.data || [];

        const farmerDescriptions = farmers
          .map(
            (farmer: any, farmerIndex: number) =>
              `Farmer ${farmerIndex + 1}: ${farmer.farmerName || "Unknown"} - ${farmer.farmerDescription || "No description"}`,
          )
          .join("; ");

        return {
          sessionNumber: sessionIndex + 1,
          sessionId: session.sessionId,
          sessionStartTime: formatTimeOnly(session.startTime),
          startDescription: session.startDescription || "",
          endDescription: session.endDescription || "",
          sessionEndTime: session.endTime
            ? formatTimeOnly(session.endTime)
            : "Active",
          sessionDistance: (session.totalDistance / 1000).toFixed(2),
          farmersCount: farmerCount,
          farmerDescriptions: farmerDescriptions || "None",
        };
      },
    );

    return {
      fullName: group.fullName,
      "Employee Code": group.employeeCode,
      Department: group.sessions[0]?.department || "N/A",
      Role: group.sessions[0]?.role || "N/A",
      "Allocated Area": group.sessions[0]?.allocatedArea || "N/A",
      Date: group.date,
      "Formatted Date": new Date(group.date).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      "Start Time": formatDateTime(group.startTime),
      "End Time": formatDateTime(group.endTime),
      "Payable Distance(km)": (totalDistanceExcludingFirst / 1000).toFixed(2),
      "Payable Amount (₹)": reimbursementAmount,
      "Total Sessions": group.totalSessions,
      "Active Sessions": group.activeSessions,
      "First Session Distance (km)": (
        group.firstSessionDistance / 1000
      ).toFixed(2),
      "Total Farmers Met": totalFarmersMet,
      "Duration (minutes)": totalDuration,
      sessionDetails,
    };
  });

  await buildAndDownloadWorkbook(rows, filters);
}

// Fetch all travel sessions from API
async function fetchAllTravelSessionsForExport(
  startDate?: string,
  endDate?: string,
): Promise<ApiUserBlock[]> {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const response = await API.get<ApiResponse>(
    "/tracking/locationlog/get_all_travel_sessions",
    { params },
  );

  const data = response.data;

  if (!data?.success) {
    throw new Error("Failed to fetch travel sessions for export.");
  }

  const userBlocks: ApiUserBlock[] = [];

  if (data.users?.data && Array.isArray(data.users.data)) {
    data.users.data.forEach((userData) => {
      const user = {
        id: userData.user?.id || 0,
        username: userData.user?.username || "",
        fullName: userData.user?.fullName || "",
        email: userData.user?.email || "",
        employeeCode: userData.user?.employeeCode || "",
        role: userData.user?.role || "N/A",
        departmentName: userData.user?.departmentName || "N/A",
        allocatedArea: userData.user?.allocatedArea || "N/A",
      };

      const sessions = userData.sessions || [];

      if (user.id) {
        userBlocks.push({
          user,
          sessions: sessions.map((session) => ({
            sessionId: session.sessionId || 0,
            user: session.user || user,
            startTime: session.startTime || "",
            startDescription: session.startDescription || "",
            endDescription: session.endDescription || "",
            endTime: session.endTime || null,
            status: session.status || "unknown",
            isActive: session.isActive || false,
            totalDistance: session.totalDistance || 0,
            date: session.date || "",
            durationMinutes: session.durationMinutes || 0,
            farmerData: session.farmerData || { count: 0, data: [] },
          })),
        });
      }
    });
  }

  return userBlocks;
}

// Group sessions by user and date
function groupApiSessionsByUserAndDate(userBlocks: ApiUserBlock[]) {
  const groupedMap = new Map<
    string,
    {
      userId: number;
      fullName: string;
      employeeCode: string;
      role: string;
      departmentName: string;
      allocatedArea: string;
      date: string;
      startTime: string;
      endTime: string;
      sessions: ApiTravelSession[];
    }
  >();

  userBlocks.forEach((block) => {
    (block.sessions || []).forEach((session) => {
      if (!session.startTime) return;

      const dateKey = formatDateOnly(session.startTime);
      const groupKey = `${block.user.id}-${dateKey}`;

      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, {
          userId: block.user.id,
          fullName: block.user.fullName || "Unknown",
          employeeCode: block.user.employeeCode || "",
          role: session.user?.role || block.user.role || "N/A",
          departmentName:
            session.user?.departmentName || block.user.departmentName || "N/A",
          allocatedArea:
            session.user?.allocatedArea || block.user.allocatedArea || "N/A",
          date: dateKey,
          startTime: session.startTime,
          endTime: session.endTime || session.startTime,
          sessions: [session],
        });
      } else {
        const g = groupedMap.get(groupKey)!;
        g.sessions.push(session);

        if (new Date(session.startTime) < new Date(g.startTime)) {
          g.startTime = session.startTime;
        }
        const sessionEndTime = session.endTime || session.startTime;
        if (new Date(sessionEndTime) > new Date(g.endTime)) {
          g.endTime = sessionEndTime;
        }
      }
    });
  });

  return Array.from(groupedMap.values());
}

// Build rows from API data
function buildRowsFromApiData(
  userBlocks: ApiUserBlock[],
  filters: Pick<ExportFilters, "selectedUser" | "appliedSearch"> = {},
): ExportRow[] {
  let filteredBlocks = userBlocks;

  if (filters.selectedUser) {
    filteredBlocks = filteredBlocks.filter(
      (b) => b.user.id.toString() === filters.selectedUser,
    );
  }

  if (filters.appliedSearch) {
    const query = filters.appliedSearch.toLowerCase();
    filteredBlocks = filteredBlocks.filter(
      (b) =>
        (b.user.fullName || "").toLowerCase().includes(query) ||
        (b.user.employeeCode || "").toLowerCase().includes(query),
    );
  }

  if (filteredBlocks.length === 0) {
    return [];
  }

  const groups = groupApiSessionsByUserAndDate(filteredBlocks);

  return groups.map((group) => {
    const sortedSessions = [...group.sessions]
      .filter((s) => s && s.startTime)
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );

    if (sortedSessions.length === 0) {
      return {
        FullName: group.fullName,
        "Employee Code": group.employeeCode,
        Department: group.departmentName,
        Role: group.role,
        "Allocated Area": group.allocatedArea,
        Date: group.date,
        "Formatted Date": new Date(group.date).toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        "Start Time": "N/A",
        "End Time": "N/A",
        "Payable Distance(km)": "0.00",
        "Payable Amount (₹)": "0.00",
        "Total Sessions": 0,
        "Active Sessions": 0,
        "First Session Distance (km)": "0.00",
        "Total Farmers Met": 0,
        "Duration (minutes)": 0,
        sessionDetails: [],
      };
    }

    const originalTotalDistance = sortedSessions.reduce(
      (sum, s) => sum + (s.totalDistance || 0),
      0,
    );
    const firstSessionDistance = sortedSessions[0]?.totalDistance || 0;
    const totalDistanceExcludingFirst = originalTotalDistance;
    const reimbursementAmount = (
      (totalDistanceExcludingFirst / 1000) *
      3.5
    ).toFixed(2);

    const firstSessionStart = new Date(group.startTime);
    const lastSessionEnd = new Date(group.endTime);
    const totalDuration = Math.round(
      (lastSessionEnd.getTime() - firstSessionStart.getTime()) / 60000,
    );

    let totalFarmersMet = 0;
    const sessionDetails: SessionDetail[] = sortedSessions.map(
      (session, sessionIndex) => {
        const farmerCount = session.farmerData?.count || 0;
        totalFarmersMet += farmerCount;
        const farmers = session.farmerData?.data || [];

        const farmerDescriptions = farmers
          .map(
            (farmer, farmerIndex) =>
              `Farmer ${farmerIndex + 1}: ${farmer.farmerName || "Unknown"} - ${farmer.farmerDescription || "No description"}`,
          )
          .join("; ");

        return {
          sessionNumber: sessionIndex + 1,
          sessionId: session.sessionId || 0,
          sessionStartTime: session.startTime
            ? formatTimeOnly(session.startTime)
            : "N/A",
          startDescription: session.startDescription || "",
          endDescription: session.endDescription || "",
          sessionEndTime: session.endTime
            ? formatTimeOnly(session.endTime)
            : "Active",
          sessionDistance: session.totalDistance
            ? (session.totalDistance / 1000).toFixed(2)
            : "0.00",
          farmersCount: farmerCount,
          farmerDescriptions: farmerDescriptions || "None",
        };
      },
    );

    return {
      FullName: group.fullName,
      "Employee Code": group.employeeCode,
      Department: group.departmentName,
      Role: group.role,
      "Allocated Area": group.allocatedArea,
      Date: group.date,
      "Formatted Date": new Date(group.date).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      "Start Time": formatDateTime(group.startTime),
      "End Time": formatDateTime(group.endTime),
      "Payable Distance(km)": (totalDistanceExcludingFirst / 1000).toFixed(2),
      "Payable Amount (₹)": reimbursementAmount,
      "Total Sessions": sortedSessions.length,
      "Active Sessions": sortedSessions.filter((s) => !s.endTime).length,
      "First Session Distance (km)": (firstSessionDistance / 1000).toFixed(2),
      "Total Farmers Met": totalFarmersMet,
      "Duration (minutes)": totalDuration,
      sessionDetails,
    };
  });
}

// Main export function
export async function exportAllTravelSessionsFromAPI(
  startDate: string,
  endDate: string,
  filters: ExportFilters = {},
): Promise<void> {
  if (!startDate || !endDate) {
    throw new Error(
      "Please select both a start date and an end date before exporting.",
    );
  }

  const userBlocks = await fetchAllTravelSessionsForExport(startDate, endDate);

  if (userBlocks.length === 0) {
    throw new Error("No travel sessions found for the selected date range.");
  }

  const rows = buildRowsFromApiData(userBlocks, {
    selectedUser: filters.selectedUser,
    appliedSearch: filters.appliedSearch,
  });

  if (rows.length === 0) {
    throw new Error("No travel sessions found with the current filters.");
  }

  await buildAndDownloadWorkbook(rows, { startDate, endDate, ...filters });
}
