import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { toast } from '../utils/Toast';

interface ReturnRequest {
  id: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
  };
  equipment: {
    id: string;
    name: string;
    image_url?: string;
  };
  status: string;
  quantity_requested: number;
  checked_out_at: string;
  created_at: string;
  updated_at: string;
  reason?: string;
}

interface AdminReturnVerificationScreenProps {
  onGoBack: () => void;
}

export const AdminReturnVerificationScreen: React.FC<AdminReturnVerificationScreenProps> = ({
  onGoBack,
}) => {
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationAction, setVerificationAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    fetchReturnRequests();
  }, []);

  const fetchReturnRequests = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');

      if (!token) {
        Alert.alert('Authentication Required', 'Please login as admin.');
        return;
      }

      console.log('Fetching return requests...');
      const response = await fetch(
        `${API_BASE_URL}/admin/reservations/all?status=return_pending`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      console.log('Return requests response:', data);

      if (response.ok) {
        setReturnRequests(data.reservations || []);
      } else {
        throw new Error(data.error || 'Failed to fetch return requests');
      }
    } catch (error) {
      console.error('Error fetching return requests:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch return requests';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReturnRequests();
  };

  const handleVerifyReturn = async (approved: boolean) => {
    if (!selectedRequest) return;

    if (!approved && !verificationNotes.trim()) {
      Alert.alert('Notes Required', 'Please provide a reason for rejecting the return.');
      return;
    }

    setProcessingId(selectedRequest.id);

    try {
      const token = await AsyncStorage.getItem('access_token');

      if (!token) {
        Alert.alert('Authentication Required', 'Please login as admin.');
        return;
      }

      console.log(`Verifying return for reservation ${selectedRequest.id}...`);
      console.log('Approved:', approved);
      console.log('Notes:', verificationNotes);

      const response = await fetch(
        `${API_BASE_URL}/reservation/${selectedRequest.id}/verify-return`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            approved: approved,
            notes: verificationNotes.trim() || (approved ? 'Equipment returned in good condition' : ''),
          }),
        }
      );

      const data = await response.json();
      console.log('Verify return response:', data);

      if (response.ok) {
        toast.success(approved ? 'Return approved!' : 'Return rejected');
        setModalVisible(false);
        setSelectedRequest(null);
        setVerificationNotes('');
        setVerificationAction(null);

        // Refresh the list
        fetchReturnRequests();
      } else {
        throw new Error(data.error || 'Failed to verify return');
      }
    } catch (error) {
      console.error('Error verifying return:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify return';
      Alert.alert('Error', errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const openVerificationModal = (request: ReturnRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setVerificationAction(action);
    setVerificationNotes('');
    setModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const renderReturnRequest = ({ item }: { item: ReturnRequest }) => {
    const isProcessing = processingId === item.id;

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.equipmentInfo}>
            {item.equipment.image_url && (
              <Image
                source={{ uri: item.equipment.image_url }}
                style={styles.equipmentImage}
              />
            )}
            <View style={styles.equipmentDetails}>
              <Text style={styles.equipmentName}>{item.equipment.name}</Text>
              <Text style={styles.userName}>
                {item.user.first_name} {item.user.last_name}
              </Text>
              <Text style={styles.userEmail}>{item.user.email}</Text>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Return Pending</Text>
          </View>
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reservation ID:</Text>
            <Text style={styles.detailValue}>{item.id}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Checked Out:</Text>
            <Text style={styles.detailValue}>{formatDate(item.checked_out_at)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>{item.quantity_requested} unit(s)</Text>
          </View>
          {item.reason && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reason:</Text>
              <Text style={styles.detailValue}>{item.reason}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => openVerificationModal(item, 'reject')}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.actionButtonText}>Reject</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => openVerificationModal(item, 'approve')}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.actionButtonText}>Approve Return</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading return requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Return Verification</Text>
        <View style={styles.placeholder} />
      </View>

      {returnRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>✓</Text>
          <Text style={styles.emptyTitle}>No Pending Returns</Text>
          <Text style={styles.emptyText}>
            All return requests have been processed
          </Text>
        </View>
      ) : (
        <FlatList
          data={returnRequests}
          renderItem={renderReturnRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Verification Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {verificationAction === 'approve' ? 'Approve Return' : 'Reject Return'}
            </Text>

            {selectedRequest && (
              <View style={styles.modalInfo}>
                <Text style={styles.modalInfoText}>
                  Equipment: {selectedRequest.equipment.name}
                </Text>
                <Text style={styles.modalInfoText}>
                  Student: {selectedRequest.user.first_name} {selectedRequest.user.last_name}
                </Text>
              </View>
            )}

            <Text style={styles.modalLabel}>
              {verificationAction === 'approve' ? 'Notes (Optional):' : 'Reason for Rejection:'}
            </Text>
            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={4}
              placeholder={
                verificationAction === 'approve'
                  ? 'Equipment in good condition...'
                  : 'Equipment damaged, missing parts, etc...'
              }
              value={verificationNotes}
              onChangeText={setVerificationNotes}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedRequest(null);
                  setVerificationNotes('');
                  setVerificationAction(null);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  verificationAction === 'approve'
                    ? styles.modalApproveButton
                    : styles.modalRejectButton,
                ]}
                onPress={() => handleVerifyReturn(verificationAction === 'approve')}
                disabled={processingId !== null}
              >
                {processingId ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.modalButtonText, styles.modalButtonTextWhite]}>
                    {verificationAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  placeholder: {
    width: 44,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  equipmentInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  equipmentImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  equipmentDetails: {
    flex: 1,
  },
  equipmentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  requestDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    width: 120,
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalInfoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f5f5f5',
  },
  modalApproveButton: {
    backgroundColor: '#34C759',
  },
  modalRejectButton: {
    backgroundColor: '#FF3B30',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  modalButtonTextWhite: {
    color: '#fff',
  },
});
