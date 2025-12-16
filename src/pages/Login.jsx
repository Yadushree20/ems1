import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { authService } from '../services/authService';
import cmtiLogo from '../assets/cmti_pic.png';
import {
  cncMachine,
  robotArm,
  manufacturingMachine,
  industrialRobot,
  gear1,
  gear2
} from '../assets/machines';
import "../styles/auth.css";
const { Title, Text } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await authService.login(values.username, values.password);
      const from = location.state?.from?.pathname || '/energymonitoring/map';
      message.success('Login successful!');
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      message.error(error.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-overlay" />
      <div className="energy-grid" />
      <div className="connection-lines" />
      <div className="energy-particles">
        <div className="energy-particle" />
        <div className="energy-particle" />
        <div className="energy-particle" />
        <div className="energy-particle" />
        <div className="energy-particle" />
        <div className="energy-particle" />
        <div className="energy-particle" />
        <div className="energy-particle" />
      </div>
      <img src={cncMachine} alt="" className="machine-animation" />
      <img src={robotArm} alt="" className="machine-animation-2" />
      <img src={manufacturingMachine} alt="" className="machine-animation-3" />
      <img src={industrialRobot} alt="" className="machine-animation-4" />
      <img src={gear1} alt="" className="gear gear-1" />
      <img src={gear2} alt="" className="gear gear-2" />
      <svg className="graph-animation">
        <path
          className="graph-line"
          d="M0,75 C50,75 50,25 100,25 S150,75 200,75 S250,25 300,25"
        />
      </svg>
      <div className="content-wrapper">
        <Card className="auth-card">
          <div className="auth-header">
            <Title level={1} className="auth-title">
              Energy Monitoring System
            </Title>
            <div className="logo-container">
              <img src={cmtiLogo} alt="CMTI Logo" className="cmti-logo" />
            </div>
          </div>

          <Form
            name="login"
            onFinish={handleSubmit}
            layout="vertical"
            className="auth-form"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Please input your username!' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Username"
                size="large"
                className="auth-input"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
                size="large"
                className="auth-input"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<LoginOutlined />}
                size="large"
                block
                className="auth-button"
                loading={loading}
              >
                Access Dashboard
              </Button>
            </Form.Item>

            <div className="auth-links">
              <Text>
                Real-time energy monitoring for optimal efficiency
              </Text>
              <br />
              <Text>
                New to the platform?{' '}
                <Link to="/energymonitoring/register" className="auth-link">
                  Register now
                </Link>
              </Text>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Login;