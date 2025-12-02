import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { testApiConnection } from '../utils/apiTest';
import { toast } from '../utils/Toast';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onNavigateToRegister: () => void;
  onNavigateTo2FA: (userId: string, maskedEmail: string) => void;
  onNavigateToForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
  onNavigateTo2FA,
  onNavigateToForgotPassword,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    console.log('Attempting login with:', username.trim());
    console.log('API URL:', `${API_BASE_URL}/auth/login`);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          toast.error('Invalid username or password');
        } else if (response.status === 403) {
          toast.error('Your account has been deactivated. Please contact support.');
        } else if (response.status === 429) {
          toast.error(data.error || 'Too many failed attempts. Try again later.');
        } else {
          toast.error(data.error || 'Failed to login. Please try again.');
        }
        return;
      }

      // Check if 2FA is required
      if (data.requires_2fa) {
        toast.success('Verification code sent to your email');
        console.log('2FA required for user:', data.user_id);
        // Navigate to 2FA verification screen
        onNavigateTo2FA(data.user_id, data.email);
        return;
      }

      // Store authentication token and user data
      if (data.access_token) {
        await AsyncStorage.setItem('access_token', data.access_token);
        await AsyncStorage.setItem('user_data', JSON.stringify(data.user));

        console.log('Login successful:', {
          user: data.user.username,
          role: data.user.role,
        });

        // Show success toast and navigate immediately
        toast.success(`Welcome back, ${data.user.first_name}!`);

        // Navigate after a brief delay to let toast appear
        setTimeout(() => {
          onLoginSuccess();
        }, 300);
      } else {
        toast.error('Failed to receive authentication token');
      }
    } catch (error: any) {
      console.error('Login error caught:', error);
      console.error('Error type:', typeof error);
      console.error('Error details:', {
        message: error?.message || 'Unknown error',
        name: error?.name || 'Unknown',
      });

      toast.error(
        'Failed to connect to backend. Check if server is running.',
        4000
      );

      // Show detailed error in console for debugging
      console.error('Backend connection failed. Ensure Flask is running on the correct port.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    const result = await testApiConnection();
    setLoading(false);

    if (result.success) {
      toast.success('Backend connection successful! ✓', 3000);
      console.log('Connection test details:', result.details);
    } else {
      toast.error('Backend connection failed ✗', 4000);
      console.error('Connection test failed:', result.message);
      console.error('Details:', result.details);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Student Login</Text>
        <Text style={styles.subtitle}>Equipment Reservation System</Text>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Username / ID</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your username or student ID"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            editable={!loading}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={styles.forgotPasswordLink}
            onPress={onNavigateToForgotPassword}
            disabled={loading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.loginButtonText}>  Logging in...</Text>
              </View>
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, loading && styles.buttonDisabled]}
            onPress={handleTestConnection}
            disabled={loading}
          >
            <Text style={styles.testButtonText}>🔍 Test Backend Connection</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={onNavigateToRegister}>
            <Text style={styles.registerLink}>Register here</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  registerContainer: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 4,
  },
});
