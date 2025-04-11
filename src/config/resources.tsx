import type { IResourceItem } from "@refinedev/core";

import {
  DashboardOutlined,
  ProjectOutlined,
  ScheduleOutlined,
  ShopOutlined,
  UserAddOutlined,
  FileAddOutlined
} from "@ant-design/icons";

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
      label: "Course Registration",
      icon: <FileAddOutlined />,
      dataProviderName: "courseRegistration", 
      liveMode: "off",
    },
  },
  {
    name: "batchJobUpload",
    list: "/batchjob/upload",
    meta: {
      label: "Add Students",
      icon: <UserAddOutlined />,
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
