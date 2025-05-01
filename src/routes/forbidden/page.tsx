import React from "react";
import { Result } from "antd";

export const ForbiddenPage: React.FC = () => {

  return (
    <Result
      status="403"
      title="403"
      subTitle="Sorry, you don't have access to this page."
    />
  );
};

export default ForbiddenPage; 