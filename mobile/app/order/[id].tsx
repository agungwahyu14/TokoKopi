import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Image,
  Modal,
  Clipboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrderDetail, useCreatePayment, useTracking, useCreateRating, useAddToCart } from '../../services/queries';
import { Colors, API_URL } from '../../constants/Colors';
import { formatRupiah } from '../../utils/formatter';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import CustomAlertModal from '../../components/CustomAlertModal';
import CustomConfirmModal from '../../components/CustomConfirmModal';

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading, error } = useOrderDetail(id);
  const { data: tracking } = useTracking(id);
  const createPaymentMutation = useCreatePayment();
  const createRatingMutation = useCreateRating();
  const addToCartMutation = useAddToCart();

  const [ratingStars, setRatingStars] = useState(0);
  const [comment, setComment] = useState('');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' as 'success' | 'error' | 'info' });
  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{ title: string; message: string; confirmText: string; cancelText: string; iconName: any; onConfirm: () => void }>({ title: '', message: '', confirmText: 'Ya', cancelText: 'Batal', iconName: 'refresh-outline', onConfirm: () => {} });
  const showConfirm = (title: string, message: string, confirmText: string, iconName: string, onConfirm: () => void) => {
    setConfirmConfig({ title, message, confirmText, cancelText: 'Batal', iconName, onConfirm });
    setConfirmVisible(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#F44336" />
        <Text style={styles.errorText}>Gagal memuat detail pesanan</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusInfo = (status: string, orderType: string) => {
    const s = status.toLowerCase();
    
    if (s === 'pending' || s === 'pending_payment') {
      return { label: 'Menunggu Pembayaran', color: '#F59E0B', icon: 'time' };
    }

    if (s === 'confirmed') {
      return { label: 'Pesanan Dikonfirmasi', color: '#00BCD4', icon: 'checkmark-done' };
    }

    if (s === 'processing') {
      return { label: 'Makanan & Minuman Disiapkan', color: '#2196F3', icon: 'cafe' };
    }

    if (s === 'ready_for_pickup') {
      return { label: 'Selesai Disiapkan', color: '#4CAF50', icon: 'hand-left' };
    }

    if (s === 'on_delivery') {
      return { label: 'Pesanan Sedang Diantarkan', color: '#9C27B0', icon: 'bicycle' };
    }

    if (s === 'completed') {
      return { label: 'Pesanan Selesai', color: '#4CAF50', icon: 'checkmark-circle' };
    }

    if (s === 'cancelled') {
      return { label: 'Pesanan Dibatalkan', color: '#F44336', icon: 'close-circle' };
    }

    return { label: status, color: '#9E9E9E', icon: 'information-circle' };
  };

  const statusInfo = getStatusInfo(order.status, order.orderType);

  const handleSendRating = async () => {
    if (ratingStars === 0) {
      showAlert('Oops', 'Silakan pilih bintang terlebih dahulu sebelum mengirim ulasan.', 'info');
      return;
    }

    try {
      await createRatingMutation.mutateAsync({
        orderId: parseInt(id),
        stars: ratingStars,
        comment: comment || undefined
      });
      showAlert('Terima Kasih!', 'Ulasan Anda telah berhasil dikirim.', 'success');
    } catch (err: any) {
      showAlert('Gagal', err.response?.data?.message || 'Gagal mengirim ulasan', 'error');
    }
  };

  const handleRepay = async () => {
    // Jika sudah ada data VA, tampilkan modal saja
    if (order.vaNumber && order.bankName) {
      setPaymentModalVisible(true);
      return;
    }

    try {
      const response = await createPaymentMutation.mutateAsync(order.id);
      router.push({
        pathname: '/payment/webview' as any,
        params: { 
          token: response.token,
          orderNumber: response.orderNumber 
        }
      });
    } catch (err) {
      showAlert('Gagal', 'Gagal memproses pembayaran kembali. Silakan coba lagi.', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    showAlert('Disalin!', 'Nomor Virtual Account berhasil disalin ke clipboard.', 'success');
  };

  const handleReorder = async () => {
    showConfirm(
      'Pesan Lagi',
      'Ingin memasukkan semua menu ini ke keranjang Anda?',
      'Ya, Pesan',
      'cart-outline',
      async () => {
        try {
          const promises = order.items.map((item: any) => 
            addToCartMutation.mutateAsync({
              productId: item.productId,
              quantity: item.quantity,
              options: item.options,
              notes: item.notes
            })
          );
          await Promise.all(promises);
          router.push('/checkout');
        } catch (err) {
          showAlert('Gagal', 'Gagal menambahkan item ke keranjang.', 'error');
        }
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Pesanan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: statusInfo.color + '10' }]}>
          <View style={styles.statusHeader}>
            <Ionicons name={statusInfo.icon as any} size={24} color={statusInfo.color} />
            <Text style={[styles.statusLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
          <Text style={styles.orderNumberText}>Nomor Pesanan: {order.orderNumber}</Text>
          <Text style={styles.orderDateText}>
            {new Date(order.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </Text>
        </View>

        {/* Rating Section (Fase 3) */}
        {order.status === 'completed' && !order.rating && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={20} color="#FFB300" />
              <Text style={styles.sectionTitle}>Berikan Ulasan</Text>
            </View>
            <View style={[styles.card, styles.ratingCard]}>
              <Text style={styles.ratingHint}>Bagaimana rasa kopi Anda hari ini?</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRatingStars(star)}>
                    <Ionicons 
                      name={star <= ratingStars ? "star" : "star-outline"} 
                      size={40} 
                      color={star <= ratingStars ? "#FFB300" : "#E0E0E0"} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity 
                style={styles.sendRatingBtn}
                onPress={handleSendRating}
                disabled={createRatingMutation.isPending}
              >
                {createRatingMutation.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.sendRatingBtnText}>Kirim Ulasan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Existing Rating (If already rated) */}
        {order.rating && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={20} color="#FFB300" />
              <Text style={styles.sectionTitle}>Ulasan Anda</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.starsRowSmall}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons 
                    key={star} 
                    name={star <= order.rating.stars ? "star" : "star-outline"} 
                    size={20} 
                    color="#FFB300" 
                  />
                ))}
              </View>
              {order.rating.comment && (
                <Text style={styles.ratingComment}>"{order.rating.comment}"</Text>
              )}
            </View>
          </View>
        )}

        {/* Store/Location Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Lokasi Penjemputan</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.storeName}>{order.store?.name || 'Toko Kopi Jaya'}</Text>
            <Text style={styles.storeAddress}>{order.store?.address || 'Outlet Toko Kopi Jaya'}</Text>
          </View>
        </View>

        {/* Delivery Section (If Applicable) */}
        {order.orderType === 'delivery' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bicycle" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Informasi Pengiriman</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.deliveryInfoRow}>
                <View style={styles.deliveryIconContainer}>
                  <Ionicons name="home" size={20} color={Colors.primary} />
                </View>
                <View style={styles.deliveryTextContainer}>
                  <Text style={styles.deliveryLabel}>Alamat Pengiriman</Text>
                  <Text style={styles.deliveryValue}>{order.deliveryAddress}</Text>
                </View>
              </View>

              <View style={[styles.deliveryInfoRow, { marginTop: 12 }]}>
                <View style={styles.deliveryIconContainer}>
                  <Ionicons name="person" size={20} color={Colors.primary} />
                </View>
                <View style={styles.deliveryTextContainer}>
                  <Text style={styles.deliveryLabel}>Penerima</Text>
                  <Text style={styles.deliveryValue}>{order.receiverName} ({order.receiverPhone})</Text>
                </View>
              </View>

              <View style={[styles.deliveryInfoRow, { marginTop: 12 }]}>
                <View style={styles.deliveryIconContainer}>
                  <Ionicons name="cube" size={20} color={Colors.primary} />
                </View>
                <View style={styles.deliveryTextContainer}>
                  <Text style={styles.deliveryLabel}>Kurir</Text>
                  <Text style={styles.deliveryValue}>{order.courierCode?.toUpperCase()} - {order.courierService}</Text>
                </View>
              </View>

              {tracking?.link && (
                <TouchableOpacity 
                  style={styles.trackLiveBtn}
                  onPress={() => Linking.openURL(tracking.link)}
                >
                  <Ionicons name="map" size={20} color="white" />
                  <Text style={styles.trackLiveBtnText}>Lacak Live (Biteship)</Text>
                </TouchableOpacity>
              )}

              {tracking?.status && (
                <View style={styles.trackingStatusBadge}>
                  <Text style={styles.trackingStatusText}>
                    Status Terakhir: {tracking.status_description || tracking.status}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Order Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cafe" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Menu yang Dipesan</Text>
          </View>
          <View style={styles.card}>
            {order.items?.map((item: any) => (
              <View key={item.id} style={styles.itemRow}>
                <Image 
                  source={{ 
                    uri: item.product?.imageUrl 
                      ? (item.product.imageUrl.startsWith('http') ? item.product.imageUrl : `${API_URL.replace('/api', '')}${item.product.imageUrl}`) 
                      : 'https://via.placeholder.com/150x150?text=Kopi' 
                  }} 
                  style={styles.itemImage}
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.quantity}x {item.product?.name}</Text>
                  {item.options && (
                    <Text style={styles.itemOptions}>{Object.values(item.options).join(', ')}</Text>
                  )}
                  <Text style={styles.itemPrice}>{formatRupiah(item.unitPrice * item.quantity)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Ringkasan Pembayaran</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatRupiah(order.subtotal)}</Text>
            </View>
            {order.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#4CAF50' }]}>Diskon</Text>
                <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>-{formatRupiah(order.discount)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pajak (10%)</Text>
              <Text style={styles.summaryValue}>{formatRupiah(order.tax)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Bayar</Text>
              <Text style={styles.totalValue}>{formatRupiah(order.finalAmount)}</Text>
            </View>
            <View style={styles.methodBadge}>
              <Text style={styles.methodText}>Metode: {order.paymentMethod?.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Action for Re-Payment */}
      {(order.status === 'pending' || order.status === 'pending_payment') && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.payNowBtn}
            onPress={handleRepay}
            disabled={createPaymentMutation.isPending}
          >
            {createPaymentMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.payNowBtnText}>Bayar Sekarang</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Action for Re-Order */}
      {(order.status === 'completed' || order.status === 'cancelled') && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.payNowBtn}
            onPress={handleReorder}
          >
            <Text style={styles.payNowBtnText}>Pesan Lagi</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Payment VA Modal */}
      <Modal
        visible={paymentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Pembayaran</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.bankLabel}>Virtual Account {order.bankName?.toUpperCase()}</Text>
              <View style={styles.vaRow}>
                <Text style={styles.vaNumber}>{order.vaNumber}</Text>
                <TouchableOpacity onPress={() => copyToClipboard(order.vaNumber || '')}>
                  <Ionicons name="copy-outline" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.totalPaymentBox}>
                <Text style={styles.totalPaymentLabel}>Total Pembayaran</Text>
                <Text style={styles.totalPaymentValue}>{formatRupiah(order.finalAmount)}</Text>
              </View>

              <View style={styles.instructionBox}>
                <Text style={styles.instructionTitle}>Cara Pembayaran:</Text>
                <Text style={styles.instructionStep}>1. Salin nomor Virtual Account di atas</Text>
                <Text style={styles.instructionStep}>2. Gunakan Mobile Banking atau ATM bank Anda</Text>
                <Text style={styles.instructionStep}>3. Masukkan nomor VA dan konfirmasi nominal</Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setPaymentModalVisible(false)}
              >
                <Text style={styles.modalCloseBtnText}>Tutup</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalWebviewBtn}
                onPress={() => {
                  setPaymentModalVisible(false);
                  router.push({
                    pathname: '/payment/webview' as any,
                    params: { 
                      token: order.paymentToken,
                      orderNumber: order.orderNumber 
                    }
                  });
                }}
              >
                <Text style={styles.modalWebviewBtnText}>Buka Midtrans</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlertModal
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />

      <CustomConfirmModal
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        onConfirm={() => {
          setConfirmVisible(false);
          confirmConfig.onConfirm();
        }}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        iconName={confirmConfig.iconName}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorText: { fontSize: 16, color: '#757575', marginTop: 16, textAlign: 'center' },
  backBtn: { marginTop: 24, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.primary },
  backBtnText: { color: 'white', fontWeight: 'bold' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerBack: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#212121' },
  scrollContent: { padding: 16 },
  statusCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusLabel: { fontSize: 20, fontWeight: 'bold', marginLeft: 8 },
  orderNumberText: { fontSize: 13, color: '#616161', marginBottom: 4 },
  orderDateText: { fontSize: 12, color: '#9E9E9E' },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#757575', marginLeft: 8, textTransform: 'uppercase' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  storeName: { fontSize: 16, fontWeight: 'bold', color: '#212121' },
  storeAddress: { fontSize: 13, color: '#757575', marginTop: 4 },
  deliveryInfoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  deliveryIconContainer: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#F5F5F5', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 12 
  },
  deliveryTextContainer: { flex: 1 },
  deliveryLabel: { fontSize: 11, color: '#9E9E9E', fontWeight: 'bold', textTransform: 'uppercase' },
  deliveryValue: { fontSize: 13, color: '#212121', marginTop: 2, fontWeight: '500' },
  trackLiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  trackLiveBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 14 },
  trackingStatusBadge: {
    marginTop: 12,
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  trackingStatusText: { fontSize: 12, color: '#616161', fontStyle: 'italic' },
  itemRow: { flexDirection: 'row', marginBottom: 16 },
  itemImage: { width: 64, height: 64, borderRadius: 12 },
  itemDetails: { flex: 1, marginLeft: 16 },
  itemName: { fontSize: 14, fontWeight: 'bold', color: '#212121' },
  itemOptions: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  itemPrice: { fontSize: 14, color: Colors.primary, fontWeight: 'bold', marginTop: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: '#757575' },
  summaryValue: { fontSize: 14, color: '#212121', fontWeight: '600' },
  totalRow: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#212121' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  methodBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
  },
  methodText: { fontSize: 11, fontWeight: 'bold', color: '#757575' },
  ratingCard: { alignItems: 'center', padding: 24 },
  ratingHint: { fontSize: 14, color: '#616161', marginBottom: 16 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  starsRowSmall: { flexDirection: 'row', marginBottom: 8 },
  ratingComment: { fontSize: 14, color: '#424242', fontStyle: 'italic' },
  sendRatingBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  sendRatingBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  modalBody: {
    marginBottom: 24,
  },
  bankLabel: {
    fontSize: 12,
    color: '#757575',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  vaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  vaNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 1,
  },
  totalPaymentBox: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
    paddingVertical: 16,
    marginBottom: 20,
  },
  totalPaymentLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  totalPaymentValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
  },
  instructionBox: {
    backgroundColor: '#FFF9C4',
    padding: 16,
    borderRadius: 12,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F57F17',
    marginBottom: 8,
  },
  instructionStep: {
    fontSize: 12,
    color: '#616161',
    marginBottom: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCloseBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#757575',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalWebviewBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalWebviewBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  payNowBtn: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payNowBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
