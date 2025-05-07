import React from "react";

import { ThemedLayoutV2, ThemedTitleV2 } from "@refinedev/antd";

// import { GitHubBanner } from "./gh-banner";
import { Header } from "./header";

import "./styles.css"; // Import the custom styles

export const Layout = ({ children }: React.PropsWithChildren) => {
  return (
    <>
      {/* <GitHubBanner /> */}
      <ThemedLayoutV2
        Header={Header}
        Title={(titleProps) => {
          return <ThemedTitleV2 {...titleProps} text="CMRS" />;
        }}
      >
        {children}
      </ThemedLayoutV2>
    </>
  );
};
