import type { IResourceItem } from "@refinedev/core";
import { jwtDecode} from "jwt-decode";

import {
  DashboardOutlined,
  ProjectOutlined,
  ScheduleOutlined,
  ShopOutlined,
  UserAddOutlined,
  FileAddOutlined,
  TagOutlined,
  LockOutlined,
  UserOutlined,
  BellOutlined
} from "@ant-design/icons";
interface DecodedToken {
  role: string;
  // other fields if necessary
}

export const resources: IResourceItem[] = [
  {
    name: "dashboard",
    list: "/",
    meta: {
      label: "Dashboard",
      icon: <DashboardOutlined />,
    },
  },
  {
    name: "courseManagement",
    list: "/courseManagement",
    show: "/courseManagement/:id",
    create: "/courseManagement/new",
    edit: "/courseManagement/edit/:id",
    meta: {
      label: "Course Management",
      icon: <ScheduleOutlined/>,
    },
  },
  // {
  //   name: "companies",
  //   list: "/companies",
  //   show: "/companies/:id",
  //   create: "/companies/new",
  //   edit: "/companies/edit/:id",
  //   meta: {
  //     label: "Companies",
  //     icon: <ShopOutlined />,
  //   },
  // },
  // {
  //   name: "tasks",
  //   list: "/tasks",
  //   create: "/tasks/new",
  //   edit: "/tasks/edit/:id",
  //   meta: {
  //     label: "Tasks",
  //     icon: <ProjectOutlined />,
  //   },
  // },
  {
    name: "courseRegistration",
    list: "/courseRegistration",
    show: "/courseRegistration/show/:id",
    create: "/courseRegistration/new/:classId",
    meta: {
      label: "Registration",
      icon: <FileAddOutlined />,
      dataProviderName: "courseRegistration", 
      liveMode: "off",
    },
  },
  // {
  //   name: "notifications",
  //   list: "/notifications",
  //   meta: {
  //     label: "Notifications",
  //     icon: <BellOutlined />,
  //   },
  // },
  {
    name: "roleManagement",
    list: "/roleManagement",
    show: "/roleManagement/view/:id",
    create: "/roleManagement/new",
    edit: "/roleManagement/edit/:id",
    meta: {
      label: "Roles",
      icon: <TagOutlined/>,
    },
  },
  {
    name: "permissionManagement",
    list: "/permissionManagement",
    show: "/permissionManagement/view/:id",
    create: "/permissionManagement/new",
    edit: "/permissionManagement/edit/:id",
    meta: {
      label: "Permissions",
      icon: <LockOutlined/>,
    },
  },
  {
    name: "staffStudentManagement",
    list: "/staffStudentManagement",
    create: "/staffStudentManagement/create",
    edit: "/staffStudentManagement/edit/:type/:id",
    show: "/staffStudentManagement/view/:type/:id",
    meta: {
      label: "Users",
      icon: <UserOutlined />,
    },
  },
  {
    name: "programs",
    list: "/programs",
    show: "/programs/show/:id",
    meta: {
      label: "Programs",
      icon: <ScheduleOutlined />,
    },
  },
];

// Get the user's roles from localStorage
const getUserRoles = (): string[] => {
  const rolesString = localStorage.getItem("user_roles");
  if (rolesString) {
    try {
      return JSON.parse(rolesString);
    } catch (e) {
      console.error("Error parsing user roles:", e);
    }
  }
  return [];
};

// Function to determine if user has access to a resource
const hasAccessToResource = (resourceName: string, userRoles: string[]): boolean => {
  // Resources only available to admin or staff
  const adminOnlyResources = [
    "roleManagement",
    "permissionManagement",
    "staffStudentManagement",
  ];

  const staffResources = [
    "courseManagement",
    "programs"
  ];

  // Resources available to all users
  const commonResources = [
    "courseRegistration",
  ];

  // Resources available only to students
  const studentResources = [
    "notifications"
  ];

  // Admin has access to everything
  if (userRoles.includes("admin")) {
    return true;
  }

  // Staff has access to everything except admin-only resources
  if (userRoles.includes("staff")) {
    return !adminOnlyResources.includes(resourceName) || staffResources.includes(resourceName) || commonResources.includes(resourceName);
  }

  // Student has access only to common resources and student-specific resources
  if (userRoles.includes("student")) {
    return commonResources.includes(resourceName) || studentResources.includes(resourceName);
  }

  return false;
};

export const getResourcesByRole = (): IResourceItem[] => {
  const userRoles = getUserRoles();
  
  // If no roles found, only show registration for student as fallback
  if (!userRoles.length) {
    return resources.filter(resource => resource.name === "courseRegistration");
  }
  
  // Filter resources based on user's roles
  return resources.filter(resource => 
    hasAccessToResource(resource.name, userRoles)
  );
};