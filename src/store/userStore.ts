import API from "../api/axios";

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
export const axiosGetUsers = async () => {
      try {
          const res = await API.get("/users/");
          
          if(res.data){
            return res.data?.results;
          }
      } catch (error) {
        console.error("/User get request error:", error);
      }
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
