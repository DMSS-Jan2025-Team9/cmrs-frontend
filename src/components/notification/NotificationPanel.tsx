import React from 'react';
import { List, Typography, Tag, Button, Empty, Spin } from 'antd';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType, Notification } from '../../services/notificationService';
import { useNavigate } from 'react-router-dom';

const { Text, Title } = Typography;

const NotificationPanel: React.FC = () => {
  const { notifications, markAsRead, isLoading, error } = useNotifications();
  const navigate = useNavigate();

  // Take only the 5 most recent notifications
  const recentNotifications = notifications.slice(0, 5);

  // Handle click on a notification
  const handleNotificationClick = (id: number) => {
    try {
      // Make sure id is a valid number before sending to backend
      if (id && !isNaN(Number(id))) {
        markAsRead(id);
      } else {
        console.error('Invalid notification ID:', id);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Handle registration for class with vacancy
  const handleRegister = (classId: number, notificationId: number) => {
    try {
      // Make sure both IDs are valid numbers
      if (notificationId && !isNaN(Number(notificationId)) && 
          classId && !isNaN(Number(classId))) {
        markAsRead(notificationId);
        navigate(`/courseRegistration/new/${classId}`);
      } else {
        console.error('Invalid IDs - classId:', classId, 'notificationId:', notificationId);
      }
    } catch (err) {
      console.error('Error handling registration:', err);
    }
  };

  // Render different UI for different notification types
  const renderNotificationContent = (notification: Notification) => {
    if (!notification) return <Text>Invalid notification</Text>;
    
    try {
      switch (notification.eventType) {
        case NotificationType.WAITLISTED:
          return (
            <div>
              <Text>
                You have been waitlisted for{' '}
                <Text strong>{notification.courseName}</Text> ({notification.courseCode})
              </Text>
              <Tag color="orange" style={{ marginLeft: 8 }}>Waitlisted</Tag>
            </div>
          );
        case NotificationType.VACANCY_AVAILABLE:
          return (
            <div>
              <Text>
                A vacancy is now available in{' '}
                <Text strong>{notification.courseName}</Text> ({notification.courseCode})
              </Text>
              <div style={{ marginTop: 8 }}>
                <Button 
                  type="primary" 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    // Verify that classId and id exist and are valid
                    if (notification.classId && notification.notificationId) {
                      handleRegister(notification.classId, notification.notificationId);
                    } else {
                      console.error('Missing notification data:', notification);
                    }
                  }}
                >
                  Register Now
                </Button>
              </div>
              <Tag color="green" style={{ marginLeft: 8 }}>Vacancy</Tag>
            </div>
          );
        default:
          return <Text>{notification.notificationMessage || "New notification"}</Text>;
      }
    } catch (err) {
      console.error('Error rendering notification content:', err);
      return <Text>Error displaying notification</Text>;
    }
  };

  if (isLoading) {
    return (
      <div style={{ width: 350, height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin tip="Loading notifications..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width: 350, padding: '20px', textAlign: 'center' }}>
        <Text type="danger">{error.message}</Text>
      </div>
    );
  }

  return (
    <div style={{ width: 350, maxHeight: 400, overflow: 'auto', padding: '12px 0' }}>
      <Title level={5} style={{ margin: '0 16px 8px' }}>Notifications</Title>
      
      {recentNotifications.length === 0 ? (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description="No notifications" 
          style={{ margin: '20px 0' }}
        />
      ) : (
        <List
          itemLayout="vertical"
          dataSource={recentNotifications}
          renderItem={(item) => (
            <List.Item
              key={item.notificationId}
              onClick={() => {
                // Check if id exists before passing to handler
                if (item && item.notificationId) {
                  handleNotificationClick(item.notificationId);
                }
              }}
              style={{ 
                padding: '8px 16px', 
                cursor: 'pointer',
                backgroundColor: item.readAt ? 'white' : 'rgba(24, 144, 255, 0.05)',
                transition: 'background-color 0.3s'
              }}
            >
              {renderNotificationContent(item)}
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: 4 }}>
                {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown date'}
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default NotificationPanel;