import React, { createContext, useState, useEffect, useContext, ReactNode, useRef, useCallback } from 'react';
import { Client, Frame } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';
import { notification } from 'antd';
import { notificationService, Notification } from '../services/notificationService';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  markAsRead: (notificationId: number) => Promise<void>;
  markMultipleAsRead: () => Promise<void>;
  refreshNotifications: () => void;
}

const API_URL = 'https://app.cmrsapp.site/notification'; // Notification service URL
const WS_URL = `${API_URL}/ws-notifications`;

// Minimum time between API calls in milliseconds
const FETCH_THROTTLE_TIME = 30000; // 30 seconds 

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const stompClientRef = useRef<Client | null>(null);
  const connectedRef = useRef<boolean>(false);
  const lastFetchTimeRef = useRef<number>(0);
  const fetchInProgressRef = useRef<boolean>(false);
  
  // Calculate unread notifications whenever notifications change
  useEffect(() => {
    const count = notifications.filter(n => !n.readAt).length;
    setUnreadCount(count);
  }, [notifications]);

  // Throttled fetch function to prevent repeated API calls
  const fetchNotifications = useCallback(async (userIdentifier: string) => {
    // If a fetch is already in progress, skip
    if (fetchInProgressRef.current) {
      console.log("Fetch already in progress, skipping");
      return;
    }
    
    // Check if we've fetched recently
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    if (timeSinceLastFetch < FETCH_THROTTLE_TIME && lastFetchTimeRef.current !== 0) {
      console.log(`Throttling fetch - last fetch was ${timeSinceLastFetch}ms ago`);
      return;
    }
    
    fetchInProgressRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching notifications for user: ${userIdentifier}`);
      let response;
      
      // Determine if it's a student or staff/admin
      if (userIdentifier.match(/^[A-Za-z]/)) {  // Student IDs typically start with letters
        response = await axios.get(`${API_URL}/api/notifications/student/${userIdentifier}`);
      } else {
        response = await axios.get(`${API_URL}/api/notifications/user/${userIdentifier}`);
      }
      
      // Update last fetch time
      lastFetchTimeRef.current = now;
      
      setNotifications(response.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
    } finally {
      setIsLoading(false);
      fetchInProgressRef.current = false;
    }
  }, []);

  // Connect to WebSocket and set up notifications
  const setupNotifications = useCallback((userIdentifier: string) => {
    // Load existing notifications
    fetchNotifications(userIdentifier);
    
    // Only create a new connection if one doesn't already exist
    if (connectedRef.current || (stompClientRef.current && stompClientRef.current.active)) {
      console.log("WebSocket connection already exists, skipping new connection");
      return;
    }

    // Setup STOMP client
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      debug: (str: string) => {
        // Disable verbose logging
        if (process.env.NODE_ENV !== 'production') {
          console.log(str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('Connected to notification WebSocket');
      connectedRef.current = true;
      
      // Subscribe to user-specific topic
      client.subscribe(`/topic/user/${userIdentifier}`, (message) => {
        try {
          const newNotification: Notification = JSON.parse(message.body);
          console.log('Received notification:', newNotification);
          
          // Check if this notification already exists (prevent duplicates)
          if (newNotification.notificationId) {
            const exists = notifications.some(
              n => n.notificationId === newNotification.notificationId
            );
            
            if (exists) {
              console.log('Notification already exists, skipping duplicate:', newNotification.notificationId);
              return;
            }
          }
          
          // Add notification to state
          setNotifications(prev => [newNotification, ...prev]);

          // Show notification toast
          notification.info({
            message: `New notification`,
            description: newNotification.notificationMessage,
            placement: 'topRight',
            duration: 5,
          });
        } catch (err) {
          console.error("Error processing received notification:", err);
        }
      });
    };

    client.onStompError = (frame: Frame) => {
      console.error('STOMP error:', frame.headers, frame.body);
      setError(new Error(`WebSocket connection error: ${frame.body}`));
      connectedRef.current = false;
    };

    client.onDisconnect = () => {
      console.log('Disconnected from notification WebSocket');
      connectedRef.current = false;
    };

    client.activate();
    stompClientRef.current = client;
  }, [fetchNotifications, notifications]);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    // Get user info from localStorage
    const userDetails = localStorage.getItem("user_details");
    if (!userDetails) return;

    let userIdentifier: string | null = null;
    try {
      const user = JSON.parse(userDetails);
      userIdentifier = user.studentFullId || user.userId?.toString();
      
      if (!userIdentifier) {
        console.log("No user identifier found, skipping notification setup");
        return;
      }
    } catch (err) {
      console.error("Error parsing user details:", err);
      return;
    }
    
    // Set up notifications
    setupNotifications(userIdentifier);

    // Cleanup on unmount
    return () => {
      if (stompClientRef.current && stompClientRef.current.active) {
        stompClientRef.current.deactivate();
        connectedRef.current = false;
      }
    };
  }, [setupNotifications]);

  const markAsRead = async (notificationId: number): Promise<void> => {
    if (!notificationId || isNaN(Number(notificationId))) {
      console.error("Invalid notification ID:", notificationId);
      return;
    }

    try {
      // Call the new API endpoint
      const response = await axios.put(`${API_URL}/api/notifications/${notificationId}/read`);
      
      if (response.data) {
        // Update the notification in our state
        setNotifications(prev => 
          prev.map(notification => 
            notification.notificationId === notificationId 
              ? { ...notification, readAt: response.data.readAt } 
              : notification
          )
        );
        console.log(`Notification ${notificationId} marked as read`);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err instanceof Error ? err : new Error('Failed to mark notification as read'));
    }
  };

  const markMultipleAsRead = async (): Promise<void> => {
    // Get all unread notification IDs
    const unreadIds = notifications
      .filter(notification => !notification.readAt)
      .map(notification => notification.notificationId);
    
    if (unreadIds.length === 0) {
      console.log("No unread notifications to mark");
      return;
    }
    
    try {
      // Call the new batch API endpoint
      const response = await axios.put(`${API_URL}/api/notifications/read`, unreadIds);
      
      if (response.data) {
        // Create a map of updated notifications for easy lookup
        const updatedMap = new Map<number, Notification>(
          response.data.map((notification: Notification) => [notification.notificationId, notification])
        );
        
        // Update our state
        setNotifications(prev => 
          prev.map(notification => {
            const updated = updatedMap.get(notification.notificationId);
            return updated ? updated : notification;
          }) as Notification[]
        );
        console.log(`${response.data.length} notifications marked as read`);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError(err instanceof Error ? err : new Error('Failed to mark all notifications as read'));
    }
  };

  const refreshNotifications = () => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    // Only allow refresh if it's been a while since the last fetch
    if (timeSinceLastFetch < 5000 && lastFetchTimeRef.current !== 0) {
      console.log("Ignoring rapid refresh request");
      return;
    }
    
    const userDetails = localStorage.getItem("user_details");
    if (!userDetails) return;

    try {
      const user = JSON.parse(userDetails);
      const userIdentifier = user.studentFullId || user.userId?.toString();
      
      if (userIdentifier) {
        fetchNotifications(userIdentifier);
      }
    } catch (err) {
      console.error("Error parsing user details during refresh:", err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        error,
        markAsRead,
        markMultipleAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;