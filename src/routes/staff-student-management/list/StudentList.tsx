import React, { useEffect, useState } from "react";
import { Table, Input, Space, Button, Row, Col, Popconfirm, message, Tag } from "antd";
import { SearchOutlined, DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import { useGo } from "@refinedev/core";
import { Student, Role } from "../models";
import { studentService } from "../services";
import { logError } from "@/utilities/logger";

interface StudentListProps {
  onSearch?: (searchTerm: string) => void;
  searchValue?: string;
}

export const StudentList: React.FC<StudentListProps> = ({ onSearch, searchValue = "" }) => {
  const go = useGo();
  
  const [studentUsers, setStudentUsers] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchName, setSearchName] = useState<string>(searchValue);

  // Fetch student users
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const studentData = await studentService.getAllStudents();
      
      // Process the roles for each student to ensure they're in a consistent format
      const processedStudentData = studentData.map(student => {
        // Ensure roles is always an array
        if (!student.roles) {
          student.roles = [];
        } else if (!Array.isArray(student.roles)) {
          student.roles = [student.roles];
        }
        
        // Convert any roles that are strings to proper role objects
        student.roles = student.roles.map((role: any) => {
          if (typeof role === 'string') {
            return { roleName: role, roleId: undefined };
          } else if (typeof role === 'object') {
            return role;
          }
          return { roleName: String(role), roleId: undefined };
        });
        
        return student;
      });
      
      setStudentUsers(processedStudentData);
      filterStudents(processedStudentData, searchName);
    } catch (error) {
      logError("Error fetching students:", error);
      message.error("Failed to load student users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter students based on search input
  const filterStudents = (data: Student[], searchTerm: string) => {
    if (!searchTerm) {
      setFilteredStudents(data);
      return;
    }
    
    const filtered = data.filter(student => 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.firstName && student.lastName && 
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.programName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredStudents(filtered);
  };

  const handleSearch = () => {
    filterStudents(studentUsers, searchName);
    if (onSearch) {
      onSearch(searchName);
    }
  };

  // Handle user deletion
  const handleDelete = async (userId: number) => {
    try {
      await studentService.deleteStudent(userId);
      message.success("Student deleted successfully");
      fetchStudents(); // Reload the students list after deletion
    } catch (error) {
      logError("Error deleting student:", error);
      message.error("Failed to delete student. Please try again.");
    }
  };

  // View student details
  const handleView = (userId: number) => {
    go({
      to: `/staffStudentManagement/view/student/${userId}`,
    });
  };

  // Edit student
  const handleEdit = (userId: number) => {
    go({
      to: `/staffStudentManagement/edit/student/${userId}`,
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
      title: "Student ID",
      dataIndex: "studentFullId",
      key: "studentFullId",
    },
    {
      title: "Name",
      key: "name",
      render: (text: string, record: Student) => (
        <span>{record.name || (record.firstName && record.lastName ? `${record.firstName} ${record.lastName}` : '')}</span>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Program",
      dataIndex: "programName",
      key: "programName",
    },
    {
      title: "Roles",
      key: "roles",
      render: (text: string, record: Student) => {
        const displayRoles = processRolesToDisplay(record.roles || []);
        
        return (
          <Space wrap>
            {displayRoles.length > 0 ? (
              displayRoles.map(role => (
                <Tag color="green" key={role.key}>
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
      render: (text: string, record: Student) => (
        <Space size="middle">
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => handleView(record.userId)}
            size="small"
          >
            View
          </Button>
          <Button 
            type="default" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record.userId)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this student?"
            onConfirm={() => handleDelete(record.userId)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} size="small">
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
            placeholder="Search by name, email, program..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onPressEnter={handleSearch}
            suffix={<SearchOutlined onClick={handleSearch} style={{ cursor: "pointer" }} />}
          />
        </Col>
      </Row>
      
      <Table
        dataSource={filteredStudents}
        columns={columns}
        rowKey="userId"
        loading={loading}
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Total: ${total} students`,
        }}
      />
    </div>
  );
}; 