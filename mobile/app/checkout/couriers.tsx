import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useCart, useShippingRates } from '../../services/queries';
import { useOrderStore } from '../../store/useOrderStore';
import { formatRupiah } from '../../utils/formatter';

export default function SelectCourierScreen() {
  const router = useRouter();
  const {
    selectedStore,
    deliveryCoords,
    deliveryCourier,
    setDeliveryCourier
  } = useOrderStore();

  const { data: cartItems } = useCart();
  const { data: shippingRates, isLoading, error: shippingError } = useShippingRates(
    deliveryCoords && selectedStore?.id ? {
      storeId: selectedStore?.id,
      destinationLatitude: deliveryCoords.latitude,
      destinationLongitude: deliveryCoords.longitude,
      items: cartItems?.map((item: any) => ({
        name: item.product.name,
        value: item.product.price,
        quantity: item.quantity,
        weight: 200 // Estimasi 200g per item
      }))
    } : null
  );

  // Debug: Log current state
  console.log('=== Courier Screen Debug ===');
  console.log('deliveryCoords:', JSON.stringify(deliveryCoords));
  console.log('selectedStore:', selectedStore?.id, selectedStore?.name);
  console.log('shippingRates:', shippingRates?.length, 'items');
  console.log('shippingError:', shippingError?.message);
  console.log('cartItems:', cartItems?.length, 'items');

  const handleSelect = (courier: any) => {
    setDeliveryCourier(courier);
    router.back();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pilih Pengiriman</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Mencari kurir terbaik...</Text>
        </View>
      ) : !deliveryCoords ? (
        <View style={styles.centerContainer}>
          <Ionicons name="location-outline" size={60} color="#E0E0E0" />
          <Text style={styles.errorTitle}>Alamat belum dipilih</Text>
          <Text style={styles.errorText}>Pilih alamat pengiriman terlebih dahulu dari halaman checkout.</Text>
        </View>
      ) : !selectedStore?.id ? (
        <View style={styles.centerContainer}>
          <Ionicons name="storefront-outline" size={60} color="#E0E0E0" />
          <Text style={styles.errorTitle}>Toko belum dipilih</Text>
          <Text style={styles.errorText}>Pilih toko asal pengiriman terlebih dahulu.</Text>
        </View>
      ) : shippingError ? (
        <View style={styles.centerContainer}>
          <Ionicons name="cloud-offline-outline" size={60} color="#E0E0E0" />
          <Text style={styles.errorTitle}>Gagal memuat kurir</Text>
          <Text style={styles.errorText}>{(shippingError as any)?.response?.data?.message || (shippingError as any)?.message || 'Terjadi kesalahan saat menghubungi server.'}</Text>
        </View>
      ) : !shippingRates || shippingRates.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="bicycle-outline" size={60} color="#E0E0E0" />
          <Text style={styles.errorTitle}>Kurir tidak tersedia</Text>
          <Text style={styles.errorText}>Tidak ada kurir tersedia untuk rute ini. Pastikan jarak tidak melebihi 40km dari toko.</Text>
          <View style={styles.debugBox}>
            <Text style={styles.debugText}>📍 Toko: {selectedStore?.name}</Text>
            <Text style={styles.debugText}>📌 Koordinat tujuan: {deliveryCoords?.latitude?.toFixed(4)}, {deliveryCoords?.longitude?.toFixed(4)}</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={shippingRates}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelected =
              deliveryCourier?.courier_code === item.courier_code &&
              deliveryCourier?.courier_service_code === item.courier_service_code;

            return (
              <TouchableOpacity
                style={[styles.courierCard, isSelected && styles.selectedCard]}
                onPress={() => handleSelect(item)}
              >
                <View style={styles.courierIconContainer}>
                  <Ionicons
                    name={item.courier_code === 'grab' || item.courier_code === 'gosend' ? 'flash' : 'cube-outline'}
                    size={24}
                    color={Colors.primary}
                  />
                </View>
                <View style={styles.courierInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.courierName}>{item.courier_name}</Text>
                    <Text style={styles.courierPrice}>{formatRupiah(item.price)}</Text>
                  </View>
                  <Text style={styles.serviceName}>{item.courier_service_name}</Text>
                  <View style={styles.etaContainer}>
                    <Ionicons name="time-outline" size={14} color="#757575" />
                    <Text style={styles.etaText}>Estimasi: {item.duration || 'Dalam waktu dekat'}</Text>
                  </View>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',

  },
  backButton: {
    width: 40,
    height: 40,

    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 15,
    color: '#757575',
    fontSize: 14,
  },
  errorText: {
    marginTop: 8,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 13,
  },
  errorTitle: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
    textAlign: 'center',
  },
  debugBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    width: '100%',
  },
  debugText: {
    fontSize: 12,
    color: '#616161',
    marginBottom: 4,
  },
  listContent: {
    padding: 20,
  },
  courierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  selectedCard: {
    borderColor: Colors.primary,
    backgroundColor: '#FAEEDA',
  },
  courierIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  courierInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  courierName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  courierPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  serviceName: {
    fontSize: 13,
    color: '#616161',
    marginBottom: 6,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaText: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 4,
  },
});
