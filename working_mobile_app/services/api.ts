import axios from 'axios';
import { storage } from './storage';
import { Platform } from 'react-native';
import { mockApi } from './mockApi';

/**
 * API Configuration
 * 
 * IMPORTANT: Update the DEFAULT_LOCAL_IP with your computer's IP address
 * 
 * To find your IP:
 * - Windows: Open CMD and run "ipconfig" (look for IPv4 Address)
 * - Mac: Open Terminal and run "ifconfig | grep inet" 
 * - Linux: Open Terminal and run "hostname -I"
 * 
 * Example: If your IP is 192.168.1.100, set DEFAULT_LOCAL_IP = '192.168.1.100'
 */

// Toggle mock mode to run the app without a backend
const USE_MOCK_API = false; // set to false to hit the real API

// UPDATE THIS with your machine's IP when using a device/emulator.
// For web, localhost works. For Android emulator, use 10.0.2.2. For iOS sim, localhost is fine.
const DEFAULT_LOCAL_IP = 'localhost';

const getApiBaseUrl = (): string => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'web') {
      return 'http://localhost:3000/api';
    }
    
    // For iOS/Android physical devices or emulators
    const url = `http://${DEFAULT_LOCAL_IP}:3000/api`;
    console.log('🌐 API URL:', url);
    return url;
  }
  
  // Production mode
  return 'https://your-production-domain.com/api';
};

const API_BASE_URL = getApiBaseUrl();

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - Add token to requests
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth
      await storage.removeItem('auth_token');
      await storage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Export either the mock API (offline) or the real axios instance
export const api: any = USE_MOCK_API ? mockApi : axiosInstance;

if (USE_MOCK_API) {
  // eslint-disable-next-line no-console
  console.log('🧪 Using mock API (offline mode, no backend required)');
}

