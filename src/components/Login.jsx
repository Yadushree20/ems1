import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Title, Text } from 'antd';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await authService.login(formData.username, formData.password);
      const from = location.state?.from?.pathname || '/energymonitoring';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-overlay"></div>
      <div className="auth-card">
        <div className="auth-header">
          <Title level={2} className="auth-title">
            Welcome Back! 👋
          </Title>
          <Text className="auth-subtitle">
            Enter your credentials to access your account
          </Text>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <input
              name="username"
              type="text"
              required
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
            />
            <input
              name="password"
              type="password"
              required
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    // Redirect to login page with the return url
    return <Navigate to="/energymonitoring/login" state={{ from: location }} replace />;
  }

  return children;
};