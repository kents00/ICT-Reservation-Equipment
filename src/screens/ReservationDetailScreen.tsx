import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Reservation } from '../types/reservation';
import { API_BASE_URL } from '../config/api';
import { toast } from '../utils/Toast';

interface ReservationDetailScreenProps {
  reservation: Reservation;
  onGoBack: () => void;
}

export const ReservationDetailScreen: React.FC<ReservationDetailScreenProps> = ({
  reservation,
  onGoBack,
}) => {
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [returning, setReturning] = useState(false);

  // Fetch QR code for the equipment
  useEffect(() => {
    const fetchQRCode = async () => {
      setLoadingQR(true);
      try {
        const response = await fetch(`${API_BASE_URL}/equipment/${reservation.equipmentId}/qr-code`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setQrCodeImage(`data:image/png;base64,${data.qr_code_image}`);
        }
      } catch (error) {
        console.error('Error fetching QR code:', error);
      } finally {
        setLoadingQR(false);
      }
    };

    if (reservation.equipmentId) {
      fetchQRCode();
    }
  }, [reservation.equipmentId]);

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'approved':
        return '#34C759';
      case 'checked_out':
        return '#007AFF';
      case 'return_pending':
        return '#FF9500';
      case 'returned':
        return '#5856D6';
      case 'pending':
        return '#FFA500';
      case 'rejected':
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'approved':
        return 'Approved';
      case 'checked_out':
        return 'Checked Out';
      case 'return_pending':
        return 'Return Pending';
      case 'returned':
        return 'Returned';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleReturnEquipment = async () => {
    console.log('=== RETURN BUTTON PRESSED ===');
    console.log('Reservation ID:', reservation.id);
    console.log('Reservation Status:', reservation.status);
    console.log('Equipment ID:', reservation.equipmentId);
    console.log('API Base URL:', API_BASE_URL);
    console.log('Full URL:', `${API_BASE_URL}/reservation/${reservation.id}/return`);

    console.log('=== SUBMITTING RETURN REQUEST ===');
    setReturning(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      console.log('Token exists:', !!token);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

      if (!token) {
        console.log('=== NO TOKEN - ABORTING ===');
        Alert.alert('Authentication Required', 'Please login to return equipment.');
        setReturning(false);
        return;
      }

      const url = `${API_BASE_URL}/reservation/${reservation.id}/return`;
      console.log('Making POST request to:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('=== RESPONSE RECEIVED ===');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response statusText:', response.statusText);

      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));

      if (response.ok) {
        console.log('=== SUCCESS ===');
        toast.success('Return request submitted!');
        // Navigate back immediately to refresh the list
        onGoBack();
        // Show success message after navigation
        setTimeout(() => {
          Alert.alert(
            'Success',
            'Your return request has been submitted. An admin will verify the equipment and update your reservation status.'
          );
        }, 500);
      } else {
        console.log('=== ERROR RESPONSE ===');
        console.log('Error from server:', data.error);
        throw new Error(data.error || 'Failed to submit return request');
      }
    } catch (error) {
      console.error('=== CATCH ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit return request. Please try again.';
      console.error('Error message:', errorMessage);
      Alert.alert('Error', errorMessage);
      toast.error(errorMessage);
    } finally {
      console.log('=== FINALLY - SETTING RETURNING FALSE ===');
      setReturning(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={20} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reservation Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: reservation.equipmentImage }}
            style={styles.image}
          />
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(reservation.status) },
            ]}
          >
            <FontAwesome
              name={reservation.status.toLowerCase() === 'approved' ? 'check-circle' :
                    reservation.status.toLowerCase() === 'checked_out' ? 'cube' :
                    reservation.status.toLowerCase() === 'return_pending' ? 'clock-o' :
                    reservation.status.toLowerCase() === 'returned' ? 'check' :
                    reservation.status.toLowerCase() === 'pending' ? 'hourglass-half' : 'times-circle'}
              size={12}
              color="#fff"
              style={styles.statusIcon}
            />
            <Text style={styles.statusText}>{getStatusLabel(reservation.status)}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.name}>{reservation.equipmentName}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reservation ID</Text>
            <Text style={styles.sectionContent}>{reservation.id}</Text>
          </View>

          {reservation.reason && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reason</Text>
              <Text style={styles.sectionContent}>{reservation.reason}</Text>
            </View>
          )}

          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Start Date</Text>
              <Text style={styles.infoValue}>
                {reservation.startDate ? formatDate(reservation.startDate) : formatDate(reservation.borrowedDate)}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>End Date</Text>
              <Text style={styles.infoValue}>
                {reservation.endDate ? formatDate(reservation.endDate) : formatDate(reservation.expectedReturnDate)}
              </Text>
            </View>
          </View>

          {reservation.quantityRequested && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <Text style={styles.sectionContent}>{reservation.quantityRequested} unit(s)</Text>
            </View>
          )}

          {reservation.status.toLowerCase() === 'checked_out' && reservation.checkedOutAt && (
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>📦 Checked Out</Text>
              <Text style={styles.infoSectionText}>
                Equipment checked out on {formatDate(reservation.checkedOutAt)}
              </Text>
            </View>
          )}

          {reservation.status.toLowerCase() === 'returned' && reservation.returnedAt && (
            <View style={[styles.infoSection, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.infoSectionTitle, { color: '#2E7D32' }]}>✓ Returned</Text>
              <Text style={styles.infoSectionText}>
                Equipment returned on {formatDate(reservation.returnedAt)}
              </Text>
            </View>
          )}

          {reservation.status.toLowerCase() === 'return_pending' && (
            <View style={[styles.infoSection, { backgroundColor: '#FFF3E0' }]}>
              <Text style={[styles.infoSectionTitle, { color: '#F57C00' }]}>⏳ Return Pending Verification</Text>
              <Text style={styles.infoSectionText}>
                Your return request has been submitted. An admin will verify the equipment condition and update the status.
              </Text>
            </View>
          )}

          {reservation.status.toLowerCase() === 'approved' && !reservation.checkedOutAt && (
            <View style={[styles.infoSection, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.infoSectionTitle, { color: '#2E7D32' }]}>✓ Approved</Text>
              <Text style={styles.infoSectionText}>
                Your reservation has been approved. Please proceed to pick up the equipment.
              </Text>
            </View>
          )}

          {reservation.status.toLowerCase() === 'checked_out' && (
            <TouchableOpacity
              style={[styles.returnButton, returning && styles.returnButtonDisabled]}
              onPress={handleReturnEquipment}
              disabled={returning}
            >
              {returning ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.returnButtonText}>Request Return Verification</Text>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QR Code</Text>
            <View style={styles.qrCodeContainer}>
              {loadingQR ? (
                <ActivityIndicator size="large" color="#007AFF" />
              ) : qrCodeImage ? (
                <>
                  <Image
                    source={{ uri: qrCodeImage }}
                    style={styles.qrCodeImage}
                    resizeMode="contain"
                  />
                  {reservation.qrCode && (
                    <Text style={styles.qrCodeText}>{reservation.qrCode}</Text>
                  )}
                </>
              ) : (
                <Text style={styles.qrCodeText}>
                  {reservation.qrCode || 'QR Code not available'}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    width: 44,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  overdueAlert: {
    backgroundColor: '#FFE5E5',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
    marginBottom: 20,
  },
  overdueTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C41C3B',
    marginBottom: 8,
  },
  overdueText: {
    fontSize: 13,
    color: '#721C24',
    lineHeight: 20,
  },
  infoSection: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 8,
  },
  infoSectionText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  qrCodeContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  qrCodeImage: {
    width: 200,
    height: 200,
    marginBottom: 12,
  },
  qrCodeText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  returnButton: {
    backgroundColor: '#5856D6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  returnButtonDisabled: {
    backgroundColor: '#ccc',
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 20,
  },
});
