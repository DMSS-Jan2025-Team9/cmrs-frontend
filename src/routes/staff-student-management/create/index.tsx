import React, { useState } from "react";
import { 
  Card, 
  Button, 
  Radio, 
  Typography, 
  Space
} from "antd";
import { UserOutlined, IdcardOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useGo } from "@refinedev/core";
import { StaffCreateForm } from "./staff-create";
import { StudentCreateForm } from "./student-create";

type UserType = "staff" | "student" | null;

export const UserCreatePage = ({ children }: React.PropsWithChildren) => {
  const go = useGo();
  const [userType, setUserType] = useState<UserType>(null);
  
  const { Title } = Typography;

  // Handle user type selection
  const handleUserTypeChange = (type: UserType) => {
    setUserType(type);
  };

  // Navigate back to user management list page
  const handleBack = () => {
    go({
      to: "/staffStudentManagement",
    });
  };

  // Render initial user type selection
  const renderUserTypeSelection = () => {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Title level={4}>Select User Type</Title>
        <p>Choose the type of user you want to create</p>

        <Space size="large" style={{ marginTop: 20 }}>
          <Button 
            type="primary" 
            size="large" 
            icon={<IdcardOutlined />}
            onClick={() => handleUserTypeChange("staff")}
            style={{ minWidth: 200, height: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
          >
            <div>Staff</div>
            <div style={{ fontSize: '12px', marginTop: '8px' }}>Create a staff user</div>
          </Button>
          
          <Button 
            type="primary" 
            size="large" 
            icon={<UserOutlined />}
            onClick={() => handleUserTypeChange("student")}
            style={{ minWidth: 200, height: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
          >
            <div>Student</div>
            <div style={{ fontSize: '12px', marginTop: '8px' }}>Create a student user</div>
          </Button>
        </Space>
      </div>
    );
  };

  return (
    <div className="page-container">
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              type="text" 
              onClick={handleBack}
              style={{ marginRight: '10px' }}
            />
            <Title level={4} style={{ margin: 0 }}>
              {userType ? `Create New ${userType === "staff" ? "Staff" : "Student"}` : "Create New User"}
            </Title>
          </div>
        }
        extra={
          userType && (
            <Radio.Group 
              value={userType} 
              onChange={(e) => handleUserTypeChange(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="staff">Staff</Radio.Button>
              <Radio.Button value="student">Student</Radio.Button>
            </Radio.Group>
          )
        }
      >
        {!userType && renderUserTypeSelection()}
        
        {userType === "staff" && <StaffCreateForm onBack={handleBack} />}
        
        {userType === "student" && <StudentCreateForm onBack={handleBack} />}
      </Card>

      {children}
    </div>
  );
}; 