// Import polyfill first
import '../utilities/polyfills';

import SockJS from 'sockjs-client';
import { Client, over } from 'stompjs';
import { notification } from "antd";
import axios from 'axios';

// Types
export enum NotificationType {
  WAITLISTED = "WAITLISTED",
  VACANCY_AVAILABLE = "VACANCY_AVAILABLE"
}

export interface Notification {
  notificationId: number;
  studentFullId: string;
  userId?: number;
  studentId?: number;
  classId: number;
  courseCode: string;
  courseName: string;
  eventType: NotificationType;
  createdAt: string;
  read: boolean;
  content?: string;
  sentAt?: string;
  readAt?: string;
  notificationMessage?: string; // Added for compatibility with backend format
}

// WebSocket client
let stompClient: Client | null = null;
let isConnecting: boolean = false;
let isConnected: boolean = false;
let lastFetchTime: number = 0;
const FETCH_THROTTLE_TIME = 30000; // 30 seconds

// Get base URL based on environment
const getBaseUrl = (): string => {
  // In production, use the absolute URL
  if (process.env.NODE_ENV === 'production') {
    return 'https://alb-cmrs-app-790797307.ap-southeast-1.elb.amazonaws.com/notification';
  }
  // In development, use relative URLs for proxying
  return 'https://alb-cmrs-app-790797307.ap-southeast-1.elb.amazonaws.com/notification';
};

// Utility function to handle API errors
const handleApiError = (error: any, action: string): void => {
  console.error(`Error ${action}:`, error);
  
  // Check if it's a network error (API not available)
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    notification.error({
      message: 'Network Error',
      description: `Cannot connect to notification service. ${action} failed.`,
      duration: 5,
    });
  } else {
    notification.error({
      message: 'Error',
      description: `Failed to ${action.toLowerCase()}.`,
      duration: 5,
    });
  }
};

