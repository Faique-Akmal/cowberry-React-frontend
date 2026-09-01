export interface TravelSession {
  sessionId: number;
  fullName: string;
  userId: number;
  username: string;
  employeeCode: string;
  startTime: string;
  startLatitude: string;
  startLongitude: string;
  role?: string;
  endTime: string;
  endLatitude: string;
  endLongitude: string;
  startOdometer: string;
  endOdometer: string;
  totalDistance: number;
  department?: string;
  allocatedArea?: string;
  totalSessions?: number;
  // New approval fields
  finalStatus?: "PENDING" | "APPROVED" | "REJECTED" | "UNDER_REVIEW";
  isApprovedByReportee?: boolean;
  isApprovedByHR?: boolean;
  isFinalApproved?: boolean;
  isRejectedByReportee?: boolean;
  isRejectedByHR?: boolean;
  reporteeInfo?: {
    id: number;
    username: string;
    fullName: string;
    employeeCode: string;
  };
  reporteeComments?: string;
  reporteeApprovedAt?: string;
  hrManagerInfo?: {
    id: number;
    username: string;
    fullName: string;
    employeeCode: string;
  };
  hrComments?: string;
  hrApprovedAt?: string;
}

export interface LocationLog {
  id: number;
  timestamp: string;
  latitude: string;
  longitude: string;
  battery: number;
  speed: number;
  pause: boolean;
}

export interface PauseInterval {
  start: LocationLog;
  end: LocationLog;
  durationMinutes: number;
}

export interface FarmerData {
  id: number;
  farmerName: string;
  farmerDescription: string;
  farmerImage?: string;
  createdAt: string;
}

export interface FarmerTravelData {
  sessionId: number;
  userId: number;
  startTime: string;
  endTime: string;
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
  startDescription: string;
  endDescription: string;
  status: string;
  isActive: boolean;
  totalDistance: number;
  date: string;
  durationMinutes: number;
  startOdometerImage: string;
  endOdometerImage: string;
  finalStatus?: "PENDING" | "APPROVED" | "REJECTED" | "UNDER_REVIEW";
  isApprovedByReportee?: boolean;
  isApprovedByHR?: boolean;
  isFinalApproved?: boolean;
  isRejectedByReportee?: boolean;
  isRejectedByHR?: boolean;
  locationLogs?: {
    count: number;
    data: LocationLog[];
  };
  farmerData?: {
    count: number;
    data: FarmerData[];
  };
}

export interface GroupedSession {
  userId: number;
  username: string;
  fullName?: string;
  employeeCode: string;
  date: string;
  sessions: TravelSession[];
  totalSessions: number;
  totalDistance: number;
  firstSessionDistance: number;
  originalTotalDistance: number;
  activeSessions: number;
  startTime: string;
  endTime: string;
  totalPoints: number;
  isLoading?: boolean;
  hasMoreSessions?: boolean;
  allSessionsLoaded?: boolean;
  // Approval summary
  approvedSessions: number;
  pendingSessions: number;
  rejectedSessions: number;
  reimbursableDistance: number;
}

export interface MultiSessionMapView {
  userId: number;
  username: string;
  fullName: string;
  employeeCode: string;
  date: string;
  sessions: TravelSession[];
  center: [number, number];
  zoom: number;
}

export interface ApiPaginationResponse {
  success: boolean;
  data: TravelSession[];
  currentPage: number;
  totalPages: number;
  limit: number;
  hasNextPage: boolean;
  totalSessions: number;
}

export interface UserInfo {
  userRole?: string;
  department?: string;
  allocatedArea?: string;
}

export interface UserListItem {
  userId: number;
  fullName: string;
  username: string;
  employeeCode: string;
  department?: string;
  allocatedArea?: string;
}

export interface SessionLogsResponse {
  success: boolean;
  sessionInfo: {
    sessionId: number;
    userId: number;
    username: string;
    employeeCode: string;
    startTime: string;
    endTime: string;
    totalLogs: number;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    totalLogs: number;
    logsInPage: number;
  };
  data: LocationLog[];
}

export interface AllTravelSessionsResponse {
  success: boolean;
  users: {
    count: number;
    data: UserTravelSessions[];
  };
}

export interface UserTravelSessions {
  user: {
    id: number;
    username: string;
    fullName: string;
    email: string;
    employeeCode: string;
    role: string;
  };
  sessions: AllTravelSessionItem[];
}

export interface AllTravelSessionItem {
  sessionId: number;
  user: {
    id: number;
    username: string;
    fullName: string;
    email: string;
    employeeCode: string;
    role: string;
  };
  startTime: string;
  endTime: string;
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
  startDescription: string;
  endDescription: string;
  status: string;
  isActive: boolean;
  totalDistance: number;
  date: string;
  durationMinutes: number;
  finalStatus?: "PENDING" | "APPROVED" | "REJECTED" | "UNDER_REVIEW";
  isApprovedByReportee?: boolean;
  isApprovedByHR?: boolean;
  isFinalApproved?: boolean;
  isRejectedByReportee?: boolean;
  isRejectedByHR?: boolean;
  farmerData: {
    count: number;
    data: FarmerData[];
  };
}
