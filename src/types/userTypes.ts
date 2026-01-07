// usersTypes.ts

export interface User {
  userId: number;
  name: string;
  full_name: string;
  employee_code: string;
  email: string;
  mobileNo: string;
  role: string;
  is_checkin: boolean;
  date: string; // ISO date string
  department: string;
  address: string;
  birthDate: string;
  allocatedArea: string;
}

export interface UserApiResponse {
  success: boolean;
  data: User[];
}
