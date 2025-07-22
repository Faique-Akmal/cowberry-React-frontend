import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOutIcon } from 'lucide-react'; // Optional: nice logout icon
// import { useAuth } from '../../context/AuthContext'; // Optional if using AuthContext

const LogoutButton: React.FC = () => {
  const navigate = useNavigate();
  // const { setUser } = useAuth(); // Optional: if you use AuthContext

  const handleLogout = () => {
    // Clear all tokens and user info
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user'); // optional

    // setUser(null); // Optional if you manage global user state

    // Redirect to login or landing page
    navigate('/signin'); // Adjust route if needed
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-medium transition"
    >
      <LogOutIcon className="w-5 h-5" />
      Logout
    </button>
  );
};

export default LogoutButton;
