import React, { useState, useEffect } from "react";
import { Form, Input, Button, DatePicker, notification, InputNumber, Space } from "antd";
import axios from "axios";
import type { Course } from "@/models";
import moment from "moment";
import { useGo } from "@refinedev/core";
import { useParams } from "react-router-dom"; // Import useParams from react-router-dom

export const CourseEditPage = ({ children }: React.PropsWithChildren) => {
  const { courseId } = useParams(); // Get courseId from the URL params
  const go = useGo();

  const [form] = Form.useForm(); // Create a reference to the form

  // Fetch course data based on courseId
  useEffect(() => {
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
          });
        })
        .catch((error) => {
          console.error("Error fetching course data", error);
          notification.error({
            message: "Error",
            description: "There was an issue fetching the course details.",
          });
        });
    }
  }, [courseId, form]); // Add `form` to the dependency array

  // Format date to ISO 8601 string
  const formatDate = (date: any): string => {
    return date ? date.toISOString() : "";
  };

  function handleEdit(): void {
    const courseName = form.getFieldValue("courseName");
    const updatedCourse: Course = {
      courseId: Number(courseId), // Add courseId to the updated course object
      courseName: courseName,
      courseCode: form.getFieldValue("courseCode"),
      registrationStart: formatDate(form.getFieldValue("registrationStart")),
      registrationEnd: formatDate(form.getFieldValue("registrationEnd")),
      maxCapacity: form.getFieldValue("maxCapacity"),
      courseDesc: form.getFieldValue("courseDesc"),
      status: "active", // Keep the same status or update as needed
    };

    axios
      .put(`http://localhost:8081/api/courses/editCourse/${courseId}`, updatedCourse) // Update course with the courseId
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
        console.error("There was an error updating the course!", error);

        // Show error notification in case of failure
        notification.error({
          message: "Error Updating Course",
          description: "There was an issue updating the course. Please try again.",
        });
      });
  }

  return (
    <div className="page-container">
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
          <Input />
        </Form.Item>

        <Form.Item>
          <Space size="middle">
            <Button type="primary" htmlType="submit">
              Edit
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