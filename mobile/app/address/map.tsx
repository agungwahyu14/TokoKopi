import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useOrderStore } from '../../store/useOrderStore';
import { useLocalSearchParams } from 'expo-router';
import CustomAlertModal from '../../components/CustomAlertModal';

const { width, height } = Dimensions.get('window');

export default function MapPickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { setDeliveryAddress } = useOrderStore();
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<any>(null);
  const [address, setAddress] = useState('Mencari alamat...');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [loading, setLoading] = useState(true);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Izin Diperlukan', 'Izin lokasi diperlukan untuk menentukan alamat pengiriman Anda pada peta.', 'error');
        setLoading(false);
        return;
      }

      let initialLocation = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setLocation(coords);
      reverseGeocode(coords.latitude, coords.longitude);
      setLoading(false);
    })();
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Menggunakan Nominatim API (OpenStreetMap) untuk akurasi kode pos yang lebih baik
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'TokoKopiJaya/1.0', // Nominatim mewajibkan User-Agent
          },
        }
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        // Format alamat: Jalan, Kelurahan, Kecamatan, Kota
        const formatted = `${addr.road || ''} ${addr.house_number || ''}, ${addr.village || addr.suburb || ''}, ${addr.city || addr.town || addr.city_district || ''}`;
        setAddress(formatted.replace(/^ , /, '').trim());
        setCity(addr.city || addr.town || addr.city_district || '');
        setPostalCode(addr.postcode || '');
      }
    } catch (error) {
      console.error('Nominatim error:', error);
      setAddress('Alamat tidak ditemukan');
      setCity('');
      setPostalCode('');
    }
  };

  const handleRegionChangeComplete = (region: any) => {
    setLocation(region);
    reverseGeocode(region.latitude, region.longitude);
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Menyiapkan Peta...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={location}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <UrlTile
          urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
      </MapView>

      {/* Static Center Marker */}
      <View style={styles.markerFixed} pointerEvents="none">
        <Ionicons name="location" size={40} color="#FF5252" />
      </View>

      {/* Header Overlay */}
      <View style={[styles.headerOverlay, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Geser Peta</Text>
        </View>
      </View>

      {/* Bottom Panel */}
      <View style={[styles.bottomPanel, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.addressCard}>
          <View style={styles.addressHeader}>
            <Ionicons name="location-sharp" size={20} color={Colors.primary} />
            <Text style={styles.addressLabel}>Lokasi Terpilih</Text>
          </View>
          <Text style={styles.addressText} numberOfLines={2}>
            {address}
          </Text>
          <TouchableOpacity 
            style={styles.confirmBtn}
            onPress={() => {
              if (params.from === 'checkout') {
                setDeliveryAddress(address, { latitude: location.latitude, longitude: location.longitude });
                router.dismiss(2); // Go back to checkout (select -> map)
              } else {
                router.push({
                  pathname: '/address/form',
                  params: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    address: address,
                    city: city,
                    postalCode: postalCode
                  }
                });
              }
            }}
          >
            <Text style={styles.confirmText}>Konfirmasi Lokasi</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating My Location Button */}
      <TouchableOpacity 
        style={styles.myLocationBtn}
        onPress={async () => {
          try {
            let loc = await Location.getCurrentPositionAsync({});
            const newRegion = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            };
            setLocation(newRegion);
            mapRef.current?.animateToRegion(newRegion, 1000);
            reverseGeocode(loc.coords.latitude, loc.coords.longitude);
          } catch (error) {
            console.error('Error getting current location:', error);
          }
        }}
      >
        <Ionicons name="locate" size={24} color={Colors.primary} />
      </TouchableOpacity>

      {/* Custom Alert Modal */}
      <CustomAlertModal
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#757575' },
  map: { width: width, height: height },
  markerFixed: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerTitleContainer: {
    flex: 1,
    backgroundColor: 'white',
    height: 44,
    borderRadius: 22,
    marginLeft: 12,
    justifyContent: 'center',
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerTitle: { fontSize: 14, fontWeight: 'bold', color: '#212121' },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
  },
  addressCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  addressHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  addressLabel: { fontSize: 12, color: '#9E9E9E', fontWeight: 'bold', marginLeft: 8, textTransform: 'uppercase' },
  addressText: { fontSize: 15, color: '#212121', lineHeight: 22, marginBottom: 20 },
  confirmBtn: {
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  myLocationBtn: {
    position: 'absolute',
    right: 20,
    bottom: 240,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
});
