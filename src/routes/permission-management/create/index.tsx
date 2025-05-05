import React, { useState } from "react";
import { Form, Input, Button, notification, Space } from "antd";
import axios from "axios";
import { useGo } from "@refinedev/core";
import type { Permission } from "@/models/index";
import { logError } from "@/utilities/logger";

export const PermissionCreatePage = ({ children }: React.PropsWithChildren) => {
  const go = useGo();
  
  const [permissionName, setPermissionName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [form] = Form.useForm();

  const getAuthToken = () => {
    return localStorage.getItem('access_token');
  };

  const token = getAuthToken();

  const handleAdd = async () => {
    try {
      setLoading(true);
      
      const newPermission = {
        permissionName,
        description
      };

      const response = await axios.post("http://localhost:8085/api/admin/permissions", newPermission, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.data.success) {
        // Reset the form after successful submission
        form.resetFields();

        // Show success notification
        notification.success({
          message: "Permission Added Successfully!",
          description: `The permission "${permissionName}" has been added.`,
          duration: 3,
        });
        
        // Navigate back to the list page
        go({
          to: "/permissionManagement",
        });
      } else {
        notification.error({
          message: "Error Adding Permission",
          description: response.data.message || "There was an issue adding the permission.",
        });
      }
    } catch (error) {
      logError("There was an error adding the permission!", error);

      // Show error notification in case of failure
      notification.error({
        message: "Error Adding Permission",
        description: "There was an issue adding the permission. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Form layout="vertical" onFinish={handleAdd} form={form}>
        <Form.Item
          label="Permission Name"
          name="permissionName"
          rules={[
            { required: true, message: "Permission Name is required!" },
            { max: 50, message: "Permission Name cannot be longer than 50 characters!" },
          ]}
        >
          <Input
            value={permissionName}
            onChange={(e) => setPermissionName(e.target.value)}
            placeholder="Enter permission name"
          />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[
            { required: true, message: "Description is required!" },
            { max: 200, message: "Description cannot be longer than 200 characters!" },
          ]}
        >
          <Input.TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter permission description"
            rows={4}
          />
        </Form.Item>

        <Form.Item style={{ marginTop: 24 }}>
          <Space size="middle">
            <Button type="primary" htmlType="submit" loading={loading}>
              Create Permission
            </Button>
            <Button
              onClick={() => {
                go({
                  to: "/permissionManagement",
                });
              }}
            >
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
      {children}
    </div>
  );
}; 