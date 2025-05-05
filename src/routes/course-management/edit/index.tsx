import React, { useState, useEffect } from "react";
import { Form, Input, Button, DatePicker, notification, InputNumber, Space, Select, Spin } from "antd";
import axios from "axios";
import type { Course } from "@/models";
import moment from "moment";
import { useGo } from "@refinedev/core";
import { useParams } from "react-router-dom"; // Import useParams from react-router-dom
import { logError } from "@/utilities/logger";

// Define Program interface
interface Program {
  programId: number;
  programName: string;
  programDesc: string;
}

export const CourseEditPage = ({ children }: React.PropsWithChildren) => {
  const { courseId } = useParams(); // Get courseId from the URL params
  const go = useGo();

  const [form] = Form.useForm(); // Create a reference to the form
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState<boolean>(true);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);

  const courseStatus = [
    "active", "inactive"
  ];

  // Fetch programs list
  useEffect(() => {
    fetchPrograms();
  }, []);

  // Function to fetch programs
  const fetchPrograms = () => {
    setLoadingPrograms(true);
    axios
      .get("http://localhost:8081/api/program")
      .then((response) => {
        setPrograms(response.data);
        setLoadingPrograms(false);
        
        // After programs are loaded, fetch course data
        if (initialLoad) {
          fetchCourseData();
          setInitialLoad(false);
        }
      })
      .catch((error) => {
        logError("Error fetching programs", error);
        notification.error({
          message: "Error",
          description: "There was an issue fetching the programs list.",
        });
        setLoadingPrograms(false);
      });
  };

  // Fetch course data based on courseId
  const fetchCourseData = () => {
    if (courseId) {
      axios
        .get(`http://localhost:8081/api/courses/courseId/${courseId}`) // Fetch course data by ID
        .then((response) => {
          const courseData = response.data;

          // Set the form fields using form.setFieldsValue
          form.setFieldsValue({
            courseName: courseData.courseName,
            courseCode: courseData.courseCode,
            courseDesc: courseData.courseDesc,
            maxCapacity: courseData.maxCapacity,
            registrationStart: moment(courseData.registrationStart),
            registrationEnd: moment(courseData.registrationEnd),
            status: courseData.status,
            programId: courseData.programId
          });
        })
        .catch((error) => {
          logError("Error fetching course data", error);
          notification.error({
            message: "Error",
            description: "There was an issue fetching the course details.",
          });
        });
    }
  };

  // Format date to ISO 8601 string
  const formatDate = (date: any): string => {
    return date ? date.toISOString() : "";
  };

  // Function to capitalize first letter
  const capitalizeFirstLetter = (string: string): string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  function handleEdit(): void {
    const courseName = form.getFieldValue("courseName");
    const programId = form.getFieldValue("programId");
    
    if (!programId) {
      notification.error({
        message: "Program Required",
        description: "Please select a program for this course.",
      });
      return;
    }
    
    const updatedCourse: Course = {
      courseId: Number(courseId), // Add courseId to the updated course object
      courseName: courseName,
      courseCode: form.getFieldValue("courseCode"),
      registrationStart: formatDate(form.getFieldValue("registrationStart")),
      registrationEnd: formatDate(form.getFieldValue("registrationEnd")),
      maxCapacity: form.getFieldValue("maxCapacity"),
      courseDesc: form.getFieldValue("courseDesc"),
      status: form.getFieldValue("status"), 
      programId: programId
    };
    const accessToken = localStorage.getItem("access_token");

    axios
      .put(`http://localhost:8081/api/courses/editCourse/${courseId}`, 
        updatedCourse,{
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type":"application/json"
          }
        }
      ) // Update course with the courseId
      .then((response) => {
        form.resetFields(); // Reset the form

        // Show success notification
        notification.success({
          message: "Course Updated Successfully!",
          description: `The course ${courseName} has been updated.`,
          duration: 3,
        });

        // Navigate back to course management page after successful update
        go({
          to: "/courseManagement",
        });
      })
      .catch((error) => {
        logError("There was an error updating the course!", error);

        // Show error notification in case of failure
        notification.error({
          message: "Error Updating Course",
          description: error.response?.data?.message || "There was an issue updating the course. Please try again.",
        });
      });
  }

  return (
    <div className="page-container">
      <h1>Edit Course</h1>
      <Form layout="vertical" onFinish={handleEdit} form={form}>
        <Form.Item
          label="Course Name"
          name="courseName"
          rules={[
            { required: true, message: "Course Name is required!" },
            { max: 100, message: "Course Name cannot be longer than 100 characters!" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Course Code"
          name="courseCode"
          rules={[
            { required: true, message: "Course Code is required!" },
            { max: 20, message: "Course Code cannot be longer than 20 characters!" },
          ]}
        >
          <Input allowClear />
        </Form.Item>
        
        <Form.Item
          label="Program"
          name="programId"
          rules={[{ required: true, message: "Program is required!" }]}
        >
          <Select
            placeholder="Select a program"
            loading={loadingPrograms}
            style={{ width: '100%' }}
          >
            {loadingPrograms ? (
              <Select.Option value="" disabled>
                <Spin size="small" /> Loading programs...
              </Select.Option>
            ) : (
              programs.map((program) => (
                <Select.Option key={program.programId} value={program.programId}>
                  {program.programName} - {program.programDesc}
                </Select.Option>
              ))
            )}
          </Select>
        </Form.Item>

        <Form.Item
          label="Registration Start"
          name="registrationStart"
          rules={[{ required: true, message: "Registration Start is required!" }]}
        >
          <DatePicker showTime />
        </Form.Item>

        <Form.Item
          label="Registration End"
          name="registrationEnd"
          rules={[
            { required: true, message: "Registration End is required!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("registrationStart") < value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Registration End must be after Registration Start!"));
              },
            }),
          ]}
        >
          <DatePicker showTime />
        </Form.Item>

        <Form.Item
          label="Course Status"
          name="status"
          rules={[{ required: true, message: "Course Status is required!" }]}
        >
          <Select placeholder="Select status">
            {courseStatus.map((status) => (
              <Select.Option key={status} value={status}>
                {capitalizeFirstLetter(status)}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Course Max Capacity"
          name="maxCapacity"
          rules={[{ required: true, message: "Course Max Capacity is required!" }]}
        >
          <InputNumber min={1} />
        </Form.Item>

        <Form.Item
          label="Course Description"
          name="courseDesc"
          rules={[{ required: true, message: "Course Description is required!" }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item>
          <Space size="middle">
            <Button type="primary" htmlType="submit">
              Save Changes
            </Button>
            <Button
              onClick={() => {
                go({
                  to: "/courseManagement",
                });
              }}
            >
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {children}
    </div>
  );
};