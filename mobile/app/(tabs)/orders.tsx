import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useOrders } from '../../services/queries';
import { useUserStore } from '../../store/useStore';
import { formatRupiah } from '../../utils/formatter';

export default function OrdersScreen() {
  const router = useRouter();
  const { data: orders, isLoading, refetch } = useOrders();
  const { user } = useUserStore();

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (!user || user.isGuest) {
      router.replace('/login');
    }
  }, [user]);

  const getStatusInfo = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'pending':
      case 'pending_payment':
        return { label: 'Menunggu Pembayaran', color: '#F59E0B' };
      case 'confirmed':
        return { label: 'Pesanan Dikonfirmasi', color: '#00BCD4' };
      case 'processing':
        return { label: 'Makanan & Minuman Disiapkan', color: '#2196F3' };
      case 'ready_for_pickup':
        return { label: 'Selesai Disiapkan', color: '#4CAF50' };
      case 'on_delivery':
        return { label: 'Sedang Diantarkan', color: '#9C27B0' };
      case 'completed':
        return { label: 'Selesai', color: '#4CAF50' };
      case 'cancelled':
        return { label: 'Dibatalkan', color: '#F44336' };
      default:
        return { label: status, color: '#9E9E9E' };
    }
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="receipt-outline" size={80} color="#E0E0E0" />
      </View>
      <Text style={styles.emptyTitle}>Belum Ada Pesanan</Text>
      <Text style={styles.emptyDesc}>Sepertinya Anda belum melakukan pemesanan hari ini.</Text>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/')}>
        <Text style={styles.backBtnText}>Pesan Sekarang</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Pesanan</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Ionicons name="refresh-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContainer}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() => router.push(`/order/${item.id}` as any)}
          >
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderId}>Order #{item.orderNumber || item.id}</Text>
                <Text style={styles.orderDate}>
                  {new Date(item.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
              {/* <View style={[styles.statusBadge, { backgroundColor: getStatusInfo(item.status).color + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusInfo(item.status).color }]}>
                  {getStatusInfo(item.status).label}
                </Text>
              </View> */}
            </View>

            <View style={styles.orderDivider} />

            <View style={styles.orderSummary}>
              <View style={styles.storeInfo}>
                <Ionicons name="location-outline" size={14} color="#757575" />
                <Text style={styles.storeName}>{item.store?.name || 'Outlet Toko Kopi Jaya'}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.itemCount}>{item.items?.length || 0} Menu</Text>
                <Text style={styles.totalAmount}>{formatRupiah(item.totalAmount)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.reorderBtn}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.reorderText}>Pesan Lagi</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  listContainer: { padding: 16, paddingBottom: 100 },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#212121' },
  orderDate: { fontSize: 12, color: '#9E9E9E', marginTop: 4 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  orderDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 12,
  },
  orderSummary: {
    marginBottom: 16,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  storeName: { fontSize: 13, color: '#757575', marginLeft: 4 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: { fontSize: 14, color: '#424242' },
  totalAmount: { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
  reorderBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  reorderText: { color: Colors.primary, fontSize: 14, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#212121' },
  emptyDesc: { color: '#9E9E9E', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  backBtn: { marginTop: 24, backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
  backBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