// Notification service
export const notificationService = {
  // Callbacks
  onNotificationReceived: (notification: Notification) => {},
  
  // Connect to WebSocket
  connect: (studentFullId: string, callback: (notification: Notification) => void) => {
    notificationService.onNotificationReceived = callback;
    
    // Prevent duplicate connections
    if (isConnecting) {
      console.log("Already attempting to connect, skipping duplicate request");
      return;
    }
    
    if (stompClient && stompClient.connected && isConnected) {
      console.log("WebSocket already connected, skipping connection attempt");
      return; // Already connected
    }

    try {
      isConnecting = true;
      console.log("Initiating WebSocket connection...");
      
      // Use relative path in development for proxy, absolute in production
      const socketUrl = `${getBaseUrl()}/ws-notifications`;
      console.log(`Connecting to WebSocket at: ${socketUrl}`);
      
      // Disconnect any existing connection before creating a new one
      if (stompClient && stompClient.connected) {
        console.log("Disconnecting existing connection before creating a new one");
        stompClient.disconnect(() => {
          console.log("Existing connection disconnected");
        });
        stompClient = null;
      }
      
      const socket = new SockJS(socketUrl);
      stompClient = over(socket);
      
      // Disable logging in production
      if (process.env.NODE_ENV === 'production') {
        stompClient.debug = () => {}; // Disable debug messages
      }
      
      stompClient.connect({}, () => {
        if (stompClient) {
          isConnected = true;
          isConnecting = false;
          console.log(`WebSocket connected for user ${studentFullId}`);
          
          // Subscribe to user-specific topic
          stompClient.subscribe(`/topic/user/${studentFullId}`, (message) => {
            try {
              let receivedNotification = JSON.parse(message.body) as Notification;
              
              // Make sure notification has all required fields
              if (receivedNotification) {
                // Generate a random ID if it doesn't exist
                if (!receivedNotification.notificationId) {
                  receivedNotification.notificationId = Date.now();
                  console.warn("Generated temporary ID for notification:", receivedNotification.notificationId);
                }
                
                // Set read status
                receivedNotification.read = false;
                
                notificationService.onNotificationReceived(receivedNotification);
                
                // Show notification toast
                notification.info({
                  message: `New notification: ${receivedNotification.eventType || 'New'}`,
                  description: notificationService.getNotificationContent(receivedNotification),
                  placement: 'topRight',
                  duration: 5,
                });
              }
            } catch (e) {
              console.error("Error parsing notification:", e);
            }
          });
        }
      }, (error) => {
        console.error("WebSocket Connection Error:", error);
        isConnecting = false;
        isConnected = false;
        // Don't show error notification on initial connection failure to avoid annoying users
      });
    } catch (error) {
      console.error("Error setting up WebSocket connection:", error);
      isConnecting = false;
      isConnected = false;
    }
  },
  
  // Disconnect from WebSocket
  disconnect: () => {
    if (stompClient && stompClient.connected) {
      stompClient.disconnect(() => {
        console.log("WebSocket Disconnected");
        isConnected = false;
      });
    }
  },
  
  // Get all notifications for a student
  getNotifications: async (studentFullId: string): Promise<Notification[]> => {
    // Throttle API calls
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;
    
    if (timeSinceLastFetch < FETCH_THROTTLE_TIME && lastFetchTime !== 0) {
      console.log(`Throttling getNotifications - last fetch was ${timeSinceLastFetch}ms ago`);
      // Return empty array to prevent UI issues
      return [];
    }
    
    try {
      const apiUrl = `${getBaseUrl()}/api/notifications/student/${studentFullId}`;
      console.log(`Fetching notifications from: ${apiUrl}`);
      
      const response = await axios.get(apiUrl);
      // Update last fetch time
      lastFetchTime = now;
      
      if (!response.data) {
        throw new Error(`Error fetching notifications: No data returned`);
      }
      
      // Process each notification to ensure it has proper properties
      const notifications = response.data.map((notification: any, index: number) => {
        // If notification ID is missing, generate one using timestamp + index
        const notificationId = notification.notificationId || notification.id || (Date.now() + index);
        
        return {
          ...notification,
          notificationId, // Ensure ID exists
          read: false, // Assume all are unread initially
          eventType: notification.eventType || 'UNKNOWN' 
        };
      });
      
      return notifications;
    } catch (error) {
      handleApiError(error, "Fetching notifications");
      return [];
    }
  },
  
  // Mark notification as read
  markAsRead: async (notificationId: number): Promise<boolean> => {
    if (!notificationId || isNaN(Number(notificationId))) {
      console.error("Invalid notification ID:", notificationId);
      return false;
    }
    
    try {
      const apiUrl = `${getBaseUrl()}/api/notifications/${notificationId}/mark-as-sent`;
      console.log(`Marking notification as read: ${apiUrl}`);
      
      const response = await axios.put(apiUrl);
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      handleApiError(error, "Marking notification as read");
      return false;
    }
  },
  
  // Get notification content based on type
  getNotificationContent: (notification: Notification): string => {
    // If we have notificationMessage or content, use that first
    if (notification.notificationMessage) {
      return notification.notificationMessage;
    }
    
    if (notification.content) {
      return notification.content;
    }
    
    // Otherwise, generate based on type
    switch (notification.eventType) {
      case NotificationType.WAITLISTED:
        return `You have been waitlisted for ${notification.courseName || 'a course'} (${notification.courseCode || ''})`;
      case NotificationType.VACANCY_AVAILABLE:
        return `A vacancy is now available in ${notification.courseName || 'a course'} (${notification.courseCode || ''}). Register now!`;
      default:
        return `New notification for ${notification.courseName || 'a course'}`;
    }
  },
  
  // Send test notification (for development)
  sendTestNotification: async (
    studentFullId: string,
    studentId: number,
    classId: number,
    courseCode: string,
    courseName: string,
    eventType: NotificationType
  ): Promise<boolean> => {
    // Validate parameters
    if (!studentFullId || !studentId || !classId || !courseCode || !courseName || !eventType) {
      console.error("Missing required parameters for test notification:", { 
        studentFullId, studentId, classId, courseCode, courseName, eventType 
      });
      return false;
    }
    
    try {
      const apiUrl = `${getBaseUrl()}/api/notifications/notificationEvent`;
      console.log(`Sending test notification to: ${apiUrl}`);
      
      // Try to send using POST with JSON body first
      try {
        const response = await axios.post(apiUrl, {
          studentFullId,
          studentId,
          classId,
          courseCode,
          courseName,
          eventType
        }, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.status >= 200 && response.status < 300) {
          return true;
        }
      } catch (err) {
        console.log("Failed to send with JSON body, trying URL parameters");
      }
      
      // Fallback to URL parameters if JSON fails
      const url = new URL(apiUrl);
      url.searchParams.append('studentFullId', studentFullId);
      url.searchParams.append('studentId', studentId.toString());
      url.searchParams.append('classId', classId.toString());
      url.searchParams.append('courseCode', courseCode);
      url.searchParams.append('courseName', courseName);
      url.searchParams.append('eventType', eventType);
      
      const response = await axios.post(url.toString(), null, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });
      
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      handleApiError(error, "Sending test notification");
      return false;
    }
  }
}; 