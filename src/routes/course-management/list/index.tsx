import React, { useEffect, useState } from "react";
import { Table, Input, Space, Button, Row, Col } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { CreateButton } from "@refinedev/antd";
import axios from "axios";

import { useGo } from "@refinedev/core";
import { PaginationTotal } from "@/components";
import type { Course } from "@/models";  

export const CourseListPage = ({ children }: React.PropsWithChildren) => {
  const go = useGo();
  
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchName, setSearchName] = useState<string>("");
  const [searchCode, setSearchCode] = useState<string>("");
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });

  // Fetch courses from the API
  const fetchCourses = async (searchName: string, searchCode: string, page: number, pageSize: number) => {
    try {
      const response = await axios.get("https://app.cmrsapp.site/course-management/api/courses/searchCourses", {
        params: {
          courseName: searchName,
          courseCode: searchCode,
          page: page,
          pageSize: pageSize,
        },
      });
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

  return (
    <div className="page-container">
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
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
        </Col>
        <Col>
          <CreateButton
            onClick={() => {
              go({
                to: {
                  resource: "courseManagement",
                  action: "create",
                },
              });
            }}
          >
            Add Course
          </CreateButton>
        </Col>
      </Row>

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
            <Button size="small" onClick={() => go({ to: `/courseManagement/view/${record.courseId}` })}>View</Button>
            <Button size="small" onClick={() => go({ to: `/courseManagement/edit/${record.courseId}` })}>Edit</Button>
          </Space>
        )} />
      </Table>

      {children}
    </div>
  );
};