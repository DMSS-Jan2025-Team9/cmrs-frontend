import type { AuthProvider } from "@refinedev/core";

import type { User } from "@/graphql/schema.types";

import { API_URL, dataProvider } from "./data";

import { jwtDecode } from "jwt-decode";
import axios from "axios";

export const authCredentials = {
  username: "", 
  password: "",

};

interface CustomJwtPayload {
  sub: string;
  roles: string[];
  userId: number;
  iat: number;
  exp: number;
}

interface StaffResponse {
  staffId: number;
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  staffFullId: string;
  department: string;
  position: string;
  roles: Array<{
    roleName: string;
  }>;
}

interface StudentResponse {
  studentId: number;
  userId: number;
  username: string;
  email: string;
  name: string;
  studentIdNumber: string;
  studentFullId: string;
  programName: string;
  firstName: string;
  lastName: string;
  roles: Array<{
    roleName: string;
    description: string;
  }>;
}

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    try {
      // Using the JWT API with username and password
      const response = await axios.post("http://localhost:8085/api/auth/login", {
        username,
        password,
      }, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Assuming the response contains accessToken
      localStorage.setItem("access_token", response.data.accessToken);

      // Decode token to get user type and info
      const decodedToken = jwtDecode<CustomJwtPayload>(response.data.accessToken);
      const userId = decodedToken.userId;
      
      // Store user info for quick access
      try {
        let userDetails = null;
        const isAdmin = decodedToken.roles.includes("admin");
        
        // If admin or staff role, fetch staff data
        if (isAdmin || decodedToken.roles.includes("staff")) {
          const staffResponse = await axios.get(`http://localhost:8085/api/staff/${userId}`, {
            headers: {
              "accept": "*/*",
              "Authorization": `Bearer ${response.data.accessToken}`
            }
          });
          userDetails = staffResponse.data;
          localStorage.setItem("user_type", "staff");
          localStorage.setItem("user_roles", JSON.stringify(decodedToken.roles));
        } else {
          // Fetch student data
          const studentResponse = await axios.get(`http://localhost:8085/api/students/secure/${userId}`, {
            headers: {
              "accept": "*/*",
              "Authorization": `Bearer ${response.data.accessToken}`
            }
          });
          userDetails = studentResponse.data;
          localStorage.setItem("user_type", "student");
          localStorage.setItem("user_roles", JSON.stringify(decodedToken.roles));
        }
        
        // Store user details in localStorage for use across the app
        localStorage.setItem("user_details", JSON.stringify(userDetails));
        
        // Determine redirect path based on user role
        let redirectPath = "/";
        if (decodedToken.roles.includes("student")) {
          redirectPath = "/courseRegistration";
        } else if (decodedToken.roles.includes("admin")) {
          redirectPath = "/";
        }
        
        return {
          success: true,
          redirectTo: redirectPath,
        };
      } catch (error) {
        console.error("Error fetching user details:", error);
      }

      return {
        success: true,
        redirectTo: "/",
      };
    } catch (e) {
      const error = e as Error;

      return {
        success: false,
        error: {
          message: "message" in error ? error.message : "Login failed",
          name: "name" in error ? error.name : "Invalid username or password",
        },
      };
    }
  },

  logout: async () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_details");
    localStorage.removeItem("user_type");
    localStorage.removeItem("user_roles");

    return {
      success: true,
      redirectTo: "/login",
    };
  },
  onError: async (error) => {
    if (error.statusCode === "UNAUTHENTICATED") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_details");
      localStorage.removeItem("user_type");
      localStorage.removeItem("user_roles");
      return {
        logout: true,
      };
    }

    return { error };
  },
  check: async () => {
    const accessToken = localStorage.getItem("access_token");
    
    if (!accessToken) {
      return {
        authenticated: false,
        redirectTo: "/login",
      };
    }

    try {
      // Just verify the token format or check expiration if needed
      const decodedToken = jwtDecode<CustomJwtPayload>(accessToken);
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (decodedToken.exp && decodedToken.exp < currentTime) {
        return {
          authenticated: false,
          redirectTo: "/login",
        };
      }
      
      return {
        authenticated: true,
      };
    } catch (error) {
      return {
        authenticated: false,
        redirectTo: "/login",
      };
    }
  },
  getIdentity: async () => {
    const accessToken = localStorage.getItem("access_token");
    const userDetails = localStorage.getItem("user_details");
    const userType = localStorage.getItem("user_type");

    if (!accessToken || !userDetails) {
      return undefined;
    }

    try {
      const decodedToken = jwtDecode<CustomJwtPayload>(accessToken);
      const details = JSON.parse(userDetails);
      
      if (userType === "staff") {
        const staffDetails = details as StaffResponse;
        return {
          id: staffDetails.userId.toString(),
          name: `${staffDetails.firstName} ${staffDetails.lastName}`,
          email: staffDetails.email,
          roles: decodedToken.roles,
          jobTitle: staffDetails.position,
          department: staffDetails.department,
          userType: "staff",
          staffId: staffDetails.staffId,
          staffFullId: staffDetails.staffFullId,
          avatarUrl: "", // You can add a default avatar or generate one based on name
        };
      } else {
        const studentDetails = details as StudentResponse;
        return {
          id: studentDetails.userId.toString(),
          name: `${studentDetails.firstName} ${studentDetails.lastName}`,
          email: studentDetails.email,
          roles: decodedToken.roles,
          jobTitle: studentDetails.programName,
          userType: "student",
          studentId: studentDetails.studentId,
          studentFullId: studentDetails.studentFullId,
          avatarUrl: "", // You can add a default avatar or generate one based on name
        };
      }
    } catch (error) {
      console.error("Error in getIdentity:", error);
      return undefined;
    }
  },
};