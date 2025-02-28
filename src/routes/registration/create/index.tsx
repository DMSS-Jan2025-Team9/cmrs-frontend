import React from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import { useParsed } from "@refinedev/core";

interface RegistrationFormValues {
    classId: number;
    studentId: string;
}

export const RegistrationCreatePage: React.FC = () => {
    const { params } = useParsed<{ classId?: string }>();

    // Parse `classId` from the URL query parameters
    const classId = params?.classId ? Number(params.classId) : undefined;

    // Define initial form values
    const initialValues: Partial<RegistrationFormValues> = classId ? { classId } : {};

    const { formProps, saveButtonProps } = useForm<RegistrationFormValues>({
        resource: "courseRegistration",
        redirect: "list", 
    });

    return (
        <Create saveButtonProps={saveButtonProps} title="Create Registration">
            <Form {...formProps} layout="vertical" initialValues={initialValues}>
                {/* Class ID Field */}
                <Form.Item label="Class ID" name="classId">
                    <Input disabled placeholder="Class ID" />
                </Form.Item>

                {/* Student ID Field */}
                <Form.Item
                    label="Student ID"
                    name="studentId"
                    rules={[{ required: true, message: "Please enter your student ID" }]}
                >
                    <Input placeholder="Enter your student ID" />
                </Form.Item>
            </Form>
        </Create>
    );
};

export default RegistrationCreatePage;