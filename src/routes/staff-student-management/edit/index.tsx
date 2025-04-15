import React, { useState, useEffect } from "react";
import { 
  Card, 
  Button, 
  Form, 
  Spin, 
  notification, 
  Typography, 
  Divider, 
  Descriptions, 
  Select,
  Space
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
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

export const UserEditPage = ({ children }: React.PropsWithChildren) => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const go = useGo();
  const [form] = Form.useForm();
  
  const [userData, setUserData] = useState<Staff | Student | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const { Title } = Typography;
  const { Option } = Select;

  // Fetch user data and all available roles
  useEffect(() => {
    if (id && type) {
      Promise.all([
        fetchUserData(),
        fetchRoles()
      ]);
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
        const userData = response.data;
        setUserData(userData);
        
        // Set the selected roles
        const roleIds = userData.roles.map((role: Role) => role.roleId);
        setSelectedRoleIds(roleIds);
        
        // Initialize form fields
        form.setFieldsValue({
          roleIds: roleIds
        });
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

  const fetchRoles = async () => {
    try {
      const accessToken = localStorage.getItem("access_token");
      const response = await axios.get("http://localhost:8085/api/admin/roles", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "*/*"
        }
      });
      
      if (response.data.success) {
        setRoles(response.data.data);
      } else {
        notification.error({
          message: "Error",
          description: response.data.message || "Failed to fetch roles",
        });
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      notification.error({
        message: "Error",
        description: "There was an issue fetching the available roles.",
      });
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return moment(dateString).format("YYYY-MM-DD HH:mm:ss");
  };

  // Filtered roles based on user type
  const getFilteredRoles = () => {
    if (type === "staff") {
      // Staff cannot select student role
      return roles.filter(role => role.roleName !== "student");
    } else {
      // Students cannot select roles with "admin" in the name
      return roles.filter(role => !role.roleName.includes("admin"));
    }
  };

  // Handle form submission - only updating roles
  const handleSubmit = async (values: { roleIds: number[] }) => {
    if (!userData) return;

    setSubmitting(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      const url = type === "staff" 
        ? `http://localhost:8085/api/staff/${id}`
        : `http://localhost:8085/api/students/${id}`;
      
      // For the update, we only send the roleIds to update
      const response = await axios.put(
        url,
        {
          roleIds: values.roleIds
        },
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "*/*",
            "Content-Type": "application/json"
          }
        }
      );
      
      if (response.data && response.data.success !== false) {
        notification.success({
          message: "Success",
          description: `${type === "staff" ? "Staff" : "Student"} updated successfully`,
        });
        
        // Navigate back to user view
        go({
          to: `/staffStudentManagement/view/${type}/${id}`,
        });
      } else {
        notification.error({
          message: "Error",
          description: response.data.message || `Failed to update ${type}`,
        });
      }
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      notification.error({
        message: "Error",
        description: `There was an issue updating the ${type}.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Navigate back to user view page
  const handleBack = () => {
    go({
      to: `/staffStudentManagement/view/${type}/${id}`,
    });
  };

  // Staff-specific information section
  const renderStaffInfo = () => {
    if (!userData || type !== "staff") return null;
    const staff = userData as Staff;
    
    return (
      <Descriptions column={1} bordered>
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
      <Descriptions column={1} bordered>
        <Descriptions.Item label="Student ID">{student.studentFullId}</Descriptions.Item>
        <Descriptions.Item label="Program">{student.programName}</Descriptions.Item>
        <Descriptions.Item label="Enrolled At">{formatDate(student.enrolledAt)}</Descriptions.Item>
      </Descriptions>
    );
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" tip={`Loading ${type} information...`} />
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
            <Title level={4} style={{ margin: 0 }}>
              Edit {type === "staff" ? "Staff" : "Student"}: {userData ? `${userData.firstName} ${userData.lastName}` : ''}
            </Title>
          </div>
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
            
            <Divider orientation="left">Edit User Roles</Divider>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              disabled={submitting}
            >
              <Form.Item
                name="roleIds"
                label="Roles"
                rules={[{ required: true, message: 'Please select at least one role' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Select roles"
                  style={{ width: '100%' }}
                  optionFilterProp="children"
                >
                  {getFilteredRoles().map(role => (
                    <Option key={role.roleId} value={role.roleId}>
                      {role.roleName} - {role.description}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button onClick={handleBack}>
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit" loading={submitting}>
                    Update Roles
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Card>
      
      {children}
    </div>
  );
}; 