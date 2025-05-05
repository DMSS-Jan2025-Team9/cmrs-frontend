import React, { useState, useEffect } from "react";
import { Card, Button, Form, Input, notification, Spin, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import axios from "axios";
import { useGo } from "@refinedev/core";
import { useParams } from "react-router-dom";
import type { Permission } from "@/models/index";

export const PermissionEditPage = ({ children }: React.PropsWithChildren) => {
  const { permissionId } = useParams();
  const go = useGo();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [permissionData, setPermissionData] = useState<Permission | null>(null);

  const { Title } = Typography;

  // Fetch permission data
  useEffect(() => {
    const fetchPermissionData = async () => {
      setLoading(true);
      try {
        const accessToken = localStorage.getItem("access_token");
        const response = await axios.get(`https://alb-cmrs-app-790797307.ap-southeast-1.elb.amazonaws.com/user-management/api/admin/permissions/${permissionId}`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "*/*"
          }
        });
        
        if (response.data.success) {
          const permission = response.data.data;
          setPermissionData(permission);
          
          // Set form fields
          form.setFieldsValue({
            permissionName: permission.permissionName,
            description: permission.description
          });
        } else {
          notification.error({
            message: "Error",
            description: response.data.message || "Failed to fetch permission details",
          });
        }
      } catch (error) {
        console.error("Error fetching permission data", error);
        notification.error({
          message: "Error",
          description: "There was an issue fetching the permission details.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (permissionId) {
      fetchPermissionData();
    }
  }, [permissionId, form]);

  // Handle form submission
  const handleSubmit = async (values: { permissionName: string; description: string }) => {
    if (!permissionData) return;

    setSubmitting(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      
      const response = await axios.put(
        `https://alb-cmrs-app-790797307.ap-southeast-1.elb.amazonaws.com/user-management/api/admin/permissions/${permissionId}`,
        values,
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "*/*",
            "Content-Type": "application/json"
          }
        }
      );
      
      if (response.data.success) {
        notification.success({
          message: "Success",
          description: "Permission updated successfully",
        });
        
        // Navigate back to permission view
        go({
          to: `/permissionManagement/`,
        });
      } else {
        notification.error({
          message: "Error",
          description: response.data.message || "Failed to update permission",
        });
      }
    } catch (error) {
      console.error("Error updating permission:", error);
      notification.error({
        message: "Error",
        description: "There was an issue updating the permission.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Navigate back to permission view page
  const handleBack = () => {
    go({
      to: `/permissionManagement/`,
    });
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" tip="Loading permission information..." />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              type="text" 
              onClick={handleBack} 
              style={{ marginRight: '10px' }}
            />
            <Title level={4} style={{ margin: 0 }}>Edit Permission: {permissionData?.permissionName}</Title>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={submitting}
        >
          <Form.Item
            name="permissionName"
            label="Permission Name"
            rules={[
              { required: true, message: 'Please input the permission name' },
              { min: 3, message: 'Permission name must be at least 3 characters' },
              { max: 50, message: 'Permission name cannot exceed 50 characters' }
            ]}
          >
            <Input placeholder="Enter permission name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: 'Please input the permission description' },
              { max: 200, message: 'Description cannot exceed 200 characters' }
            ]}
          >
            <Input.TextArea 
              placeholder="Enter permission description"
              rows={4}
            />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button onClick={handleBack}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Update Permission
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
      
      {children}
    </div>
  );
}; 