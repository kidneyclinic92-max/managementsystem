import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * API Configuration
 * 
 * This file connects to the Next.js backend API.
 * 
 * For physical devices, you need to set your computer's local IP address:
 * 1. Find your computer's local IP address (shown when you run "expo start")
 * 2. Look for a line like: "Metro waiting on exp://192.168.1.100:8081"
 * 3. The IP address is the number before the port (e.g., "192.168.1.100")
 * 4. Update the DEFAULT_LOCAL_IP constant below with your IP
 */

// Default local IP - UPDATE THIS with your computer's local IP address
// Find it by running "expo start" and looking for the IP in the output
const DEFAULT_LOCAL_IP = '39.56.120.75'; // Your computer's local IP address

// Get the development server URL
const getApiBaseUrl = (): string => {
  if (__DEV__) {
    // For web, use localhost
    if (Platform.OS === 'web') {
      return 'http://localhost:3000/api';
    }
    
    // Use the configured IP address for physical devices
    const url = `http://${DEFAULT_LOCAL_IP}:3000/api`;
    console.log('✅ Using API server:', url);
    return url;
  }
  return 'https://your-production-domain.com/api';
};

// Initialize API base URL
const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      // Use Bearer token for mobile apps (backend supports this via getAuthenticatedUser)
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      // You might want to redirect to login here
    }
    return Promise.reject(error);
  }
);
