import * as XLSX from "xlsx";
import { User, Zone } from "../types/user.types";
import { getZoneDetails, getAllocatedArea } from "./user.helpers";

export const exportUsersToExcel = async (users: User[], zones: Zone[]) => {
  try {
    if (users.length === 0) {
      throw new Error("No users to export");
    }

    const excelData = users.map((user: User, index: number) => {
      const zoneDetails = getZoneDetails(user.zoneId || "", zones);
      const allocatedArea = getAllocatedArea(user, zones);

      return {
        "Employee Code": user.employee_code || "N/A",
        "Full Name": user.full_name || user.name || "N/A",
        Username: user.username || "N/A",
        Email: user.email || "N/A",
        Role: user.role || "N/A",
        Department: user.department || "N/A",
        "Zone ID": user.zoneId || "N/A",
        "Zone Name": zoneDetails?.name || user.zoneName || "N/A",
        "Allocated Area": allocatedArea,
        "Mobile Number": user.mobileNo || "N/A",

        "Date Joined": user.date
          ? new Date(user.date).toLocaleDateString()
          : "N/A",
        Address: user.address || "N/A",
        "Birth Date": user.birthDate
          ? new Date(user.birthDate).toLocaleDateString()
          : "N/A",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

    const maxWidth = excelData.reduce(
      (w, r) => Math.max(w, Object.values(r).join("").length),
      10,
    );
    worksheet["!cols"] = [{ wch: maxWidth }];

    const fileName = `users_export_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(workbook, fileName);

    return fileName;
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw error;
  }
};
