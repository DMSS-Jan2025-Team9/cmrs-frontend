import React, { useState, useEffect, useRef } from "react";
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
  Space,
  message
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import { useGo } from "@refinedev/core";
import { useParams } from "react-router-dom";
import { staffService, studentService } from "../services";
import { Staff, Student, Role, StaffUpdateRequest, StudentUpdateRequest } from "../models";

// Extend the models to include created/updated dates if they're missing
interface UserWithDates {
  createdAt?: string;
  updatedAt?: string;
}

export const UserEditPage = ({ children }: React.PropsWithChildren) => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const go = useGo();
  const [form] = Form.useForm();
  const formInitialized = useRef(false);
  
  const [userData, setUserData] = useState<(Staff | Student) & UserWithDates | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [rolesLoaded, setRolesLoaded] = useState<boolean>(false);
  const [formKey, setFormKey] = useState<number>(0); // Key to force re-render

  const { Title } = Typography;
  const { Option } = Select;

  // Navigate back function
  const handleBack = () => {
    go({
      to: type && id ? `/staffStudentManagement/view/${type}/${id}` : "/staffStudentManagement",
    });
  };

  // Fetch user data and roles on component mount
  useEffect(() => {
    const loadData = async () => {
      if (id && type) {
        setLoading(true);
        
        // Load roles first
        const roleData = await fetchRoles();
        
        // Then load user data
        let userData = null;
        if (type === "staff") {
          userData = await staffService.getStaffById(parseInt(id, 10));
        } else {
          userData = await studentService.getStudentById(parseInt(id, 10));
        }
        
        if (userData && roleData && roleData.length > 0) {
          console.log("User data:", userData);
          console.log("Roles data:", roleData);
          setUserData(userData);
          
          // Process role data to match user roles with available roles
          if (userData.roles && Array.isArray(userData.roles)) {
            const userRoleNames = userData.roles.map((role: any) => 
              typeof role === 'string' ? role : role.roleName
            ).filter(Boolean);
            
            console.log("User role names:", userRoleNames);
            
            // Find matching role IDs
            const matchedRoleIds = roleData
              .filter((role: Role) => userRoleNames.includes(role.roleName))
              .map((role: Role) => role.roleId)
              .filter((id: number | undefined): id is number => id !== undefined);
            
            console.log("Matched role IDs:", matchedRoleIds);
            
            // Set the selected roles
            setSelectedRoleIds(matchedRoleIds);
            
            // Update the form values directly and force re-render
            setTimeout(() => {
              form.setFieldsValue({ roleIds: matchedRoleIds });
              console.log("Form values set:", matchedRoleIds);
              formInitialized.current = true;
              setFormKey(prev => prev + 1); // Increment key to force re-render
            }, 100);
          }
        }
        
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, type]);

  const fetchRoles = async (): Promise<Role[]> => {
    try {
      const accessToken = localStorage.getItem("access_token");
      const response = await axios.get("https://app.cmrsapp.site/user-management/api/admin/roles", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "*/*"
        }
      });
      
      if (response.data.success) {
        console.log("Fetched roles:", response.data.data);
        const roleData = response.data.data;
        setRoles(roleData);
        setRolesLoaded(true);
        return roleData;
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
    return [];
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
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
    if (!userData || !id) return;

    setSubmitting(true);
    console.log("Submitting role update:", values);
    
    try {
      // Get updated roles data with proper typings
      const roleStrings: string[] = values.roleIds.map(roleId => {
        const role = roles.find(r => r.roleId === roleId);
        return role?.roleName || `Role ${roleId}`;
      });
      
      let result;
      if (type === "staff" && 'staffId' in userData) {
        const updateData: StaffUpdateRequest = {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          staffFullId: userData.staffFullId,
          department: userData.department,
          position: userData.position,
          roles: roleStrings
        };
        
        result = await staffService.updateStaff(parseInt(id, 10), updateData);
      } else if (type === "student" && 'studentId' in userData) {
        const updateData: StudentUpdateRequest = {
          email: userData.email,
          name: userData.name,
          studentFullId: userData.studentFullId,
          programName: userData.programName,
          roles: roleStrings
        };
        
        result = await studentService.updateStudent(parseInt(id, 10), updateData);
      }
      
      if (result && result.success !== false) {
        message.success(`${type === "staff" ? "Staff" : "Student"} roles updated successfully`);
        
        // Navigate back to user view
        go({
          to: `/staffStudentManagement/view/${type}/${id}`,
        });
      } else {
        message.error(`Failed to update ${type} roles: ${result?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      message.error(`There was an error updating the ${type}. Please try again.`);
    } finally {
      setSubmitting(false);
    }
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

  // Log current state for debugging
  console.log("Current state on render:", {
    selectedRoleIds,
    formInitialized: formInitialized.current,
    formKey
  });

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
            </Descriptions>
            
            <Divider orientation="left">{type === "staff" ? "Staff Information" : "Student Information"}</Divider>
            
            {type === "staff" ? renderStaffInfo() : renderStudentInfo()}
            
            <Divider orientation="left">Edit User Roles</Divider>
            
            <Form
              key={formKey} // Key to force re-render when roles change
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              disabled={submitting}
              initialValues={{ roleIds: selectedRoleIds }}
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
                  loading={!rolesLoaded}
                  defaultValue={selectedRoleIds}
                >
                  {getFilteredRoles().map(role => (
                    <Option key={role.roleId} value={role.roleId}>
                      {role.roleName} {role.description ? `- ${role.description}` : ''}
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