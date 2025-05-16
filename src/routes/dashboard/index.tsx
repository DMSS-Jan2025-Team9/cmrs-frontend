import React, { useState, useEffect } from 'react';
import { Col, Row, notification, Card, Statistic, Table, Button, Empty } from "antd";
import { TeamOutlined, WarningOutlined, SolutionOutlined } from "@ant-design/icons";
import axios from 'axios';
import { useGo } from "@refinedev/core";
import { PaginationTotal } from '@/components';

export const DashboardPage = () => {
  const go = useGo();

  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classData, setClassData] = useState({
    full: { classes: [], title: "Full Classes", icon: <TeamOutlined />, color: '#cf1322' },
    nearfull: { classes: [], title: "Nearly Full Classes", icon: <WarningOutlined />, color: '#faad14' },
    mostlyempty: { classes: [], title: "Low Enrollment Classes", icon: <SolutionOutlined />, color: '#3f8600' }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Use the new filter endpoint with different filter types
        const [fullResponse, nearFullResponse, mostlyEmptyResponse] = await Promise.all([
          axios.get('http://localhost:8081/api/classSchedule/filter?filterType=full'),
          axios.get('http://localhost:8081/api/classSchedule/filter?filterType=nearfull'),
          axios.get('http://localhost:8081/api/classSchedule/filter?filterType=mostlyempty')
        ]);

        // Update state with the new data structure
        setClassData({
          full: { 
            ...classData.full, 
            classes: fullResponse.data 
          },
          nearfull: { 
            ...classData.nearfull, 
            classes: nearFullResponse.data 
          },
          mostlyempty: { 
            ...classData.mostlyempty, 
            classes: mostlyEmptyResponse.data 
          }
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
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

  // Helper function to render a Class Card
  const renderClassCard = (filterType: keyof typeof classData) => {
    const { classes, title, icon, color } = classData[filterType];
    
    return classes.length > 0 ? (
      <Card 
        title={title} 
        style={{ marginBottom: 16 }}
        extra={<span>{classes.length} classes</span>}
      >      
        <Table 
          dataSource={classes}
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
      </Card>
    ) : null;
  };

  return (
    <div className="page-container">
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {Object.entries(classData).map(([filterType, data]) => (
          <Col span={8} key={filterType}>
            <Card>
              <Statistic
                title={data.title}
                value={data.classes.length}
                valueStyle={{ color: data.color }}
                prefix={data.icon}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Render class cards for each filter type */}
      {renderClassCard('full')}
      {renderClassCard('nearfull')}
      {renderClassCard('mostlyempty')}
    </div>
  );
};