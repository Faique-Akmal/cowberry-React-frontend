import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";

const Logout: React.FC = () => {
  const navigate = useNavigate();
  const {axiosLogout} = useAuth();
  
  useEffect(() => {
    // ✅ Clear tokens from storage
    axiosLogout()
    // ✅ Redirect to; login (or home)
    navigate('/signin', { replace: true });
  }, [navigate]);

  return null; // no UI needed
};

export default Logout;