import React, { useState, useEffect } from "react";
import { 
  Card, 
  Descriptions, 
  Button, 
  Spin, 
  notification, 
  Space, 
  Typography, 
  Popconfirm, 
  message 
} from "antd";
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import axios from "axios";
import { useGo } from "@refinedev/core";
import type { Permission } from "@/models/index";
import { useParams } from "react-router-dom";

export const PermissionViewPage = ({ children }: React.PropsWithChildren) => {
  const { permissionId } = useParams();
  const go = useGo();
  
  const [permissionData, setPermissionData] = useState<Permission | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const { Title } = Typography;

  // Fetch permission data based on permissionId
  useEffect(() => {
    if (permissionId) {
      fetchPermissionData();
    }
  }, [permissionId]);

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
        setPermissionData(response.data.data);
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

  // Navigate to the edit page
  const handleEdit = () => {
    go({
      to: `/permissionManagement/edit/${permissionId}`,
    });
  };

  // Navigate back to permission management list page
  const handleBack = () => {
    go({
      to: "/permissionManagement",
    });
  };

  // Handle delete permission
  const handleDeletePermission = async () => {
    try {
      const accessToken = localStorage.getItem("access_token");
      await axios.delete(`https://alb-cmrs-app-790797307.ap-southeast-1.elb.amazonaws.com/user-management/api/admin/permissions/${permissionId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "*/*",
          "Content-Type": "application/json"
        }
      });
      
      message.success("Permission deleted successfully");
      handleBack(); // Navigate back to list page
    } catch (error) {
      console.error("Error deleting permission:", error);
      message.error("Failed to delete permission. Please try again.");
    }
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
            <Title level={4} style={{ margin: 0 }}>Permission Details</Title>
          </div>
        }
        extra={
          <Space>
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={handleEdit}
            >
              Edit
            </Button>
            <Popconfirm
              title="Delete Permission"
              description="Are you sure you want to delete this permission?"
              onConfirm={handleDeletePermission}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button 
                danger 
                icon={<DeleteOutlined />}
              >
                Delete
              </Button>
            </Popconfirm>
          </Space>
        }
      >
        {permissionData && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Permission ID">{permissionData.permissionId}</Descriptions.Item>
            <Descriptions.Item label="Permission Name">{permissionData.permissionName}</Descriptions.Item>
            <Descriptions.Item label="Description">{permissionData.description}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>
      
      {children}
    </div>
  );
}; 