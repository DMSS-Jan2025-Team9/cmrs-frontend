import React from "react";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Get the previous page URL from sessionStorage
  const previousPage = sessionStorage.getItem("previousPage") || "/";
  
  const handleGoBack = () => {
    navigate(previousPage);
  };

  return (
    <Result
      status="403"
      title="403"
      subTitle="Sorry, you don't have access to this page."
    //   extra={
    //     <Button type="primary" onClick={handleGoBack}>
    //       Go Back
    //     </Button>
    //   }
    />
  );
};

export default ForbiddenPage; 