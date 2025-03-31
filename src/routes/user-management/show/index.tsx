import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Table, Typography, Button, Select } from "antd";

interface Student {
    studentFullId: string;
    name: string;
    programName: string;
    enrolledAt: string;
}

export const StudentsByProgramPage: React.FC = () => {
    const { programName } = useParams<{ programName: string }>();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10); // Default page size

    useEffect(() => {
        if (!programName) return;

        axios.get(`http://localhost:8085/api/students/program/${encodeURIComponent(programName)}`)
            .then((response) => {
                setStudents(response.data || []);
            })
            .catch((error) => {
                console.error("Failed to fetch students:", error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [programName]);

    const columns = [
        {
            title: "#",
            key: "index",
            render: (_: any, __: Student, index: number) => index + 1, // Auto index
        },
        {
            title: "Student ID",
            dataIndex: "studentFullId",
            key: "studentFullId",
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Program Name",
            dataIndex: "programName",
            key: "programName",
        },
        {
            title: "Enrollment Date",
            dataIndex: "enrolledAt",
            key: "enrolledAt",
        }
    ];

    return (
        <div>
            <Button type="default">
                <Link to="/programs">⬅ Back to Programs</Link>
            </Button>

            <Typography.Title level={2}>
                Students in {decodeURIComponent(programName || "")}
            </Typography.Title>

            <Typography.Text strong>Total Students: {students.length}</Typography.Text>

            <div style={{ margin: "10px 0" }}>
                <Typography.Text>Show:</Typography.Text>
                <Select
                    defaultValue={10}
                    style={{ width: 100, marginLeft: 10 }}
                    onChange={value => setPageSize(value)}
                    options={[
                        { value: 10, label: "10" },
                        { value: 20, label: "20" },
                        { value: 50, label: "50" },
                        { value: 100, label: "100" }
                    ]}
                />
                <Typography.Text> students per page</Typography.Text>
            </div>

            <Table 
                dataSource={students} 
                columns={columns} 
                rowKey="studentFullId" 
                loading={loading} 
                pagination={{ pageSize }} 
            />
        </div>
    );
};

export default StudentsByProgramPage;
