import React, { useState, useEffect } from "react";
import { Card, Alert, Spin } from "antd";
import { useParams } from "react-router-dom";
import { StaffView } from "./StaffView";
import { StudentView } from "./StudentView";

export const UserViewPage = ({ children }: React.PropsWithChildren) => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Add a brief loading state for better UX
  useEffect(() => {
    // Set a very brief loading time to allow component mounting
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  if (!id || !type) {
    console.error("Missing parameters:", { type, id });
    return (
      <Card>
        <Alert
          message="Error"
          description="Missing user ID or type parameter"
          type="error"
          showIcon
        />
      </Card>
    );
  }

  const userIdNumber = parseInt(id, 10);

  if (isNaN(userIdNumber)) {
    return (
      <Card>
        <Alert
          message="Error"
          description="Invalid user ID"
          type="error"
          showIcon
        />
      </Card>
    );
  }

  return (
    <>
      {type === "staff" ? (
        <StaffView userId={userIdNumber} />
      ) : type === "student" ? (
        <StudentView userId={userIdNumber} />
      ) : (
        <Card>
          <Alert
            message="Error"
            description={`Unknown user type: ${type}`}
            type="error"
            showIcon
          />
        </Card>
      )}
      {children}
    </>
  );
}; 