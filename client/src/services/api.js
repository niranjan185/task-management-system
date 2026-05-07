import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://task-management-system-production-6619.up.railway.app/api'
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
