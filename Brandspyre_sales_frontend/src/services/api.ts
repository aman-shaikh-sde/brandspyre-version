import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/marketplace';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Buyer or Organization token if present
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('buyer_token') ||
    localStorage.getItem('seller_token') ||
    localStorage.getItem('admin_token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
