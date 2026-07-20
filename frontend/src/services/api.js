import axios from 'axios';

// Fallback to dynamic window origin or proxy for single-port & cloud deployments
const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Automatically inject JWT token into the headers of every request if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('eduai_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
