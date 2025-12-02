import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginScreen, RegisterScreen, EquipmentListScreen, EquipmentDetailScreen, ReservationDetailScreen, ApprovalDetailScreen, ProfileEditScreen, AdminReturnVerificationScreen, QRScannerScreen, TwoFactorScreen, ForgotPasswordScreen, ResetPasswordCodeScreen, ResetPasswordScreen } from './src/screens';
import { Equipment } from './src/types/equipment';
import { Reservation, PendingApproval } from './src/types/reservation';
import { ToastContainer } from './src/utils/Toast';

type ScreenType = 'login' | 'register' | 'equipment-list' | 'equipment-detail' | 'reservation-detail' | 'approval-detail' | 'profile-edit' | 'admin-return-verification' | 'qr-scanner' | 'two-factor' | 'forgot-password' | 'reset-password-code' | 'reset-password';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [twoFactorUserId, setTwoFactorUserId] = useState<string>('');
  const [twoFactorEmail, setTwoFactorEmail] = useState<string>('');
  const [resetPasswordEmail, setResetPasswordEmail] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [verifiedToken, setVerifiedToken] = useState<string>('');

  // Check for existing authentication on app mount
  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userData = await AsyncStorage.getItem('user_data');

      if (token && userData) {
        console.log('Found existing auth token, restoring session...');
        setIsLoggedIn(true);
        setCurrentScreen('equipment-list');
      } else {
        console.log('No existing auth found, showing login screen');
      }
    } catch (error) {
      console.error('Error checking existing auth:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setCurrentScreen('equipment-list');
  };

  const handleRegisterSuccess = () => {
    setCurrentScreen('login');
  };

  const handleNavigateTo2FA = (userId: string, maskedEmail: string) => {
    setTwoFactorUserId(userId);
    setTwoFactorEmail(maskedEmail);
    setCurrentScreen('two-factor');
  };

  const handle2FASuccess = async (accessToken: string, userData: any) => {
    // Store authentication token and user data
    await AsyncStorage.setItem('access_token', accessToken);
    await AsyncStorage.setItem('user_data', JSON.stringify(userData));

    console.log('2FA verification successful, user logged in:', userData.username);

    // Clear 2FA state
    setTwoFactorUserId('');
    setTwoFactorEmail('');

    // Complete login
    setIsLoggedIn(true);
    setCurrentScreen('equipment-list');
  };

  const handle2FAGoBack = () => {
    setTwoFactorUserId('');
    setTwoFactorEmail('');
    setCurrentScreen('login');
  };

  const handleNavigateToForgotPassword = () => {
    setCurrentScreen('forgot-password');
  };

  const handleForgotPasswordCodeSent = (email: string, resetToken: string) => {
    setResetPasswordEmail(email);
    setResetToken(resetToken);
    setCurrentScreen('reset-password-code');
  };

  const handleResetPasswordCodeVerified = (email: string, code: string, verifiedToken: string) => {
    setResetPasswordEmail(email);
    setVerifiedToken(verifiedToken);
    setCurrentScreen('reset-password');
  };

  const handlePasswordResetComplete = () => {
    setResetPasswordEmail('');
    setResetToken('');
    setVerifiedToken('');
    setCurrentScreen('login');
  };

  const handleForgotPasswordGoBack = () => {
    setResetPasswordEmail('');
    setResetToken('');
    setVerifiedToken('');
    setCurrentScreen('login');
  };

  const handleSelectEquipment = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setCurrentScreen('equipment-detail');
  };

  const handleSelectReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setCurrentScreen('reservation-detail');
  };

  const handleSelectApproval = (approval: PendingApproval) => {
    setSelectedApproval(approval);
    setCurrentScreen('approval-detail');
  };

  const handleLogout = async () => {
    try {
      // Clear stored authentication data
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user_data');
      console.log('Auth data cleared');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }

    setIsLoggedIn(false);
    setCurrentScreen('login');
    setSelectedEquipment(null);
    setSelectedReservation(null);
    setSelectedApproval(null);
  };

  const handleGoBack = () => {
    setSelectedEquipment(null);
    setSelectedReservation(null);
    setSelectedApproval(null);
    setCurrentScreen('equipment-list');
  };

  const handleEditProfile = () => {
    setCurrentScreen('profile-edit');
  };

  const handleAdminReturnVerification = () => {
    setCurrentScreen('admin-return-verification');
  };

  const handleScanQR = () => {
    setCurrentScreen('qr-scanner');
  };

  const handleQREquipmentFound = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setCurrentScreen('equipment-detail');
  };

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <ToastContainer />
        {currentScreen === 'login' ? (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onNavigateToRegister={() => setCurrentScreen('register')}
            onNavigateTo2FA={handleNavigateTo2FA}
            onNavigateToForgotPassword={handleNavigateToForgotPassword}
          />
        ) : currentScreen === 'two-factor' ? (
          <TwoFactorScreen
            userId={twoFactorUserId}
            maskedEmail={twoFactorEmail}
            onVerificationSuccess={handle2FASuccess}
            onGoBack={handle2FAGoBack}
          />
        ) : currentScreen === 'forgot-password' ? (
          <ForgotPasswordScreen
            onCodeSent={handleForgotPasswordCodeSent}
            onGoBack={handleForgotPasswordGoBack}
          />
        ) : currentScreen === 'reset-password-code' ? (
          <ResetPasswordCodeScreen
            email={resetPasswordEmail}
            resetToken={resetToken}
            onCodeVerified={handleResetPasswordCodeVerified}
            onGoBack={handleForgotPasswordGoBack}
          />
        ) : currentScreen === 'reset-password' ? (
          <ResetPasswordScreen
            email={resetPasswordEmail}
            verifiedToken={verifiedToken}
            onPasswordReset={handlePasswordResetComplete}
            onGoBack={handleForgotPasswordGoBack}
          />
        ) : (
          <RegisterScreen
            onRegisterSuccess={handleRegisterSuccess}
            onNavigateToLogin={() => setCurrentScreen('login')}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ToastContainer />
      {renderScreen()}
    </View>
  );

  function renderScreen() {
    if (currentScreen === 'equipment-list') {
      return (
        <EquipmentListScreen
          onSelectEquipment={handleSelectEquipment}
          onSelectReservation={handleSelectReservation}
          onSelectApproval={handleSelectApproval}
          onLogout={handleLogout}
          onEditProfile={handleEditProfile}
          onAdminReturnVerification={handleAdminReturnVerification}
          onScanQR={handleScanQR}
        />
      );
    }
    if (currentScreen === 'equipment-detail' && selectedEquipment) {
      return (
        <EquipmentDetailScreen
          equipment={selectedEquipment}
          onGoBack={handleGoBack}
        />
      );
    }
    if (currentScreen === 'reservation-detail' && selectedReservation) {
      return (
        <ReservationDetailScreen
          reservation={selectedReservation}
          onGoBack={handleGoBack}
        />
      );
    }
    if (currentScreen === 'approval-detail' && selectedApproval) {
      return (
        <ApprovalDetailScreen
          approval={selectedApproval}
          onGoBack={handleGoBack}
        />
      );
    }
    if (currentScreen === 'profile-edit') {
      return (
        <ProfileEditScreen
          onGoBack={handleGoBack}
        />
      );
    }
    if (currentScreen === 'admin-return-verification') {
      return (
        <AdminReturnVerificationScreen
          onGoBack={handleGoBack}
        />
      );
    }
    if (currentScreen === 'qr-scanner') {
      return (
        <QRScannerScreen
          onGoBack={handleGoBack}
          onEquipmentFound={handleQREquipmentFound}
        />
      );
    }
    return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
