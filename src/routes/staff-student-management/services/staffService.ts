import axios from "axios";
import { Staff, StaffUpdateRequest, ApiResponse } from "../models";
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

export const staffService = {
  /**
   * Get all staff members
   */
  getAllStaff: async (): Promise<Staff[]> => {
    try {
      const response = await axios.get(`${API_URL}/staff/all`, {
        headers: getAuthHeaders()
      });
      
      // Ensure we're handling the response properly and returning an array
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      logInfo("Staff response format:", response.data);
      return [];
    } catch (error) {
      logError("Error fetching all staff:", error);
      return [];
    }
  },

  /**
   * Get staff by userId
   */
  getStaffById: async (userId: number): Promise<Staff | null> => {
    try {
      // Log the request to debug
      logInfo(`Fetching staff with userId: ${userId}`);
      
      const response = await axios.get(`${API_URL}/staff/${userId}`, {
        headers: getAuthHeaders()
      });
      
      logInfo("Staff by ID response:", response.data);
      
      // Check if roles is missing or not an array, and set a default
      if (response.data) {
        const staffData = response.data;
        if (!staffData.roles) {
          logInfo("Roles missing, setting empty array");
          staffData.roles = [];
        } else if (!Array.isArray(staffData.roles)) {
          logInfo("Roles not an array, converting to array:", staffData.roles);
          staffData.roles = [staffData.roles];
        }
        
        // Add fallback for name if not present
        if (!staffData.name && staffData.firstName && staffData.lastName) {
          staffData.name = `${staffData.firstName} ${staffData.lastName}`;
        }
        
        logInfo("Processed staff data:", staffData);
        return staffData;
      }
      
      logInfo("No data returned for staff with ID:", userId);
      return null;
    } catch (error: any) {
      logError(`Error fetching staff with ID ${userId}:`, error);
      logError("Error details:", error.response?.data || error.message);
      return null; // Return null instead of throwing to prevent component crashes
    }
  },

  /**
   * Update staff information
   */
  updateStaff: async (userId: number, staffData: StaffUpdateRequest): Promise<ApiResponse<any>> => {
    // Format roles correctly if needed
    const formattedData = { ...staffData };
    if (Array.isArray(formattedData.roles) && formattedData.roles.length > 0 && typeof formattedData.roles[0] === 'object') {
      formattedData.roles = (formattedData.roles as any[]).map(role => role.roleName || role);
    }
    
    try {
      logInfo(`Updating staff with userId: ${userId}`, formattedData);
      
      const response = await axios.put(
        `${API_URL}/staff/update/${userId}`,
        formattedData,
        {
          headers: getAuthHeaders(true)
        }
      );
      
      logInfo("Update staff response:", response);
      
      if (response.data && typeof response.data === 'object') {
        return {
          success: response.status === 200,
          message: response.data.message || "Staff updated successfully",
          data: response.data
        };
      }
      
      return {
        success: true,
        message: "Staff updated successfully",
        data: response.data
      };
    } catch (error) {
      logError(`Error updating staff with ID ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Delete staff
   */
  deleteStaff: async (userId: number): Promise<ApiResponse<any>> => {
    try {
      logInfo(`Deleting staff with userId: ${userId}`);
      
      const response = await axios.delete(
        `${API_URL}/staff/${userId}`,
        {
          headers: getAuthHeaders()
        }
      );
      
      logInfo("Delete staff response:", response);
      
      return {
        success: true,
        message: "Staff deleted successfully",
        data: response.data
      };
    } catch (error) {
      logError(`Error deleting staff with ID ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Create staff
   */
  createStaff: async (staffData: any): Promise<ApiResponse<any>> => {
    try {
      logInfo("Creating new staff:", staffData);
      
      const response = await axios.post(
        `${API_URL}/auth/register/staff`,
        staffData,
        {
          headers: getAuthHeaders(true)
        }
      );
      
      logInfo("Create staff response:", response);
      
      return {
        success: response.status >= 200 && response.status < 300,
        message: "Staff created successfully",
        data: response.data
      };
    } catch (error) {
      logError("Error creating staff:", error);
      throw error;
    }
  }
}; 