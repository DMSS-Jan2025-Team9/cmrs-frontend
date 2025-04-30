import React, { useState } from "react";
import { Card, Tabs, Button } from "antd";
import { UserAddOutlined } from "@ant-design/icons";
import { useGo } from "@refinedev/core";
import { StaffList } from "./StaffList";
import { StudentList } from "./StudentList";

const { TabPane } = Tabs;

export const UserListPage = ({ children }: React.PropsWithChildren) => {
  const go = useGo();
  const [activeTab, setActiveTab] = useState<string>("staff");
  const [searchValue, setSearchValue] = useState<string>("");

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSearchValue(""); // Reset search when changing tabs
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handleCreateUser = () => {
    go({
      to: {
        resource: "staffStudentManagement",
        action: "create",
      },
    });
  };
  
  const handleMassEnrollStudents = () => {
    go({
      to: "/batchjob/upload",
    });
  };
  
  return (
    <Card
      title="User Management"
      extra={
        <>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={handleCreateUser}
            style={{ marginRight: 8 }}
          >
            Create User
          </Button>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={handleMassEnrollStudents}
          >
            Mass Enroll Students
          </Button>
        </>
      }
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={handleTabChange}
        type="card"
      >
        <TabPane tab="Staff" key="staff">
          <StaffList searchValue={searchValue} onSearch={handleSearch} />
        </TabPane>
        <TabPane tab="Students" key="student">
          <StudentList searchValue={searchValue} onSearch={handleSearch} />
        </TabPane>
      </Tabs>
      {children}
    </Card>
  );
}; 