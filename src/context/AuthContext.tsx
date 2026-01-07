import { createContext, useContext } from "react";
import API from "../api/axios";

interface AuthContextType {
  login: (refreshToken: string, accessToken: string) => void;
  logout: () => void;
  axiosLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const login = async (refreshToken: string, accessToken: string) => {
    try {
      console.log("AuthContext: Storing tokens...");
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("accessToken", accessToken);

      // Optional: Verify tokens are stored
      console.log("AuthContext: Tokens stored -", {
        hasAccessToken: !!localStorage.getItem("accessToken"),
        hasRefreshToken: !!localStorage.getItem("refreshToken"),
      });

      return Promise.resolve();
    } catch (error) {
      console.error("AuthContext: Error storing tokens:", error);
      return Promise.reject(error);
    }
  };

  const axiosLogout = async () => {
    try {
      const res = await API.post("/auth/user_logout/")!;
      console.log(res.data);
    } catch (err) {
      console.error("Failed to logout user", err);
    }

    logout();
  };

  const logout = () => {
    localStorage.clear();
  };

  // useEffect(()=>{

  //   const intervalId = startTokenRefreshInterval();
  //   return () => clearInterval(intervalId);

  // },[]);

  return (
    <AuthContext.Provider value={{ login, logout, axiosLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
