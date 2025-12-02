import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Equipment } from '../types/equipment';
import { Reservation, PendingApproval } from '../types/reservation';
import { API_BASE_URL } from '../config/api';
import { toast } from '../utils/Toast';

interface EquipmentListScreenProps {
  onSelectEquipment: (equipment: Equipment) => void;
  onSelectReservation: (reservation: Reservation) => void;
  onSelectApproval: (approval: PendingApproval) => void;
  onLogout: () => void;
  onEditProfile: () => void;
  onAdminReturnVerification?: () => void;
  onScanQR: () => void;
}

export const EquipmentListScreen: React.FC<EquipmentListScreenProps> = ({
  onSelectEquipment,
  onSelectReservation,
  onSelectApproval,
  onLogout,
  onEditProfile,
  onAdminReturnVerification,
  onScanQR,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'equipment' | 'reservations' | 'approvals'>('equipment');
  const [menuOpen, setMenuOpen] = useState(false);

  // Data states
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [returnRequestsCount, setReturnRequestsCount] = useState<number>(0);
  const [userInfo, setUserInfo] = useState<{ name: string; role: string; initial: string; imageUrl: string | null }>({
    name: 'User',
    role: 'Student',
    initial: 'U',
    imageUrl: null,
  });

  // Helper function to map backend status to frontend status
  const mapStatus = (status: string): 'Available' | 'Unavailable' | 'Maintenance' => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'Available';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'Unavailable';
    }
  };

  // Helper function to format dates
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper function to get image URL
  const getImageUrl = (imageUrl: string | null): string | null => {
    if (!imageUrl) {
      return null; // Return null for missing images
    }
    // If image_url starts with http/https, use it directly
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // Otherwise, construct the full URL from the backend
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}/${imageUrl}`;
  };

  // Fetch equipment data
  const fetchEquipment = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');

      const response = await fetch(`${API_BASE_URL}/equipment`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch equipment');
      }

      const data = await response.json();

      // Transform backend data to match frontend interface
      const transformedEquipment: Equipment[] = data.equipment.map((item: any) => ({
        id: item.id,
        name: item.name,
        title: item.name,
        description: item.description || '',
        category: item.category,
        quantity: item.quantity,
        quantityAvailable: item.quantity_available,
        location: item.location || 'Unknown',
        status: mapStatus(item.status),
        image: getImageUrl(item.image_url),
        qrCode: item.qr_code,
        lastMaintenance: item.last_maintenance,
      }));

      setEquipment(transformedEquipment);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast.error('Failed to load equipment. Please try again.');
    }
  };

  // Fetch user reservations
  const fetchReservations = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');

      if (!token) {
        setReservations([]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/reservation`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reservations');
      }

      const data = await response.json();

      // Transform backend data
      const transformedReservations: Reservation[] = data.reservations.map((item: any) => ({
        id: item.id,
        equipmentId: item.equipment_id,
        equipmentName: item.equipment?.name || 'Unknown Equipment',
        equipmentImage: getImageUrl(item.equipment?.image_url),
        borrowedDate: item.start_date,
        expectedReturnDate: item.end_date,
        status: item.status, // Keep original backend status
        quantityRequested: item.quantity_requested,
        reason: item.reason,
        startDate: item.start_date,
        endDate: item.end_date,
        qrCode: item.equipment?.qr_code,
        checkedOutAt: item.checked_out_at,
        returnedAt: item.returned_at,
        approvedAt: item.approved_at,
      }));

      setReservations(transformedReservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  // Fetch pending approvals
  const fetchApprovals = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');

      if (!token) {
        setApprovals([]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/reservation?status=pending`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch approvals');
      }

      const data = await response.json();

      // Transform to pending approvals
      const transformedApprovals: PendingApproval[] = data.reservations.map((item: any) => ({
        id: item.id,
        equipmentId: item.equipment_id,
        equipmentName: item.equipment?.name || 'Unknown Equipment',
        equipmentImage: getImageUrl(item.equipment?.image_url),
        requestedQuantity: item.quantity_requested,
        purpose: item.reason || 'No reason provided',
        requestedDate: formatDate(item.reserved_at),
        startDate: formatDate(item.start_date),
        endDate: formatDate(item.end_date),
        status: 'Pending',
      }));

      setApprovals(transformedApprovals);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    }
  };

  // Fetch return requests count (admin only)
  const fetchReturnRequests = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userDataStr = await AsyncStorage.getItem('user_data');

      if (!token || !userDataStr) {
        setReturnRequestsCount(0);
        return;
      }

      const userData = JSON.parse(userDataStr);
      if (userData.role !== 'admin') {
        setReturnRequestsCount(0);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/reservations/all?status=return_pending`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch return requests');
      }

      const data = await response.json();
      setReturnRequestsCount(data.reservations?.length || 0);
    } catch (error) {
      console.error('Error fetching return requests:', error);
      setReturnRequestsCount(0);
    }
  };

  // Load user info from storage
  const loadUserInfo = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('user_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setUserInfo({
          name: `${userData.first_name} ${userData.last_name}`,
          role: userData.role === 'admin' ? 'Admin' : 'Student',
          initial: userData.first_name?.charAt(0).toUpperCase() || 'U',
          imageUrl: getImageUrl(userData.image_url),
        });
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  // Load all data on mount
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchEquipment(),
      fetchReservations(),
      fetchApprovals(),
      fetchReturnRequests(),
      loadUserInfo(),
    ]).finally(() => setLoading(false));
  }, []);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchEquipment(),
      fetchReservations(),
      fetchApprovals(),
      fetchReturnRequests(),
    ]);
    setRefreshing(false);
  };

  const filteredEquipment = equipment.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Available':
        return styles.statusAvailable;
      case 'Maintenance':
        return styles.statusMaintenance;
      default:
        return styles.statusUnavailable;
    }
  };

  const renderEquipmentCard = ({ item }: { item: Equipment }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onSelectEquipment(item)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.noImagePlaceholder]}>
            <FontAwesome name="image" size={40} color="#ccc" />
            <Text style={styles.noImageText}>No Image</Text>
          </View>
        )}
        <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
          <FontAwesome
            name={item.status === 'Available' ? 'check-circle' :
                  item.status === 'Maintenance' ? 'wrench' : 'times-circle'}
            size={12}
            color="#fff"
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.categoryRow}>
          <FontAwesome name="tag" size={12} color="#999" />
          <Text style={styles.category}>{item.category}</Text>
        </View>

        <View style={styles.quantityContainer}>
          <View style={styles.quantityItem}>
            <View style={styles.quantityIconRow}>
              <FontAwesome name="cubes" size={14} color="#007AFF" />
              <Text style={styles.quantityLabel}>Total</Text>
            </View>
            <Text style={styles.quantityValue}>{item.quantity}</Text>
          </View>
          <View style={styles.quantityDivider} />
          <View style={styles.quantityItem}>
            <View style={styles.quantityIconRow}>
              <FontAwesome name="check" size={14} color="#34C759" />
              <Text style={styles.quantityLabel}>Available</Text>
            </View>
            <Text
              style={[
                styles.quantityValue,
                item.quantityAvailable === 0 && styles.quantityRed,
              ]}
            >
              {item.quantityAvailable}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <FontAwesome name="map-marker" size={12} color="#999" />
        <Text style={styles.locationText}>{item.location}</Text>
      </View>
    </TouchableOpacity>
  );

  const getReservationStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
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
    const statusLower = status?.toLowerCase();
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

  const renderReservationCard = ({ item }: { item: Reservation }) => (
    <TouchableOpacity
      style={styles.compactCard}
      onPress={() => onSelectReservation(item)}
      activeOpacity={0.7}
    >
      <View style={styles.compactCardLeft}>
        <View style={styles.compactImageContainer}>
          <Image
            source={{ uri: item.equipmentImage }}
            style={styles.compactImage}
          />
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {item.equipmentName}
          </Text>
          <Text style={styles.compactSubtitle}>{formatDate(item.borrowedDate)}</Text>
          <Text style={styles.compactSubtitle}>Return: {formatDate(item.expectedReturnDate)}</Text>
        </View>
      </View>
      <View
        style={[
          styles.compactBadge,
          { backgroundColor: getReservationStatusColor(item.status) },
        ]}
      >
        <Text style={styles.compactBadgeText}>{getStatusLabel(item.status)}</Text>
      </View>
    </TouchableOpacity>
  );

  const getApprovalStatusColor = (status: string) => {
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

  const getHeaderTitle = () => {
    if (activeTab === 'equipment') return 'Equipment Catalog';
    if (activeTab === 'reservations') return 'Active Reservations';
    return 'Pending Approvals';
  };

  const renderApprovalCard = ({ item }: { item: PendingApproval }) => (
    <TouchableOpacity
      style={styles.compactCard}
      onPress={() => onSelectApproval(item)}
      activeOpacity={0.7}
    >
      <View style={styles.compactCardLeft}>
        <View style={styles.compactImageContainer}>
          <Image
            source={{ uri: item.equipmentImage }}
            style={styles.compactImage}
          />
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {item.equipmentName}
          </Text>
          <Text style={styles.compactSubtitle}>Qty: {item.requestedQuantity}</Text>
          <Text style={styles.compactSubtitle}>{item.purpose}</Text>
        </View>
      </View>
      <View
        style={[
          styles.compactBadge,
          { backgroundColor: getApprovalStatusColor(item.status) },
        ]}
      >
        <Text style={styles.compactBadgeText}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Modern Header with Gradient Effect */}
      <View style={styles.header}>
        {activeTab !== 'equipment' && (
          <TouchableOpacity onPress={() => setActiveTab('equipment')} style={styles.backButton}>
            <FontAwesome name="arrow-left" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, activeTab !== 'equipment' && styles.headerTitleCenter]}>
            {getHeaderTitle()}
          </Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === 'equipment' ? 'Browse and reserve equipment' :
             activeTab === 'reservations' ? `${reservations.length} items` :
             `${approvals.length} pending`}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)} style={styles.hamburgerButton}>
          <FontAwesome name="bars" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {menuOpen && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity
            style={styles.menuBackdrop}
            onPress={() => setMenuOpen(false)}
            activeOpacity={1}
          />
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuHeaderButton}
              onPress={() => {
                onEditProfile();
                setMenuOpen(false);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.menuHeader}>
                {userInfo.imageUrl ? (
                  <Image
                    source={{ uri: userInfo.imageUrl }}
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.profileCircle}>
                    <Text style={styles.profileInitial}>{userInfo.initial}</Text>
                  </View>
                )}
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{userInfo.name}</Text>
                  <View style={styles.roleContainer}>
                    <FontAwesome
                      name={userInfo.role === 'Admin' ? 'shield' : 'user'}
                      size={10}
                      color="#666"
                      style={styles.roleIcon}
                    />
                    <Text style={styles.profileRole}>{userInfo.role}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onLogout();
                setMenuOpen(false);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemContent}>
                <View style={styles.menuIconCircle}>
                  <FontAwesome name="sign-out" size={16} color="#FF3B30" />
                </View>
                <Text style={styles.menuItemText}>Logout</Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setMenuOpen(false)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemContent}>
                <View style={styles.menuIconCircle}>
                  <FontAwesome name="headphones" size={16} color="#007AFF" />
                </View>
                <Text style={styles.menuItemText}>Support</Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {activeTab === 'equipment' && (
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => setActiveTab('reservations')}
              activeOpacity={0.7}
            >
              <View style={styles.statIconContainer}>
                <FontAwesome name="bookmark" size={24} color="#007AFF" />
              </View>
              <Text style={styles.statCount}>{reservations.length}</Text>
              <Text style={styles.statLabel}>Reservations</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => setActiveTab('approvals')}
              activeOpacity={0.7}
            >
              <View style={styles.statIconContainer}>
                <FontAwesome name="clock-o" size={24} color="#FF9500" />
              </View>
              <Text style={styles.statCount}>{approvals.length}</Text>
              <Text style={styles.statLabel}>Approvals</Text>
            </TouchableOpacity>
          </View>
          {userInfo.role === 'Admin' && onAdminReturnVerification && (
            <TouchableOpacity
              style={[styles.statCard, styles.adminCard]}
              onPress={onAdminReturnVerification}
              activeOpacity={0.7}
            >
              <View style={styles.adminCardContent}>
                <View style={styles.adminIconContainer}>
                  <FontAwesome name="check-circle" size={24} color="#FF9500" />
                </View>
                <View style={styles.adminTextContainer}>
                  <Text style={styles.adminCount}>{returnRequestsCount}</Text>
                  <Text style={styles.adminLabel}>Return Verifications</Text>
                </View>
                <FontAwesome name="chevron-right" size={16} color="#FF9500" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}

      {activeTab === 'equipment' && (
        <>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <FontAwesome name="search" size={16} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search equipment..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <FontAwesome name="times-circle" size={16} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading equipment...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredEquipment}
              renderItem={renderEquipmentCard}
              keyExtractor={(item) => item.id}
              numColumns={1}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#007AFF']}
                  tintColor="#007AFF"
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconContainer}>
                    <FontAwesome name="inbox" size={48} color="#007AFF" />
                  </View>
                  <Text style={styles.emptyText}>No equipment found</Text>
                  <Text style={styles.emptySubtext}>Try adjusting your search</Text>
                </View>
              }
            />
          )}
        </>
      )}

      {activeTab === 'reservations' && (
        <FlatList
          data={reservations}
          renderItem={renderReservationCard}
          keyExtractor={(item) => item.id}
          numColumns={1}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome name="calendar-o" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No active reservations</Text>
              <Text style={styles.emptySubtext}>Reserve equipment to see them here</Text>
            </View>
          }
        />
      )}

      {activeTab === 'approvals' && (
        <FlatList
          data={approvals}
          renderItem={renderApprovalCard}
          keyExtractor={(item) => item.id}
          numColumns={1}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome name="check-circle-o" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No pending approvals</Text>
              <Text style={styles.emptySubtext}>All caught up!</Text>
            </View>
          }
        />
      )}

      {/* Floating QR Scanner Button */}
      <TouchableOpacity
        style={styles.qrScanButton}
        onPress={onScanQR}
        activeOpacity={0.8}
      >
        <FontAwesome name="qrcode" size={28} color="#fff" />
      </TouchableOpacity>
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
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#007AFF',
  },
  dateContainer: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 11,
    color: '#999',
    marginRight: 8,
  },
  dateValue: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  purpose: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic',
  },
  requestedDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f8f9fa',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
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
  statusAvailable: {
    backgroundColor: '#34C759',
  },
  statusUnavailable: {
    backgroundColor: '#FF3B30',
  },
  statusMaintenance: {
    backgroundColor: '#FFA500',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  noImagePlaceholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  category: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  quantityIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  quantityItem: {
    flex: 1,
    alignItems: 'center',
  },
  quantityDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
  },
  quantityLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  quantityRed: {
    color: '#FF3B30',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  compactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  compactCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  compactImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  compactSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  compactBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  compactBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  adminCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF9F0',
    borderWidth: 2,
    borderColor: '#FF9500',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  adminCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adminIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  adminTextContainer: {
    flex: 1,
  },
  adminCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF9500',
    marginBottom: 2,
  },
  adminLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  statIcon: {
    marginBottom: 8,
  },
  statCount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitleCenter: {
    flex: 1,
    textAlign: 'center',
  },
  hamburgerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menu: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1001,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuHeaderButton: {
    width: '100%',
  },
  profileCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  roleIcon: {
    marginRight: 6,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  qrScanButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

