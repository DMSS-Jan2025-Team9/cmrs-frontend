import React, { useEffect, useState } from "react";
import { Table, Input, Space, Button, Row, Col, Popconfirm, message } from "antd";
import { SearchOutlined, DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import { CreateButton } from "@refinedev/antd";
import axios from "axios";

import { useGo } from "@refinedev/core";
import { PaginationTotal } from "@/components";
import type { Role } from "@/models/index";

export const RoleListPage = ({ children }: React.PropsWithChildren) => {
  const go = useGo();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchName, setSearchName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);

  // Fetch roles from the API
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      const response = await axios.get("http://localhost:8085/api/admin/roles", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "*/*"
        }
      });
      
      if (response.data.success) {
        const filteredRoles = searchName 
          ? response.data.data.filter((role: Role) => 
              role.roleName.toLowerCase().includes(searchName.toLowerCase()))
          : response.data.data;
          
        setRoles(filteredRoles);
        setTotal(filteredRoles.length);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      message.error("Failed to load roles. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []); // Fetch roles once when the component mounts

  // Filter roles based on search input
  const handleSearch = () => {
    fetchRoles();
  };

  // Handle role deletion
  const handleDelete = async (roleId: number) => {
    try {
      const accessToken = localStorage.getItem("access_token");
      await axios.delete(`http://localhost:8085/api/admin/roles/${roleId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "*/*"
        }
      });
      
      message.success("Role deleted successfully");
      fetchRoles(); // Reload the roles after deletion
    } catch (error) {
      console.error("Error deleting role:", error);
      message.error("Failed to delete role. Please try again.");
    }
  };

  return (
    <div className="page-container">
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <Input
              placeholder="Search by Role Name"
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
                  resource: "roleManagement",
                  action: "create",
                },
              });
            }}
          >
            Add Role
          </CreateButton>
        </Col>
      </Row>

      <Table
        dataSource={roles}
        loading={loading}
        pagination={{
          total: total,
          showTotal: (total) => <PaginationTotal total={total} entityName="roles" />,
        }}
        rowKey="roleId"
      >
        <Table.Column<Role> title="Role Name" dataIndex="roleName" />
        <Table.Column<Role> title="Description" dataIndex="description" />
        <Table.Column<Role> 
          title="Permissions" 
          dataIndex="permissions" 
          render={(permissions) => (
            <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {permissions?.map((perm: any) => perm.permissionName).join(', ')}
            </div>
          )} 
        />
        <Table.Column<Role> 
          title="Actions" 
          key="actions" 
          render={(_, record) => (
            <Space>
              <Button 
                size="small" 
                icon={<EyeOutlined />}
                onClick={() => go({ to: `/roleManagement/view/${record.roleId}` })}
              >
                View
              </Button>
              <Button 
                size="small" 
                icon={<EditOutlined />}
                onClick={() => go({ to: `/roleManagement/edit/${record.roleId}` })}
              >
                Edit
              </Button>
              <Popconfirm
                title="Are you sure you want to delete this role?"
                description="This action cannot be undone."
                onConfirm={() => handleDelete(record.roleId)}
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