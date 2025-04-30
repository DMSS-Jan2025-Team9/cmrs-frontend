import React from "react";

import { useGetIdentity } from "@refinedev/core";

import { SettingOutlined, UserOutlined, MailOutlined, IdcardOutlined } from "@ant-design/icons";
import { Button, Popover, Divider, Tag } from "antd";

import { ExtendedUser } from "@/types";

import { CustomAvatar } from "../../custom-avatar";
import { Text } from "../../text";
import { AccountSettings } from "../account-settings";

export const CurrentUser = () => {
  const [opened, setOpened] = React.useState(false);
  const { data: user } = useGetIdentity<ExtendedUser>();

  // Get the primary role (usually the first one or admin if present)
  const primaryRole = user?.roles?.includes("admin") 
    ? "Admin" 
    : user?.roles?.[0] ? `${user.roles[0].charAt(0).toUpperCase()}${user.roles[0].slice(1)}` : "";

  const content = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minWidth: "240px",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}
      >
        <Text strong style={{ fontSize: "16px" }}>
          {user?.name}
        </Text>
        {primaryRole && (
          <Tag color={primaryRole === "Admin" ? "red" : "blue"}>
            {primaryRole}
          </Tag>
        )}
        
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <MailOutlined style={{ color: "#8c8c8c" }} />
          <Text style={{ color: "#8c8c8c", fontSize: "13px" }}>
            {user?.email}
          </Text>
        </div>
        
        {user?.userType === "student" && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <IdcardOutlined style={{ color: "#8c8c8c" }} />
            <Text style={{ color: "#8c8c8c", fontSize: "13px" }}>
              ID: {user?.studentFullId}
            </Text>
          </div>
        )}
        
        {user?.userType === "student" && user?.jobTitle && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <UserOutlined style={{ color: "#8c8c8c" }} />
            <Text style={{ color: "#8c8c8c", fontSize: "13px" }}>
              Program: {user?.jobTitle}
            </Text>
          </div>
        )}
        
        {user?.userType === "staff" && user?.jobTitle && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <UserOutlined style={{ color: "#8c8c8c" }} />
            <Text style={{ color: "#8c8c8c", fontSize: "13px" }}>
              Position: {user?.jobTitle}
            </Text>
          </div>
        )}
        
        {user?.userType === "staff" && user?.department && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <IdcardOutlined style={{ color: "#8c8c8c" }} />
            <Text style={{ color: "#8c8c8c", fontSize: "13px" }}>
              Dept: {user?.department}
            </Text>
          </div>
        )}
      </div>
      <Divider style={{ margin: "0" }} />
      <div
        style={{
          padding: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <Button
          style={{ textAlign: "left" }}
          icon={<SettingOutlined />}
          type="text"
          block
          onClick={() => setOpened(true)}
        >
          Account settings
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Popover
        placement="bottomRight"
        content={content}
        trigger="click"
        overlayInnerStyle={{ padding: 0 }}
        overlayStyle={{ zIndex: 999 }}
      >
        <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
          <CustomAvatar
            name={user?.name}
            src={user?.avatarUrl}
            size="default"
            style={{ cursor: "pointer" }}
          />
          <span className="user-name" style={{ marginLeft: "8px" }}>
            {user?.name}
          </span>
        </div>
      </Popover>
      {user && (
        <AccountSettings
          opened={opened}
          setOpened={setOpened}
          userId={user.id}
        />
      )}
    </>
  );
};
