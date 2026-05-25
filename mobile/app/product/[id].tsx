import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '../../store/useStore';
import { useAddToCart } from '../../services/queries';
import api from '../../services/api';
import { Colors, API_URL } from '../../constants/Colors';
import { formatRupiah } from '../../utils/formatter';
import CustomAlertModal from '../../components/CustomAlertModal';

export default function ProductDetailModal() {
  const { id } = useLocalSearchParams();
   const router = useRouter();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const addToCartMutation = useAddToCart();

  React.useEffect(() => {
    if (!user || user.isGuest) {
      router.replace('/login');
    }
  }, [user]);

  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState('Regular');
  const [temp, setTemp] = useState('Hot');

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
    onConfirm: () => {},
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info', onConfirm = () => {}) => {
    setAlertConfig({ title, message, type, onConfirm });
    setAlertVisible(true);
  };

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await api.get(`/products/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!product) return null;

  const handleAddToCart = async () => {
    if (!user || user.isGuest) {
      router.push('/login');
      return;
    }

    try {
      await addToCartMutation.mutateAsync({
        productId: Number(id),
        quantity,
        options: { size, temp },
      });
      
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      
      showAlert(
        'Berhasil',
        'Kopi nikmat pilihanmu berhasil ditambahkan ke keranjang!',
        'success',
        () => router.back()
      );
    } catch (error: any) {
      showAlert(
        'Gagal',
        error.response?.data?.message || 'Gagal menambahkan ke keranjang',
        'error'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Produk</Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Ionicons name="share-outline" size={24} color="#212121" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Image 
          source={{ 
            uri: product.imageUrl 
              ? (product.imageUrl.startsWith('http') ? product.imageUrl : `${API_URL.replace('/api', '')}${product.imageUrl}`) 
              : 'https://via.placeholder.com/500x500?text=Kopi' 
          }} 
          style={styles.productImage} 
        />
        
        <View style={styles.content}>
          <View style={styles.mainInfo}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>{formatRupiah(product.price)}</Text>
            </View>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={16} color="#FFB300" />
              <Text style={styles.ratingText}>4.8</Text>
            </View>
          </View>

          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Deskripsi</Text>
          <Text style={styles.description}>{product.description}</Text>

          <View style={styles.optionSection}>
            <Text style={styles.sectionTitle}>Pilih Ukuran</Text>
            <View style={styles.optionRow}>
              {['Regular', 'Large'].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSize(s)}
                  style={[styles.optionBtn, size === s && styles.optionBtnActive]}
                >
                  <Text style={[styles.optionText, size === s && styles.optionTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.optionSection}>
            <Text style={styles.sectionTitle}>Suhu</Text>
            <View style={styles.optionRow}>
              {['Hot', 'Iced'].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTemp(t)}
                  style={[styles.optionBtn, temp === t && styles.optionBtnActive]}
                >
                  <Text style={[styles.optionText, temp === t && styles.optionTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.counter}>
          <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))}>
            <Ionicons name="remove-circle-outline" size={36} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity onPress={() => setQuantity(quantity + 1)}>
            <Ionicons name="add-circle-outline" size={36} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
          <Text style={styles.addToCartText}>Tambah ke Keranjang</Text>
        </TouchableOpacity>
      </View>
      {/* Custom Success/Error Alert Modal */}
      <CustomAlertModal
        visible={alertVisible}
        onClose={() => {
          setAlertVisible(false);
          alertConfig.onConfirm();
        }}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  closeBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#212121' },
  shareBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  productImage: { width: '100%', height: 350, backgroundColor: '#F5F5F5' },
  content: { padding: 24, marginTop: -30, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  mainInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  productName: { fontSize: 24, fontWeight: 'bold', color: '#212121' },
  productPrice: { fontSize: 20, fontWeight: 'bold', color: Colors.primary, marginTop: 4 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9C4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  ratingText: { fontSize: 14, fontWeight: 'bold', color: '#854F0B', marginLeft: 4 },
  divider: { height: 1, backgroundColor: '#F5F5F5', marginVertical: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#212121', marginBottom: 12 },
  description: { fontSize: 14, color: '#757575', lineHeight: 22, marginBottom: 24 },
  optionSection: { marginBottom: 24 },
  optionRow: { flexDirection: 'row' },
  optionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginRight: 12,
  },
  optionBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionText: { color: '#757575', fontWeight: 'bold', fontSize: 14 },
  optionTextActive: { color: 'white' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    backgroundColor: '#fff',
  },
  counter: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  quantityText: { fontSize: 22, marginHorizontal: 16, fontWeight: 'bold', color: '#212121', minWidth: 30, textAlign: 'center' },
  addToCartBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addToCartText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
