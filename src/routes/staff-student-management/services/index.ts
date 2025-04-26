export * from "./staffService";
export * from "./studentService";

// Common utility for API calls
export const apiUtils = {
  getHeaders: (contentType = false) => {
    const accessToken = localStorage.getItem("access_token");
    return {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "*/*",
      ...(contentType ? { "Content-Type": "application/json" } : {})
    };
  }
}; 