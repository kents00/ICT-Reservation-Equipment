import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { PendingApproval } from '../types/reservation';

interface ApprovalDetailScreenProps {
  approval: PendingApproval;
  onGoBack: () => void;
}

export const ApprovalDetailScreen: React.FC<ApprovalDetailScreenProps> = ({
  approval,
  onGoBack,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return '#FFA500';
      case 'Approved':
        return '#34C759';
      case 'Rejected':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return '#FFF3E0';
      case 'Approved':
        return '#E8F5E9';
      case 'Rejected':
        return '#FFEBEE';
      default:
        return '#F5F5F5';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'Pending':
        return '⏳ Awaiting Approval';
      case 'Approved':
        return '✓ Request Approved';
      default:
        return '✗ Request Rejected';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={20} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Approval Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: approval.equipmentImage }}
            style={styles.image}
          />
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(approval.status) },
            ]}
          >
            <FontAwesome
              name={approval.status === 'Pending' ? 'clock-o' :
                    approval.status === 'Approved' ? 'check-circle' : 'times-circle'}
              size={12}
              color="#fff"
              style={styles.statusIcon}
            />
            <Text style={styles.statusText}>{approval.status}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.name}>{approval.equipmentName}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Request ID</Text>
            <Text style={styles.sectionContent}>{approval.id}</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Requested Date</Text>
              <Text style={styles.infoValue}>{approval.requestedDate}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Quantity</Text>
              <Text style={styles.infoValue}>{approval.requestedQuantity}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Purpose</Text>
            <Text style={styles.sectionContent}>{approval.purpose}</Text>
          </View>

          <View style={[styles.statusBox, { backgroundColor: getStatusBgColor(approval.status) }]}>
            <Text style={[styles.statusBoxTitle, { color: getStatusColor(approval.status) }]}>
              {getStatusMessage(approval.status)}
            </Text>
            {approval.status === 'Pending' && (
              <Text style={styles.statusBoxDescription}>
                Your equipment request is being reviewed by the administrator.
              </Text>
            )}
            {approval.status === 'Approved' && (
              <Text style={styles.statusBoxDescription}>
                Your request has been approved. Please proceed with equipment collection.
              </Text>
            )}
            {approval.status === 'Rejected' && (
              <Text style={styles.statusBoxDescription}>
                Unfortunately, your request was not approved. Please contact the administrator for more information.
              </Text>
            )}
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
  statusBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statusBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusBoxDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
  },
});
