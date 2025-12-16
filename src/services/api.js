import axios from 'axios';
import { authService } from './authService';

const api = axios.create({
  baseURL: 'https://emsapi.cmti.online'
});

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authService.logout();
      window.location.href = '/energymonitoring';
    }
    return Promise.reject(error);
  }
);

export default api;