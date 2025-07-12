import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

interface AuthContextType {
  login: (refreshToken: string, accessToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const login = (refreshToken: string, accessToken: string) => {
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('accessToken', accessToken);
  };

  const logout = () => {
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accessToken');
  };

  const refreshToken = localStorage.getItem('refreshToken');

  const AxiosRefreshToken = () =>
  API.post('token/refresh/', {refresh:refreshToken});

  useEffect(() => {

    if(!refreshToken){
      logout()    
    } else {
      const interval = setInterval(async () => {
      const res = await AxiosRefreshToken();

      localStorage.setItem('accessToken', res.data?.access);
        console.log("token refresh")
      }, 29 * 60 * 1000); // refresh before 30 min expiry

      return () => clearInterval(interval);
    }

  }, []);

  return (
    <AuthContext.Provider value={{ login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
