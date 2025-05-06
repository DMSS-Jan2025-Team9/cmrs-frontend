import React, { useState, useEffect } from "react";
import { Form, Input, Button, notification, Space, Select, Divider } from "antd";
import axios from "axios";
import { useGo } from "@refinedev/core";

interface Role {
  roleId: number;
  roleName: string;
  description: string;
}

interface Program {
  programId: number;
  programName: string;
  programDesc: string;
  courses: Course[];
}

interface Course {
  courseId: number;
  courseName: string;
  courseDesc: string;
}

interface StudentCreateFormProps {
  onBack: () => void;
}

export const StudentCreateForm: React.FC<StudentCreateFormProps> = ({ onBack }) => {
  const go = useGo();
  const [form] = Form.useForm();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const { Option } = Select;

  // Fetch all available roles and programs
  useEffect(() => {
    Promise.all([
      fetchRoles(),
      fetchPrograms()
    ]);
  }, []);

  const fetchRoles = async () => {
    try {
      const accessToken = localStorage.getItem("access_token");
      const response = await axios.get("https://app.cmrsapp.site/user-management/api/admin/roles", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "*/*"
        }
      });
      
      if (response.data.success) {
        // Filter out admin roles
        const rolesList = response.data.data.filter((role: Role) => !role.roleName.includes("admin"));
        setRoles(rolesList);
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

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      const response = await axios.get("https://app.cmrsapp.site/course-management/api/program", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "*/*"
        }
      });

      if (response.data !== null) {
        setPrograms(response.data);
      } else {
        notification.error({
          message: "Error",
          description: response.data.message || "Failed to fetch programs",
        });
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
      notification.error({
        message: "Error",
        description: "There was an issue fetching the available programs.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      
      // Format the request payload according to the expected format
      const payload = {
        user: {
          role: values.role.map((roleId: number) => roleId.toString()),
        },
        student: {
          firstName: values.firstName,
          lastName: values.lastName,
          programInfo: values.programInfo
        }
      };
      
      const response = await axios.post(
        "https://app.cmrsapp.site/user-management/api/auth/register/student",
        payload,
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "*/*",
            "Content-Type": "application/json"
          }
        }
      );
      
      if (response.data.success !== false) {
        notification.success({
          message: "Success",
          description: "Student created successfully",
        });
        
        // Navigate back to user list
        go({
          to: "/staffStudentManagement",
        });
      } else {
        notification.error({
          message: "Error",
          description: response.data.message || "Failed to create student",
        });
      }
    } catch (error) {
      console.error("Error creating student:", error);
      notification.error({
        message: "Error",
        description: "There was an issue creating the student.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      disabled={submitting}
      initialValues={{ role: [] }}
    >
      <Divider orientation="left">User Information</Divider>
      
      <Form.Item
        name="role"
        label="Roles"
        rules={[{ required: true, message: 'Please select at least one role' }]}
      >
        <Select
          mode="multiple"
          placeholder="Select roles"
          style={{ width: '100%' }}
          optionFilterProp="children"
          loading={loading}
        >
          {roles.map(role => (
            <Option key={role.roleId} value={role.roleId}>
              {role.roleName} - {role.description}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Divider orientation="left">Personal Information</Divider>

      <Form.Item
        name="firstName"
        label="First Name"
        rules={[{ required: true, message: 'Please enter first name' }]}
      >
        <Input placeholder="Enter first name" />
      </Form.Item>

      <Form.Item
        name="lastName"
        label="Last Name"
        rules={[{ required: true, message: 'Please enter last name' }]}
      >
        <Input placeholder="Enter last name" />
      </Form.Item>

      <Divider orientation="left">Program Information</Divider>

      <Form.Item
        name="programInfo"
        label="Program"
        rules={[{ required: true, message: 'Please select a program' }]}
      >
        <Select
          placeholder="Select program"
          style={{ width: '100%' }}
          optionFilterProp="children"
          loading={loading}
        >
          {programs.map(program => (
            <Option key={program.programId} value={program.programName}>
              {program.programName}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item>
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onBack}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Create Student
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}; 