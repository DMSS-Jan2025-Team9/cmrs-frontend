import React, { useState, useEffect } from 'react';
import { Col, Row, notification, Card, Statistic, Table, Button } from "antd";
import { TeamOutlined, WarningOutlined, SolutionOutlined } from "@ant-design/icons";
import axios from 'axios';
import { useGo } from "@refinedev/core";
import { PaginationTotal } from '@/components';
import { logError } from "@/utilities/logger";

export const DashboardPage = () => {
  const go = useGo();

  const [_isLoading, setLoading] = useState(true);
  const [_error, setError] = useState(null);
  const [fullClasses, setFullClasses] = useState([]);
  const [nearFullClasses, setNearFullClasses] = useState([]);
  const [mostlyEmptyClasses, setMostlyEmptyClasses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [fullResponse, nearFullResponse, mostlyEmptyResponse] = await Promise.all([
          axios.get('http://localhost:8081/api/classSchedule/full'),
          axios.get('http://localhost:8081/api/classSchedule/nearFull'),
          axios.get('http://localhost:8081/api/classSchedule/mostlyEmpty')
        ]);

        setFullClasses(fullResponse.data);
        setNearFullClasses(nearFullResponse.data);
        setMostlyEmptyClasses(mostlyEmptyResponse.data);
        setError(null);
      } catch (err) {
        logError('Error fetching data:', err);
        notification.error({
          message: "Error",
          description: "There was an issue fetching the class schedules.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="page-container">
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Full Classes"
              value={fullClasses.length}
              valueStyle={{ color: '#cf1322' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Nearly Full Classes"
              value={nearFullClasses.length}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Low Enrollment Classes"
              value={mostlyEmptyClasses.length}
              valueStyle={{ color: '#3f8600' }}
              prefix={<SolutionOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {fullClasses.length > 0 ? (
      <Card 
        title={"Full Classes"} 
        style={{ marginBottom: 16 }}
        extra={<span>{fullClasses.length} classes</span>}
      >      
        <Table 
          dataSource={fullClasses}
          rowKey="classScheduleId"
          pagination={{
            pageSize: 5,
            showTotal: (total) => <PaginationTotal total={total} entityName="classes" />,
          }}
        >
          <Table.Column title="Course Name" dataIndex="courseName" />
          <Table.Column title="Course Code" dataIndex="courseCode" />
          <Table.Column title="Schedule" render={(_, record) => (
            `${record.dayOfWeek}, ${record.startTime} - ${record.endTime}`
          )} />
          <Table.Column 
            title="Enrollment" 
            render={(_, record) => (
              `${(record.maxCapacity - record.vacancy)}/${record.maxCapacity} (${Math.round((record.maxCapacity - record.vacancy) / record.maxCapacity * 100)}%)`
            )} 
          />
          <Table.Column title="Actions" key="actions" render={(value, record) => (
              <Button size="small" onClick={() => go({ to: `/courseManagement/view/${record.courseId}` })}>View</Button>
          )} />
        </Table>
      </Card>): null}

      {nearFullClasses.length > 0 ? (
      <Card 
        title={"Nearly Full Classes"} 
        style={{ marginBottom: 16 }}
        extra={<span>{nearFullClasses.length} classes</span>}
      >
        <Table 
          dataSource={nearFullClasses}
          rowKey="classScheduleId"
          pagination={{
            pageSize: 5,
            showTotal: (total) => <PaginationTotal total={total} entityName="classes" />,
          }}
        >
          <Table.Column title="Course Name" dataIndex="courseName" />
          <Table.Column title="Course Code" dataIndex="courseCode" />
          <Table.Column title="Schedule" render={(_, record) => (
            `${record.dayOfWeek}, ${record.startTime} - ${record.endTime}`
          )} />
          <Table.Column 
            title="Enrollment" 
            render={(_, record) => (
              `${(record.maxCapacity - record.vacancy)}/${record.maxCapacity} (${Math.round((record.maxCapacity - record.vacancy) / record.maxCapacity * 100)}%)`
            )} 
          />
          <Table.Column title="Actions" key="actions" render={(value, record) => (
              <Button size="small" onClick={() => go({ to: `/courseManagement/view/${record.courseId}` })}>View</Button>
          )} />
        </Table>
      </Card>) : null}

      {mostlyEmptyClasses.length > 0 ? (
      <Card 
        title={"Low Enrollment Classes"} 
        style={{ marginBottom: 16 }}
        extra={<span>{mostlyEmptyClasses.length} classes</span>}
      >
        <Table 
          dataSource={mostlyEmptyClasses}
          rowKey="classScheduleId"
          pagination={{
            pageSize: 5,
            showTotal: (total) => <PaginationTotal total={total} entityName="classes" />,
          }}
        >
          <Table.Column title="Course Name" dataIndex="courseName" />
          <Table.Column title="Course Code" dataIndex="courseCode" />
          <Table.Column title="Schedule" render={(_, record) => (
            `${record.dayOfWeek}, ${record.startTime} - ${record.endTime}`
          )} />
          <Table.Column 
            title="Enrollment" 
            render={(_, record) => (
              `${(record.maxCapacity - record.vacancy)}/${record.maxCapacity} (${Math.round((record.maxCapacity - record.vacancy) / record.maxCapacity * 100)}%)`
            )} 
          />
          <Table.Column title="Actions" key="actions" render={(value, record) => (
              <Button size="small" onClick={() => go({ to: `/courseManagement/view/${record.courseId}` })}>View</Button>
          )} />
        </Table>
      </Card>) : null}
    </div>
  );
};
