// src/utils/exportAllTravelSessionsToExcel.ts
// New export utility using the get_all_travel_sessions API

import ExcelJS from "exceljs";
import { UserTravelSessions } from "../types/travelSession";

export interface ExportFilters {
  startDate?: string;
  endDate?: string;
  selectedUser?: string;
}

interface FlatExportRow {
  "User ID": number;
  Username: string;
  "Full Name": string;
  "Employee Code": string;
  Role: string;
  Email: string;
  "Session ID": number;
  "Session Date": string;
  "Start Time": string;
  "End Time": string;
  "Duration (minutes)": number;
  "Distance (km)": string;
  Status: string;
  "Is Active": string;
  "Start Latitude": number;
  "Start Longitude": number;
  "End Latitude": number;
  "End Longitude": number;
  "Start Description": string;
  "End Description": string;
  "Farmers Count": number;
  "Farmer Details": string;
  "Total Farmers Met": number;
}

export async function exportAllTravelSessionsToExcel(
  userTravelData: UserTravelSessions[],
  filters: ExportFilters = {},
): Promise<void> {
  if (userTravelData.length === 0) {
    throw new Error("No travel sessions to export.");
  }

  // Flatten the data for Excel export
  const flatData: FlatExportRow[] = [];

  userTravelData.forEach((userData) => {
    const user = userData.user;
    const totalFarmersForUser = userData.sessions.reduce(
      (sum, session) => sum + (session.farmerData?.count || 0),
      0,
    );

    // If no sessions, still add one row with user info
    if (userData.sessions.length === 0) {
      flatData.push({
        "User ID": user.id,
        Username: user.username,
        "Full Name": user.fullName,
        "Employee Code": user.employeeCode,
        Role: user.role,
        Email: user.email,
        "Session ID": 0,
        "Session Date": "",
        "Start Time": "",
        "End Time": "",
        "Duration (minutes)": 0,
        "Distance (km)": "0.00",
        Status: "No Sessions",
        "Is Active": "No",
        "Start Latitude": 0,
        "Start Longitude": 0,
        "End Latitude": 0,
        "End Longitude": 0,
        "Start Description": "",
        "End Description": "",
        "Farmers Count": 0,
        "Farmer Details": "",
        "Total Farmers Met": totalFarmersForUser,
      });
      return;
    }

    // Add each session as a row
    userData.sessions.forEach((session) => {
      const farmerDetails =
        session.farmerData?.data
          .map((f) => `${f.farmerName}: ${f.farmerDescription}`)
          .join("; ") || "";

      flatData.push({
        "User ID": user.id,
        Username: user.username,
        "Full Name": user.fullName,
        "Employee Code": user.employeeCode,
        Role: user.role,
        Email: user.email,
        "Session ID": session.sessionId,
        "Session Date": new Date(session.date).toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        "Start Time": new Date(session.startTime).toLocaleString(),
        "End Time": session.endTime
          ? new Date(session.endTime).toLocaleString()
          : "Active",
        "Duration (minutes)": Math.round(session.durationMinutes),
        "Distance (km)": (session.totalDistance / 1000).toFixed(2),
        Status: session.status,
        "Is Active": session.isActive ? "Yes" : "No",
        "Start Latitude": session.startLatitude,
        "Start Longitude": session.startLongitude,
        "End Latitude": session.endLatitude,
        "End Longitude": session.endLongitude,
        "Start Description": session.startDescription || "",
        "End Description": session.endDescription || "",
        "Farmers Count": session.farmerData?.count || 0,
        "Farmer Details": farmerDetails || "None",
        "Total Farmers Met": totalFarmersForUser,
      });
    });
  });

  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Travel Sessions");

  // Define columns
  const columns = Object.keys(flatData[0] || {}).map((key) => ({
    header: key,
    key: key,
    width: key.includes("Description") || key.includes("Details") ? 40 : 18,
  }));

  sheet.columns = columns;

  // Style header row
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

  // Add data rows
  flatData.forEach((row) => {
    const rowData: Record<string, any> = {};
    columns.forEach((col) => {
      rowData[col.key] = (row as any)[col.key] ?? "";
    });
    sheet.addRow(rowData);
  });

  // Add summary sheet
  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Metric", key: "metric", width: 30 },
    { header: "Value", key: "value", width: 20 },
  ];

  const totalUsers = userTravelData.length;
  const totalSessions = userTravelData.reduce(
    (sum, u) => sum + u.sessions.length,
    0,
  );
  const totalDistance = userTravelData.reduce(
    (sum, u) => sum + u.sessions.reduce((s, sess) => s + sess.totalDistance, 0),
    0,
  );
  const totalFarmers = userTravelData.reduce(
    (sum, u) =>
      sum +
      u.sessions.reduce((s, sess) => s + (sess.farmerData?.count || 0), 0),
    0,
  );

  summarySheet.addRows([
    { metric: "Export Date", value: new Date().toLocaleString() },
    {
      metric: "Date Range",
      value:
        filters.startDate && filters.endDate
          ? `${filters.startDate} to ${filters.endDate}`
          : "All Dates",
    },
    { metric: "Total Users", value: totalUsers },
    { metric: "Total Sessions", value: totalSessions },
    {
      metric: "Total Distance",
      value: `${(totalDistance / 1000).toFixed(2)} km`,
    },
    { metric: "Total Farmers Met", value: totalFarmers },
    {
      metric: "Average Sessions per User",
      value: (totalSessions / totalUsers).toFixed(1),
    },
    {
      metric: "Average Distance per Session",
      value: (totalDistance / totalSessions / 1000).toFixed(2) + " km",
    },
  ]);

  // Style summary header
  const summaryHeader = summarySheet.getRow(1);
  summaryHeader.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F4E78" },
    };
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
  });

  // Generate and download file
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

  const filename = `all_travel_sessions_${filterInfo.length ? filterInfo.join("_") : "all"}_${dateStr}.xlsx`;

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 100);
}
