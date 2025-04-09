import { SaveButton, useForm } from "@refinedev/antd";
import type { HttpError } from "@refinedev/core";
import { useGetIdentity } from "@refinedev/core";
import { CloseOutlined } from "@ant-design/icons";
import { Button, Card, Drawer, Form, Input, Spin, Tag } from "antd";
import { getNameInitials } from "@/utilities";
import { CustomAvatar } from "../../custom-avatar";
import { Text } from "../../text";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; // You may need to install this

type Props = {
  opened: boolean;
  setOpened: (opened: boolean) => void;
  userId: string;
};

type JwtPayload = {
  permissions: string[];
  roles: string[];
  email: string;
  sub: string;
  iat: number;
  exp: number;
};

export const AccountSettings = ({ opened, setOpened, userId }: Props) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<JwtPayload | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        const accessToken = localStorage.getItem("access_token");
        if (accessToken) {
          const decoded = jwtDecode<JwtPayload>(accessToken);
          setUserData(decoded);
          
          // Populate the form with data from JWT
          form.setFieldsValue({
            name: decoded.sub,
            email: decoded.email,
            roles: decoded.roles,
            permissions: decoded.permissions
          });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (opened) {
      loadUserData();
    }
  }, [opened, form]);

  const handleSave = async (values: any) => {
    // In a real application, you would update the user profile here
    // For now, we'll just close the modal
    console.log("Would save values:", values);
    setOpened(false);
  };

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
        <Text strong>Account Settings</Text>
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
          <Form 
            form={form}
            layout="vertical"
            onFinish={handleSave}
          >
            <CustomAvatar
              shape="square"
              name={getNameInitials(userData?.sub || "")}
              style={{
                width: 96,
                height: 96,
                marginBottom: "24px",
              }}
            />
            <Form.Item label="Username" name="name">
              <Input disabled placeholder="Username" />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input disabled placeholder="Email" />
            </Form.Item>
            <Form.Item label="Roles">
              {userData?.roles.map(role => (
                <Tag key={role} color="blue">{role}</Tag>
              ))}
            </Form.Item>
          </Form>
          <Button 
            type="primary"
            onClick={closeModal}
            style={{
              display: "block",
              marginLeft: "auto",
            }}
          >
            Close
          </Button>
        </Card>
      </div>
    </Drawer>
  );
};