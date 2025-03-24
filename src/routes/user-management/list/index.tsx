import React, { useEffect, useState } from "react";
import { Table, Typography } from "antd";
import { Link } from "react-router-dom";
import axios from "axios";

interface Student {
    studentFullId: string;
    name: string;
    programName: string;
    enrolledAt: string;
}

export const AllStudentsPage: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        axios.get("http://localhost:8085/api/students")
            .then((response) => setStudents(response.data))
            .catch((error) => console.error("Error fetching students:", error))
            .finally(() => setLoading(false));
    }, []);

    // 👉 Column definitions (with clickable Program Name)
    const studentColumns = [
        { title: "Student ID", dataIndex: "studentFullId", key: "studentFullId" },
        { title: "Name", dataIndex: "name", key: "name" },
        {
            title: "Program Name",
            dataIndex: "programName",
            key: "programName",
            render: (text: string) => <Link to={`/students/program/${encodeURIComponent(text)}`}>{text}</Link>,
        },
        { title: "Enrollment Date", dataIndex: "enrolledAt", key: "enrolledAt" },
    ];

    return (
        <div>
            <Typography.Title level={3}>All Students</Typography.Title>
            <Table dataSource={students} columns={studentColumns} loading={loading} rowKey="studentFullId" />
        </div>
    );
};
