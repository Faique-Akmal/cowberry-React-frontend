import axios from 'axios';

const API = axios.create({
  baseURL: 'http://192.168.0.136:8000/api',
});

API.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export default API;
