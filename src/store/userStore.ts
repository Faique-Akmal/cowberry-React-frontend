import axios from "axios";
import API from "../api/axios";

export interface AxiosGetUsers {
  id: number;
  password: string;
  last_login: string; // ISO string, you can convert to Date if needed
  is_superuser: boolean;
  username: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
  email: string;
  birth_date: string | null; // ISO date or null
  mobile_no: string | null;
  address: string;
  profile_image: string | null;
  is_active_employee: boolean;
  employee_code: string;
  is_employee_code_verified: boolean;
  role: number;
  department: string | null;
  groups: any[]; // Replace `any` with proper group type if known
  user_permissions: any[]; // Replace `any` with proper permission type if known
}

export interface AxiosGetMe{
address: string | null;
birth_date: Date | null;
department: number;
email: string;
id:number;
mobile_no: number | null;
profile_image: string | null;
role: number;
username:string
}

export interface AxiosPostChangePassword{
  old_password: string;
  new_password: string;        
}

// export interface PaginatedResponse<T> {
//   count: number;
//   next: string | null;
//   results: T[];
// }

// export const axiosGetUsers = async () => {
//       try {
//           const res = await API.get("/users/");
          
//           if(res.data){
//             return res.data?.results;
//           }
//       } catch (error) {
//         console.error("/User get request error:", error);
//       }
//     }

export const axiosGetUsers = async (
  page: number,
  limit: number,
  signal?: AbortSignal
) => {
      try {
        const res = await API.get("/users/", {
          params: { page, limit },
          signal,
        });
        
        if(res.data){
          return res.data?.results;
        }
      } catch (error) {
        if (axios.isCancel(error) || error?.name === "CanceledError") {
              // request was canceled intentionally (safe to ignore)
              console.log("✅ Axios request cancelled");
            } else {
              // actual error (show toast, log, etc)
              console.error("❌ /users/ Request failed", error);
            }

        }
        // console.error("/User get request error:", error);
    }

export const axiosGetMe = async () => {
      try {
          const res = await API.get("/me/");
          
          if(res.data){
            return res.data;
          }
      } catch (error) {
        console.error("/me/ get request error:", error);
      }
    }

export const axiosPostChangePassword = async (oldNewPassword: AxiosPostChangePassword) => {
  try {
      const res = await API.post("/change-password/", oldNewPassword);
      
      if(res.data){
        return res.data;
      }
  } catch (error) {
    console.error("/change-password/ post request error:", error);
  }
}