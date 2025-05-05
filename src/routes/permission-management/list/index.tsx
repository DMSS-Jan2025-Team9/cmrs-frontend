import React, { useEffect, useState } from "react";
import { Table, Input, Space, Button, Row, Col, Popconfirm, message } from "antd";
import { SearchOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { CreateButton } from "@refinedev/antd";
import axios from "axios";
import { logError } from "@/utilities/logger";

import { useGo } from "@refinedev/core";
import { PaginationTotal } from "@/components";
import type { Permission } from "@/models/index";

export const PermissionListPage = ({ children }: React.PropsWithChildren) => {
  const go = useGo();
  
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [searchName, setSearchName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);

  // Fetch permissions from the API
  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      const response = await axios.get("http://localhost:8085/api/admin/permissions", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "*/*"
        }
      });
      
      if (response.data.success) {
        const filteredPermissions = searchName 
          ? response.data.data.filter((permission: Permission) => 
              permission.permissionName.toLowerCase().includes(searchName.toLowerCase()))
          : response.data.data;
          
        setPermissions(filteredPermissions);
        setTotal(filteredPermissions.length);
      }
    } catch (error) {
      logError("Error fetching permissions:", error);
      message.error("Failed to load permissions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []); // Fetch permissions once when the component mounts

  // Filter permissions based on search input
  const handleSearch = () => {
    fetchPermissions();
  };

  // Handle permission deletion
  const handleDelete = async (permissionId: number) => {
    try {
      const accessToken = localStorage.getItem("access_token");
      await axios.delete(`http://localhost:8085/api/admin/permissions/${permissionId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "*/*"
        }
      });
      
      message.success("Permission deleted successfully");
      fetchPermissions(); // Reload the permissions after deletion
    } catch (error) {
      logError("Error deleting permission:", error);
      message.error("Failed to delete permission. Please try again.");
    }
  };

  return (
    <div className="page-container">
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <Input
              placeholder="Search by Permission Name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              allowClear
              onPressEnter={handleSearch}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              Search
            </Button>
          </Space>
        </Col>
        <Col>
          <CreateButton
            onClick={() => {
              go({
                to: {
                  resource: "permissionManagement",
                  action: "create",
                },
              });
            }}
          >
            Add Permission
          </CreateButton>
        </Col>
      </Row>

      <Table
        dataSource={permissions}
        loading={loading}
        pagination={{
          total: total,
          showTotal: (total) => <PaginationTotal total={total} entityName="permissions" />,
        }}
        rowKey="permissionId"
      >
        <Table.Column<Permission> title="Permission Name" dataIndex="permissionName" />
        <Table.Column<Permission> title="Description" dataIndex="description" />
        <Table.Column<Permission> 
          title="Actions" 
          key="actions" 
          render={(_, record) => (
            <Space>
              <Button 
                size="small" 
                icon={<EditOutlined />}
                onClick={() => go({ to: `/permissionManagement/edit/${record.permissionId}` })}
              >
                Edit
              </Button>
              <Popconfirm
                title="Are you sure you want to delete this permission?"
                description="This action cannot be undone."
                onConfirm={() => handleDelete(record.permissionId)}
                okText="Yes"
                cancelText="No"
              >
                <Button 
                  size="small" 
                  danger
                  icon={<DeleteOutlined />}
                >
                  Delete
                </Button>
              </Popconfirm>
            </Space>
          )} 
        />
      </Table>

      {children}
    </div>
  );
}; 