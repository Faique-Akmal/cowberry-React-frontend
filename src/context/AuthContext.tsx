import { createContext, useContext, useEffect } from 'react';
import API from '../api/axios';

interface AuthContextType {
  login: (refreshToken: string, accessToken: string) => void;
  logout: () => void;
  axiosLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const login = (refreshToken: string, accessToken: string) => {
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('accessToken', accessToken);
  };

  const axiosLogout = async () =>{
    try {
      const res = await API.post("/logout/")
      console.log(res.data)
    } catch (err) {
      console.error('Failed to logout user', err);
    }
    
    logout();
  } 

  const logout = () => {
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accessToken');
  };


  const refreshToken = localStorage.getItem('refreshToken');

  const axiosRefreshToken = () =>
  API.post('token/refresh/', {refresh:refreshToken});

  useEffect(() => {

    if(!refreshToken){
      logout()    
    } else {
      const interval = setInterval(async () => {
      const res = await axiosRefreshToken();

      if(res.data){
          localStorage.setItem('accessToken', res.data?.access);
          localStorage.setItem('refreshToken', res.data?.refresh);
            console.log("token refresh")
        }
      }, 3 * 60 * 1000); // refresh before 3 min expiry

      return () => clearInterval(interval);
    }

  }, []);

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
