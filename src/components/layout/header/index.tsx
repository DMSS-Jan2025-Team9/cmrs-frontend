import React from "react";

import { Layout, Space, theme } from "antd";

import { CurrentUser } from "../current-user";
import { NotificationBell } from "../../notification";

const { useToken } = theme;

export const Header = () => {
  const { token } = useToken();

  const headerStyles: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "0px 24px",
    height: "64px",
    position: "sticky",
    top: 0,
    zIndex: 999,
  };

  // Get user roles from localStorage to check if user is a student
  // const getUserRoles = (): string[] => {
  //   const rolesString = localStorage.getItem("user_roles");
  //   if (rolesString) {
  //     try {
  //       return JSON.parse(rolesString);
  //     } catch (e) {
  //       console.error("Error parsing user roles:", e);
  //     }
  //   }
  //   return [];
  // };

  // // Only show notification bell for students
  // const userRoles = getUserRoles();
  // const showNotifications = userRoles.includes("student");

  return (
    <Layout.Header style={headerStyles}>
      <Space align="center" size="middle">
        { <NotificationBell />}  
        <CurrentUser />
      </Space>
    </Layout.Header>
  );
};
