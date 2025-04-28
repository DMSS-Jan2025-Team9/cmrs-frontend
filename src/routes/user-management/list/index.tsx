import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Typography, Collapse, Button, Space, Spin } from "antd";
import { Program } from "@/models"; 

const { Panel } = Collapse;

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

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "50px" }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div>
            <Typography.Title level={2}>Programs</Typography.Title>
            <Collapse accordion>
                {programs.map((program) => (
                    <Panel 
                        header={program.programName} 
                        key={program.programName}
                    >
                        <Space direction="horizontal">
                            <Button type="primary">
                                <Link to={`/students/program/${encodeURIComponent(program.programName)}`}>
                                    View Students
                                </Link>
                            </Button>
                            <Button>
                                <Link to={`/programs/view/${encodeURIComponent(program.programId)}`}>
                                    Program Details
                                </Link>
                            </Button>
                        </Space>
                    </Panel>
                ))}
            </Collapse>
        </div>
    );
};

export default ProgramsPage;