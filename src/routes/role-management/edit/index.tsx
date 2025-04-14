import React, { useState, useEffect } from "react";
import { Card, Button, Form, Input, notification, Spin, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import axios from "axios";
import { useGo } from "@refinedev/core";
import { useParams } from "react-router-dom";
import type { Role, Permission } from "@/models/index";

export const RoleEditPage = ({ children }: React.PropsWithChildren) => {
    const { roleId } = useParams();
    const go = useGo();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [roleData, setRoleData] = useState<Role | null>(null);

    const { Title } = Typography;

    // Fetch role data
    useEffect(() => {
    const fetchRoleData = async () => {
        setLoading(true);
        try {
        const accessToken = localStorage.getItem("access_token");
        const response = await axios.get(`http://localhost:8085/api/admin/roles/${roleId}`, {
            headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "*/*"
            }
        });
        
        if (response.data.success) {
            const role = response.data.data;
            setRoleData(role);
            
            // Set form fields
            form.setFieldsValue({
            roleName: role.roleName,
            description: role.description
            });
        } else {
            notification.error({
            message: "Error",
            description: response.data.message || "Failed to fetch role details",
            });
        }
        } catch (error) {
        console.error("Error fetching role data", error);
        notification.error({
            message: "Error",
            description: "There was an issue fetching the role details.",
        });
        } finally {
        setLoading(false);
        }
    };

    if (roleId) {
        fetchRoleData();
    }
    }, [roleId, form]);

    // Handle form submission
    const handleSubmit = async (values: { roleName: string; description: string }) => {
    if (!roleData) return;

    setSubmitting(true);
    try {
        const accessToken = localStorage.getItem("access_token");
        
        // Get the current permissions
        const permissionIds = roleData.permissions.map(p => p.permissionId);
        
        const response = await axios.put(
        `http://localhost:8085/api/admin/roles/${roleId}`,
        {
            ...values,
            permissionIds
        },
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
            description: "Role updated successfully",
        });
        
        // Navigate back to role view
        go({
            to: `/roleManagement/view/${roleId}`,
        });
        } else {
        notification.error({
            message: "Error",
            description: response.data.message || "Failed to update role",
        });
        }
    } catch (error) {
        console.error("Error updating role:", error);
        notification.error({
        message: "Error",
        description: "There was an issue updating the role.",
        });
    } finally {
        setSubmitting(false);
    }
    };

    // Navigate back to role view page
    const handleBack = () => {
    go({
        to: `/roleManagement/view/${roleId}`,
    });
    };

    if (loading) {
    return (
        <div className="page-container" style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" tip="Loading role information..." />
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
            <Title level={4} style={{ margin: 0 }}>Edit Role: {roleData?.roleName}</Title>
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
            name="roleName"
            label="Role Name"
            rules={[
                { required: true, message: 'Please input the role name' },
                { min: 3, message: 'Role name must be at least 3 characters' },
                { max: 50, message: 'Role name cannot exceed 50 characters' }
            ]}
            >
            <Input placeholder="Enter role name" />
            </Form.Item>

            <Form.Item
            name="description"
            label="Description"
            rules={[
                { required: true, message: 'Please input the role description' },
                { max: 200, message: 'Description cannot exceed 200 characters' }
            ]}
            >
            <Input.TextArea 
                placeholder="Enter role description"
                rows={4}
            />
            </Form.Item>

            <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Button onClick={handleBack}>
                Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={submitting}>
                Update Role
                </Button>
            </div>
            </Form.Item>
        </Form>
        </Card>
        
        {children}
    </div>
    );
}; 