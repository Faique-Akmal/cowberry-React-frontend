import API from "../api/axios";

// export interface AxiosGetUsers {

// }

export const axiosGetUsers = async () => {
      try {
          const res = await API.get("/users/");
          
          if(res.data){
            return res.data?.results
          }
      } catch (error) {
        console.error("/User get request error:", error);
      }
    }
