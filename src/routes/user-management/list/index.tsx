import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Table, Typography } from "antd";

interface Program {
    programName: string;
    studentCount: number;  // If you want to show count
}

export const ProgramsPage: React.FC = () => {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get("http://localhost:8081/api/program")
            .then((response) => {
                setPrograms(response.data);
            })
            .catch((error) => {
                console.error("Failed to fetch programs:", error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const columns = [
        {
            title: "Program Name",
            dataIndex: "programName",
            key: "programName",
            render: (text: string) => <Link to={`/students/program/${encodeURIComponent(text)}`}>{text}</Link>,
        },
        // {
        //     title: "Total Students",
        //     dataIndex: "studentCount",
        //     key: "studentCount",
        // }
    ];

    return (
        <div>
            <Typography.Title level={2}>Programs</Typography.Title>
            <Table dataSource={programs} columns={columns} rowKey="programName" loading={loading} />
        </div>
    );
};

export default ProgramsPage;
