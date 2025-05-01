import { BrowserRouter, Outlet, Route, Routes } from "react-router";

import { RefineThemes, useNotificationProvider } from "@refinedev/antd";
import { Authenticated, ErrorComponent, Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";

import { App as AntdApp, ConfigProvider, theme } from "antd";

import { Layout, ProtectedRoute } from "@/components";
import { resources, getResourcesByRole } from "@/config/resources";
import { authProvider, dataProvider, liveProvider } from "@/providers";
import dataProviders from "@refinedev/simple-rest";
import {
  DashboardPage,
  LoginPage,
  CourseClassList,
  RegistrationCreatePage,
  BatchJobUploadPage,
  CourseListPage,
  CourseCreatePage,
  CourseEditPage,
  CourseViewPage,
  ClassScheduleCreatePage,
  ClassScheduleEditPage,
  ProgramsPage,
  StudentsByProgramPage,
  MyRegistrationPage,
  RoleCreatePage,
  RoleListPage,
  RoleViewPage,
  RoleEditPage,
  PermissionListPage,
  PermissionCreatePage,
  PermissionEditPage,
  PermissionViewPage,
  UserListPage,
  UserCreatePage,
  UserViewPage,
  UserEditPage,
  ForbiddenPage,
  NotificationPage
} from "@/routes";

import "@refinedev/antd/dist/reset.css";
import { useEffect, useState } from "react";

import { ProgramViewPage } from "./routes/program-management";
import { NotificationProvider } from "./contexts/NotificationContext";
const REGISTRATION_API_URL = "http://localhost:8083/api";

// Create a custom theme that extends the Refine Blue theme
const customTheme = {
  ...RefineThemes.Blue,
  components: {
    ...RefineThemes.Blue.components,
    Menu: {
      ...RefineThemes.Blue.components?.Menu,
      itemHeight: 50, // Increase menu item height
      itemMarginInline: 14, // Add more horizontal spacing
    },
    Layout: {
      ...RefineThemes.Blue.components?.Layout,
      siderWidth: 260, // Increase sider width only when expanded
      // Default collapsed width remains the same (80px)
    }
  }
};

// Define route access roles - which roles can access which routes
const routeAccessRoles: Record<string, string[]> = {
  // These routes are admin-only
  "/roleManagement": ["admin"],
  "/roleManagement/new": ["admin"],
  "/roleManagement/view": ["admin"],
  "/roleManagement/edit": ["admin"],
  "/permissionManagement": ["admin"],
  "/permissionManagement/new": ["admin"],
  "/permissionManagement/view": ["admin"],
  "/permissionManagement/edit": ["admin"],
  "/staffStudentManagement": ["admin"],
  "/staffStudentManagement/create": ["admin"],
  "/staffStudentManagement/view": ["admin"],
  "/staffStudentManagement/edit": ["admin"],
  
  // These routes are for admin and staff
  "/courseManagement": ["admin", "staff"],
  "/courseManagement/new": ["admin", "staff"],
  "/courseManagement/view": ["admin", "staff"],
  "/courseManagement/edit": ["admin", "staff"],
  "/programs": ["admin", "staff"],
  "/students": ["admin", "staff"],
  "/": ["admin", "staff"], // Dashboard route
  
  // These routes are accessible to all users
  "/courseRegistration": ["admin", "staff", "student"],
  "/courseRegistration/new": ["admin", "staff", "student"],
  "/courseRegistration/MyRegistration": ["admin", "staff", "student"],
};

// Helper function to determine required roles for a path
const getRequiredRolesForPath = (path: string) => {
  // Normalize path by removing trailing slash
  let normalizedPath = path.endsWith('/') && path !== '/' 
    ? path.slice(0, -1) 
    : path;
    
  // Special case for root path
  if (normalizedPath === '/') {
    return routeAccessRoles['/'] || [];
  }
  
  // Extract the main segments for matching (excluding numeric IDs and query params)
  const segments = normalizedPath.split('/').filter(segment => {
    // Keep segments that are not purely numeric and not empty
    return segment && !/^\d+$/.test(segment);
  });
  
  // Build the path segments for matching
  let currentPath = '';
  
  // Check each level of the path for role restrictions
  for (let i = 0; i < segments.length; i++) {
    if (i === 0) {
      currentPath = '/' + segments[i];
    } else {
      currentPath += '/' + segments[i];
    }
    
    // Check if this path is protected
    if (routeAccessRoles[currentPath]) {
      console.log(`Path ${path} matched access rule for ${currentPath}`);
      return routeAccessRoles[currentPath];
    }
  }
  
  console.log(`No access rules found for path: ${path}`);
  // Default - admin and staff only for unspecified routes
  return ["admin", "staff"];
};

const App = () => {
  // Using state to manage resources so they update when user logs in/out
  const [visibleResources, setVisibleResources] = useState(getResourcesByRole());
  
  // Custom logout function
  const handleLogout = async () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_details");
    localStorage.removeItem("user_type");
    localStorage.removeItem("user_roles");
    
    // Force refresh resources
    setVisibleResources(getResourcesByRole());
    
    // Return success response for Refine
    return {
      success: true,
      redirectTo: "/login",
    };
  };
  
  // Listen for changes to user roles in localStorage
  useEffect(() => {
    // Update resources when component mounts
    setVisibleResources(getResourcesByRole());
    
    // Set up event listener for storage changes (like login/logout)
    const handleStorageChange = () => {
      setVisibleResources(getResourcesByRole());
    };
    
    // Create a custom event listener for auth changes
    window.addEventListener("storage", handleStorageChange);
    
    // Clean up
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <BrowserRouter>
      <ConfigProvider theme={customTheme}>
        <AntdApp>
          <DevtoolsProvider>
            <NotificationProvider>
              <Refine
                routerProvider={routerProvider}
                dataProvider={{
                  default: dataProvider,
                  courseRegistration: dataProviders(REGISTRATION_API_URL),
                }}
                liveProvider={liveProvider}
                notificationProvider={useNotificationProvider}
                authProvider={{
                  ...authProvider,
                  // Override the login method to also refresh resources
                  login: async (params) => {
                    const result = await authProvider.login(params);
                    // Dispatch a storage event to trigger resource update
                    window.dispatchEvent(new Event("storage"));
                    setVisibleResources(getResourcesByRole());
                    return result;
                  },
                  // Override logout with our custom implementation
                  logout: handleLogout
                }}
                resources={visibleResources}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  liveMode: "auto",
                  useNewQueryKeys: true,
                }}
              >
                <Routes>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-layout"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Layout>
                          <Outlet />
                        </Layout>
                      </Authenticated>
                    }
                  >
                    {/* Dashboard route with admin and staff access */}
                    <Route 
                      index 
                      element={
                        <ProtectedRoute requiredRoles={["admin", "staff"]}>
                          <DashboardPage />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Forbidden page - accessible to all authenticated users */}
                    <Route path="/forbidden" element={<ForbiddenPage />} />

                    {/* Notifications page - accessible to all users */}
                    <Route path="/notifications" element={
                      <ProtectedRoute requiredRoles={["admin", "staff", "student"]}>
                        <NotificationPage />
                      </ProtectedRoute>
                    } />

                    {/* Course Registration routes with protection */}
                    <Route path="/courseRegistration" element={
                      <ProtectedRoute requiredRoles={getRequiredRolesForPath("/courseRegistration")}>
                        <Outlet />
                      </ProtectedRoute>
                    }>
                      <Route index element={<CourseClassList/>} />
                      <Route path="new/:classId" element={<RegistrationCreatePage />} />
                      <Route path="MyRegistration" element={<MyRegistrationPage />} />
                    </Route>

                    {/* Course Management routes with protection */}
                    <Route path="/courseManagement" element={
                      <ProtectedRoute requiredRoles={getRequiredRolesForPath("/courseManagement")}>
                        <Outlet />
                      </ProtectedRoute>
                    }>
                      <Route index element={<CourseListPage />} />
                      <Route path="new" element={<CourseCreatePage />} />
                      <Route path="view/:courseId" element={<CourseViewPage />} />
                      <Route path="edit/:courseId" element={<CourseEditPage />} />
                    </Route>

                    {/* Class Scheduling routes with protection */}
                    <Route path="/classScheduling" element={
                      <ProtectedRoute requiredRoles={["admin", "staff"]}>
                        <Outlet />
                      </ProtectedRoute>
                    }>
                      <Route path="new" element={<ClassScheduleCreatePage />} />
                      <Route path="edit/:classId" element={<ClassScheduleEditPage />} />
                    </Route>
    
                    {/* Batch Job routes with protection */}
                    <Route path="/batchjob/upload" element={
                      <ProtectedRoute requiredRoles={["admin", "staff"]}>
                        <BatchJobUploadPage />
                      </ProtectedRoute>
                    } />

                    {/* Role Management routes with protection */}
                    <Route path="/roleManagement" element={
                      <ProtectedRoute requiredRoles={getRequiredRolesForPath("/roleManagement")}>
                        <Outlet />
                      </ProtectedRoute>
                    }>
                      <Route index element={<RoleListPage />} />
                      <Route path="new" element={<RoleCreatePage />} />
                      <Route path="view/:roleId" element={<RoleViewPage />} />
                      <Route path="edit/:roleId" element={<RoleEditPage />} />
                    </Route>

                    {/* Permission Management routes with protection */}
                    <Route path="/permissionManagement" element={
                      <ProtectedRoute requiredRoles={getRequiredRolesForPath("/permissionManagement")}>
                        <Outlet />
                      </ProtectedRoute>
                    }>
                      <Route index element={<PermissionListPage />} />
                      <Route path="new" element={<PermissionCreatePage />} />
                      <Route path="view/:permissionId" element={<PermissionViewPage />} />
                      <Route path="edit/:permissionId" element={<PermissionEditPage />} />
                    </Route>

                    {/* Staff Student Management routes with protection */}
                    <Route path="/staffStudentManagement" element={
                      <ProtectedRoute requiredRoles={getRequiredRolesForPath("/staffStudentManagement")}>
                        <Outlet />
                      </ProtectedRoute>
                    }>
                      <Route index element={<UserListPage />} />
                      <Route path="create" element={<UserCreatePage />} />
                      <Route path="view/:type/:id" element={<UserViewPage />} />
                      <Route path="edit/:type/:id" element={<UserEditPage />} />
                    </Route>

                    {/* Programs routes with protection */}
                    <Route path="/programs" element={
                      <ProtectedRoute requiredRoles={getRequiredRolesForPath("/programs")}>
                        <Outlet />
                      </ProtectedRoute>
                    }>
                      <Route index element={<ProgramsPage />} />
                      <Route path="view/:programId" element={<ProgramViewPage />} />
                    </Route>

                    {/* Students routes with protection */}
                    <Route path="/students" element={
                      <ProtectedRoute requiredRoles={getRequiredRolesForPath("/students")}>
                        <Outlet />
                      </ProtectedRoute>
                    }>
                      <Route path="program/:programName" element={<StudentsByProgramPage />} />
                    </Route>

                    <Route path="*" element={<ErrorComponent />} />
                  </Route>

                  <Route
                    element={
                      <Authenticated
                        key="authenticated-auth"
                        fallback={<Outlet />}
                      >
                        <NavigateToResource resource="dashboard" />
                      </Authenticated>
                    }
                  >
                    <Route path="/login" element={<LoginPage />} />
                  </Route>
                </Routes>
                <UnsavedChangesNotifier />
                <DocumentTitleHandler />
              </Refine>
              <DevtoolsPanel />
            </NotificationProvider>
          </DevtoolsProvider>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
};

export default App;
