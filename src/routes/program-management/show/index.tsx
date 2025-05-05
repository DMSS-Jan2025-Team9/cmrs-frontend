import React, { useState, useEffect } from "react";
import { Card, Descriptions, Button, Spin, notification, Table, Space, Typography } from "antd";
import axios from "axios";
import type { Course, Program } from "@/models";
import moment from "moment";
import { useGo } from "@refinedev/core";
import { useParams } from "react-router-dom";
import { logError } from "@/utilities/logger";

export const ProgramViewPage = ({ children }: React.PropsWithChildren) => {
  const { programId } = useParams();
  const go = useGo();
  
  const [programData, setProgramData] = useState<Program | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { Title } = Typography;

  // Function to capitalize first letter
  const capitalizeFirstLetter = (string: string): string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Fetch program data based on programId
  useEffect(() => {
    if (programId) {
      setLoading(true);
      axios
        .get(`http://localhost:8081/api/program/${programId}`)
        .then((response) => {
          setProgramData(response.data);
          setCourses(response.data.courses || []);
          setLoading(false);
        })
        .catch((error) => {
          logError("Error fetching program data", error);
          notification.error({
            message: "Error",
            description: "There was an issue fetching the program details.",
          });
          setLoading(false);
        });
    }
  }, [programId]);

  // Format date for display
  const formatDate = (dateString: string): string => {
    return dateString ? moment(dateString).format("MMMM D, YYYY, h:mm a") : "Not set";
  };

  // Navigate to the edit page
  const handleEdit = () => {
    go({
      to: `/programManagement/edit/${programId}`,
    });
  };

  // Navigate to add course page
  const handleAddCourse = () => {
    go({
      to: `/courseManagement/new?programId=${programId}`
    });
  };

  // Navigate to edit course page
  const handleEditCourse = (courseId: number) => {
    go({
      to: `/courseManagement/edit/${courseId}`,
    });
  };

  // Navigate to view course details page
  const handleViewCourse = (courseId: number) => {
    go({
      to: `/courseManagement/view/${courseId}`,
    });
  };

  // Navigate back to program management page
  const handleBack = () => {
    go({
      to: "/programs",
    });
  };

  // Table columns configuration
  const columns = [
    {
      title: 'Course Name',
      dataIndex: 'courseName',
      key: 'courseName',
    },
    {
      title: 'Course Code',
      dataIndex: 'courseCode',
      key: 'courseCode',
    },
    {
      title: 'Registration Start',
      dataIndex: 'registrationStart',
      key: 'registrationStart',
      render: (text: string) => formatDate(text),
    },
    {
      title: 'Registration End',
      dataIndex: 'registrationEnd',
      key: 'registrationEnd',
      render: (text: string) => formatDate(text),
    },
    {
      title: 'Max Capacity',
      dataIndex: 'maxCapacity',
      key: 'maxCapacity',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => capitalizeFirstLetter(text || ""),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Course) => (
        <Space>
          <Button size="small" onClick={() => record.courseId !== undefined && handleViewCourse(record.courseId)}>
            View
          </Button>
          <Button size="small" onClick={() => record.courseId !== undefined && handleEditCourse(record.courseId)}>
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" tip="Loading program information..." />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Card 
        title={`Program Details: ${programData?.programName}`}
        extra={
          <Space>
            <Button type="primary" onClick={handleEdit}>
              Edit Program
            </Button>
            <Button type="primary" onClick={handleAddCourse}>
              Add Course
            </Button>
          </Space>
        }
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Program Name">{programData?.programName}</Descriptions.Item>
          <Descriptions.Item label="Program Description">{programData?.programDesc}</Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: "30px", marginBottom: "20px" }}>
          <Title level={4}>Courses in this Program</Title>
        </div>

        <Table 
          dataSource={courses} 
          columns={columns} 
          rowKey="courseId"
          pagination={false}
          locale={{ emptyText: "No courses found for this program" }}
        />

        <div style={{ marginTop: "20px" }}>
          <Button onClick={handleBack}>
            Back to Program Management
          </Button>
        </div>
      </Card>

      {children}
    </div>
  );
};