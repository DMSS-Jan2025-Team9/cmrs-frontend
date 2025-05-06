import React, { useState, useEffect } from "react";
import { Form, Input, Button, DatePicker, notification, InputNumber, Space, Select, Spin } from "antd";
import axios from "axios";
import type { Course, Program } from "@/models";
import moment from "moment";
import { useGo } from "@refinedev/core";

export const CourseCreatePage = ({ children }: React.PropsWithChildren) => {
  const go = useGo();
  
  const [courseName, setCourseName] = useState<string>("");
  const [courseCode, setCourseCode] = useState<string>("");
  const [courseDesc, setCourseDesc] = useState<string>("");
  const [maxCapacity, setMaxCapacity] = useState<number>(0);
  const [registrationStart, setRegistrationStart] = useState<moment.Moment | null>(null);
  const [registrationEnd, setRegistrationEnd] = useState<moment.Moment | null>(null);
  const [programId, setProgramId] = useState<number | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState<boolean>(true);

  const [form] = Form.useForm(); // Create a reference to the form
  const { Option } = Select;

  // Fetch programs on component mount
  useEffect(() => {
    fetchPrograms();
  }, []);

  // Function to fetch programs from API
  const fetchPrograms = () => {
    setLoadingPrograms(true);
    axios
      .get("https://app.cmrsapp.site/course-management/api/program")
      .then((response) => {
        setPrograms(response.data);
        setLoadingPrograms(false);
      })
      .catch((error) => {
        console.error("Error fetching programs", error);
        notification.error({
          message: "Error",
          description: "There was an issue fetching the programs list.",
        });
        setLoadingPrograms(false);
      });
  };

  // Format date to ISO 8601 string
  const formatDate = (date: any): string => {
    return date ? date.toISOString() : "";
  };

  function handleAdd(): void {
    if (!programId) {
      notification.error({
        message: "Program Required",
        description: "Please select a program for this course.",
      });
      return;
    }

    const newCourse: Course = {
      courseName,
      courseCode,
      registrationStart: formatDate(registrationStart),
      registrationEnd: formatDate(registrationEnd),
      maxCapacity,
      courseDesc,
      status: "active",
      programId,
    };

    const accessToken = localStorage.getItem("access_token");

    axios
      .post("https://app.cmrsapp.site/course-management/api/courses/addCourse", newCourse, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type":"application/json"
        }
      })
      .then((response) => {
        // Reset the form after successful submission
        form.resetFields(); // Reset the form using form's resetFields()

        // Show success notification
        notification.success({
          message: "Course Added Successfully!",
          description: `The course "${courseName}" has been added.`,
          duration: 3,
        });

        // Navigate back to course list
        go({
          to: "/courseManagement",
        });
      })
      .catch((error) => {
        console.error("There was an error adding the course!", error);

        // Show error notification in case of failure
        notification.error({
          message: "Error Adding Course",
          description: error.response?.data?.message || "There was an issue adding the course. Please try again.",
        });
      });
  }

  return (
    <div className="page-container">
      <h1>Create New Course</h1>
      <Form layout="vertical" onFinish={handleAdd} form={form}> {/* Attach the form ref */}
        <Form.Item
          label="Course Name"
          name="courseName"
          rules={[
            { required: true, message: "Course Name is required!" },
            { max: 100, message: "Course Name cannot be longer than 100 characters!" },
          ]}
        >
          <Input
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
          />
        </Form.Item>

        <Form.Item
          label="Course Code"
          name="courseCode"
          rules={[
            { required: true, message: "Course Code is required!" },
            { max: 20, message: "Course Code cannot be longer than 20 characters!" },
          ]}
        >
          <Input
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            allowClear
          />
        </Form.Item>
        
        <Form.Item
          label="Program"
          name="programId"
          rules={[{ required: true, message: "Program is required!" }]}
        >
          <Select
            placeholder="Select a program"
            onChange={(value) => setProgramId(value)}
            loading={loadingPrograms}
            style={{ width: '100%' }}
          >
            {loadingPrograms ? (
              <Option value="" disabled>
                <Spin size="small" /> Loading programs...
              </Option>
            ) : (
              programs.map((program) => (
                <Option key={program.programId} value={program.programId}>
                  {program.programName} - {program.programDesc}
                </Option>
              ))
            )}
          </Select>
        </Form.Item>

        <Form.Item
          label="Registration Start"
          name="registrationStart"
          rules={[{ required: true, message: "Registration Start is required!" }]}
        >
          <DatePicker
            showTime
            value={registrationStart ? moment(registrationStart) : null}
            onChange={(date) => setRegistrationStart(date)}
          />
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
          <DatePicker
            showTime
            value={registrationEnd ? moment(registrationEnd) : null}
            onChange={(date) => setRegistrationEnd(date)}
          />
        </Form.Item>

        <Form.Item
          label="Course Max Capacity"
          name="maxCapacity"
          rules={[
            { required: true, message: "Course Max Capacity is required!" },
          ]}
        >
          <InputNumber
            min={1} // Set minimum value to 1
            value={maxCapacity}
            onChange={(value) => setMaxCapacity(value ?? 0)}
          />
        </Form.Item>

        <Form.Item
          label="Course Description"
          name="courseDesc"
          rules={[{ required: true, message: "Course Description is required!" }]}
        >
          <Input.TextArea
            rows={4}
            value={courseDesc}
            onChange={(e) => setCourseDesc(e.target.value)}
          />
        </Form.Item>

        <Form.Item>
          <Space size="middle">
            <Button type="primary" htmlType="submit">
              Add Course
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