// src/utils/exportTravelSessionsToExcel.ts
// Builds and downloads the Travel Sessions .xlsx export.
// Pulled out of the component so the export logic can be tested/reused
// independently, and so the component doesn't need to know about ExcelJS.

import ExcelJS from "exceljs";
import { GroupedSession } from "../types/travelSession";
import { formatDateTime, formatTimeOnly } from "./travelSessionHelpers";

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
  sessionEndTime: string;
  sessionDistance: string;
  sessionStatus: string;
  farmersCount: number;
  farmerDescriptions: string;
}

/**
 * @param groupedData          grouped sessions to export (already filtered)
 * @param farmerDataByKey      map of `${userId}-${date}` -> farmer/session detail array,
 *                              typically the return value of loadFarmerDataForGroups()
 * @param detectPauses         pause-detection fn (kept as a param so the util stays pure /
 *                              doesn't need to know about the store's sessionLogs shape)
 * @param filters               active UI filters, only used to build the filename
 */
export async function exportTravelSessionsToExcel(
  groupedData: GroupedSession[],
  farmerDataByKey: Record<string, any>,
  detectPauses: (sessionId: number) => { durationMinutes: number }[],
  filters: ExportFilters = {},
): Promise<void> {
  if (groupedData.length === 0) {
    throw new Error("No grouped sessions to export.");
  }

  const groupedDataWithFarmerInfo = groupedData.map((group) => {
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

    const totalPauses = group.sessions.reduce(
      (sum, session) => sum + detectPauses(session.sessionId).length,
      0,
    );

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
          sessionEndTime: session.endTime
            ? formatTimeOnly(session.endTime)
            : "Active",
          sessionDistance: (session.totalDistance / 1000).toFixed(2),
          sessionStatus: session.endTime ? "Completed" : "Active",
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
      "Total Distance (km)": (group.originalTotalDistance / 1000).toFixed(2),
      "Total Reimbursement(km)": (
        (group.originalTotalDistance / 1000) *
        3.5
      ).toFixed(2),
      "First Session Distance (km)": (
        group.firstSessionDistance / 1000
      ).toFixed(2),
      "Total Farmers Met": totalFarmersMet,
      "Duration (minutes)": totalDuration,
      "Total Pauses Count": totalPauses,
      Status:
        group.activeSessions > 0 ? "Has Active Sessions" : "All Completed",
      Notes: "All sessions included for all roles",
      sessionDetails,
    };
  });

  const sortedData = groupedDataWithFarmerInfo.sort(
    (a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime(),
  );

  const maxSessions = Math.max(...groupedData.map((g) => g.sessions.length), 1);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Travel Sessions");

  const baseHeaders = [
    "fullName",
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
    "Total Pauses Count",
  ];

  const sessionHeaders: string[] = [];
  for (let i = 1; i <= maxSessions; i++) {
    sessionHeaders.push(
      `Session ${i} ID`,
      `Session ${i} Start Time`,
      `Session ${i} End Time`,
      `Session ${i} Distance (km)`,
      `Session ${i} Status`,
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

    row.sessionDetails.forEach((session) => {
      const prefix = `Session ${session.sessionNumber}`;
      rowData[`${prefix} ID`] = session.sessionId;
      rowData[`${prefix} Start Time`] = session.sessionStartTime;
      rowData[`${prefix} End Time`] = session.sessionEndTime;
      rowData[`${prefix} Distance (km)`] = session.sessionDistance;
      rowData[`${prefix} Status`] = session.sessionStatus;
      rowData[`${prefix} Farmers Count`] = session.farmersCount;
      rowData[`${prefix} Farmer Descriptions`] = session.farmerDescriptions;
    });

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
