import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomAlertModal from '../../components/CustomAlertModal';
import { Colors } from '../../constants/Colors';
import { useCart, useCheckout, useCreatePayment, useNearbyStores, usePromos, useShippingRates } from '../../services/queries';
import { useOrderStore } from '../../store/useOrderStore';
import { useUserStore } from '../../store/useStore';
import { formatRupiah } from '../../utils/formatter';

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: cartItems, isLoading: cartLoading } = useCart();
  const { data: promos } = usePromos();
  const { user } = useUserStore();
  const {
    selectedStore,
    orderType,
    setOrderType,
    selectedPromo,
    setSelectedPromo,
    paymentMethod,
    setPaymentMethod,
    deliveryCourier,
    setDeliveryCourier,
    deliveryAddress,
    deliveryCoords
  } = useOrderStore();

  const { data: shippingRates, isLoading: shippingLoading } = useShippingRates(
    deliveryCoords ? {
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

  const [promoModalVisible, setPromoModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [notes, setNotes] = useState('');

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'error' as 'success' | 'error' | 'info' });
  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };
  const [location, setLocation] = useState<any>(null);

  const { data: stores } = useNearbyStores(location?.latitude, location?.longitude);
  const { setSelectedStore } = useOrderStore();
  const checkoutMutation = useCheckout();
  const createPaymentMutation = useCreatePayment();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let currentLoc = await Location.getCurrentPositionAsync({});
        setLocation(currentLoc.coords);
      }
    })();
  }, []);

  useEffect(() => {
    if (stores && stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0]);
    }
  }, [stores, selectedStore]);

  const calculateSubtotal = () => {
    if (!cartItems) return 0;
    return cartItems.reduce((total: number, item: any) => total + (item.product.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    if (!selectedPromo) return 0;
    const subtotal = calculateSubtotal();

    // Cek minimal belanja
    if (subtotal < (selectedPromo.minSpend || 0)) return 0;

    let discount = 0;
    if (selectedPromo.type === 'percent') {
      discount = (subtotal * selectedPromo.value) / 100;
      // Cek maksimal diskon
      if (selectedPromo.maxDiscount && discount > selectedPromo.maxDiscount) {
        discount = selectedPromo.maxDiscount;
      }
    } else {
      discount = selectedPromo.value;
    }
    return discount;
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return (subtotal - discount) * 0.1;
  };

  const calculateTotal = () => {
    const shipping = orderType === 'delivery' && deliveryCourier ? (deliveryCourier.price || 0) : 0;
    return calculateSubtotal() - calculateDiscount() + calculateTax() + shipping;
  };

  const isFormValid = () => {
    if (!selectedStore) return false;
    if (orderType === 'delivery' && (!deliveryAddress || !deliveryCourier)) return false;
    if (!paymentMethod) return false;
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!user || user.isGuest) {
      router.push('/login');
      return;
    }

    try {
      const response = await checkoutMutation.mutateAsync({
        storeId: selectedStore.id,
        orderType: orderType,
        paymentMethod: paymentMethod,
        promoCode: selectedPromo?.code || null,
        shippingCost: orderType === 'delivery' ? (deliveryCourier?.price || 0) : 0,
        deliveryAddress: deliveryAddress,
        deliveryLatitude: deliveryCoords?.latitude,
        deliveryLongitude: deliveryCoords?.longitude,
        receiverName: user?.name,
        receiverPhone: user?.phone,
        courierCode: deliveryCourier?.courier_code,
        courierService: deliveryCourier?.courier_service_code,
        notes: notes || ''
      });

      if (response.success) {
        setSelectedPromo(null);

        try {
          // Langsung buat token pembayaran Midtrans
          const paymentResponse = await createPaymentMutation.mutateAsync(response.data.id);

          // Langsung buka WebView Midtrans
          router.replace({
            pathname: '/payment/webview' as any,
            params: {
              token: paymentResponse.token,
              orderNumber: paymentResponse.orderNumber,
              orderId: response.data.id
            }
          });
        } catch (paymentError) {
          console.error('Payment token error:', paymentError);
          // Jika gagal buat token, tetap arahkan ke halaman sukses (status pending)
          router.replace({
            pathname: '/payment/success' as any,
            params: {
              orderNumber: response.data.orderNumber,
              status: 'pending',
              orderId: response.data.id
            }
          });
        }
      }
    } catch (error: any) {
      showAlert('Gagal', error.response?.data?.message || 'Terjadi kesalahan saat memproses pesanan.', 'error');
    }
  };

  if (cartLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Konfirmasi Pesanan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>
        {/* Order Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pilih Metode</Text>
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[styles.typeBtn, orderType === 'pickup' && styles.activeTypeBtn]}
              onPress={() => setOrderType('pickup')}
            >
              <Ionicons name="walk" size={20} color={orderType === 'pickup' ? 'white' : '#757575'} />
              <Text style={[styles.typeBtnText, orderType === 'pickup' && styles.activeTypeBtnText]}>Pickup</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, orderType === 'delivery' && styles.activeTypeBtn]}
              onPress={() => setOrderType('delivery')}
            >
              <Ionicons name="bicycle" size={20} color={orderType === 'delivery' ? 'white' : '#757575'} />
              <Text style={[styles.typeBtnText, orderType === 'delivery' && styles.activeTypeBtnText]}>Delivery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lokasi</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Ionicons name="location" size={20} color={Colors.primary} />
              <Text style={styles.locationLabel}>
                {orderType === 'pickup' ? 'Ambil pesananmu di' : 'Pesananmu dikirim dari'}
              </Text>
            </View>
            <Text style={styles.storeName}>{selectedStore?.name || 'Pilih Toko Terlebih Dahulu'}</Text>
            <Text style={styles.storeAddress}>{selectedStore?.address}</Text>

            {orderType === 'delivery' && (
              <View style={styles.deliveryAddressSection}>
                <View style={styles.divider} />
                <View style={styles.locationHeader}>
                  <Ionicons name="home" size={20} color={Colors.primary} />
                  <Text style={styles.locationLabel}>Dikirim ke</Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/address/select')}
                  style={styles.addressSelector}
                >
                  <Text style={styles.addressText} numberOfLines={2}>
                    {deliveryAddress || 'Pilih Alamat Pengiriman'}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#BDBDBD" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Delivery Courier (Only if Delivery) */}
        {orderType === 'delivery' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pilih Pengiriman</Text>
            <TouchableOpacity
              style={styles.selectorBtn}
              onPress={() => router.push('/checkout/couriers')}
            >
              <View style={styles.selectorLeft}>
                <Ionicons name="bicycle-outline" size={20} color={Colors.primary} />
                <Text style={styles.selectorText}>
                  {deliveryCourier ? `${deliveryCourier.courier_name} (${deliveryCourier.courier_service_name})` : 'Pilih Kurir Pengiriman'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {deliveryCourier && (
                  <Text style={{ marginRight: 8, fontWeight: 'bold', color: Colors.primary }}>
                    {formatRupiah(deliveryCourier.price)}
                  </Text>
                )}
                <Ionicons name="chevron-forward" size={18} color="#BDBDBD" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catatan Pesanan (Opsional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Contoh: Kurangi gula, titip di satpam..."
            placeholderTextColor="#9E9E9E"
            multiline
          />
        </View>

        {/* Items Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rincian Pesanan</Text>
          <View style={styles.itemsCard}>
            {cartItems?.map((item: any) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.quantity}x {item.product.name}</Text>
                  {item.options && (
                    <Text style={styles.itemOptions}>{Object.values(item.options).join(', ')}</Text>
                  )}
                </View>
                <Text style={styles.itemPrice}>{formatRupiah(item.product.price * item.quantity)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Voucher & Payment */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.selectorBtn}
            onPress={() => router.push('/checkout/promos' as any)}
          >
            <View style={styles.selectorLeft}>
              <Ionicons name="pricetag-outline" size={20} color={Colors.primary} />
              <Text style={styles.selectorText}>{selectedPromo ? selectedPromo.title : 'Pilih Voucher'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#BDBDBD" />
          </TouchableOpacity>
        </View>

        {/* Cost Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatRupiah(calculateSubtotal())}</Text>
            </View>
            {selectedPromo && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#4CAF50' }]}>Diskon Promo</Text>
                <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>-{formatRupiah(calculateDiscount())}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pajak (10%)</Text>
              <Text style={styles.summaryValue}>{formatRupiah(calculateTax())}</Text>
            </View>
            {orderType === 'delivery' && deliveryCourier && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Ongkos Kirim</Text>
                <Text style={styles.summaryValue}>{formatRupiah(deliveryCourier.price)}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, { marginTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 }]}>
              <Text style={styles.totalLabel}>Total Pembayaran</Text>
              <Text style={styles.totalValue}>{formatRupiah(calculateTotal())}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Footer Button */}
      <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[styles.placeOrderBtn, (!isFormValid() || checkoutMutation.isPending) && styles.disabledBtn]}
          onPress={handlePlaceOrder}
          disabled={!isFormValid() || checkoutMutation.isPending}
        >
          {checkoutMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.placeOrderBtnText}>
              Pesan Sekarang — {formatRupiah(calculateTotal())}
            </Text>
          )}
        </TouchableOpacity>
      </View>

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
  container: { flex: 1, backgroundColor: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#212121' },
  scrollContent: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#212121', marginBottom: 12 },
  typeToggle: { flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 4 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8 },
  activeTypeBtn: { backgroundColor: Colors.primary },
  typeBtnText: { marginLeft: 8, fontSize: 14, color: '#757575', fontWeight: '600' },
  activeTypeBtnText: { color: 'white' },
  locationCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F0F0F0', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  locationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  locationLabel: { fontSize: 12, color: '#9E9E9E', fontWeight: 'bold', marginLeft: 8 },
  storeName: { fontSize: 16, fontWeight: 'bold', color: '#212121' },
  storeAddress: { fontSize: 13, color: '#757575', marginTop: 4 },
  deliveryAddressSection: { marginTop: 15 },
  divider: { height: 1, backgroundColor: '#F5F5F5', marginVertical: 15 },
  addressSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addressText: { flex: 1, fontSize: 14, color: '#212121', fontWeight: '500' },
  courierList: { flexDirection: 'row', gap: 12 },
  courierBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0', backgroundColor: '#fff' },
  activeCourierBtn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  courierText: { fontSize: 13, fontWeight: 'bold', color: '#757575', marginRight: 6 },
  activeCourierText: { color: 'white' },
  itemsCard: { backgroundColor: '#F9F9F9', borderRadius: 16, padding: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, color: '#212121', fontWeight: '500' },
  itemOptions: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: 'bold', color: '#212121' },
  selectorBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0', marginBottom: 12 },
  selectorLeft: { flexDirection: 'row', alignItems: 'center' },
  selectorText: { marginLeft: 12, fontSize: 14, color: '#212121', fontWeight: '600' },
  summaryCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: '#757575' },
  summaryValue: { fontSize: 14, color: '#212121', fontWeight: '500' },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#212121' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  stickyFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  placeOrderBtn: { backgroundColor: Colors.primary, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  placeOrderBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  disabledBtn: { backgroundColor: '#E0E0E0' },
  notesInput: {
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    color: '#212121',
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#212121' },
  modalItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  activeModalItem: { backgroundColor: '#FAEEDA', borderRadius: 12 },
  promoTitle: { fontSize: 14, fontWeight: 'bold', color: '#212121' },
  promoInfo: { flex: 1 },
  promoDesc: { fontSize: 12, color: '#757575', marginTop: 4 },
  promoLimit: { fontSize: 11, color: Colors.primary, fontWeight: 'bold', marginTop: 4 },
  paymentMethodText: { fontSize: 15, fontWeight: 'bold', color: '#212121' },
});
