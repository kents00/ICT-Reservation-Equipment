import { Platform } from 'react-native';

// Your computer's local IP address (found from Flask output or ipconfig)
const LOCAL_IP = '192.168.1.2';

// Determine the correct API base URL based on platform
const getApiBaseUrl = (): string => {
  // For web platform, use localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }

  // For Android emulator, localhost maps to 10.0.2.2
  if (Platform.OS === 'android') {
    // Use local IP for physical devices, 10.0.2.2 for emulator
    // Change to LOCAL_IP if testing on physical Android device
    return `http://${LOCAL_IP}:5000/api`;
  }

  // For iOS simulator, localhost works fine
  if (Platform.OS === 'ios') {
    return 'http://localhost:5000/api';
  }

  // Fallback
  return 'http://localhost:5000/api';
};

// For physical devices, you'll need to use your computer's local IP address
// Example: 'http://192.168.1.100:5000/api'
// You can find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)

export const API_BASE_URL = getApiBaseUrl();

console.log('API_BASE_URL configured as:', API_BASE_URL);
console.log('Platform:', Platform.OS);

// Helper to check if the API is reachable
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    console.log('Checking API connection to:', `${API_BASE_URL}/health`);
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      timeout: 5000,
    } as RequestInit);
    console.log('API health check response:', response.ok);
    return response.ok;
  } catch (error) {
    console.error('API connection check failed:', error);
    return false;
  }
};
