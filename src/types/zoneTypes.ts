export interface ZoneCount {
  employees: number;
}

export interface Zone {
  id: number;
  zoneId: string;
  name: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  _count: ZoneCount;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ZoneApiResponse {
  success: boolean;
  data: Zone[];
  pagination: Pagination;
}

export interface ZoneQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}
