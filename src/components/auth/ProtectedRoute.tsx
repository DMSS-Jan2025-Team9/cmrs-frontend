import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { logError, logInfo } from "@/utilities/logger";

interface ProtectedRouteProps {
  requiredRoles?: string[];
  children?: React.ReactNode;
}

/**
 * A component that handles role-based access to routes
 * If user has correct roles, it renders children or outlet
 * If not, it redirects to forbidden page
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredRoles = [],
  children,
}) => {
  const location = useLocation();

  // Get user roles from localStorage
  const getUserRoles = (): string[] => {
    const rolesString = localStorage.getItem("user_roles");
    if (rolesString) {
      try {
        return JSON.parse(rolesString);
      } catch (e) {
        logError("Error parsing user roles:", e);
      }
    }
    return [];
  };

  const userRoles = getUserRoles();
  
  // Store current page path for the back button on forbidden page
  useEffect(() => {
    sessionStorage.setItem("previousPage", location.pathname);
  }, [location.pathname]);

  // Check if user has any of the required roles (or if no roles are required)
  const hasRequiredRole = (): boolean => {
    // Log for debugging
    logInfo(`Checking access to path: ${location.pathname}`);
    logInfo(`User roles: ${JSON.stringify(userRoles)}`);
    logInfo(`Required roles: ${JSON.stringify(requiredRoles)}`);
    
    // Admin role has access to everything
    if (userRoles.includes("admin")) {
      logInfo('Access granted: User is admin');
      return true;
    }
    
    // If no specific roles required, allow access
    if (requiredRoles.length === 0) {
      logInfo('Access granted: No specific roles required');
      return true;
    }
    
    // Check if user has any of the required roles
    const hasAccess = requiredRoles.some(role => userRoles.includes(role));
    
    if (hasAccess) {
      logInfo('Access granted: User has required role');
    } else {
      logInfo('Access denied: User does not have required role');
    }
    
    return hasAccess;
  };

  // If user doesn't have required permissions, redirect to forbidden page
  if (!hasRequiredRole()) {
    logInfo(`Redirecting to forbidden page from ${location.pathname}`);
    return <Navigate to="/forbidden" replace />;
  }

  // Render children or outlet if authorized
  return <>{children || <Outlet />}</>;
};

export default ProtectedRoute; 