import React, { useState } from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Button, Upload, message, Table, Typography } from "antd";
import { RcFile } from "antd/es/upload";
import axios from "axios";

interface BatchJobUploadFormValues {
    csvFile: RcFile | undefined;
}

interface BatchJobStatus {
    jobId: string;
    status: string;
    progress: string;
}

interface CsvData {
    [key: string]: string;
}

export const BatchJobUploadPage: React.FC = () => {
    const [file, setFile] = useState<RcFile | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(false);
    const [batchJobStatus, setBatchJobStatus] = useState<BatchJobStatus | null>(null);
    const [csvContents, setCsvContents] = useState<CsvData[]>([]);

    const handleFileChange = (info: any) => {
        if (info.file.status === "done") {
            message.success(`${info.file.name} file uploaded successfully`);
        } else if (info.file.status === "error") {
            message.error(`${info.file.name} file upload failed.`);
        }
    };

    const handleBeforeUpload = (selectedFile: RcFile) => {
        setFile(selectedFile);
        readCsvFile(selectedFile);  // Trigger CSV file reading
        return false;
    };

    const readCsvFile = (file: RcFile) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const text = e.target.result;
            parseCsv(text);
        };
        reader.readAsText(file);
    };

    const parseCsv = (csvText: string) => {
        const rows = csvText.split("\n");
        const headers = rows[0].split(",");
        const data = rows.slice(1).map((row) => {
            const values = row.split(",");
            const rowData: CsvData = {};
            headers.forEach((header, index) => {
                rowData[header] = values[index];
            });
            return rowData;
        });
        setCsvContents(data);
    };

    const handleBatchJobSubmit = async (values: BatchJobUploadFormValues) => {
        if (!file) {
            message.error("Please upload a CSV file before submitting.");
            return;
        }

        const formData = new FormData();
        formData.append("csvFile", file);

        setLoading(true);  // Start loading state

        try {
            // Sending the file to the backend
            const response = await axios.post("http://localhost:8085/jobs/importStudents", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            // Assuming the response contains job details (e.g., jobId)
            const jobStatus: BatchJobStatus = {
                jobId: response.data.jobId,
                status: "In Progress",
                progress: "0%",
            };
            setBatchJobStatus(jobStatus);

            message.success("Batch job started successfully!");
        } catch (error) {
            message.error("Error starting batch job.");
            console.error(error);
        } finally {
            setLoading(false);  // Stop loading state
        }
    };

    const columns = [
        {
            title: "Job ID",
            dataIndex: "jobId",
            key: "jobId",
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
        },
        {
            title: "Progress",
            dataIndex: "progress",
            key: "progress",
        },
    ];

    const csvColumns = csvContents.length > 0 ? Object.keys(csvContents[0]).map((key) => ({
        title: key,
        dataIndex: key,
        key: key,
    })) : [];

    // Determine if scrolling is needed based on the number of rows
    const scrollProps = csvContents.length > 15 ? { y: 300 } : {};  // Adjust `y` value as needed for scroll height

    return (
        <Create title="Upload CSV and Start Batch Job">
            <Form layout="vertical" onFinish={handleBatchJobSubmit}>
                <Form.Item
                    label="Upload CSV"
                    name="csvFile"
                    rules={[{ required: true, message: "Please upload a CSV file" }]}
                >
                    <Upload
                        accept=".csv"
                        beforeUpload={handleBeforeUpload}
                        onChange={handleFileChange}
                        showUploadList={false}
                    >
                        <Button>Click to Upload CSV</Button>
                    </Upload>
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        disabled={!file || loading}
                    >
                        Start Batch Job
                    </Button>
                </Form.Item>
            </Form>

            {/* Show file name after file is selected */}
            {file && (
                <Typography.Paragraph strong>
                    Selected File: {file.name}
                </Typography.Paragraph>
            )}

            {/* Displaying the CSV contents as a table */}
            {csvContents.length > 0 && (
                <Table
                    dataSource={csvContents}
                    columns={csvColumns}
                    rowKey={(record, index) => index !== undefined ? index.toString() : String(Math.random())}
                    pagination={false}
                    loading={loading}
                    scroll={scrollProps}  // Add scroll props here
                />

            )}

            {/* Displaying the batch job status in a table */}
            {batchJobStatus && (
                <Table
                    dataSource={[batchJobStatus]}
                    columns={columns}
                    rowKey="jobId"
                    pagination={false}
                    loading={loading}
                />
            )}
        </Create>
    );
};

