import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form, Input, Button, List, message } from "antd";
import axios, { AxiosError } from "axios";

interface CreateRegistrationDTO {
    classId: number;
    studentFullIds: string[];
}

export const RegistrationCreatePage: React.FC = () => {
    const { classId } = useParams<{ classId: string }>();
    const [studentFullIds, setStudentFullIds] = useState<string[]>([]);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const handleAddStudent = () => {
        if (studentFullIds.length < 5) {
            setStudentFullIds([...studentFullIds, ""]);
        } else {
            message.warning("You can only register up to 5 students.");
        }
    };

    const handleStudentFullIdChange = (index: number, value: string) => {
        const newStudentFullIds = [...studentFullIds];
        newStudentFullIds[index] = value;
        setStudentFullIds(newStudentFullIds);
    };

    const onFinish = async (values: any) => {
        // Add the studentIds to the form values
        values.studentFullIds = studentFullIds.filter(id => id.trim() !== "");
        if (values.studentFullIds.length === 0) {
            message.error("Please enter at least one student ID.");
            return;
        }

        try {
            const response = await axios.post(
              "https://alb-cmrs-app-790797307.ap-southeast-1.elb.amazonaws.com/course-registration/api/courseRegistration",
              values
            );
            if (response.status === 201) {
              message.success("Registration created successfully!");
              navigate("/courseRegistration");
            } else {
              message.error("Failed to create registration.");
            }
          } catch (err) {
            // Check if it's an AxiosError with a response payload
            const axiosErr = err as AxiosError<{ message?: string }>;
            const serverMessage =
              axiosErr.response?.data?.message 
              axiosErr.message;             
        
            message.error(serverMessage);
          }
        };

    return (
        <div>
            <h1>Create Registration</h1>
            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ classId }}>
                {/* Class ID Field */}
                <Form.Item label="Class ID" name="classId">
                    <Input disabled placeholder="Class ID" />
                </Form.Item>

                {/* Student ID Fields */}
                <List
                    header={<div>Student</div>}
                    dataSource={studentFullIds}
                    renderItem={(id, index) => (
                        <List.Item>
                            <Form.Item
                                label={`Student ID ${index + 1}`}
                                name={`studentFullIds[${index}]`}
                                rules={[{ required: true, message: "Please enter a student ID" }]}
                            >
                                <Input
                                    placeholder="Enter student ID"
                                    value={id}
                                    onChange={(e) => handleStudentFullIdChange(index, e.target.value)}
                                />
                            </Form.Item>
                        </List.Item>
                    )}
                />

                {/* Add Student Button */}
                <Button type="dashed" onClick={handleAddStudent} style={{ width: "100%" }}>
                    + Add Student
                </Button>

                {/* Submit Button */}
                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Submit
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default RegistrationCreatePage;