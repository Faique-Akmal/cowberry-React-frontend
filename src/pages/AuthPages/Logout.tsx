import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { useLocationTracker } from "../../hooks/LocationTrackerProvider";

const Logout: React.FC = () => {
  const navigate = useNavigate();
  const { axiosLogout } = useAuth();
  const tracker = useLocationTracker();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await axiosLogout?.();
        await tracker.stop();

        // Clear stored data while preserving theme settings
        const isDarkMode = localStorage.getItem("isDarkMode");
        const theme = localStorage.getItem("theme");
        const customTheme = localStorage.getItem("customTheme");
        localStorage.clear();
        sessionStorage.clear();
        if (isDarkMode !== null) localStorage.setItem("isDarkMode", isDarkMode);
        if (theme !== null) localStorage.setItem("theme", theme);
        if (customTheme !== null) localStorage.setItem("customTheme", customTheme);

        // Optional: Force browser to drop cached pages
        window.history.pushState(null, "", window.location.href);
        window.addEventListener("popstate", () => {
          navigate("/signin", { replace: true });
        });

        toast.success("Logged out");
      } catch (error) {
        console.error("Logout failed:", error);
        toast.error("Failed to logout");
      } finally {
        // Redirect and replace history so back button can't re-enter
        navigate("/signin", { replace: true });
      }
    };

    handleLogout();
  }, [navigate, axiosLogout]);

  return null;
};

export default Logout;
