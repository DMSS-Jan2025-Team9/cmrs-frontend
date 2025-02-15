import React, { useEffect, useState } from "react";
import { Table, Input, Space, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import axios from "axios";

import { useGo } from "@refinedev/core";
import { CreateButton } from "@refinedev/antd";
import { CustomAvatar, PaginationTotal, Text } from "@/components";
import type { Course } from "@/models";  // Assuming you've created a type for your courses

export const CourseListPage = ({ children }: React.PropsWithChildren) => {
  const go = useGo();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchName, setSearchName] = useState<string>("");
  const [searchCode, setSearchCode] = useState<string>("");
  const [pagination, setPagination] = useState({ page: 1, pageSize: 12 });

  // Fetch courses from the API
  const fetchCourses = async () => {
    try {
       const response = await axios.get("http://localhost:8081/api/courses"
       , {
        params: {
          courseName: searchName,
          courseCode: searchCode,
          page: pagination.page,
          pageSize: pagination.pageSize,
        },
      }
      );
      console.log(response.data);
      setCourses(response.data);
      setFilteredCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [searchName, searchCode, pagination]);

  // Handle search filters
  const handleSearch = () => {
    fetchCourses();
  };

  // Handle pagination
  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize });
  };

  // Helper function for deletion
  const handleDelete = async (courseId: number) => {
    try {
      await axios.delete(`http://localhost:8081/api/courses/${courseId}`);
      alert('Course deleted successfully');
      // Refresh course list after delete
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      alert('Failed to delete course');
    }
  };

  return (
    <div className="page-container">
      <div className="search-container">
        <Space>
          <Input
            placeholder="Search by Course Name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            allowClear
          />
          <Input
            placeholder="Search by Course Code"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            allowClear
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
          >
            Search
          </Button>
        </Space>
      </div>

      <Table
        dataSource={filteredCourses}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          onChange: handlePaginationChange,
          showTotal: (total) => <PaginationTotal total={total} entityName="courses" />,
        }}
        rowKey="courseId"
      >
        <Table.Column<Course> title="Course Name" dataIndex="courseName" />
        <Table.Column<Course> title="Course Code" dataIndex="courseCode" />
        <Table.Column<Course> title="Course Description" dataIndex="courseDesc" />
        <Table.Column<Course> title="Actions" key="actions" render={(value, record) => (
          <Space>
            <Button size="small" onClick={() => go({ to: { resource: "courses", action: "edit", id: record.courseId } })}>Edit</Button>
            <Button size="small" onClick={() => handleDelete(record.courseId)}>Delete</Button>
          </Space>
        )} />
      </Table>

      {children}
    </div>
  );
};