import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../config/api';
import { toast } from '../utils/Toast';

interface ProfileEditScreenProps {
  onGoBack: () => void;
}

export const ProfileEditScreen: React.FC<ProfileEditScreenProps> = ({ onGoBack }) => {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [course, setCourse] = useState('');
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [gmail, setGmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const courses = [
    'Bachelor of Science in Marine Biology',
    'Bachelor of Science in Information Technology',
    'Bachelor of Technology and Livelihood Education in Industrial Arts',
    'Bachelor of Technology and Livelihood Education in Home Economics',
  ];

  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Helper function to get full image URL
  const getImageUrl = (imageUrl: string | null): string | null => {
    if (!imageUrl) return null;
    // If already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // If it starts with /, remove it to avoid double slashes
    const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    // Construct full URL from backend
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}/${cleanPath}`;
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('access_token');
      const userDataStr = await AsyncStorage.getItem('user_data');

      if (!token || !userDataStr) {
        toast.error('Please login to view your profile');
        onGoBack();
        return;
      }

      const userData = JSON.parse(userDataStr);

      // Set form fields from user data
      setUsername(userData.username || '');
      setFirstName(userData.first_name || '');
      setLastName(userData.last_name || '');
      setMiddleName(userData.middle_name || '');
      setStudentId(userData.student_id || '');
      setCourse(userData.department || courses[0]);
      setGmail(userData.email || '');
      setPhone(userData.phone || '');
      setTwoFactorEnabled(userData.two_factor_enabled || false);
      // Use helper function to get full image URL
      setProfileImage(getImageUrl(userData.image_url));
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to change your profile photo.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any, // Using 'images' to avoid deprecated warning
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        setSelectedImageUri(selectedUri);
        toast.success('Image selected! Save to update your profile.');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      toast.error('Failed to select image');
    }
  };

  const handleSave = async () => {
    // Validation
    if (!username.trim() || !firstName.trim() || !lastName.trim() || !studentId.trim() || !course.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!gmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (password && password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSaving(true);

    try {
      const token = await AsyncStorage.getItem('access_token');

      if (!token) {
        toast.error('Authentication required. Please login again.');
        return;
      }

      // Create FormData for multipart upload
      const formData = new FormData();

      // Add basic fields
      formData.append('username', username.trim());
      formData.append('first_name', firstName.trim());
      formData.append('last_name', lastName.trim());
      formData.append('middle_name', middleName.trim());
      formData.append('student_id', studentId.trim());
      formData.append('department', course);
      formData.append('email', gmail.trim());
      formData.append('phone', phone.trim());

      // Add two-factor authentication setting
      formData.append('two_factor_enabled', twoFactorEnabled.toString());

      // Add password if provided
      if (password) {
        formData.append('password', password);
      }

      // Add image if selected
      if (selectedImageUri) {
        const filename = selectedImageUri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        console.log('[PROFILE] Adding image to FormData:', { filename, type, uri: selectedImageUri.substring(0, 50) });

        formData.append('profile_image', {
          uri: selectedImageUri,
          name: filename,
          type: type,
        } as any);
      }

      console.log('[PROFILE] Sending request to:', `${API_BASE_URL}/auth/profile`);
      console.log('[PROFILE] Has selected image:', !!selectedImageUri);

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData, it will be set automatically with boundary
        },
        body: formData,
      });

      console.log('[PROFILE] Response status:', response.status);
      console.log('[PROFILE] Response content-type:', response.headers.get('content-type'));

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      console.log('[PROFILE] Server response:', data.user);

      // Update stored user data
      const updatedUser = { ...JSON.parse(await AsyncStorage.getItem('user_data') || '{}'), ...data.user };
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));

      // Update the displayed profile image with the new URL from server
      if (data.user.image_url) {
        setProfileImage(getImageUrl(data.user.image_url));
        setSelectedImageUri(null); // Clear selected image to show the saved one
      }

      toast.success('Profile updated successfully!');

      // Navigate back after a short delay
      setTimeout(() => {
        onGoBack();
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
            <FontAwesome name="arrow-left" size={20} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={20} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.content}>
          {/* Profile Avatar Section */}
          <View style={styles.avatarSection}>
            {(selectedImageUri || profileImage) ? (
              <Image
                source={{ uri: (selectedImageUri || profileImage) as string }}
                style={styles.avatarImage}
                resizeMode="cover"
                onError={(e) => {
                  console.log('[PROFILE] Image load error:', e.nativeEvent.error);
                  console.log('[PROFILE] Attempted to load:', selectedImageUri || profileImage);
                }}
                onLoad={() => {
                  console.log('[PROFILE] Image loaded successfully:', selectedImageUri || profileImage);
                }}
              />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>
                  {firstName.charAt(0).toUpperCase()}{lastName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.changeAvatarButton} onPress={handleImagePicker}>
              <FontAwesome name="camera" size={16} color="#007AFF" />
              <Text style={styles.changeAvatarText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Personal Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Username *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your last name"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Middle Name (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your middle name"
                placeholderTextColor="#999"
                value={middleName}
                onChangeText={setMiddleName}
              />
            </View>
          </View>

          {/* Academic Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Academic Information</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Student ID *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your student ID"
                placeholderTextColor="#999"
                value={studentId}
                onChangeText={setStudentId}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Course *</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setCourseDropdownOpen(!courseDropdownOpen)}
              >
                <Text style={styles.dropdownText}>{course}</Text>
                <FontAwesome
                  name={courseDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#007AFF"
                />
              </TouchableOpacity>
              {courseDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {courses.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setCourse(c);
                        setCourseDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          c === course && styles.dropdownOptionTextActive,
                        ]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Contact Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Gmail *</Text>
              <View style={styles.inputWithIcon}>
                <FontAwesome name="envelope" size={16} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIconText]}
                  placeholder="Enter your Gmail address"
                  placeholderTextColor="#999"
                  value={gmail}
                  onChangeText={setGmail}
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <View style={styles.inputWithIcon}>
                <FontAwesome name="phone" size={16} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIconText]}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#999"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Security Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <Text style={styles.helperText}>Leave blank to keep current password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter a password (min. 6 characters)"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            {/* Two-Factor Authentication */}
            <View style={styles.twoFactorSection}>
              <View style={styles.twoFactorHeader}>
                <View style={styles.twoFactorInfo}>
                  <FontAwesome name="shield" size={18} color="#34C759" style={styles.twoFactorIcon} />
                  <View>
                    <Text style={styles.twoFactorTitle}>Two-Factor Authentication</Text>
                    <Text style={styles.twoFactorStatus}>
                      {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    twoFactorEnabled && styles.toggleButtonActive,
                  ]}
                  onPress={() => setTwoFactorEnabled(!twoFactorEnabled)}
                >
                  <View
                    style={[
                      styles.toggleDot,
                      twoFactorEnabled && styles.toggleDotActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.twoFactorDescription}>
                {twoFactorEnabled
                  ? 'Your account is protected with 2FA. You will receive a verification code via email when logging in.'
                  : 'Enable 2FA to add an extra layer of security to your account.'}
              </Text>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.saveButtonText}>Saving...</Text>
              </>
            ) : (
              <>
                <FontAwesome name="save" size={18} color="#fff" style={styles.saveButtonIcon} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  placeholder: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  changeAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputWithIcon: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  inputWithIconText: {
    paddingHorizontal: 40,
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: '#fff',
    maxHeight: 200,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#666',
  },
  dropdownOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  twoFactorSection: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
    marginTop: 12,
  },
  twoFactorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  twoFactorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  twoFactorIcon: {
    marginRight: 4,
  },
  twoFactorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  twoFactorStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#34C759',
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleDotActive: {
    alignSelf: 'flex-end',
  },
  twoFactorDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonIcon: {
    color: '#fff',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  bottomSpacing: {
    height: 20,
  },
});
