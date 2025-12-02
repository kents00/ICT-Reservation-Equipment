import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';

interface RegisterScreenProps {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}

const COURSES = [
  'Bachelor of Science in Marine Biology',
  'Bachelor of Science in Information Technology',
  'Bachelor of Technology and Livelihood Education in Industrial Arts',
  'Bachelor of Technology and Livelihood Education in Home Economics',
];

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onNavigateToLogin,
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    id: '',
    course: COURSES[0],
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      Alert.alert('Validation Error', 'First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      Alert.alert('Validation Error', 'Last name is required');
      return false;
    }
    if (!formData.id.trim()) {
      Alert.alert('Validation Error', 'Student ID is required');
      return false;
    }
    if (!password.trim()) {
      Alert.alert('Validation Error', 'Password is required');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('your-backend-url/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     firstName: formData.firstName,
      //     lastName: formData.lastName,
      //     middleName: formData.middleName,
      //     id: formData.id,
      //     course: formData.course,
      //     password,
      //   }),
      // });

      console.log('Registration data:', { ...formData, password });
      Alert.alert('Success', 'Registration successful! Please log in.');
      onRegisterSuccess();
    } catch (error) {
      Alert.alert('Registration Error', 'Failed to register. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Student Registration</Text>
        <Text style={styles.subtitle}>Create your account</Text>

        <View style={styles.formContainer}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your first name"
            placeholderTextColor="#999"
            value={formData.firstName}
            onChangeText={(value) => handleInputChange('firstName', value)}
            editable={!loading}
          />

          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your last name"
            placeholderTextColor="#999"
            value={formData.lastName}
            onChangeText={(value) => handleInputChange('lastName', value)}
            editable={!loading}
          />

          <Text style={styles.label}>Middle Name (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your middle name"
            placeholderTextColor="#999"
            value={formData.middleName}
            onChangeText={(value) => handleInputChange('middleName', value)}
            editable={!loading}
          />

          <Text style={styles.label}>Student ID *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your student ID"
            placeholderTextColor="#999"
            value={formData.id}
            onChangeText={(value) => handleInputChange('id', value)}
            editable={!loading}
          />

          <Text style={styles.label}>Course *</Text>
          <TouchableOpacity
            style={styles.courseButton}
            onPress={() => setShowCourseDropdown(!showCourseDropdown)}
          >
            <Text style={styles.courseButtonText}>{formData.course}</Text>
            <Text style={styles.courseButtonArrow}>▼</Text>
          </TouchableOpacity>
          {showCourseDropdown && (
            <View style={styles.courseDropdown}>
              {COURSES.map((course) => (
                <TouchableOpacity
                  key={course}
                  style={styles.courseOption}
                  onPress={() => {
                    handleInputChange('course', course);
                    setShowCourseDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.courseOptionText,
                      formData.course === course && styles.courseOptionSelected,
                    ]}
                  >
                    {course}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter a password (min. 6 characters)"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          <Text style={styles.label}>Confirm Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            placeholderTextColor="#999"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>
              {loading ? 'Registering...' : 'Register'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={onNavigateToLogin}>
            <Text style={styles.loginLink}>Login here</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  courseButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseButtonText: {
    fontSize: 14,
    color: '#333',
  },
  courseButtonArrow: {
    fontSize: 12,
    color: '#999',
  },
  courseDropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#fff',
    marginTop: -1,
  },
  courseOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  courseOptionText: {
    fontSize: 14,
    color: '#666',
  },
  courseOptionSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
    alignItems: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 4,
  },
});
