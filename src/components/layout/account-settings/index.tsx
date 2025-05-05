import { SaveButton, useForm } from "@refinedev/antd";
import type { HttpError } from "@refinedev/core";
import { useGetIdentity } from "@refinedev/core";
import { CloseOutlined } from "@ant-design/icons";
import { Button, Card, Drawer, Form, Input, Spin, Tag, Row, Col, Descriptions } from "antd";
import { getNameInitials } from "@/utilities";
import { CustomAvatar } from "../../custom-avatar";
import { Text } from "../../text";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { ExtendedUser } from "@/types";
import { logError } from "@/utilities/logger";

type Props = {
  opened: boolean;
  setOpened: (opened: boolean) => void;
  userId: string;
};

export const AccountSettings = ({ opened, setOpened, userId }: Props) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const { data: user } = useGetIdentity<ExtendedUser>();

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        if (user) {
          // If we have the user data from useGetIdentity, use it to populate the form
          form.setFieldsValue({
            name: user.name,
            email: user.email,
            roles: user.roles?.join(", "),
            jobTitle: user.jobTitle || "",
            userType: user.userType
          });
        }
      } catch (error) {
        logError("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (opened) {
      loadUserData();
    }
  }, [opened, form, user]);

  const closeModal = () => {
    setOpened(false);
  };

  if (loading) {
    return (
      <Drawer
        open={opened}
        width={756}
        styles={{
          body: {
            background: "#f5f5f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
        }}
      >
        <Spin />
      </Drawer>
    );
  }

  return (
    <Drawer
      onClose={closeModal}
      open={opened}
      width={756}
      styles={{
        body: { background: "#f5f5f5", padding: 0 },
        header: { display: "none" },
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px",
          backgroundColor: "#fff",
        }}
      >
        <Text strong>Account Details</Text>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={() => closeModal()}
        />
      </div>
      <div
        style={{
          padding: "16px",
        }}
      >
        <Card>
          <div style={{ marginBottom: "24px" }}>
            <Row align="middle" gutter={16}>
              <Col>
                <CustomAvatar
                  shape="square"
                  name={user?.name || ""}
                  style={{
                    width: 96,
                    height: 96,
                  }}
                />
              </Col>
              <Col>
                <h2>{user?.name}</h2>
                <Row>
                <Text strong style={{ marginRight: "8px" }}>Roles:</Text>
                  {user?.roles?.map(role => (
                    <Tag key={role} color={role === "admin" ? "red" : "blue"}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Tag>
                  ))}
                </Row>
              </Col>
            </Row>
          </div>

          <Descriptions
            bordered
            column={1}
            layout="vertical"
            title="User Information"
          >
            <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
            <Descriptions.Item label="User Type">
              <Tag color={user?.userType === "staff" ? "green" : "purple"}>
                {user?.userType?.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            
            {user?.userType === "student" && (
              <>
                <Descriptions.Item label="Program">
                  {user?.jobTitle || "Not specified"}
                </Descriptions.Item>
                <Descriptions.Item label="Username/Student ID">
                  {user?.studentFullId}
                </Descriptions.Item>
              </>
            )}
            
            {user?.userType === "staff" && (
              <>
                <Descriptions.Item label="Position">
                  {user?.jobTitle || "Not specified"}
                </Descriptions.Item>
                <Descriptions.Item label="Department">
                  {user?.department || "Not specified"}
                </Descriptions.Item>
                <Descriptions.Item label="Username/Staff ID">
                  {user?.staffFullId}
                </Descriptions.Item>
              </>
            )}
          </Descriptions>

          <div style={{ marginTop: "24px", textAlign: "right" }}>
            <Button 
              type="primary"
              onClick={closeModal}
            >
              Close
            </Button>
          </div>
        </Card>
      </div>
    </Drawer>
  );
};