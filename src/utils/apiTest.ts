import { Platform } from 'react-native';
import { API_BASE_URL } from '../config/api';

/**
 * Test API connectivity
 * Run this before attempting login to ensure backend is reachable
 */
export const testApiConnection = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  console.log('=== API Connection Test ===');
  console.log('Platform:', Platform.OS);
  console.log('API Base URL:', API_BASE_URL);

  try {
    console.log('Attempting to connect to health endpoint...');
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);

      return {
        success: true,
        message: 'Backend is reachable! ✓',
        details: {
          status: response.status,
          data,
          url: API_BASE_URL,
        },
      };
    } else {
      return {
        success: false,
        message: `Backend responded with error status: ${response.status}`,
        details: {
          status: response.status,
          url: API_BASE_URL,
        },
      };
    }
  } catch (error: any) {
    console.error('Connection test failed:', error);

    return {
      success: false,
      message: `Failed to connect to backend at ${API_BASE_URL}`,
      details: {
        error: error.message || String(error),
        url: API_BASE_URL,
        platform: Platform.OS,
        troubleshooting: getTroubleshootingTips(),
      },
    };
  }
};

/**
 * Get platform-specific troubleshooting tips
 */
const getTroubleshootingTips = (): string[] => {
  const tips: string[] = [
    '1. Ensure Flask backend is running: python app.py',
    '2. Backend should be on port 5000',
  ];

  if (Platform.OS === 'android') {
    tips.push('3. For Android emulator, backend must be accessible at 10.0.2.2');
    tips.push('4. Test in emulator browser: http://10.0.2.2:5000/api/health');
    tips.push('5. For physical device, update API_BASE_URL with your IP address');
  } else if (Platform.OS === 'ios') {
    tips.push('3. For iOS simulator, localhost should work');
    tips.push('4. For physical device, update API_BASE_URL with your IP address');
  } else if (Platform.OS === 'web') {
    tips.push('3. Test in browser: http://localhost:5000/api/health');
  }

  tips.push('6. Check firewall settings');
  tips.push('7. Verify CORS is enabled on backend');

  return tips;
};

/**
 * Test login endpoint with sample credentials
 */
export const testLoginEndpoint = async (
  username: string,
  password: string
): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  console.log('=== Login Endpoint Test ===');
  console.log('Testing with username:', username);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    console.log('Login response status:', response.status);
    const data = await response.json();
    console.log('Login response data:', data);

    if (response.ok && data.access_token) {
      return {
        success: true,
        message: 'Login successful! ✓',
        details: {
          username: data.user?.username,
          role: data.user?.role,
          hasToken: !!data.access_token,
        },
      };
    } else {
      return {
        success: false,
        message: data.error || 'Login failed',
        details: {
          status: response.status,
          response: data,
        },
      };
    }
  } catch (error: any) {
    console.error('Login test failed:', error);
    return {
      success: false,
      message: 'Failed to connect to login endpoint',
      details: {
        error: error.message || String(error),
      },
    };
  }
};

/**
 * Run all connectivity tests
 */
export const runAllTests = async (
  username?: string,
  password?: string
): Promise<void> => {
  console.log('==================================');
  console.log('   API CONNECTIVITY TEST SUITE   ');
  console.log('==================================\n');

  // Test 1: Health check
  const healthTest = await testApiConnection();
  console.log('\nTest 1 - Health Check:');
  console.log('Result:', healthTest.success ? '✓ PASS' : '✗ FAIL');
  console.log('Message:', healthTest.message);
  if (healthTest.details) {
    console.log('Details:', JSON.stringify(healthTest.details, null, 2));
  }

  // Test 2: Login endpoint (if credentials provided)
  if (username && password) {
    console.log('\n----------------------------------\n');
    const loginTest = await testLoginEndpoint(username, password);
    console.log('\nTest 2 - Login Endpoint:');
    console.log('Result:', loginTest.success ? '✓ PASS' : '✗ FAIL');
    console.log('Message:', loginTest.message);
    if (loginTest.details) {
      console.log('Details:', JSON.stringify(loginTest.details, null, 2));
    }
  }

  console.log('\n==================================');
  console.log('        TEST SUITE COMPLETE       ');
  console.log('==================================\n');
};
