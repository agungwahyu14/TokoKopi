import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOrderStore } from '../../store/useOrderStore';

import { useAddresses } from '../../services/queries';

// Hapus SAVED_ADDRESSES statis karena sekarang menggunakan database

export default function SelectAddressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setDeliveryAddress } = useOrderStore();
  const [search, setSearch] = useState('');
  const { data: savedAddresses, isLoading } = useAddresses();

  const filteredAddresses = savedAddresses?.filter((addr: any) => 
    addr.label.toLowerCase().includes(search.toLowerCase()) || 
    addr.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectAddress = (addr: string, coords?: { latitude: number; longitude: number }) => {
    setDeliveryAddress(addr, coords);
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pilih Lokasi Pengiriman</Text>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#9E9E9E" />
            <TextInput
              placeholder="Cari alamat atau area..."
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* Map Option */}
        <TouchableOpacity 
          style={styles.mapOption}
          onPress={() => router.push({ pathname: '/address/map', params: { from: 'checkout' } })}
        >
          <View style={styles.mapIconCircle}>
            <Ionicons name="map-outline" size={22} color={Colors.primary} />
          </View>
          <View style={styles.mapTextContent}>
            <Text style={styles.mapTitle}>Pilih lewat Map</Text>
            <Text style={styles.mapSubtitle}>Pin point lokasi pengiriman lebih akurat</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Saved Addresses */}
        <Text style={styles.sectionTitle}>Alamat Tersimpan</Text>
        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
        ) : filteredAddresses && filteredAddresses.length > 0 ? (
          <FlatList
            data={filteredAddresses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.addressItem}
                onPress={() => handleSelectAddress(item.address, { latitude: parseFloat(item.latitude), longitude: parseFloat(item.longitude) })}
              >
                <View style={styles.addressIconCircle}>
                  <Ionicons name={item.label.toLowerCase() === 'rumah' ? 'home' : (item.label.toLowerCase() === 'kantor' ? 'briefcase' : 'location')} size={20} color="#757575" />
                </View>
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>{item.label}</Text>
                  <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#E0E0E0" />
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Belum ada alamat tersimpan</Text>
          </View>
        )}
      </View>

      {/* Action Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity 
          style={styles.newAddressBtn}
          onPress={() => router.push({ pathname: '/address/map', params: { from: 'checkout' } })}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.newAddressText}>Tambah Alamat Baru</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#212121' },
  content: { flex: 1, padding: 16 },
  searchSection: { marginBottom: 20 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15 },
  mapOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 24,
  },
  mapIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAEEDA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mapTextContent: { flex: 1 },
  mapTitle: { fontSize: 16, fontWeight: 'bold', color: '#212121' },
  mapSubtitle: { fontSize: 12, color: '#757575', marginTop: 2 },
  divider: { height: 8, backgroundColor: '#FAFAFA', marginHorizontal: -16, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#9E9E9E', textTransform: 'uppercase', marginBottom: 16 },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  addressIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressInfo: { flex: 1 },
  addressLabel: { fontSize: 15, fontWeight: 'bold', color: '#212121' },
  addressText: { fontSize: 13, color: '#757575', marginTop: 2 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  newAddressBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newAddressText: { color: 'white', fontSize: 15, fontWeight: 'bold', marginLeft: 8 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#9E9E9E', fontSize: 14 },
});
