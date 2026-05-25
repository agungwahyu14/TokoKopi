import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProductDetail } from '../../services/queries';
import { formatRupiah } from '../../utils/formatter';
import { Colors } from '../../constants/Colors';
import { useCartStore } from '../../store/useStore';

const { width } = Dimensions.get('window');

export default function DetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data: product, isLoading } = useProductDetail(id as string);
  const { addItem } = useCartStore();

  const [size, setSize] = useState('Regular');
  const [temperature, setTemperature] = useState('Hot');
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text>Produk tidak ditemukan</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleAddToCart = () => {
    addItem({
      id: `${product.id}-${size}-${temperature}`,
      name: `${product.name} (${size}, ${temperature})`,
      price: size === 'Large' ? product.price + 5000 : product.price,
      quantity: quantity,
    });
    router.back();
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: product.image || 'https://images.unsplash.com/photo-1509722747041-616f39b57569?q=80&w=1000&auto=format&fit=crop' }} 
            style={styles.image} 
          />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.headerInfo}>
            <View>
              <Text style={styles.name}>{product.name}</Text>
              <Text style={styles.category}>{product.category?.name || 'Coffee'}</Text>
            </View>
            <Text style={styles.price}>{formatRupiah(product.price)}</Text>
          </View>

          <Text style={styles.sectionTitle}>Deskripsi</Text>
          <Text style={styles.description}>
            {product.description || 'Nikmati perpaduan biji kopi pilihan dengan rasa yang autentik dan aroma yang menggugah selera.'}
          </Text>

          {/* Size Options */}
          <Text style={styles.sectionTitle}>Ukuran</Text>
          <View style={styles.optionRow}>
            {['Regular', 'Large'].map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.optionChip, size === s && styles.optionChipActive]}
                onPress={() => setSize(s)}
              >
                <Text style={[styles.optionText, size === s && styles.optionTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Temperature Options */}
          <Text style={styles.sectionTitle}>Suhu</Text>
          <View style={styles.optionRow}>
            {['Hot', 'Iced'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.optionChip, temperature === t && styles.optionChipActive]}
                onPress={() => setTemperature(t)}
              >
                <Text style={[styles.optionText, temperature === t && styles.optionTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quantity */}
          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>Jumlah</Text>
            <View style={styles.counter}>
              <TouchableOpacity 
                style={styles.counterBtn} 
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={20} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity 
                style={styles.counterBtn} 
                onPress={() => setQuantity(quantity + 1)}
              >
                <Ionicons name="add" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer / Add to Cart */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Harga</Text>
          <Text style={styles.totalPrice}>
            {formatRupiah((size === 'Large' ? product.price + 5000 : product.price) * quantity)}
          </Text>
        </View>
        <TouchableOpacity style={styles.addCartBtn} onPress={handleAddToCart}>
          <Text style={styles.addCartText}>Tambah ke Keranjang</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backLink: {
    color: Colors.primary,
    marginTop: 10,
    fontWeight: 'bold',
  },
  imageContainer: {
    position: 'relative',
    height: 350,
  },
  image: {
    width: width,
    height: 350,
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#fff',
    marginTop: -30,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
  },
  category: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#616161',
    lineHeight: 22,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  optionChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FAEEDA',
  },
  optionText: {
    fontSize: 14,
    color: '#757575',
  },
  optionTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    padding: 4,
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    color: '#212121',
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    alignItems: 'center',
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: '#757575',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  addCartBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  addCartText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
