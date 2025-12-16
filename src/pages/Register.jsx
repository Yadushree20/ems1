import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Select, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { authService } from '../services/authService';
import "../styles/auth.css";

const { Title, Text } = Typography;
const { Option } = Select;

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('user');

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await authService.register({
        email: values.email,
        username: values.username,
        password: values.password,
        role: values.role,
        adminPassKey: values.adminPassKey
      });
      message.success('Registration successful! Please login.');
      navigate('/energymonitoring');
    } catch (error) {
      console.error('Registration error:', error);
      message.error(error.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-overlay" />
      <div className="content-wrapper">
        <Card className="auth-card">
          <div className="auth-header">
            <Title level={2} className="auth-title">
              Create Account ✨
            </Title>
            <Text className="auth-subtitle">
              Join us to monitor and manage your machines efficiently
            </Text>
          </div>

          <Form
            name="register"
            onFinish={handleSubmit}
            layout="vertical"
            className="auth-form"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Email"
                size="large"
                className="auth-input"
              />
            </Form.Item>

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
              name="role"
              rules={[{ required: true, message: 'Please select a role!' }]}
            >
              <Select
                size="large"
                placeholder="Select Role"
                onChange={(value) => setRole(value)}
                className="auth-select"
              >
                <Option value="user">User</Option>
                <Option value="admin">Admin</Option>
              </Select>
            </Form.Item>

            {role === 'admin' && (
              <Form.Item
                name="adminPassKey"
                rules={[{ required: true, message: 'Please input admin pass key!' }]}
              >
                <Input.Password
                  prefix={<SafetyCertificateOutlined />}
                  placeholder="Admin Pass Key"
                  size="large"
                  className="auth-input"
                />
              </Form.Item>
            )}

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please input your password!' },
                { min: 6, message: 'Password must be at least 6 characters!' }
              ]}
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
                size="large"
                block
                className="auth-button"
                loading={loading}
              >
                Register
              </Button>
            </Form.Item>

            <div className="auth-links">
              <Text>
                Already have an account?{' '}
                <Link to="/energymonitoring" className="auth-link">
                  Sign in
                </Link>
              </Text>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Register;