import React, { useState } from "react";
import { Form, Input, Button, DatePicker, notification, InputNumber, Space } from "antd";
import axios from "axios";
import type { Course } from "@/models";
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

  const [form] = Form.useForm(); // Create a reference to the form

  // Format date to ISO 8601 string
  const formatDate = (date: any): string => {
    return date ? date.toISOString() : "";
  };

  function handleAdd(): void {
    const newCourse: Course = {
      courseName,
      courseCode,
      registrationStart: formatDate(registrationStart),
      registrationEnd: formatDate(registrationEnd),
      maxCapacity,
      courseDesc,
      status: "active",
    };

    axios
      .post("http://localhost:8081/api/courses/addCourse", newCourse)
      .then((response) => {
        // Reset the form after successful submission
        form.resetFields(); // Reset the form using form's resetFields()

        // Show success notification
        notification.success({
          message: "Course Added Successfully!",
          description: `The course "${courseName}" has been added.`,
          duration: 3,
        });
      })
      .catch((error) => {
        console.error("There was an error adding the course!", error);

        // Show error notification in case of failure
        notification.error({
          message: "Error Adding Course",
          description: "There was an issue adding the course. Please try again.",
        });
      });
  }

  return (
    <div className="page-container">
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
          <Input
            value={courseDesc}
            onChange={(e) => setCourseDesc(e.target.value)}
          />
        </Form.Item>

        <Form.Item>
          <Space size="middle">
          <Button type="primary" htmlType="submit">
            Add
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
