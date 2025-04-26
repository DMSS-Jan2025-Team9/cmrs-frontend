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
  UserOutlined
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
  {
    name: "companies",
    list: "/companies",
    show: "/companies/:id",
    create: "/companies/new",
    edit: "/companies/edit/:id",
    meta: {
      label: "Companies",
      icon: <ShopOutlined />,
    },
  },
  {
    name: "tasks",
    list: "/tasks",
    create: "/tasks/new",
    edit: "/tasks/edit/:id",
    meta: {
      label: "Tasks",
      icon: <ProjectOutlined />,
    },
  },
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
    show: "/programs/:id",
    meta: {
      label: "Programs",
      icon: <ScheduleOutlined />,
    },
  },
];

export const getResourcesByRole = (role: string): IResourceItem[] => {
  if (role === "student") {
    return resources.filter(resource => resource.name === "courseRegistration");
  }

  return resources; // other roles see everything
};