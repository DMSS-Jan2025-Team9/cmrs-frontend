import React, { useState, useEffect } from 'react';
import { Badge, Button, Dropdown, Tooltip } from 'antd';
import { BellOutlined, LinkOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationPanel } from '../notification';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className }) => {
  const { unreadCount, isLoading } = useNotifications();
  const [open, setOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting'>('connecting');
  const navigate = useNavigate();

  // Stabilize connection status to avoid UI flickering
  useEffect(() => {
    if (!isLoading) {
      // Add a short delay to avoid rapid changes
      const timer = setTimeout(() => {
        setConnectionStatus('connected');
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Change to connecting only if we've been loading for a while
      const timer = setTimeout(() => {
        setConnectionStatus('connecting');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleOpenChange = (flag: boolean) => {
    setOpen(flag);
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate('/notifications');
  };

  // Connection status indicator with stable display
  const ConnectionStatus = () => {
    if (connectionStatus === 'connected') {
      return (
        <Tooltip title="Connected to notification service">
          <LinkOutlined style={{ color: '#52c41a', marginRight: 8 }} />
        </Tooltip>
      );
    }
    return (
      <Tooltip title="Connecting to notification service">
        <DisconnectOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
      </Tooltip>
    );
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <ConnectionStatus />
      <Dropdown
        open={open}
        onOpenChange={handleOpenChange}
        dropdownRender={() => (
          <div>
            <NotificationPanel />
            <div style={{ padding: '8px 16px', textAlign: 'center', background:'white', borderTop: '1px solid #f0f0f0' }}>
              <Button type="link" onClick={handleViewAll}>
                View All Notifications
              </Button>
            </div>
          </div>
        )}
        placement="bottomRight"
        arrow
      >
        <Badge 
          count={unreadCount} 
          overflowCount={99}
        >
          <Button 
            type="text" 
            icon={<BellOutlined style={{ fontSize: '18px' }} />} 
            className={className}
            style={{ padding: '4px 8px' }}
          />
        </Badge>
      </Dropdown>
    </div>
  );
};

export default NotificationBell; 