// components/ProtectedRoute.tsx
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

interface JwtPayload {
  role?: string;
  exp?: number;
  [key: string]: unknown;
}

function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    ) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

function isTokenValid(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded) return false;
  if (decoded.exp && decoded.exp * 1000 < Date.now()) return false;
  return true;
}

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}: ProtectedRouteProps) {
  const location = useLocation();
  const token = localStorage.getItem("accessToken");

  if (!token || !isTokenValid(token)) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  const decoded = decodeToken(token);
  const role = decoded?.role ?? localStorage.getItem("role") ?? "";

  if (allowedRoles.length > 0) {
    const normalizedRole = role.toLowerCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

    if (!normalizedRole || !normalizedAllowed.includes(normalizedRole)) {
      return <Navigate to="/not-accessible" replace />;
    }
  }

  return <>{children}</>;
}
