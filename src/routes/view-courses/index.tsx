import React, { useEffect, useState } from "react";
import { Table, Input, Space, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import axios from "axios";

import { useGo } from "@refinedev/core";
import { PaginationTotal } from "@/components";
import type { Course } from "@/models";  // Assuming you've created a type for your courses

export const CourseListPage = ({ children }: React.PropsWithChildren) => {
  const go = useGo();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchName, setSearchName] = useState<string>("");
  const [searchCode, setSearchCode] = useState<string>("");
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });

  // Fetch courses from the API
  const fetchCourses = async (searchName: string, searchCode: string, page: number, pageSize: number) => {
    try {
      const response = await axios.get("http://localhost:8081/api/courses/searchCourses", {
        params: {
          courseName: searchName,
          courseCode: searchCode,
          page: page,
          pageSize: pageSize,
        },
      });
      console.log(response.data); // Log the response to check the structure
      setCourses(response.data);
      setFilteredCourses(response.data); // Update the filtered courses (table)
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  useEffect(() => {
    fetchCourses(searchName, searchCode, pagination.page, pagination.pageSize);
  }, []); // Fetch courses only once when the component mounts

  // Trigger fetchCourses only when search button is clicked
  const handleSearch = () => {
    setPagination({ page: 1, pageSize: 10 }); // Reset to first page when searching
    fetchCourses(searchName, searchCode, 1, 10); // Pass the search params to the fetchCourses function
  };

  // Handle pagination
  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize });
    fetchCourses(searchName, searchCode, page, pageSize); // Ensure pagination works with search
  };

    // Handle course deletion
    const handleView = async (courseId: number) => {
      try {
        await axios.delete(`http://localhost:8081/api/courses/${courseId}`);
        alert('Course deleted successfully');
        // Refresh course list after deletion
        fetchCourses(searchName, searchCode, pagination.page, pagination.pageSize);
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
            onChange={(e) => setSearchName(e.target.value)} // Update search name on input change
            allowClear
          />
          <Input
            placeholder="Search by Course Code"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)} // Update search code on input change
            allowClear
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch} // Search only when the button is clicked
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
          onChange: handlePaginationChange, // Handle pagination change
          showTotal: (total) => <PaginationTotal total={total} entityName="courses" />,
        }}
        rowKey="courseId"
      >
        <Table.Column<Course> title="Course Name" dataIndex="courseName" />
        <Table.Column<Course> title="Course Code" dataIndex="courseCode" />
        <Table.Column<Course> title="Course Description" dataIndex="courseDesc" />
        <Table.Column<Course> title="Actions" key="actions" render={(value, record) => (
          <Space>
            <Button size="small" onClick={() => handleView(record.courseId)}>View</Button>
          </Space>
        )} />
      </Table>

      {children}
    </div>
  );
};
