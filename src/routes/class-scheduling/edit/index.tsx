import React, { useState, useEffect } from "react";
import { Form, Button, TimePicker, Select, InputNumber, notification, Space } from "antd";
import axios from "axios";
import { useGo } from "@refinedev/core";
import { useParams } from "react-router-dom";
import moment from "moment";

// Define the interface for the ClassSchedule
interface ClassSchedule {
  classId: number;
  courseId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  vacancy: number;
}

// Define the interface for Course to use in the dropdown
interface Course {
  courseId: number;
  courseName: string;
  courseCode: string;
}

export const ClassScheduleEditPage = ({ children }: React.PropsWithChildren) => {
  const { classId } = useParams(); // Get classId from the URL params
  const go = useGo();
  const [form] = Form.useForm();

  const [courseId, setCourseId] = useState<number>(0);
  
  // State for storing courses for the dropdown
  const [courses, setCourses] = useState<Course[]>([]);
  // State to store current enrollment to calculate new vacancy
  const [currentEnrollment, setCurrentEnrollment] = useState<number>(0);
  
  // Days of the week options
  const daysOfWeek = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];

  const accessToken = localStorage.getItem("access_token");

  // Fetch courses for the dropdown
  useEffect(() => {
    axios.get("https://alb-cmrs-app-790797307.ap-southeast-1.elb.amazonaws.com/course-management/api/courses")
      .then((response) => {
        setCourses(response.data);
      })
      .catch((error) => {
        console.error("Error fetching courses:", error);
        notification.error({
          message: "Error",
          description: "Failed to load courses. Please try again later.",
        });
      });
  }, []);

  // Fetch class schedule data based on classId
  useEffect(() => {
    if (classId) {
      axios.get(`https://alb-cmrs-app-790797307.ap-southeast-1.elb.amazonaws.com/course-management/api/classSchedule/classId/${classId}`)
        .then((response) => {
          const classData = response.data;
          
          // Calculate current enrollment
          setCurrentEnrollment(classData.maxCapacity - classData.vacancy);
          setCourseId(classData.courseId);
          
          // Set the form fields using form.setFieldsValue
          form.setFieldsValue({
            courseId: classData.courseId,
            dayOfWeek: classData.dayOfWeek,
            startTime: moment(classData.startTime, "HH:mm:ss"),
            endTime: moment(classData.endTime, "HH:mm:ss"),
            maxCapacity: classData.maxCapacity,
          });
        })
        .catch((error) => {
          console.error("Error fetching class schedule data", error);
          notification.error({
            message: "Error",
            description: "There was an issue fetching the class schedule details.",
          });
        });
    }
  }, [classId, form]);

  // Format time to ISO 8601 string
  const formatTime = (time: moment.Moment | null): string => {
    return time ? time.format("HH:mm:ss") : "";
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



  const handleEdit = (values: any) => {
    // Find the selected course
    const selectedCourse = courses.find(course => course.courseId === values.courseId);
    
    // Calculate new vacancy based on the difference between new maxCapacity and current enrollment
    const newVacancy = values.maxCapacity - currentEnrollment;
    
    // Prepare the updated class schedule
    const updatedClassSchedule: ClassSchedule = {
      classId: Number(classId),
      courseId: values.courseId,
      dayOfWeek: values.dayOfWeek,
      startTime: formatTime(values.startTime),
      endTime: formatTime(values.endTime),
      maxCapacity: values.maxCapacity,
      vacancy: newVacancy >= 0 ? newVacancy : 0, // Ensure vacancy is not negative
    };

    axios.put(`https://alb-cmrs-app-790797307.ap-southeast-1.elb.amazonaws.com/course-management/api/classSchedule/editClassSchedule/${classId}`, updatedClassSchedule,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type":"application/json"
        }
      }
    )
      .then((response) => {
        // Show success notification
        notification.success({
          message: "Class Schedule Updated Successfully!",
          description: `The class schedule for ${selectedCourse?.courseName} on ${values.dayOfWeek} has been updated.`,
          duration: 3,
        });

        // Redirect to class schedule list page
        go({
          to: `/courseManagement/View/${courseId}`,
        });
      })
      .catch((error) => {
        console.error("There was an error updating the class schedule!", error);

        // Show error notification in case of failure
        notification.error({
          message: error.response?.data?.error || "Error",
          description: error.response?.data?.message || "Failed to add class schedule. Please try again.",
        });
      });
  };

  return (
    <div className="page-container">
      <h1>Edit Class Schedule</h1>
      
      <Form layout="vertical" onFinish={handleEdit} form={form}>
        <Form.Item
          label="Course"
          name="courseId"
          rules={[{ required: true, message: "Please select a course!" }]}
        >
          <Select
            placeholder="Select a course"
            showSearch
            optionFilterProp="children"
            disabled={true}
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
          rules={[
            { required: true, message: "Maximum capacity is required!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (value >= currentEnrollment) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(`Capacity cannot be less than current enrollment (${currentEnrollment})!`));
              },
            }),
          ]}
        >
          <InputNumber min={currentEnrollment > 0 ? currentEnrollment : 1} />
        </Form.Item>

        <Form.Item>
          <Space size="middle">
            <Button type="primary" htmlType="submit">
              Update Class Schedule
            </Button>
            <Button
              onClick={() => {
                go({
                  to: `/courseManagement/View/${courseId}`,
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