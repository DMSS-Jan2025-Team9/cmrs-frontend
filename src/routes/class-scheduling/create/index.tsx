import React, { useState, useEffect } from "react";
import { Form, Button, TimePicker, Select, InputNumber, notification, Space, Input } from "antd";
import axios from "axios";
import { useGo } from "@refinedev/core";
import { useLocation } from "react-router-dom";
import moment from "moment";

// Define the interface for the ClassSchedule
interface ClassSchedule {
  classId?: number;
  courseId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  vacancy: number;
}

// Define the interface for Course
interface Course {
  courseId: number;
  courseName: string;
  courseCode: string;
}

export const ClassScheduleCreatePage = ({ children }: React.PropsWithChildren) => {
  const go = useGo();
  const [form] = Form.useForm();
  
  // Get courseId from URL query parameter
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const courseIdParam = queryParams.get('courseId');
  const courseId = courseIdParam ? Number(courseIdParam) : 0;
  
  // State for storing the current course details
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  
  // Fallback state in case no courseId is provided
  const [courses, setCourses] = useState<Course[]>([]);
  const [showCourseDropdown, setShowCourseDropdown] = useState<boolean>(true);
  
  // Days of the week options
  const daysOfWeek = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];

  // Fetch the specific course details if courseId is provided
  useEffect(() => {
    if (courseId) {
      axios.get(`http://localhost:8081/api/courses/courseId/${courseId}`)
        .then((response) => {
          setCurrentCourse(response.data);
          setShowCourseDropdown(false);
          // Set the courseId in the form
          form.setFieldsValue({ 
            courseId: response.data.courseId,
            courseName: `${response.data.courseName} (${response.data.courseCode})`
          });
        })
        .catch((error) => {
          console.error("Error fetching course details:", error);
          notification.error({
            message: "Error",
            description: "Failed to load course details. Showing all courses instead.",
          });
          // Fetch all courses as fallback
          fetchAllCourses();
        });
    } else {
      // No courseId provided, fetch all courses
      fetchAllCourses();
    }
  }, [courseId, form]);

  // Function to fetch all courses
  const fetchAllCourses = () => {
    axios.get("http://localhost:8081/api/courses")
      .then((response) => {
        setCourses(response.data);
        setShowCourseDropdown(true);
      })
      .catch((error) => {
        console.error("Error fetching courses:", error);
        notification.error({
          message: "Error",
          description: "Failed to load courses. Please try again later.",
        });
      });
  };

  // Format time to ISO 8601 string
  const formatTime = (time: moment.Moment | null): string => {
    return time ? time.format("HH:mm:ss") : "";
  };

  const handleAdd = (values: any) => {
    const selectedCourseId = values.courseId;
    const selectedCourseName = currentCourse 
      ? currentCourse.courseName 
      : courses.find(c => c.courseId === selectedCourseId)?.courseName;
    
    // Initially set vacancy equal to maxCapacity
    const newClassSchedule: ClassSchedule = {
      courseId: selectedCourseId,
      dayOfWeek: values.dayOfWeek,
      startTime: formatTime(values.startTime),
      endTime: formatTime(values.endTime),
      maxCapacity: values.maxCapacity,
      vacancy: values.maxCapacity, // Initial vacancy equals max capacity
    };

    axios.post("http://localhost:8081/api/classSchedule/addClassSchedule", newClassSchedule)
      .then((response) => {
        // Reset the form after successful submission
        form.resetFields();

        // Show success notification
        notification.success({
          message: "Class Schedule Added Successfully!",
          description: `A new class schedule for ${selectedCourseName} on ${values.dayOfWeek} has been added.`,
          duration: 3,
        });

        // Redirect to course view page
        go({
          to: `/courseManagement/View/${selectedCourseId}`,
        });
      })
      .catch((error) => {
        console.error("There was an error adding the class schedule!", error);

        // Show error notification in case of failure
        notification.error({
          message: error.response?.data?.error || "Error",
          description: error.response?.data?.message || "Failed to add class schedule. Please try again.",
        });
      });
  };

  // Validate that end time is after start time
  const validateEndTime = ({ getFieldValue }: { getFieldValue: (name: string) => moment.Moment }) => ({
    validator(_: any, value: moment.Moment) {
      const startTime: moment.Moment = getFieldValue("startTime");
      if (!value || !startTime || value.isAfter(startTime)) {
        return Promise.resolve();
      }
      return Promise.reject(new Error("End time must be after start time!"));
    },
  });

  return (
    <div className="page-container">
      <h1>Add New Class Schedule</h1>
      
      <Form layout="vertical" onFinish={handleAdd} form={form}>
        {showCourseDropdown ? (
          <Form.Item
            label="Course"
            name="courseId"
            rules={[{ required: true, message: "Please select a course!" }]}
          >
            <Select
              placeholder="Select a course"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {courses.map((course) => (
                <Select.Option key={course.courseId} value={course.courseId}>
                  {course.courseName} ({course.courseCode})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        ) : (
          <>
            <Form.Item name="courseId" hidden={true}>
              <InputNumber />
            </Form.Item>
            <Form.Item
              label="Course"
              name="courseName"
            >
              <Input 
                disabled
                className="ant-input-disabled"
              />
            </Form.Item>
          </>
        )}

        <Form.Item
          label="Day of Week"
          name="dayOfWeek"
          rules={[{ required: true, message: "Day of week is required!" }]}
        >
          <Select placeholder="Select day of week">
            {daysOfWeek.map((day) => (
              <Select.Option key={day} value={day}>
                {day}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Start Time"
          name="startTime"
          rules={[{ required: true, message: "Start time is required!" }]}
        >
          <TimePicker format="HH:mm" />
        </Form.Item>

        <Form.Item
          label="End Time"
          name="endTime"
          rules={[
            { required: true, message: "End time is required!" },
            validateEndTime,
          ]}
        >
          <TimePicker format="HH:mm" />
        </Form.Item>

        <Form.Item
          label="Maximum Capacity"
          name="maxCapacity"
          rules={[{ required: true, message: "Maximum capacity is required!" }]}
        >
          <InputNumber min={1} />
        </Form.Item>

        <Form.Item>
          <Space size="middle">
            <Button type="primary" htmlType="submit">
              Add Class Schedule
            </Button>
            <Button
              onClick={() => {
                const currentCourseId = form.getFieldValue("courseId");
                go({
                  to: `/courseManagement/View/${currentCourseId || ""}`,
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