import React, { useState, useEffect } from "react";
import { 
    Card, 
    Descriptions, 
    Button, 
    Spin, 
    notification, 
    Table, 
    Space, 
    Typography, 
    Tag, 
    Modal, 
    Form,
    Select,
    Popconfirm,
    message 
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import axios from "axios";
import { useGo } from "@refinedev/core";
import type { Role, Permission } from "@/models/index";
import { useParams } from "react-router-dom";


export const RoleViewPage = ({ children }: React.PropsWithChildren) => {
    const { roleId } = useParams();
    const go = useGo();
    
    const [roleData, setRoleData] = useState<Role | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [isAddPermissionModalVisible, setIsAddPermissionModalVisible] = useState<boolean>(false);
    const [addPermissionForm] = Form.useForm();
    const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);

    const { Title } = Typography;

    // Fetch role data based on roleId
    useEffect(() => {
        if (roleId) {
        fetchRoleData();
        }
    }, [roleId]);

    const fetchRoleData = async () => {
        setLoading(true);
        try {
        const accessToken = localStorage.getItem("access_token");
        const response = await axios.get(`https://app.cmrsapp.site/user-management/api/admin/roles/${roleId}`, {
            headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "*/*"
            }
        });
        
        if (response.data.success) {
            setRoleData(response.data.data);
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

    // Fetch all permissions to use in the add permission modal
    useEffect(() => {
        const fetchAllPermissions = async () => {
        try {
            const accessToken = localStorage.getItem("access_token");
            const response = await axios.get("https://app.cmrsapp.site/user-management/api/admin/permissions", {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Accept": "*/*"
            }
            });
            
            if (response.data.success) {
            setAllPermissions(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching permissions", error);
        }
        };

        fetchAllPermissions();
    }, []);

    // Calculate available permissions (those not already assigned to the role)
    useEffect(() => {
        if (roleData && allPermissions.length > 0) {
        const assignedPermissionIds = roleData.permissions.map(p => p.permissionId);
        const available = allPermissions.filter(p => 
            !assignedPermissionIds.includes(p.permissionId)
        );
        setAvailablePermissions(available);
        }
    }, [roleData, allPermissions]);

    // Navigate to the edit page
    const handleEdit = () => {
        go({
        to: `/roleManagement/edit/${roleId}`,
        });
    };

    // Navigate back to role management page
    const handleBack = () => {
        go({
        to: "/roleManagement",
        });
    };

    // Handle delete role
    const handleDeleteRole = async () => {
        try {
        const accessToken = localStorage.getItem("access_token");
        await axios.delete(`https://app.cmrsapp.site/user-management/api/admin/roles/${roleId}`, {
            headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "*/*",
            "Content-Type": "application/json"
            }
        });
        
        message.success("Role deleted successfully");
        handleBack();
        } catch (error) {
        console.error("Error deleting role:", error);
        message.error("Failed to delete role. Please try again.");
        }
    };

    // Show add permission modal
    const showAddPermissionModal = () => {
        setIsAddPermissionModalVisible(true);
        addPermissionForm.resetFields();
    };

    // Handle add permission form submission
    const handleAddPermission = async (values: { permissionIds: number[] }) => {
        try {
        if (!roleData) return;
        
        const accessToken = localStorage.getItem("access_token");
        
        // Get current permissions
        const currentPermissionIds = roleData.permissions.map(p => p.permissionId);
        
        // Add new permissions
        const updatedPermissionIds = [...currentPermissionIds, ...values.permissionIds];
        
        // Update role with new permissions
        const response = await axios.put(
            `https://app.cmrsapp.site/user-management/api/admin/roles/permissions`,
            {
            roleId: roleId,
            permissionIds: updatedPermissionIds
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
            message.success("Permissions added successfully");
            setIsAddPermissionModalVisible(false);
            fetchRoleData(); // Refresh role data
        } else {
            message.error(response.data.message || "Failed to add permissions");
        }
        } catch (error) {
        console.error("Error adding permissions:", error);
        message.error("Failed to add permissions. Please try again.");
        }
    };

    // Remove permission from role
    const handleRemovePermission = async (permissionId: number) => {
        try {
        if (!roleData) return;
        
        const accessToken = localStorage.getItem("access_token");
        
        // Filter out the removed permission
        const updatedPermissionIds = roleData.permissions
            .filter(p => p.permissionId !== permissionId)
            .map(p => p.permissionId);
        
        // Update role with new permissions
        const response = await axios.put(
            `https://app.cmrsapp.site/user-management/api/admin/roles/permissions`,
            {
            roleId: roleId,
            permissionIds: updatedPermissionIds
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
            message.success("Permission removed successfully");
            fetchRoleData(); // Refresh role data
        } else {
            message.error(response.data.message || "Failed to remove permission");
        }
        } catch (error) {
        console.error("Error removing permission:", error);
        message.error("Failed to remove permission. Please try again.");
        }
    };

    // Table columns configuration for permissions
    const permissionColumns = [
        {
        title: 'Permission Name',
        dataIndex: 'permissionName',
        key: 'permissionName',
        render: (text: string) => <Tag color="blue">{text}</Tag>
        },
        {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        },
        {
        title: 'Actions',
        key: 'actions',
        render: (_: any, record: Permission) => (
            <Popconfirm
            title="Remove Permission"
            description="Are you sure you want to remove this permission from the role?"
            onConfirm={() => handleRemovePermission(record.permissionId)}
            okText="Yes"
            cancelText="No"
            >
            <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
            >
                Remove
            </Button>
            </Popconfirm>
        ),
        },
    ];

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
            title={`Role Details: ${roleData?.roleName}`}
            extra={
            <Space>
                <Button type="primary" onClick={handleEdit}>
                Edit Role
                </Button>
                <Popconfirm
                title="Delete Role"
                description="Are you sure you want to delete this role? This action cannot be undone."
                onConfirm={handleDeleteRole}
                okText="Yes"
                cancelText="No"
                >
                <Button danger>
                    Delete Role
                </Button>
                </Popconfirm>
            </Space>
            }
        >
            <Descriptions bordered column={1}>
            <Descriptions.Item label="Role Name">{roleData?.roleName}</Descriptions.Item>
            <Descriptions.Item label="Description">{roleData?.description}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: "30px", marginBottom: "20px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4}>Permissions</Title>
            <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={showAddPermissionModal}
                disabled={availablePermissions.length === 0}
            >
                Add Permissions
            </Button>
            </div>

            <Table 
            dataSource={roleData?.permissions || []} 
            columns={permissionColumns} 
            rowKey="permissionId"
            pagination={false}
            locale={{ emptyText: "No permissions assigned to this role" }}
            />

            <div style={{ marginTop: "20px" }}>
            <Button onClick={handleBack}>
                Back to Role Management
            </Button>
            </div>
        </Card>

        {/* Add Permission Modal */}
        <Modal
            title="Add Permissions to Role"
            open={isAddPermissionModalVisible}
            onCancel={() => setIsAddPermissionModalVisible(false)}
            footer={null}
        >
            <Form
            form={addPermissionForm}
            layout="vertical"
            onFinish={handleAddPermission}
            >
            <Form.Item
                name="permissionIds"
                label="Select Permissions"
                rules={[{ required: true, message: 'Please select at least one permission' }]}
            >
                <Select
                mode="multiple"
                placeholder="Select permissions to add"
                style={{ width: '100%' }}
                options={availablePermissions.map(perm => ({
                    label: `${perm.permissionName} - ${perm.description}`,
                    value: perm.permissionId
                }))}
                />
            </Form.Item>
            <Form.Item>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <Button onClick={() => setIsAddPermissionModalVisible(false)}>
                    Cancel
                </Button>
                <Button type="primary" htmlType="submit">
                    Add Permissions
                </Button>
                </div>
            </Form.Item>
            </Form>
        </Modal>

        {children}
        </div>
    );
}; 