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
  Row,
  Col
} from "antd";
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useGo } from "@refinedev/core";
import { Student } from "../models";
import { studentService } from "../services";

interface StudentViewProps {
  userId: number;
  onBack?: () => void;
  onDelete?: () => void;
}

export const StudentView: React.FC<StudentViewProps> = ({ 
  userId, 
  onBack, 
  onDelete 
}) => {
  const go = useGo();
  
  const [userData, setUserData] = useState<Student | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { Title } = Typography;

  // Fetch user data
  useEffect(() => {
    const fetchData = async () => {
      if (userId) {
        try {
          setLoading(true);
          setError(null);
          
          const data = await studentService.getStudentById(userId);
          if (data) {
            console.log("Fetched student data:", data);
            
            // Ensure roles is an array
            if (!data.roles || !Array.isArray(data.roles)) {
              data.roles = [];
            }
            
            setUserData(data);
          } else {
            setError("Failed to fetch student data");
            notification.error({
              message: "Error",
              description: "No student data found"
            });
          }
        } catch (err) {
          console.error("Error fetching student data", err);
          setError("Error fetching student data");
          notification.error({
            message: "Error",
            description: "There was an issue fetching the student details."
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [userId]);

  // Navigate to the edit page
  const handleEdit = () => {
    go({
      to: `/staffStudentManagement/edit/student/${userId}`,
    });
  };

  // Navigate back to user management list page
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      go({
        to: "/staffStudentManagement",
      });
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    try {
      await studentService.deleteStudent(userId);
      message.success("Student deleted successfully");
      if (onDelete) {
        onDelete();
      } else {
        handleBack(); // Navigate back to list page
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      message.error("Failed to delete student. Please try again.");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" tip="Loading student information..." />
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Typography.Text type="danger">
          {error || "Student not found"}
        </Typography.Text>
        <br />
        <Button onClick={handleBack} icon={<ArrowLeftOutlined />} style={{ marginTop: 16 }}>
          Back to list
        </Button>
      </div>
    );
  }

  // Process roles for display
  const displayRoles = Array.isArray(userData.roles) && userData.roles.length > 0
    ? userData.roles.map((role, index) => ({
        roleName: typeof role === 'string' ? role : role.roleName || `Role ${index + 1}`,
        key: index.toString()
      }))
    : [];

  return (
    <Card
      title={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack} />
          <span>Student Details</span>
        </Space>
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
            title="Are you sure you want to delete this student?"
            onConfirm={handleDeleteUser}
            okText="Yes"
            cancelText="No"
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
      style={{ width: '100%' }}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Divider orientation="left">User Information</Divider>
          <Descriptions bordered column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="User ID">{userData.userId}</Descriptions.Item>
            <Descriptions.Item label="Username">{userData.username}</Descriptions.Item>
            <Descriptions.Item label="Email">{userData.email}</Descriptions.Item>
            <Descriptions.Item label="Name">{userData.name}</Descriptions.Item>
            <Descriptions.Item label="Roles" span={2}>
              <Space wrap>
                {displayRoles.length > 0 ? (
                  displayRoles.map(role => (
                    <Tag color="green" key={role.key}>
                      {role.roleName}
                    </Tag>
                  ))
                ) : (
                  <span>No roles assigned</span>
                )}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Col>

        <Col span={24}>
          <Divider orientation="left">Student Information</Divider>
          <Descriptions bordered column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="Student ID">{userData.studentFullId || "N/A"}</Descriptions.Item>
            <Descriptions.Item label="Student ID Number">{userData.studentIdNumber || "N/A"}</Descriptions.Item>
            <Descriptions.Item label="Program">{userData.programName || "N/A"}</Descriptions.Item>
            {userData.enrolledAt && (
              <Descriptions.Item label="Enrolled At">{userData.enrolledAt}</Descriptions.Item>
            )}
          </Descriptions>
        </Col>
      </Row>
    </Card>
  );
}; 