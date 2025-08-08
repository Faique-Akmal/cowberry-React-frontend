import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const Logout: React.FC = () => {
  const navigate = useNavigate();
  const { axiosLogout } = useAuth();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await axiosLogout(); 
        toast.success("Logged out"); 
      } catch (error) {
        console.error("Logout failed:", error);
        toast.error("Failed to logout"); 
      } finally {
        navigate("/signin", { replace: true }); 
      }
    };

    handleLogout();
  }, [navigate, axiosLogout]);

  return null;
};

export default Logout;
