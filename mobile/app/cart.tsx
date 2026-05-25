import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomAlertModal from '../components/CustomAlertModal';
import { API_URL, Colors } from '../constants/Colors';
import { useCart, useClearCart, useCheckout as useCreateOrder, useRemoveFromCart, useUpdateCartItem } from '../services/queries';
import { formatRupiah } from '../utils/formatter';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: cartItems, isLoading } = useCart();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveFromCart();
  const clearMutation = useClearCart();
  const createOrderMutation = useCreateOrder();

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

  const handleUpdateQuantity = async (id: number, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(id);
      return;
    }
    try {
      await updateMutation.mutateAsync({ id, quantity: newQuantity });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    } catch (error) {
      showAlert('Gagal', 'Gagal memperbarui jumlah item di keranjang.', 'error');
    }
  };

  const handleRemoveItem = async (id: number) => {
    try {
      await removeMutation.mutateAsync(id);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    } catch (error) {
      showAlert('Gagal', 'Gagal menghapus item dari keranjang.', 'error');
    }
  };

  const handleClearCart = async () => {
    try {
      await clearMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    } catch (error) {
      showAlert('Gagal', 'Gagal mengosongkan keranjang belanja.', 'error');
    }
  };

  const handleCheckout = async () => {
    try {
      const totalAmount = calculateTotal();
      // Default checkout payload - bisa dikembangkan dengan pilihan store/tipe
      const payload = {
        orderType: 'pickup', // Default pickup
        paymentMethod: 'midtrans', // Akan dipilih di halaman /payment
      };

      const response = await createOrderMutation.mutateAsync(payload);

      if (response.success) {
        const orderId = response.data.id;
        router.push({
          pathname: '/payment',
          params: { orderId, totalAmount }
        });
      }
    } catch (error: any) {
      showAlert('Gagal', error.response?.data?.message || 'Gagal membuat pesanan.', 'error');
    }
  };

  const calculateTotal = () => {
    if (!cartItems) return 0;
    return cartItems.reduce((total: number, item: any) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={80} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>Keranjang Kosong</Text>
      <Text style={styles.emptySubtitle}>Ayo cari kopi favoritmu sekarang!</Text>
      <TouchableOpacity
        style={styles.browseBtn}
        onPress={() => router.push('/(tabs)/menu')}
      >
        <Text style={styles.browseBtnText}>Lihat Menu</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Keranjang Saya</Text>
        {cartItems && cartItems.length > 0 && (
          <TouchableOpacity onPress={handleClearCart}>
            <Text style={styles.clearText}>Hapus Semua</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmptyCart}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Image
              source={{
                uri: item.product.imageUrl
                  ? (item.product.imageUrl.startsWith('http') ? item.product.imageUrl : `${API_URL.replace('/api', '')}${item.product.imageUrl}`)
                  : 'https://via.placeholder.com/300x300?text=Kopi'
              }}
              style={styles.productImage}
            />
            <View style={styles.itemInfo}>
              <View style={styles.itemHeader}>
                <Text style={styles.productName} numberOfLines={1}>{item.product.name}</Text>
                <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                  <Ionicons name="trash-outline" size={18} color="#FF5252" />
                </TouchableOpacity>
              </View>

              {item.options && (
                <Text style={styles.optionsText}>
                  {Object.values(item.options).join(', ')}
                </Text>
              )}

              <View style={styles.itemFooter}>
                <Text style={styles.productPrice}>{formatRupiah(item.product.price)}</Text>
                <View style={styles.counter}>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                  >
                    <Ionicons name="remove" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                  >
                    <Ionicons name="add" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      />

      {cartItems && cartItems.length > 0 && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Harga</Text>
            <Text style={styles.totalValue}>{formatRupiah(calculateTotal())}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => router.push('/checkout')}
          >
            <Text style={styles.checkoutBtnText}>Lanjut ke Pembayaran</Text>
          </TouchableOpacity>
        </View>
      )}
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
  safeArea: { flex: 1, backgroundColor: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,

  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#212121' },
  clearText: { color: '#FF5252', fontSize: 14, fontWeight: '600' },
  listContent: { padding: 16 },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  productImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#F5F5F5' },
  itemInfo: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#212121', flex: 1, marginRight: 8 },
  optionsText: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  productPrice: { fontSize: 14, fontWeight: 'bold', color: Colors.primary },
  counter: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 20, padding: 2 },
  counterBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  quantityText: { marginHorizontal: 12, fontSize: 14, fontWeight: 'bold' },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    backgroundColor: '#fff',
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  totalLabel: { fontSize: 14, color: '#757575' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  checkoutBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  disabledBtn: { opacity: 0.7 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#212121', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#9E9E9E', marginTop: 8, textAlign: 'center' },
  browseBtn: { marginTop: 24, backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
  browseBtnText: { color: '#fff', fontWeight: 'bold' },
});
