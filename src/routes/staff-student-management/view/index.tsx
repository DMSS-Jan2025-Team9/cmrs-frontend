import React, { useState, useEffect } from "react";
import { 
  Card, 
  Descriptions, 
  Button, 
  Spin, 
  notification, 
  Space, 
  Typography, 
  Tag, 
  Popconfirm, 
  message,
  Divider,
  Tabs
} from "antd";
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import { useGo } from "@refinedev/core";
import { useParams } from "react-router-dom";

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

export const UserViewPage = ({ children }: React.PropsWithChildren) => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const go = useGo();
  
  const [userData, setUserData] = useState<Staff | Student | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const { Title } = Typography;
  const { TabPane } = Tabs;

  // Fetch user data based on type (staff or student) and ID
  useEffect(() => {
    if (id && type) {
      fetchUserData();
    }
  }, [id, type]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      const url = type === "staff" 
        ? `http://localhost:8085/api/staff/${id}`
        : `http://localhost:8085/api/students/${id}`;
      
      const response = await axios.get(url, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "*/*"
        }
      });
      
      if (response.data) {
        setUserData(response.data);
      } else {
        notification.error({
          message: "Error",
          description: `Failed to fetch ${type} details`,
        });
      }
    } catch (error) {
      console.error(`Error fetching ${type} data`, error);
      notification.error({
        message: "Error",
        description: `There was an issue fetching the ${type} details.`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Navigate to the edit page
  const handleEdit = () => {
    go({
      to: `/staffStudentManagement/edit/${type}/${id}`,
    });
  };

  // Navigate back to user management list page
  const handleBack = () => {
    go({
      to: "/staffStudentManagement",
    });
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    try {
      const accessToken = localStorage.getItem("access_token");
      const url = type === "staff" 
        ? `http://localhost:8085/api/staff/${id}`
        : `http://localhost:8085/api/students/${id}`;
        
      await axios.delete(url, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "*/*",
          "Content-Type": "application/json"
        }
      });
      
      message.success(`${type === "staff" ? "Staff" : "Student"} deleted successfully`);
      handleBack(); // Navigate back to list page
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      message.error(`Failed to delete ${type}. Please try again.`);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return moment(dateString).format("YYYY-MM-DD HH:mm:ss");
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" tip={`Loading ${type} information...`} />
      </div>
    );
  }

  // Staff-specific information section
  const renderStaffInfo = () => {
    if (!userData || type !== "staff") return null;
    const staff = userData as Staff;
    
    return (
      <Descriptions column={1} bordered style={{ marginTop: 24 }}>
        <Descriptions.Item label="Staff ID">{staff.staffFullId}</Descriptions.Item>
        <Descriptions.Item label="Department">{staff.department}</Descriptions.Item>
        <Descriptions.Item label="Position">{staff.position}</Descriptions.Item>
      </Descriptions>
    );
  };

  // Student-specific information section
  const renderStudentInfo = () => {
    if (!userData || type !== "student") return null;
    const student = userData as Student;
    
    return (
      <Descriptions column={1} bordered style={{ marginTop: 24 }}>
        <Descriptions.Item label="Student ID">{student.studentFullId}</Descriptions.Item>
        <Descriptions.Item label="Program">{student.programName}</Descriptions.Item>
        <Descriptions.Item label="Enrolled At">{formatDate(student.enrolledAt)}</Descriptions.Item>
      </Descriptions>
    );
  };

  // User roles section
  const renderRoles = () => {
    if (!userData) return null;
    
    return (
      <div style={{ marginTop: 24 }}>
        <Title level={5}>Roles</Title>
        <Space size={[0, 8]} wrap>
          {userData.roles.map((role: Role) => (
            <Tag color="blue" key={role.roleId}>
              {role.roleName}
            </Tag>
          ))}
        </Space>
      </div>
    );
  };

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
            <Title level={4} style={{ margin: 0 }}>
              {type === "staff" ? "Staff" : "Student"} Details
            </Title>
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
              title={`Delete ${type === "staff" ? "Staff" : "Student"}`}
              description={`Are you sure you want to delete this ${type}?`}
              onConfirm={handleDeleteUser}
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
        {userData && (
          <>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Name">{`${userData.firstName} ${userData.lastName}`}</Descriptions.Item>
              <Descriptions.Item label="Username">{userData.username}</Descriptions.Item>
              <Descriptions.Item label="Email">{userData.email}</Descriptions.Item>
              <Descriptions.Item label="Created At">{formatDate(userData.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Updated At">{formatDate(userData.updatedAt)}</Descriptions.Item>
            </Descriptions>
            
            <Divider orientation="left">{type === "staff" ? "Staff Information" : "Student Information"}</Divider>
            
            {type === "staff" ? renderStaffInfo() : renderStudentInfo()}
            
            <Divider orientation="left">User Roles</Divider>
            
            {renderRoles()}
          </>
        )}
      </Card>
      
      {children}
    </div>
  );
}; 