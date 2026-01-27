import API from "../api/axios";

export interface AxiosPostChangePassword {
  old_password: string;
  new_password: string;
}

export const axiosPostChangePassword = async (
  oldNewPassword: AxiosPostChangePassword,
) => {
  try {
    const res = await API.post("/auth/change-password/", oldNewPassword);

    if (res.data) {
      return res.data;
    }
  } catch (error) {
    console.error("/change-password/ post request error:", error);
  }
};
