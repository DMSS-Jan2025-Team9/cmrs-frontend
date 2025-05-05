import React from "react";
import { useLogin } from "@refinedev/core";
import { Card, Layout, Typography, Form, Input, Button, theme, Alert } from "antd";
import { ThemedTitleV2 } from "@refinedev/antd";
import { authCredentials } from "@/providers";

const { Text } = Typography;
const { useToken } = theme;

export const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const { token } = useToken();
  const { mutate: login } = useLogin();

  const onFinish = (values: { username: string; password: string }) => {
    login(values);
  };

  return (
    <Layout
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: token.colorBgLayout,
      }}
    >
      <Card
        style={{
          width: "400px",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <ThemedTitleV2 collapsed={false} text="Course Management and Registration System (CMRS)" />
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            username: authCredentials.username,
            password: authCredentials.password,
          }}
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input size="large" placeholder="Username" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password size="large" placeholder="Password" />
          </Form.Item>

          <Alert
            message="User Information"
            description={
              <Text>
                Student users use format <Text strong>U######</Text> (e.g. U119713)<br />
                Staff users use format <Text strong>S######</Text> (e.g. S124642)
              </Text>
            }
            type="info"
            showIcon
            style={{ marginBottom: "16px" }}
          />

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              style={{ width: "100%" }}
            >
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Layout>
  );
};