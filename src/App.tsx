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

import { Layout } from "@/components";
import { resources } from "@/config/resources";
import { authProvider, dataProvider, liveProvider } from "@/providers";
import dataProviders from "@refinedev/simple-rest";
import {
  CompanyCreatePage,
  CompanyEditPage,
  CompanyListPage,
  DashboardPage,
  LoginPage,
  TasksCreatePage,
  TasksEditPage,
  TasksListPage,
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
  PermissionEditPage
} from "@/routes";



import "@refinedev/antd/dist/reset.css";
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

const App = () => {
  return (
    <BrowserRouter>
      <ConfigProvider theme={customTheme}>
        <AntdApp>
          <DevtoolsProvider>
            <Refine
              routerProvider={routerProvider}
              dataProvider={{
                default: dataProvider,
                courseRegistration: dataProviders(REGISTRATION_API_URL),
              }}
            
              liveProvider={liveProvider}
              notificationProvider={useNotificationProvider}
              authProvider={authProvider}
              resources={resources}
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
                  <Route index element={<DashboardPage />} />

                  <Route
                    path="/tasks"
                    element={
                      <TasksListPage>
                        <Outlet />
                      </TasksListPage>
                    }
                  >
                    <Route path="new" element={<TasksCreatePage />} />
                    <Route path="edit/:id" element={<TasksEditPage />} />
                  </Route>

                  <Route path="/companies">
                    <Route index element={<CompanyListPage />} />
                    <Route path="new" element={<CompanyCreatePage />} />
                    <Route path="edit/:id" element={<CompanyEditPage />} />
                  </Route>

                  <Route path="/courseRegistration">
                    <Route index element={<CourseClassList/>} />
                    <Route path="new/:classId" element={<RegistrationCreatePage />} />
                    <Route path="MyRegistration" element={<MyRegistrationPage />} />
                  </Route>

                  <Route path="/courseManagement">
                    <Route index element={<CourseListPage />} />
                    <Route path="new" element={<CourseCreatePage />} />
                    <Route path="view/:courseId" element={<CourseViewPage />} />
                    <Route path="edit/:courseId" element={<CourseEditPage />} />
                  </Route>

                  <Route path="/classScheduling">
                    <Route path="new" element={<ClassScheduleCreatePage />} />
                    <Route path="edit/:classId" element={<ClassScheduleEditPage />} />
                  </Route>
  
                  <Route path="/batchjob/upload">
                    <Route index element={<BatchJobUploadPage />} />
                  </Route>

                  <Route path="/roleManagement">
                    <Route index element={<RoleListPage />} />
                    <Route path="new" element={<RoleCreatePage />} />
                    <Route path="view/:roleId" element={<RoleViewPage />} />
                    <Route path="edit/:roleId" element={<RoleEditPage />} />
                  </Route>

                  <Route path="/permissionManagement">
                    <Route index element={<PermissionListPage />} />
                    <Route path="new" element={<PermissionCreatePage />} />
                    <Route path="edit/:permissionId" element={<PermissionEditPage />} />
                  </Route>
                  
                  <Route path="/programs" element={<ProgramsPage />} />

                  <Route path="/students">
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
          </DevtoolsProvider>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
};

export default App;
