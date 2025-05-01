import React, { useState, useEffect } from 'react';
import { 
  Card, 
  List, 
  Typography, 
  Tag, 
  Button, 
  Radio, 
  Empty, 
  Space,
  Tabs
} from 'antd';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType, Notification } from '../../services/notificationService';
import { useNavigate } from 'react-router-dom';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

export const NotificationPage: React.FC = () => {
  const { notifications, markAsRead, refreshNotifications, markMultipleAsRead } = useNotifications();
  const navigate = useNavigate();

  // Filter state
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | NotificationType>('all');
  
  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // Check if user is admin or staff
  const isAdminOrStaff = (): boolean => {
    const rolesString = localStorage.getItem("user_roles");
    if (rolesString) {
      try {
        const roles = JSON.parse(rolesString);
        return roles.includes("admin") || roles.includes("staff");
      } catch (e) {
        console.error("Error parsing user roles:", e);
      }
    }
    return false;
  };

  // Reload notifications when the page loads
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Filter notifications based on selected filters
  const filteredNotifications = notifications.filter((notification) => {
    // Apply read/unread filter - Fixed to use readAt instead of read property
    if (filter === 'unread' && notification.readAt) return false;
    if (filter === 'read' && !notification.readAt) return false;
    
    // Apply type filter
    if (typeFilter !== 'all' && notification.eventType !== typeFilter) return false;
    
    return true;
  });

  // Calculate paginated data
  const startIndex = (pagination.current - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  const paginatedData = filteredNotifications.slice(startIndex, endIndex);

  // Handle registration for class with vacancy
  const handleRegister = (classId: number, notificationId: number) => {
    markAsRead(notificationId);
    navigate(`/courseRegistration/new/${classId}`);
  };

  // Mark notification as read when clicked
  const handleNotificationClick = (id: number) => {
    markAsRead(id);
  };

  // Render different UI for different notification types
  const renderNotificationContent = (notification: Notification) => {
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
                  handleRegister(notification.classId, notification.notificationId);
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
  };

  // Render notifications tab
  const renderNotificationsTab = () => (
    <div>
      <Space style={{ marginBottom: 16 }} size="large">
        <div>
          <Text strong style={{ marginRight: 8 }}>Status:</Text>
          <Radio.Group 
            value={filter} 
            onChange={e => {
              setFilter(e.target.value);
              setPagination({ ...pagination, current: 1 });
            }}
          >
            <Radio.Button value="all">All</Radio.Button>
            <Radio.Button value="unread">Unread</Radio.Button>
            <Radio.Button value="read">Read</Radio.Button>
          </Radio.Group>
        </div>
      </Space>
      
      {paginatedData.length === 0 ? (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description="No notifications found" 
          style={{ margin: '40px 0' }}
        />
      ) : (
        <List
          itemLayout="vertical"
          dataSource={paginatedData}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: filteredNotifications.length,
            onChange: (page) => setPagination({ ...pagination, current: page }),
            showTotal: (total) => `Total ${total} notifications`,
          }}
          renderItem={(item) => (
            <List.Item
              key={item.notificationId}
              onClick={() => handleNotificationClick(item.notificationId)}
              style={{ 
                padding: '16px', 
                cursor: 'pointer',
                backgroundColor: item.readAt ? 'transparent' : 'rgba(24, 144, 255, 0.05)',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              {renderNotificationContent(item)}
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: 8 }}>
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Card 
      title="Notifications" 
      style={{ margin: '24px' }}
      extra={
        <Button type="link" onClick={markMultipleAsRead}>
          Mark All as Read
        </Button>
      }
    >
      {renderNotificationsTab()}
    </Card>
  );
};

export default NotificationPage;