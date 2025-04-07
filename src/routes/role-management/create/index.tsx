import React, { useState, useEffect } from "react";
import { Form, Input, Button, notification, Space, Checkbox, Card, Divider } from "antd";
import axios from "axios";
import { useGo } from "@refinedev/core";

interface Permission {
  permissionId: number;
  permissionName: string;
  description: string;
}

interface Role {
  roleName: string;
  description: string;
  permissions: Permission[];
}

export const RoleCreatePage = ({ children }: React.PropsWithChildren) => {
  const go = useGo();
  
  const [roleName, setRoleName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [form] = Form.useForm();

  // Fetch available permissions on component mount
  useEffect(() => {
    fetchPermissions();
  }, []);

  const getAuthToken = () => {
    // Get the token from localStorage or wherever you store it after login
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  };

  const fetchPermissions = async () => {
    try {
      setLoading(true);

      const token = getAuthToken();

      const response = await axios.get("http://localhost:8085/api/admin/permissions", {
        headers: {
          Authorization: token
        }
      });
      if (response.data.success) {
        setPermissions(response.data.data);
      } else {
        notification.error({
          message: "Error Fetching Permissions",
          description: response.data.message || "Failed to fetch permissions",
        });
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      notification.error({
        message: "Error Fetching Permissions",
        description: "There was an issue fetching permissions. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permissionId: number) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const handleAdd = () => {
    const permissionsToSend = permissions
      .filter(permission => selectedPermissions.includes(permission.permissionId))
      .map(permission => ({
        permissionId: permission.permissionId,
        permissionName: permission.permissionName,
        description: permission.description
      }));

    const newRole: Role = {
      roleName,
      description,
      permissions: permissionsToSend,
    };

    axios
      .post("http://localhost:8085/api/admin/roles", newRole)
      .then((response) => {
        // Reset the form after successful submission
        form.resetFields();
        setSelectedPermissions([]);

        // Show success notification
        notification.success({
          message: "Role Added Successfully!",
          description: `The role "${roleName}" has been added.`,
          duration: 3,
        });
      })
      .catch((error) => {
        console.error("There was an error adding the role!", error);

        // Show error notification in case of failure
        notification.error({
          message: "Error Adding Role",
          description: "There was an issue adding the role. Please try again.",
        });
      });
  };

  // Group permissions by category (based on naming conventions)
  const groupedPermissions = permissions.reduce((groups: Record<string, Permission[]>, permission) => {
    const category = permission.permissionName.split('_')[0];
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(permission);
    return groups;
  }, {});

  return (
    <div className="page-container">
      <Form layout="vertical" onFinish={handleAdd} form={form}>
        <Form.Item
          label="Role Name"
          name="roleName"
          rules={[
            { required: true, message: "Role Name is required!" },
            { max: 50, message: "Role Name cannot be longer than 50 characters!" },
          ]}
        >
          <Input
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="Enter role name"
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
            placeholder="Enter role description"
            rows={4}
          />
        </Form.Item>

        <Divider orientation="left">Permissions</Divider>
        
        {Object.entries(groupedPermissions).map(([category, perms]) => (
          <Card 
            title={category.charAt(0).toUpperCase() + category.slice(1)} 
            key={category}
            className="mb-4"
            size="small"
          >
            {perms.map(permission => (
              <div key={permission.permissionId} className="mb-2">
                <Checkbox
                  checked={selectedPermissions.includes(permission.permissionId)}
                  onChange={() => handlePermissionChange(permission.permissionId)}
                >
                  <div>
                    <strong>{permission.permissionName}</strong>
                    <div className="text-sm text-gray-500">{permission.description}</div>
                  </div>
                </Checkbox>
              </div>
            ))}
          </Card>
        ))}

        <Form.Item>
          <Space size="middle">
            <Button type="primary" htmlType="submit">
              Create Role
            </Button>
            <Button
              onClick={() => {
                go({
                  to: "/roleManagement",
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