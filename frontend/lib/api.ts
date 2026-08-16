import axios from 'axios';

// 1. Define where our backend is living
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// 2. Create an Axios "Instance"
// This is like a dedicated messenger for our app that already knows where to go.
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 3. The "Security Interceptor"
// This function runs AUTOMATICALLY every time you send a request.
// It checks if we have a token in the browser, and if so, attaches it.
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('intraai_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
