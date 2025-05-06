import React, { useState, useEffect } from "react";
import { Form, Input, Button, notification, Space, Checkbox, Card, Divider } from "antd";
import axios from "axios";
import { useGo } from "@refinedev/core";
import type { Role_Creation, Permission } from "@/models/index";


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
    // Check if authentication is working properly
    const checkAuth = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          console.log("No token found");
          return;
        }
        
        const response = await axios.get("https://app.cmrsapp.site/user-management/api/test/authorities", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":"application/json"
          }
        });
        
        console.log("Auth check successful:", response.data);
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };
    
    checkAuth();
    fetchPermissions();
  }, []);

  const getAuthToken = () => {
    // Get the token from localStorage or wherever you store it after login
    return localStorage.getItem('access_token');
  };

  const token = getAuthToken();

  const fetchPermissions = async () => {
    try {
      setLoading(true);

      console.log("Token BEFORE api call:", token);

      const response = await axios.get("https://app.cmrsapp.site/user-management/api/admin/permissions", {
        headers: {
          Authorization: `Bearer ${token}`
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

    const newRole: Role_Creation = {
      roleName,
      description,
      permissions: permissionsToSend,
    };

    axios.post("https://app.cmrsapp.site/user-management/api/admin/roles", newRole, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
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
            style={{ marginTop: 16 }}
          >
            {perms.map(permission => (
              <div key={permission.permissionId} className="mb-3">
                <Checkbox style={{ marginBottom: 4 }}
                  checked={selectedPermissions.includes(permission.permissionId)}
                  onChange={() => handlePermissionChange(permission.permissionId)}
                >
                  <strong className="font-medium">{permission.permissionName}</strong>
                </Checkbox>
                <div className="text-sm text-gray-500 ml-6 mt-1" style={{ marginLeft: 24 }}>{permission.description}</div>
              </div>
            ))}
          </Card>
        ))}

        <Form.Item style={{ marginTop: 32 }}>
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