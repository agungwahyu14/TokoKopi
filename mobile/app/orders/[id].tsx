import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrderById, useOrderTracking } from '../../services/queries';
import { Colors } from '../../constants/Colors';
import { formatRupiah } from '../../utils/formatter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: order, isLoading, error } = useOrderById(id as string);
  const { data: tracking, isLoading: trackingLoading } = useOrderTracking(order?.status === 'on_delivery' ? id as string : '');

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Gagal memuat detail pesanan</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#4CAF50';
      case 'processing': return '#2196F3';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#F44336';
      default: return '#757575';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Pesanan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
         {/* Status Card */}
         <View style={styles.statusCard}>
           <View style={styles.statusHeader}>
             <Text style={styles.orderId}>Pesanan #{order.orderNumber || order.id}</Text>
             <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
               <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                 {order.status.toUpperCase()}
               </Text>
             </View>
           </View>
           <Text style={styles.orderDate}>
             {new Date(order.createdAt).toLocaleDateString('id-ID', { 
               day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
             })}
           </Text>
         </View>
 
         {/* Delivery Tracking Section */}
         {order.status === 'on_delivery' && (
           <View style={styles.section}>
             <View style={styles.sectionHeaderRow}>
               <Text style={styles.sectionTitle}>Status Pengiriman</Text>
               <View style={styles.liveBadge}>
                 <View style={styles.liveDot} />
                 <Text style={styles.liveText}>REAL-TIME</Text>
               </View>
             </View>
             
             {trackingLoading ? (
               <View style={styles.trackingLoading}>
                 <ActivityIndicator size="small" color={Colors.primary} />
                 <Text style={styles.trackingLoadingText}>Memperbarui pelacakan...</Text>
               </View>
             ) : tracking ? (
               <View style={styles.trackingCard}>
                 {/* Courier Info */}
                 <View style={styles.courierInfoRow}>
                   <View style={styles.courierIconBg}>
                     <Ionicons name="bicycle" size={24} color={Colors.primary} />
                   </View>
                   <View style={{ flex: 1 }}>
                     <Text style={styles.courierMainName}>{tracking.courier?.company || order.courierCode?.toUpperCase()}</Text>
                     <Text style={styles.courierServiceText}>{tracking.courier?.type || order.courierService}</Text>
                   </View>
                   {tracking.courier?.link && (
                      <TouchableOpacity style={styles.trackLinkBtn}>
                        <Text style={styles.trackLinkText}>Lacak</Text>
                      </TouchableOpacity>
                   )}
                 </View>
 
                 {/* Timeline */}
                 <View style={styles.timelineContainer}>
                   {tracking.history && tracking.history.map((step: any, index: number) => (
                     <View key={index} style={styles.timelineItem}>
                       <View style={styles.timelineLeft}>
                         <View style={[styles.timelineDot, index === 0 && styles.activeDot]} />
                         {index < tracking.history.length - 1 && <View style={styles.timelineLine} />}
                       </View>
                       <View style={styles.timelineRight}>
                         <Text style={[styles.timelineStatus, index === 0 && styles.activeStatus]}>
                           {step.status}
                         </Text>
                         <Text style={styles.timelineNote}>{step.note}</Text>
                         <Text style={styles.timelineTime}>
                           {new Date(step.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                         </Text>
                       </View>
                     </View>
                   ))}
                 </View>
               </View>
             ) : (
               <View style={styles.emptyTracking}>
                 <Text style={styles.emptyTrackingText}>Gagal mengambil data pelacakan kurir</Text>
               </View>
             )}
           </View>
         )}

        {/* Store Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lokasi Pengambilan/Toko</Text>
          <View style={styles.storeCard}>
            <Ionicons name="storefront-outline" size={24} color={Colors.primary} />
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{order.store?.name || 'Toko Kopi Jaya'}</Text>
              <Text style={styles.storeAddress}>{order.store?.address || 'Alamat toko tidak tersedia'}</Text>
            </View>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Pesanan</Text>
          {order.items.map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemMain}>
                <Text style={styles.itemName}>{item.quantity}x {item.product?.name}</Text>
                {item.options && (
                  <Text style={styles.itemOptions}>
                    {Object.values(item.options).join(', ')}
                  </Text>
                )}
              </View>
              <Text style={styles.itemPrice}>{formatRupiah(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatRupiah(order.subtotal)}</Text>
          </View>
          {order.shippingCost > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ongkos Kirim</Text>
              <Text style={styles.summaryValue}>{formatRupiah(order.shippingCost)}</Text>
            </View>
          )}
          {order.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#4CAF50' }]}>Diskon Promo</Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>-{formatRupiah(order.discount)}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pajak (10%)</Text>
            <Text style={styles.summaryValue}>{formatRupiah(order.tax)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalValue}>{formatRupiah(order.totalAmount)}</Text>
          </View>
          <View style={styles.paymentMethod}>
            <Ionicons name="wallet-outline" size={20} color="#757575" />
            <Text style={styles.paymentText}>Dibayar dengan {order.paymentMethod.toUpperCase()}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#212121' },
  scrollContent: { padding: 16 },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId: { fontSize: 18, fontWeight: 'bold', color: '#212121' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  orderDate: { fontSize: 14, color: '#757575' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#212121', marginBottom: 16 },
  storeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', padding: 16, borderRadius: 16 },
  storeInfo: { marginLeft: 16, flex: 1 },
  storeName: { fontSize: 15, fontWeight: 'bold', color: '#212121' },
  storeAddress: { fontSize: 13, color: '#757575', marginTop: 2 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  itemMain: { flex: 1 },
  itemName: { fontSize: 15, color: '#212121', fontWeight: '500' },
  itemOptions: { fontSize: 12, color: '#9E9E9E', marginTop: 4 },
  itemPrice: { fontSize: 15, fontWeight: 'bold', color: '#212121' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: '#757575' },
  summaryValue: { fontSize: 14, color: '#212121', fontWeight: '500' },
  totalRow: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#212121' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  paymentMethod: { flexDirection: 'row', alignItems: 'center', marginTop: 16, backgroundColor: '#F5F5F5', padding: 12, borderRadius: 12 },
  paymentText: { marginLeft: 10, fontSize: 13, color: '#757575', fontWeight: '500' },
  errorText: { fontSize: 16, color: '#757575', marginBottom: 20 },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: 'white', fontWeight: 'bold' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50', marginRight: 6 },
  liveText: { fontSize: 10, fontWeight: 'bold', color: '#4CAF50' },
  trackingLoading: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#F9F9F9', borderRadius: 16 },
  trackingLoadingText: { marginLeft: 12, fontSize: 13, color: '#757575' },
  trackingCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  courierInfoRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  courierIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  courierMainName: { fontSize: 15, fontWeight: 'bold', color: '#212121' },
  courierServiceText: { fontSize: 13, color: '#757575', marginTop: 2 },
  trackLinkBtn: { backgroundColor: Colors.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  trackLinkText: { fontSize: 12, fontWeight: 'bold', color: Colors.primary },
  timelineContainer: { padding: 16 },
  timelineItem: { flexDirection: 'row' },
  timelineLeft: { width: 30, alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0E0E0', zIndex: 1 },
  activeDot: { backgroundColor: Colors.primary, width: 12, height: 12, borderRadius: 6 },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#F0F0F0', marginVertical: 4 },
  timelineRight: { flex: 1, paddingBottom: 24, paddingLeft: 8 },
  timelineStatus: { fontSize: 14, fontWeight: '600', color: '#757575', textTransform: 'capitalize' },
  activeStatus: { color: '#212121', fontWeight: 'bold' },
  timelineNote: { fontSize: 13, color: '#757575', marginTop: 4, lineHeight: 18 },
  timelineTime: { fontSize: 11, color: '#9E9E9E', marginTop: 6 },
  emptyTracking: { padding: 20, backgroundColor: '#FFF9C4', borderRadius: 12 },
  emptyTrackingText: { fontSize: 13, color: '#F57F17', textAlign: 'center' },
});
