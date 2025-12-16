import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    role: 'user',
    adminPassKey: ''
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
      await authService.register(formData);
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Register
        </h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <input
              name="email"
              type="email"
              required
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
            />
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
            <select
              name="role"
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {formData.role === 'admin' && (
              <input
                name="adminPassKey"
                type="password"
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300"
                placeholder="Admin Pass Key"
                value={formData.adminPassKey}
                onChange={handleChange}
              />
            )}
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};