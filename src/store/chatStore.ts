import API from "../api/axios";

export interface AxiosPostCreateGroup {
  name: string;
  members: string[];
}

export interface Members {
                id: number;
                username: string;
                is_online: boolean;
                last_seen: Date;
            }

export interface Created_By {
            id: number;
            username: string;
            email: string;
        }

export interface AxiosAllGroup{
  group_id: number;
  group_name: string;
  created_by: Created_By;
  created_at: Date;
  members: Members[];
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
};

export const axiosGetGroupMsg = async (group_id:number) => {
    try {
          const res = await API.get(`chat/messages/group/${group_id}/`);
          if(res.data){
            return res.data;
          }
      } catch (error) {
        console.error("chat/messages/group/{group_id}/ get request error:", error);
      }
};

export const axiosPostSendMsg = async (newMsg) => {
  try {
          const res = await API.post("/chat/message/send/", newMsg);

          if(res.data){
            console.log(res.data)
            return res.data;
          }
      } catch (error) {
        console.error("'/chat/group/create/' post error:", error);
      }
};