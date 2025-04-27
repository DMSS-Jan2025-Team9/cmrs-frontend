import React, { useState, useEffect } from "react";
import { Card, Descriptions, Button, Spin, notification, Table, Space, Typography } from "antd";
import axios from "axios";
import type { Course, Program, ClassSchedule } from "@/models";
import moment from "moment";
import { useGo } from "@refinedev/core";
import { useParams } from "react-router-dom";

export const CourseViewPage = ({ children }: React.PropsWithChildren) => {
  const { courseId } = useParams();
  const go = useGo();
  
  const [courseData, setCourseData] = useState<Course | null>(null);
  const [programData, setProgramData] = useState<Program | null>(null);
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [programLoading, setProgramLoading] = useState<boolean>(false);
  const [schedulesLoading, setSchedulesLoading] = useState<boolean>(true);

  const { Title } = Typography;

  // Function to capitalize first letter
  const capitalizeFirstLetter = (string: string): string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Fetch course data based on courseId
  useEffect(() => {
    if (courseId) {
      setLoading(true);
      axios
        .get(`http://localhost:8081/api/courses/courseId/${courseId}`)
        .then((response) => {
          setCourseData(response.data);
          setLoading(false);
          
          // If we have programId in the course data, fetch program details
          if (response.data.programId) {
            fetchProgramData(response.data.programId);
          }
        })
        .catch((error) => {
          console.error("Error fetching course data", error);
          notification.error({
            message: "Error",
            description: "There was an issue fetching the course details.",
          });
          setLoading(false);
        });
    }
  }, [courseId]);

  // Fetch program data based on programId
  const fetchProgramData = (programId: number) => {
    setProgramLoading(true);
    axios
      .get(`http://localhost:8081/api/program/${programId}`)
      .then((response) => {
        setProgramData(response.data);
        setProgramLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching program data", error);
        notification.error({
          message: "Error",
          description: "There was an issue fetching the program details.",
        });
        setProgramLoading(false);
      });
  };

  // Fetch class schedules for the course
  useEffect(() => {
    if (courseId) {
      setSchedulesLoading(true);
      axios
        .get(`http://localhost:8081/api/classSchedule?courseId=${courseId}`)
        .then((response) => {
          setClassSchedules(response.data);
          setSchedulesLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching class schedules", error);
          notification.error({
            message: "Error",
            description: "There was an issue fetching the class schedules.",
          });
          setSchedulesLoading(false);
        });
    }
  }, [courseId]);

  // Format date for display
  const formatDate = (dateString: string): string => {
    return dateString ? moment(dateString).format("MMMM D, YYYY, h:mm a") : "Not set";
  };

  // Format time for display
  const formatTime = (timeString: string): string => {
    return timeString ? moment(timeString, "HH:mm:ss").format("h:mm a") : "Not set";
  };

  // Navigate to the edit page
  const handleEdit = () => {
    go({
      to: `/courseManagement/edit/${courseId}`,
    });
  };

  // Navigate to add class schedule page
  const handleAddClassSchedule = () => {
    go({
      to: `/classScheduling/new?courseId=${courseId}`
    });
  };

  // Navigate to edit class schedule page
  const handleEditClassSchedule = (classId: number) => {
    go({
      to: `/classScheduling/edit/${classId}`,
    });
  };

  // Navigate back to course management page
  const handleBack = () => {
    go({
      to: "/courseManagement",
    });
  };

  // Table columns configuration
  const columns = [
    {
      title: 'Day of Week',
      dataIndex: 'dayOfWeek',
      key: 'dayOfWeek',
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (text: string) => formatTime(text),
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (text: string) => formatTime(text),
    },
    {
      title: 'Vacancy',
      dataIndex: 'vacancy',
      key: 'vacancy',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ClassSchedule) => (
        <Button size="small" onClick={() => handleEditClassSchedule(record.classId)}>
          Edit
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" tip="Loading course information..." />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Card 
        title={`Course Details: ${courseData?.courseName}`}
        extra={
          <Space>
            <Button type="primary" onClick={handleEdit}>
              Edit Course
            </Button>
            <Button type="primary" onClick={handleAddClassSchedule}>
              Add Class Schedule
            </Button>
          </Space>
        }
      >
        <Descriptions bordered column={1}>
          {/* <Descriptions.Item label="Course ID">{courseData?.courseId}</Descriptions.Item> */}
          <Descriptions.Item label="Course Name">{courseData?.courseName}</Descriptions.Item>
          <Descriptions.Item label="Course Code">{courseData?.courseCode}</Descriptions.Item>
          <Descriptions.Item label="Program">
            {programLoading ? (
              <Spin size="small" />
            ) : programData ? (
              <div>
                <div><strong>{programData.programName}</strong></div>
                <div>{programData.programDesc}</div>
              </div>
            ) : (
              "Not assigned to a program"
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Registration Start">
            {formatDate(courseData?.registrationStart || "")}
          </Descriptions.Item>
          <Descriptions.Item label="Registration End">
            {formatDate(courseData?.registrationEnd || "")}
          </Descriptions.Item>
          <Descriptions.Item label="Max Capacity">{courseData?.maxCapacity}</Descriptions.Item>
          <Descriptions.Item label="Status">{capitalizeFirstLetter(courseData?.status || "")}</Descriptions.Item>
          <Descriptions.Item label="Description">{courseData?.courseDesc}</Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: "30px", marginBottom: "20px" }}>
          <Title level={4}>Class Schedules</Title>
        </div>

        <Table 
          dataSource={classSchedules} 
          columns={columns} 
          rowKey="classId"
          loading={schedulesLoading}
          pagination={false}
          locale={{ emptyText: "No class schedules found for this course" }}
        />

        <div style={{ marginTop: "20px" }}>
          <Button onClick={handleBack}>
            Back to Course Management
          </Button>
        </div>
      </Card>

      {children}
    </div>
  );
};