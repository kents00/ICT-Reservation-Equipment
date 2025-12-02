import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { toast } from '../utils/Toast';
import { Equipment } from '../types/equipment';

interface QRScannerScreenProps {
  onGoBack: () => void;
  onEquipmentFound: (equipment: Equipment) => void;
}

export const QRScannerScreen: React.FC<QRScannerScreenProps> = ({
  onGoBack,
  onEquipmentFound,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    console.log('[QR Scanner] Scanned:', { type, data });

    try {
      const token = await AsyncStorage.getItem('access_token');

      const response = await fetch(`${API_BASE_URL}/equipment/qr/${encodeURIComponent(data)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Equipment not found');
        } else {
          toast.error('Failed to fetch equipment details');
        }
        setTimeout(() => {
          setScanned(false);
          setLoading(false);
        }, 2000);
        return;
      }

      const equipmentData = await response.json();
      console.log('[QR Scanner] Equipment found:', equipmentData);

      const equipment: Equipment = {
        id: equipmentData.id,
        name: equipmentData.name,
        title: equipmentData.name,
        description: equipmentData.description || '',
        category: equipmentData.category,
        quantity: equipmentData.quantity,
        quantityAvailable: equipmentData.quantity_available,
        location: equipmentData.location || 'Unknown',
        status: mapStatus(equipmentData.status),
        image: getImageUrl(equipmentData.image_url) || '',
        qrCode: equipmentData.qr_code,
        lastMaintenance: equipmentData.last_maintenance,
      };

      toast.success('Equipment found!');
      setTimeout(() => {
        onEquipmentFound(equipment);
      }, 500);
    } catch (error) {
      console.error('[QR Scanner] Error:', error);
      toast.error('Failed to process QR code');
      setTimeout(() => {
        setScanned(false);
        setLoading(false);
      }, 2000);
    }
  };

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

  const getImageUrl = (imageUrl: string | null): string | null => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}/${cleanPath}`;
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <FontAwesome name="camera" size={64} color="#ccc" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            Please grant camera access to scan QR codes
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.headerButton}>
          <FontAwesome name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <View style={styles.placeholder} />
      </View>

      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>

          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>
              {loading ? 'Processing...' : 'Align QR code within the frame'}
            </Text>
            {loading && <ActivityIndicator size="small" color="#fff" style={{ marginTop: 8 }} />}
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  placeholder: {
    width: 36,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    paddingVertical: 100,
  },
  scanArea: {
    alignSelf: 'center',
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#00FF00',
    borderWidth: 4,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#f5f5f5',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
