import axios from "axios";
import { Student, StudentUpdateRequest, ApiResponse } from "../models";
import { logError, logInfo } from "@/utilities/logger";

const API_URL = "http://localhost:8085/api";

// Helper to get authentication headers
const getAuthHeaders = (contentType = false) => {
  const accessToken = localStorage.getItem("access_token");
  return {
    "Authorization": `Bearer ${accessToken}`,
    "Accept": "*/*",
    ...(contentType ? { "Content-Type": "application/json" } : {})
  };
};

export const studentService = {
  /**
   * Get all students
   */
  getAllStudents: async (): Promise<Student[]> => {
    try {
      logInfo("Fetching all students");
      
      // Try the admin endpoint first
      try {
        const response = await axios.get(`${API_URL}/students/admin/all`, {
          headers: getAuthHeaders()
        });
        
        logInfo("Students response format:", response.data);
        
        // Ensure we're handling the response properly and returning an array
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }
      } catch (adminError) {
        console.warn("Admin endpoint failed, trying alternative:", adminError);
        
        // Try the regular endpoint as a fallback
        const fallbackResponse = await axios.get(`${API_URL}/students/all`, {
          headers: getAuthHeaders()
        });
        
        if (Array.isArray(fallbackResponse.data)) {
          return fallbackResponse.data;
        } else if (fallbackResponse.data && Array.isArray(fallbackResponse.data.data)) {
          return fallbackResponse.data.data;
        }
      }
      
      return [];
    } catch (error) {
      logError("Error fetching all students:", error);
      return [];
    }
  },

  /**
   * Get student by userId
   */
  getStudentById: async (userId: number): Promise<Student | null> => {
    try {
      logInfo(`Fetching student with userId: ${userId}`);
      
      const response = await axios.get(`${API_URL}/students/secure/${userId}`, {
        headers: getAuthHeaders()
      });
      
      logInfo("Student by ID response:", response.data);
      
      // Check if roles is missing or not an array, and set a default
      if (response.data) {
        const studentData = response.data;
        if (!studentData.roles) {
          logInfo("Roles missing, setting empty array");
          studentData.roles = [];
        } else if (!Array.isArray(studentData.roles)) {
          logInfo("Roles not an array, converting to array:", studentData.roles);
          studentData.roles = [studentData.roles];
        }
        
        // Add fallback for name if not present
        if ((!studentData.name || studentData.name === "") && studentData.firstName && studentData.lastName) {
          studentData.name = `${studentData.firstName} ${studentData.lastName}`;
        }
        
        logInfo("Processed student data:", studentData);
        return studentData;
      }
      
      logInfo("No data returned for student with ID:", userId);
      return null;
    } catch (error: any) {
      logError(`Error fetching student with ID ${userId}:`, error);
      logError("Error details:", error.response?.data || error.message);
      
      // Try alternative endpoint if secure endpoint fails
      try {
        logInfo(`Trying alternative endpoint for student with userId: ${userId}`);
        const altResponse = await axios.get(`${API_URL}/students/${userId}`, {
          headers: getAuthHeaders()
        });
        
        if (altResponse.data) {
          logInfo("Alternative endpoint success:", altResponse.data);
          const studentData = altResponse.data;
          if (!studentData.roles) {
            studentData.roles = [];
          } else if (!Array.isArray(studentData.roles)) {
            studentData.roles = [studentData.roles];
          }
          return studentData;
        }
      } catch (altError) {
        logError("Alternative endpoint also failed:", altError);
      }
      
      return null; // Return null instead of throwing to prevent component crashes
    }
  },

  /**
   * Update student information
   */
  updateStudent: async (userId: number, studentData: StudentUpdateRequest): Promise<ApiResponse<any>> => {
    // Format roles correctly if needed
    const formattedData = { ...studentData };
    if (Array.isArray(formattedData.roles) && formattedData.roles.length > 0 && typeof formattedData.roles[0] === 'object') {
      formattedData.roles = (formattedData.roles as any[]).map(role => role.roleName || role);
    }
    
    try {
      logInfo(`Updating student with userId: ${userId}`, formattedData);
      
      const response = await axios.put(
        `${API_URL}/students/update/${userId}`,
        formattedData,
        {
          headers: getAuthHeaders(true)
        }
      );
      
      logInfo("Update student response:", response);
      
      if (response.data && typeof response.data === 'object') {
        return {
          success: response.status === 200,
          message: response.data.message || "Student updated successfully",
          data: response.data
        };
      }
      
      return {
        success: true,
        message: "Student updated successfully",
        data: response.data
      };
    } catch (error) {
      logError(`Error updating student with ID ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Delete student
   */
  deleteStudent: async (userId: number): Promise<ApiResponse<any>> => {
    try {
      logInfo(`Deleting student with userId: ${userId}`);
      
      const response = await axios.delete(
        `${API_URL}/students/${userId}`,
        {
          headers: getAuthHeaders()
        }
      );
      
      logInfo("Delete student response:", response);
      
      return {
        success: true,
        message: "Student deleted successfully",
        data: response.data
      };
    } catch (error) {
      logError(`Error deleting student with ID ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Create student
   */
  createStudent: async (studentData: any): Promise<ApiResponse<any>> => {
    try {
      logInfo("Creating new student:", studentData);
      
      const response = await axios.post(
        `${API_URL}/auth/register/student`,
        studentData,
        {
          headers: getAuthHeaders(true)
        }
      );
      
      logInfo("Create student response:", response);
      
      return {
        success: response.status >= 200 && response.status < 300,
        message: "Student created successfully",
        data: response.data
      };
    } catch (error) {
      logError("Error creating student:", error);
      throw error;
    }
  }
}; 