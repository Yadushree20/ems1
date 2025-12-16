import axios from 'axios';

const BASE_URL = 'http://172.18.7.91:9900';

export const authService = {
  async register({ email, username, password, role, adminPassKey }) {
    if (role === 'admin' && adminPassKey !== '6565') {
      throw new Error('Invalid admin pass key');
    }

    try {
      const response = await axios.post(`${BASE_URL}/register`, {
        email,
        username,
        password,
        role
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async login(username, password) {
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('grant_type', '');
      formData.append('scope', '');
      formData.append('client_id', '');
      formData.append('client_secret', '');

      const response = await axios.post(`${BASE_URL}/auth`, 
        formData.toString(),
        {
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify({ username }));
        return response.data;
      } else {
        throw new Error('No access token received');
      }
    } catch (error) {
      console.error('Login error:', error.response || error);
      throw error.response?.data || error.message;
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/energymonitoring';
  },

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user'));
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};