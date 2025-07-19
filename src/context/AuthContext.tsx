import { createContext, useContext, useEffect } from 'react';
import API from '../api/axios';
import { axiosGetMe } from '../store/userStore';


interface AuthContextType {
  login: (refreshToken: string, accessToken: string) => void;
  logout: () => void;
  axiosLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const getMeData = async () => {
    const meData = await axiosGetMe();

    if(meData){
      localStorage.setItem('meUser', JSON.stringify(meData));
    }

  }

  const login = (refreshToken: string, accessToken: string) => {
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('accessToken', accessToken);

    getMeData();
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

      if(res.data?.access){
          localStorage.setItem('accessToken', res.data?.access);
          
          console.log("Token Refresh.");
          console.log("NEW ACCESS TOKEN : ", res.data?.access);
          console.log(localStorage.getItem("accessToken"));
        }
      }, 29 * 60 * 1000); // refresh before 30 min expiry

      return () => clearInterval(interval);
    }
    
    console.log(localStorage.getItem("accessToken"));
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
