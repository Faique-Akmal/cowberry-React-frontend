export interface User {
  id: number;
  name: string;
  fullName: string;
  email: string;
  employeeCode: string;
  designation: string;
  mobileNo?: string;
  department: string;
  departmentId: number;
  zone: string;
  zoneId: number;
  zoneCity: string;
  zoneState: string;
  reportee?: {
    id: number;
    name: string;
    employeeCode: string;
  };
  hrManager?: {
    id: number;
    name: string;
    employeeCode: string;
  };
}

export interface Leave {
  id: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  emergencyContact: string;
  addressDuringLeave: string;
  status: string;
  reporteeStatus: string;
  hrStatus: string;
  reporteeId: number;

  hrManagerId: number;
  reporteeComments: string | null;
  hrComments: string | null;
  reporteeActionAt: string | null;
  hrActionAt: string | null;
  documentUrl: string | null;
  documentName: string | null;
  createdAt: string;
  updatedAt: string;
  user: User;
  reportee: {
    id: number;
    name: string;

    email: string;
    employeeCode: string;
    designation: string;
  };
  hrManager: {
    id: number;
    name: string;
    email: string;
    employeeCode: string;
    designation: string;
  };
}

export interface Department {
  id: number;
  name: string;
}

export interface Zone {
  id: number;
  name: string;
  city: string;
  state: string;
}

export interface FilterUser {
  id: number;
  name: string;
  employeeCode?: string;
  designation?: string;
  department?: string;
}

export interface Statistics {
  total: number;
  currentYear: {
    pending: {
      count: number;
      totalDays: number;
    };
  };
  byStatus: {
    [key: string]: {
      count: number;
      totalDays: number;
    };
  };
  byType: {
    [key: string]: {
      count: number;
      totalDays: number;
    };
  };
  byStatusAndType: {
    [key: string]: {
      [key: string]: {
        count: number;
        totalDays: number;
      };
    };
  };
}

export interface AppliedFilters {
  status: string | null;
  leaveType: string | null;
  year: number | null;
  search: string | null;
  departmentId: number | null;
  zoneId: number | null;
  userId: number | null;
  reporteeId: number | null;
  hrManagerId: number | null;
  startDate: string | null;
  endDate: string | null;
  sortBy: string;
  sortOrder: string;
  page: number;
  limit: number;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  itemsPerPage: number;
}

export interface AdminInfo {
  id: number;
  name: string;
  email: string;
  role: string;
  employeeCode: string;
}

export interface LeavesResponse {
  success: boolean;
  message: string;
  data: {
    leaves: Leave[];
    pagination: Pagination;
    statistics: Statistics;
    filters: {
      departments: Department[];
      zones: Zone[];
      users: FilterUser[];
    };
    appliedFilters: AppliedFilters;
    adminInfo: AdminInfo;
  };
}

export interface ApproveRejectLeaveRequest {
  action: "APPROVE" | "REJECT";
  comments: string;
}

export interface ApproveRejectLeaveResponse {
  success: boolean;
  message: string;
  data: Leave;
}

export interface LocalStorageUser {
  id: number;
  role: string;
  department?: string;
  name?: string;
  email?: string;
  employeeCode?: string;
}
