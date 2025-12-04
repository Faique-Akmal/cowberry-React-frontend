// components/ProtectedRoute.jsx

import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = localStorage.getItem("accessToken"); // your auth token
  const role = localStorage.getItem("role");

  // If no token, go to signin
  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  // If role is restricted and not allowed
  if (allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}
