import API from "../api/axios";

export interface AxiosPostCreateGroup {
  name: string;
  members: string[];
}

export interface AxiosAllGroup{
  group_id: number;
  group_name: string;
  created_by: number;
  members: number[];
  created_at: Date;
}

export const axiosPostCreateGroup = async (newGroup:AxiosPostCreateGroup) => {
  try {
          const res = await API.post("/chat/group/create/", newGroup);

          if(res.data){
            console.log(res.data)
            return res.data;
          }
      } catch (error) {
        console.error("'/chat/group/create/' post error:", error);
      }
};

export const axiosGetAllGroup = async () => {
    try {
          const res = await API.get("/chat/messages/all-groups/");

          if(res.data){
            return res.data;
          }
      } catch (error) {
        console.error("/User get request error:", error);
      }
}