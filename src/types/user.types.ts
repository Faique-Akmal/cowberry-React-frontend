// Add UserRole type
export type UserRole = "HR" | "Manager" | "ZonalManager" | string;

// Update User interface to match your backend response
export interface User {
  id: string;
  userId: string;
  name: string;
  full_name: string;
  employee_code: string;
  username: string;
  email: string;
  role: string;
  roleId: number;

  is_checkin: boolean;
  department: string;
  departmentId?: number;
  profile_image?: string;
  date: string;
  is_online: boolean;
  allocatedArea?: string;
  mobileNo: string;
  address?: string;
  birthDate?: string;
  profileImageUrl?: string;

  hrManagerId?: number;

  reporteeId?: number;

  hrManager?: HRManager | null;
  reportee?: Reportee | null;

  zoneId?: string;
  zoneName?: string;
  zone?: {
    id: number;
    zoneId: string;
    name: string;
    area: string;
    city: string;
    state: string;
    pincode?: string;
    description?: string;
  };
  createdAt?: string;
}

export interface CurrentUser {
  id: string;
  role: UserRole;
  department?: string;
  departmentName?: string;
  allocatedArea?: string;
  zoneId?: string;
}

export interface Department {
  departmentId: number;
  name: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
}

export interface Zone {
  id: number;
  zoneId: string;
  name: string;
  area: string;
  city: string;
  state: string;
  pincode?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    employees: number;
  };
}

export interface EditUserForm {
  username: string;
  full_name: string;
  email: string;
  mobileNo: string;
  address: string;
  birthDate: string;
  reporteeId?: number | null;
  hrManagerId?: number | null;
  profileImageUrl: string;
  departmentId: number;
  departmentName: string;
  zoneId: string;
  zoneName: string;
  allocatedArea: string;
  roleId: number;
  roleName: string;
}

export interface FilterState {
  searchTerm: string;
  sortOrder: "asc" | "desc";
  roleFilter: string;
  departmentFilter: string;
  zoneFilter: string;
  statusFilter: "" | "online" | "offline";
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalUsersCount: number;
  hasMore: boolean;
  limit: number;
}

export interface HRManager {
  id: number;
  name: string;
  email: string;
  employeeCode: string;
  designation: string | null;
  mobileNo: string;
  department: {
    name: string;
  };
  zone: any;
}

export interface Reportee {
  id: number;
  name: string;
  email: string;
  employeeCode: string;
  designation: string | null;
  mobileNo: string;
  role: string;
  department: string;
  zone: any;
}
