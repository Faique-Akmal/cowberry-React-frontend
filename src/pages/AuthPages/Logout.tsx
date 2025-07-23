import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext'; // Optional if using AuthContext

const Logout: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = () => {
      // Clear tokens and user data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');

      // If you're using a global auth context:
      // setUser(null);

      // Redirect to sign-in
      navigate('/signin');
    };

    handleLogout();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-600 text-lg">Logging out...</p>
    </div>
  );
};

export default Logout;
