import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Equipment } from '../types/equipment';
import { API_BASE_URL } from '../config/api';
import { toast } from '../utils/Toast';

interface EquipmentDetailScreenProps {
  equipment: Equipment;
  onGoBack: () => void;
}

export const EquipmentDetailScreen: React.FC<EquipmentDetailScreenProps> = ({
  equipment,
  onGoBack,
}) => {
  const [reserving, setReserving] = useState(false);
  const [reserveQuantity, setReserveQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);

  // Initialize default dates (today + 7 days)
  useEffect(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(nextWeek.toISOString().split('T')[0]);
  }, []);

  // Fetch QR code image from backend
  useEffect(() => {
    const fetchQRCode = async () => {
      setLoadingQR(true);
      try {
        const response = await fetch(`${API_BASE_URL}/equipment/${equipment.id}/qr-code`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // QR code image is returned as base64 string
          setQrCodeImage(`data:image/png;base64,${data.qr_code_image}`);
        }
      } catch (error) {
        console.error('Error fetching QR code:', error);
      } finally {
        setLoadingQR(false);
      }
    };

    fetchQRCode();
  }, [equipment.id]);

  const handleReserve = async () => {
    if (equipment.quantityAvailable === 0) {
      Alert.alert('Not Available', 'This equipment is currently not available for reservation.');
      return;
    }

    if (reserveQuantity > equipment.quantityAvailable) {
      Alert.alert('Invalid Quantity', `Only ${equipment.quantityAvailable} units are available.`);
      return;
    }

    if (!reason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for this reservation.');
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert('Dates Required', 'Please select start and end dates.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      Alert.alert('Invalid Dates', 'End date must be after start date.');
      return;
    }

    setReserving(true);

    try {
      const token = await AsyncStorage.getItem('access_token');

      if (!token) {
        Alert.alert('Authentication Required', 'Please login to make a reservation.');
        setReserving(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/reservation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          equipment_id: equipment.id,
          quantity_requested: reserveQuantity,
          reason: reason.trim(),
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Reservation request submitted successfully!');
        Alert.alert(
          'Success',
          'Your reservation request has been submitted and is pending admin approval.',
          [
            {
              text: 'OK',
              onPress: () => onGoBack(),
            },
          ]
        );
      } else {
        throw new Error(data.error || 'Failed to create reservation');
      }
    } catch (error) {
      console.error('Reservation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create reservation. Please try again.';
      Alert.alert('Error', errorMessage);
      toast.error(errorMessage);
    } finally {
      setReserving(false);
    }
  };

  const incrementQuantity = () => {
    if (reserveQuantity < equipment.quantityAvailable) {
      setReserveQuantity(reserveQuantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (reserveQuantity > 1) {
      setReserveQuantity(reserveQuantity - 1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return '#34C759';
      case 'unavailable':
        return '#FF3B30';
      case 'maintenance':
        return '#FFA500';
      default:
        return '#999';
    }
  };

  const isAvailable = equipment.quantityAvailable > 0 && equipment.status.toLowerCase() === 'available';

  const isFormValid = () => {
    return (
      isAvailable &&
      reason.trim().length > 0 &&
      startDate.length > 0 &&
      endDate.length > 0 &&
      reserveQuantity > 0
    );
  };

  const getButtonText = () => {
    if (!isAvailable) {
      return 'Not Available';
    }
    if (reserving) {
      return 'Submitting...';
    }
    return 'Submit Reservation Request';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={20} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Equipment Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: equipment.image }}
            style={styles.image}
          />
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(equipment.status) },
            ]}
          >
            <FontAwesome
              name={equipment.status === 'Available' ? 'check-circle' :
                    equipment.status === 'Maintenance' ? 'wrench' : 'times-circle'}
              size={12}
              color="#fff"
              style={styles.statusIcon}
            />
            <Text style={styles.statusText}>{equipment.status}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.name}>{equipment.name}</Text>
          <Text style={styles.title}>{equipment.title}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <Text style={styles.sectionContent}>{equipment.category}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionContent}>{equipment.description}</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Total Quantity</Text>
              <Text style={styles.infoValue}>{equipment.quantity}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Available</Text>
              <Text
                style={[
                  styles.infoValue,
                  equipment.quantityAvailable === 0 && styles.infoValueRed,
                ]}
              >
                {equipment.quantityAvailable}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.sectionContent}>{equipment.location}</Text>
          </View>

          {equipment.status === 'Maintenance' && equipment.lastMaintenance && (
            <View style={styles.maintenanceSection}>
              <Text style={styles.maintenanceTitle}>⚠ Under Maintenance</Text>
              <View style={styles.maintenanceContent}>
                <Text style={styles.maintenanceLabel}>Last Maintenance:</Text>
                <Text style={styles.maintenanceDate}>{equipment.lastMaintenance}</Text>
              </View>
            </View>
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
                  <Text style={styles.qrCodeText}>{equipment.qrCode}</Text>
                </>
              ) : (
                <Text style={styles.qrCodeText}>{equipment.qrCode}</Text>
              )}
            </View>
          </View>

          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>Quantity to Reserve</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={decrementQuantity}
                disabled={reserveQuantity <= 1}
              >
                <FontAwesome name="minus" size={18} color={reserveQuantity <= 1 ? '#ccc' : '#FF3B30'} />
              </TouchableOpacity>
              <View style={styles.quantityDisplay}>
                <Text style={styles.quantityValue}>{reserveQuantity}</Text>
              </View>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={incrementQuantity}
                disabled={reserveQuantity >= equipment.quantityAvailable}
              >
                <FontAwesome name="plus" size={18} color={reserveQuantity >= equipment.quantityAvailable ? '#ccc' : '#34C759'} />
              </TouchableOpacity>
            </View>
            <Text style={styles.quantityInfo}>
              Available: {equipment.quantityAvailable} unit{equipment.quantityAvailable === 1 ? '' : 's'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reservation Period</Text>
            <View style={styles.dateInputContainer}>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Start Date</Text>
                <TextInput
                  style={styles.dateInput}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>End Date</Text>
                <TextInput
                  style={styles.dateInput}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reason for Reservation *</Text>
            <TextInput
              style={styles.reasonInput}
              value={reason}
              onChangeText={setReason}
              placeholder="Please provide a reason for borrowing this equipment..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.reserveButton,
              (!isFormValid() || reserving) && styles.reserveButtonDisabled,
            ]}
            onPress={handleReserve}
            disabled={!isFormValid() || reserving}
          >
            {reserving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.reserveButtonText}>{getButtonText()}</Text>
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
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: '#666',
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
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  infoValueRed: {
    color: '#FF3B30',
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
  maintenanceSection: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  maintenanceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 12,
  },
  maintenanceContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  maintenanceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  maintenanceDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFA500',
  },
  reserveButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  reserveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  reserveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 20,
  },
  quantitySection: {
    marginBottom: 20,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginVertical: 12,
    gap: 20,
  },
  quantityButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  quantityDisplay: {
    alignItems: 'center',
    minWidth: 60,
  },
  quantityValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
  },
  quantityInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  dateInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '600',
  },
  dateInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  reasonInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
  },
});
