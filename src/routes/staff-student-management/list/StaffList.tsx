import React, { useEffect, useState } from "react";
import { Table, Input, Space, Button, Row, Col, Popconfirm, message, Tag } from "antd";
import { SearchOutlined, DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import { useGo } from "@refinedev/core";
import { Staff, Role } from "../models";
import { staffService } from "../services";

interface StaffListProps {
  onSearch?: (searchTerm: string) => void;
  searchValue?: string;
}

export const StaffList: React.FC<StaffListProps> = ({ onSearch, searchValue = "" }) => {
  const go = useGo();
  
  const [staffUsers, setStaffUsers] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchName, setSearchName] = useState<string>(searchValue);

  // Fetch staff users
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const staffData = await staffService.getAllStaff();
      
      // Process the roles for each staff member to ensure they're in a consistent format
      const processedStaffData = staffData.map(staff => {
        // Ensure roles is always an array
        if (!staff.roles) {
          staff.roles = [];
        } else if (!Array.isArray(staff.roles)) {
          staff.roles = [staff.roles];
        }
        
        // Convert any roles that are strings to proper role objects
        staff.roles = staff.roles.map((role: any) => {
          if (typeof role === 'string') {
            return { roleName: role, roleId: undefined };
          } else if (typeof role === 'object') {
            return role;
          }
          return { roleName: String(role), roleId: undefined };
        });
        
        return staff;
      });
      
      setStaffUsers(processedStaffData);
      filterStaff(processedStaffData, searchName);
    } catch (error) {
      console.error("Error fetching staff:", error);
      message.error("Failed to load staff users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Filter staff based on search input
  const filterStaff = (data: Staff[], searchTerm: string) => {
    if (!searchTerm) {
      setFilteredStaff(data);
      return;
    }
    
    const filtered = data.filter(staff => 
      staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.position?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredStaff(filtered);
  };

  const handleSearch = () => {
    filterStaff(staffUsers, searchName);
    if (onSearch) {
      onSearch(searchName);
    }
  };

  // Handle user deletion
  const handleDelete = async (userId: number) => {
    try {
      await staffService.deleteStaff(userId);
      message.success("Staff deleted successfully");
      fetchStaff(); // Reload the staff list after deletion
    } catch (error) {
      console.error("Error deleting staff:", error);
      message.error("Failed to delete staff. Please try again.");
    }
  };

  // View staff details
  const handleView = (userId: number) => {
    go({
      to: `/staffStudentManagement/view/staff/${userId}`,
    });
  };

  // Edit staff
  const handleEdit = (userId: number) => {
    go({
      to: `/staffStudentManagement/edit/staff/${userId}`,
    });
  };

  // Helper function to process roles for display
  const processRolesToDisplay = (roles: any[]) => {
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return [];
    }
    
    return roles.map((role, index) => {
      if (typeof role === 'string') {
        return { roleName: role, key: `role-${index}` };
      } else if (typeof role === 'object' && role !== null) {
        return { 
          roleName: role.roleName || `Role ${index}`, 
          key: role.roleId?.toString() || `role-${index}` 
        };
      }
      return { roleName: String(role), key: `role-${index}` };
    });
  };

  // Table columns configuration
  const columns = [
    {
      title: "Staff ID",
      dataIndex: "staffFullId",
      key: "staffFullId",
    },
    {
      title: "Name",
      key: "name",
      render: (text: string, record: Staff) => (
        <span>{record.name || `${record.firstName} ${record.lastName}`}</span>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Position",
      dataIndex: "position",
      key: "position",
    },
    {
      title: "Roles",
      key: "roles",
      render: (text: string, record: Staff) => {
        const displayRoles = processRolesToDisplay(record.roles || []);
        
        return (
          <Space wrap>
            {displayRoles.length > 0 ? (
              displayRoles.map(role => (
                <Tag color="blue" key={role.key}>
                  {role.roleName}
                </Tag>
              ))
            ) : (
              <span style={{ color: "#999" }}>No roles assigned</span>
            )}
          </Space>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (text: string, record: Staff) => (
        <Space size="middle">
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => handleView(record.userId)}
            size="small"
            
          >
            View
          </Button>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record.userId)}
            size="small"
            >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this staff member?"
            onConfirm={() => handleDelete(record.userId)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} size="small" >
            Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Input
            placeholder="Search by name, email, department..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onPressEnter={handleSearch}
            suffix={<SearchOutlined onClick={handleSearch} style={{ cursor: "pointer" }} />}
          />
        </Col>
      </Row>
      
      <Table
        dataSource={filteredStaff}
        columns={columns}
        rowKey="userId"
        loading={loading}
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Total: ${total} staff members`,
        }}
      />
    </div>
  );
}; 