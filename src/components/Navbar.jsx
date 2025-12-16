import React, { useState } from 'react';
import { Menu, Button, Dropdown, Avatar, Typography, Divider } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  UserOutlined, 
  LogoutOutlined,
  LineChartOutlined,
  BarChartOutlined,
  AppstoreAddOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
  DashboardOutlined,
  ToolOutlined,
  SmileOutlined
} from '@ant-design/icons';
import { authService } from '../services/authService';
import './Navbar.css';

const { Text } = Typography;

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [current, setCurrent] = useState(location.pathname);
  const user = authService.getCurrentUser();

  // Function to get user initials or emoji
  const getAvatarContent = () => {
    if (user?.username) {
      const names = user.username.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return user.username[0].toUpperCase();
    }
    return '👤';
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/energymonitoring');
  };

  // Define profileMenu
  const profileMenu = (
    <Menu className="profile-dropdown">
      <div className="profile-header">
        <Avatar 
          size={64} 
          className="profile-avatar"
        >
          {getAvatarContent()}
        </Avatar>
        <div className="profile-info">
          <Text strong style={{ fontSize: '16px' }}>{user?.username || 'User'}</Text>
          <Text type="secondary">
            <SmileOutlined style={{ marginRight: '4px' }} />
            {user?.role || 'User Role'}
          </Text>
        </div>
      </div>
      <Divider style={{ margin: '10px 0' }} />
      <Menu.Item 
        key="logout" 
        icon={<LogoutOutlined />} 
        onClick={handleLogout}
        className="logout-item"
      >
        Logout
      </Menu.Item>
    </Menu>
  );

  // Check if we're in machine-related routes
  const isMachineRoute = location.pathname.includes('/energymonitoring/machine/') || 
                        location.pathname.includes('/energymonitoring/real-time-graph') ||
                        location.pathname.includes('/energymonitoring/detailed-graph') ||
                        location.pathname.includes('/energymonitoring/production');

  const getMenuItems = () => {
    if (isMachineRoute) {
      return [
        {
          key: '/energymonitoring/real-time-graph',
          icon: <LineChartOutlined />,
          label: <Link to="/energymonitoring/real-time-graph">Real Time Graph</Link>
        },
        {
          key: '/energymonitoring/detailed-graph',
          icon: <BarChartOutlined />,
          label: <Link to="/energymonitoring/detailed-graph">Detail Graph</Link>
        },
        {
          key: '/energymonitoring/production',
          icon: <AppstoreAddOutlined />,
          label: <Link to="/energymonitoring/production">Production</Link>
        },
        {
          key: 'back',
          icon: <ArrowLeftOutlined />,
          label: 'Back',
          onClick: () => navigate(-1)
        },
        {
          key: 'home',
          icon: <HomeOutlined />,
          label: 'Home',
          onClick: () => navigate('/energymonitoring/map')
        }
      ];
    } else {
      return [
        {
          key: '/energymonitoring/machine',
          icon: <ToolOutlined />,
          label: <Link to="/energymonitoring/machine">Machines</Link>
        },
        {
          key: '/energymonitoring/productivity',
          icon: <BarChartOutlined />,
          label: <Link to="/energymonitoring/productivity">Productivity</Link>
        }
      ];
    }
  };

  return (
    <div className="navbar-container">
      <div className="navbar-content" style={{ maxWidth: '100%', padding: '0 40px' }}>
        <div className="navbar-brand" onClick={() => navigate('/energymonitoring/map')}>
          <DashboardOutlined className="brand-icon" />
          <span className="brand-text">SMDDC Dashboard</span>
        </div>

        <Menu 
          mode="horizontal" 
          selectedKeys={[current]}
          className="main-menu"
          onClick={e => setCurrent(e.key)}
          items={getMenuItems()}
          style={{ 
            flex: '1', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            marginRight: '20px'
          }}
        />

        <div className="navbar-right">
          <Dropdown
            overlay={profileMenu}
            placement="bottomRight"
            trigger={['click']}
          >
            <div className="profile-dropdown-trigger">
              <Avatar 
                className="profile-avatar"
                style={{ marginRight: '8px' }}
              >
                {getAvatarContent()}
              </Avatar>
              <span style={{ color: 'white', fontWeight: '500' }}>{user?.username || 'User'}</span>
            </div>
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default Navbar;