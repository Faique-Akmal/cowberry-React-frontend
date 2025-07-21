import { createContext, useContext, useEffect } from 'react';
import API from '../api/axios';
import { startTokenRefreshInterval } from '../utils/tokenRefresher';
import { axiosGetMe } from '../store/userStore';

interface AuthContextType {
  login: (refreshToken: string, accessToken: string) => void;
  logout: () => void;
  axiosLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const getMeData = async () => {
    const meData = await axiosGetMe()!;

    localStorage.setItem('meUser', JSON.stringify(meData));

  }

  const login = (refreshToken: string, accessToken: string) => {
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('accessToken', accessToken);

    getMeData()!;
  };

  const axiosLogout = async () =>{
    try {
      const res = await API.post("/logout/")!;
      console.log(res.data)
    } catch (err) {
      console.error('Failed to logout user', err);
    }
    
    logout();
  } 

  const logout = () => {
    localStorage.clear();
  };

  useEffect(()=>{

    const intervalId = startTokenRefreshInterval();
    return () => clearInterval(intervalId);

  },[]);


  return (
    <AuthContext.Provider value={{ login, logout, axiosLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
