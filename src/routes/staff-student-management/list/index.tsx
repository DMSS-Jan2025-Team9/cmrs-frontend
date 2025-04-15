import React, { useEffect, useState } from "react";
import { Table, Input, Space, Button, Row, Col, Popconfirm, message, Tabs, Tag } from "antd";
import { SearchOutlined, DeleteOutlined, EditOutlined, EyeOutlined, UserAddOutlined } from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import { useGo } from "@refinedev/core";
import { PaginationTotal } from "@/components";

interface User {
  userId: number;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  roles: Role[];
}

interface Staff extends User {
  staffId: number;
  staffFullId: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
}

interface Student extends User {
  studentId: number;
  studentFullId: string;
  firstName: string;
  lastName: string;
  programId: number;
  programName: string;
  enrolledAt: string;
}

interface Role {
  roleId: number;
  roleName: string;
  description: string;
}

type TabKey = "staff" | "student";

export const UserListPage = ({ children }: React.PropsWithChildren) => {
  const go = useGo();
  
  const [staffUsers, setStaffUsers] = useState<Staff[]>([]);
  const [studentUsers, setStudentUsers] = useState<Student[]>([]);
  const [searchName, setSearchName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabKey>("staff");
  const [totalStaff, setTotalStaff] = useState<number>(0);
  const [totalStudents, setTotalStudents] = useState<number>(0);

  // Fetch staff and student users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      
      // Fetch staff
      const staffResponse = await axios.get("http://localhost:8085/api/staff/all", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "*/*"
        }
      });
      
      if (staffResponse.data) {
        const filteredStaff = searchName 
          ? staffResponse.data.filter((staff: Staff) => 
              `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(searchName.toLowerCase()))
          : staffResponse.data;
          
        setStaffUsers(filteredStaff);
        setTotalStaff(filteredStaff.length);
      }
      
      // Fetch students
      const studentResponse = await axios.get("http://localhost:8085/api/students/allInfo", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "*/*"
        }
      });
      
      if (studentResponse.data) {
        const filteredStudents = searchName 
          ? studentResponse.data.filter((student: Student) => 
              `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchName.toLowerCase()))
          : studentResponse.data;
          
        setStudentUsers(filteredStudents);
        setTotalStudents(filteredStudents.length);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      message.error("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []); // Fetch users once when the component mounts

  // Filter users based on search input
  const handleSearch = () => {
    fetchUsers();
  };

  // Handle user deletion
  const handleDelete = async (id: number, type: TabKey) => {
    try {
      const accessToken = localStorage.getItem("access_token");
      const url = type === "staff" 
        ? `http://localhost:8085/api/staff/${id}`
        : `http://localhost:8085/api/students/${id}`;
        
      await axios.delete(url, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "*/*"
        }
      });
      
      message.success(`${type === "staff" ? "Staff" : "Student"} deleted successfully`);
      fetchUsers(); // Reload the users after deletion
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      message.error(`Failed to delete ${type}. Please try again.`);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return moment(dateString).format("YYYY-MM-DD HH:mm:ss");
  };

  // Create user button handler
  const handleCreateUser = () => {
    go({
      to: {
        resource: "staffStudentManagement",
        action: "create",
      },
    });
  };

  // Tab change handler
  const handleTabChange = (key: string) => {
    setActiveTab(key as TabKey);
  };

  // Get ID based on user type
  const getUserId = (record: Staff | Student, type: TabKey): number => {
    if (type === "staff" && "staffId" in record) {
      return record.staffId;
    } else if (type === "student" && "studentId" in record) {
      return record.studentId;
    }
    return 0;
  };

  // Common columns for both staff and student tables
  const getCommonColumns = (type: TabKey) => [
    {
      title: `${type === "staff" ? "Staff ID" : "Student ID"}`,
      dataIndex: type === "staff" ? "staffFullId" : "studentFullId",
      key: type === "staff" ? "staffFullId" : "studentFullId",
    },
    {
      title: "Name",
      key: "name",
      render: (_: any, record: Staff | Student) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: "Roles",
      dataIndex: "roles",
      key: "roles",
      render: (roles: Role[]) => (
        <Space size={[0, 4]} wrap>
          {roles?.map((role: Role) => (
            <Tag color="blue" key={role.roleId}>
              {role.roleName}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => formatDate(text),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (text: string) => formatDate(text),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Staff | Student) => {
        const id = getUserId(record, type);
        return (
          <Space>
            <Button 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => go({ to: `/staffStudentManagement/view/${type}/${id}` })}
            >
              View
            </Button>
            <Button 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => go({ to: `/staffStudentManagement/edit/${type}/${id}` })}
            >
              Edit
            </Button>
            <Popconfirm
              title={`Are you sure you want to delete this ${type}?`}
              description="This action cannot be undone."
              onConfirm={() => handleDelete(id, type)}
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
        );
      }
    },
  ];

  return (
    <div className="page-container">
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <Input
              placeholder="Search by Name"
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
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={handleCreateUser}
          >
            Add User
          </Button>
        </Col>
      </Row>

      <Tabs 
        activeKey={activeTab} 
        onChange={handleTabChange}
        items={[
          {
            key: "staff",
            label: "Staff",
            children: (
              <Table
                dataSource={staffUsers}
                columns={getCommonColumns("staff")}
                loading={loading && activeTab === "staff"}
                pagination={{
                  total: totalStaff,
                  showTotal: (total) => <PaginationTotal total={total} entityName="staff users" />,
                }}
                rowKey="staffId"
              />
            )
          },
          {
            key: "student",
            label: "Students",
            children: (
              <Table
                dataSource={studentUsers}
                columns={getCommonColumns("student")}
                loading={loading && activeTab === "student"}
                pagination={{
                  total: totalStudents,
                  showTotal: (total) => <PaginationTotal total={total} entityName="student users" />,
                }}
                rowKey="studentId"
              />
            )
          }
        ]}
      />

      {children}
    </div>
  );
}; 