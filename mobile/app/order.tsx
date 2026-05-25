import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL, Colors } from '../constants/Colors';
import { useCart, useCategories, useMenu, useNearbyStores } from '../services/queries';
import { useOrderStore } from '../store/useOrderStore';
import { useUserStore } from '../store/useStore';
import { formatRupiah } from '../utils/formatter';

const { width } = Dimensions.get('window');

export default function OrderScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const { user } = useUserStore();

  useEffect(() => {
    if (!user || user.isGuest) {
      router.replace('/login');
    }
  }, [user]);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [isDelayOver, setIsDelayOver] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  const { data: stores, isLoading: storesLoading } = useNearbyStores(userLocation?.lat || null, userLocation?.lng || null);
  const { data: products, isLoading: productsLoading } = useMenu();
  const { data: categoriesData } = useCategories();
  const { data: cartItems } = useCart();
  const { setOrderType, setSelectedStore } = useOrderStore();

  const nearestStore = stores && stores.length > 0 ? stores[0] : null;

  useEffect(() => {
    if (type) setOrderType(type.toString().toLowerCase() as any);
  }, [type]);

  useEffect(() => {
    if (nearestStore) setSelectedStore(nearestStore);
  }, [nearestStore]);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setUserLocation({ lat: -8.6500, lng: 115.2167 }); // Fallback Denpasar
          return;
        }
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
      } catch (error) {
        setUserLocation({ lat: -8.6500, lng: 115.2167 }); // Fallback Denpasar
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsDelayOver(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleProductPress = (product: any) => {
    router.push(`/product/${product.id}`);
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p: any) => {
      if (activeCategory === 'Semua') return true;

      const matchString = p.category === activeCategory;
      const matchArray = p.categories?.some((c: any) => c.name === activeCategory);

      return matchString || matchArray;
    });
  }, [products, activeCategory]);

  if (!isDelayOver || storesLoading || productsLoading || locationLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Menyiapkan menu dan mencari lokasi terdekat...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pemesanan {type?.toString().charAt(0).toUpperCase() + type?.toString().slice(1)}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.locationContainer}>
          {/* Store Location */}
          <View style={styles.locationRow}>
            <View style={styles.locationIconWrapper}>
              <View style={[styles.iconDot, { backgroundColor: Colors.primary }]} />
              {type?.toString().toLowerCase() === 'delivery' && <View style={styles.verticalLine} />}
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Outlet Pengiriman</Text>
              <Text style={styles.locationName} numberOfLines={1}>{nearestStore?.name || 'Toko Kopi Jaya'}</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>{nearestStore?.address || 'Mencari outlet terdekat...'}</Text>
            </View>
            {nearestStore?.distance && (
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceText}>{nearestStore.distance.toFixed(1)} km</Text>
              </View>
            )}
          </View>

          {/* Delivery Location - Only for Delivery */}
          {type?.toString().toLowerCase() === 'delivery' && (
            <View style={styles.locationRow}>
              <View style={styles.locationIconWrapper}>
                <View style={[styles.iconDot, { backgroundColor: '#FF5252' }]} />
              </View>
              <View style={styles.locationInfo}>
                <View style={styles.deliveryHeader}>
                  <Text style={styles.locationLabel}>Alamat Pengantaran</Text>
                  <TouchableOpacity onPress={() => router.push('/address/select')}>
                    <Text style={styles.changeText}>Ubah</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.locationName} numberOfLines={1}>{user?.name || 'Agungwahyu'}</Text>
                <Text style={styles.locationAddress} numberOfLines={1}>{user?.address || 'Jl. Raya Denpasar No. 123, Bali'}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={styles.menuContainer}>
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            {['Semua', ...(categoriesData?.map((c: any) => c.name) || [])].map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => setActiveCategory(category)}
                style={[
                  styles.categoryTab,
                  activeCategory === category && styles.activeCategoryTab
                ]}
              >
                <Text style={[
                  styles.categoryTabText,
                  activeCategory === category && styles.activeCategoryTabText
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.productCard} onPress={() => handleProductPress(item)}>
              <Image
                source={{
                  uri: item.imageUrl
                    ? (item.imageUrl.startsWith('http') ? item.imageUrl : `${API_URL.replace('/api', '')}${item.imageUrl}`)
                    : 'https://via.placeholder.com/300x300?text=Kopi'
                }}
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productPrice}>{formatRupiah(item.price)}</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.productListPadding}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cafe-outline" size={48} color="#E0E0E0" />
              <Text style={styles.emptyText}>Menu tidak ditemukan</Text>
            </View>
          }
        />
      </View>

      {cartItems && cartItems.length > 0 && (
        <TouchableOpacity
          style={styles.floatingCart}
          onPress={() => router.push('/cart')}
          activeOpacity={0.9}
        >
          <View style={styles.floatingCartContent}>
            <View style={styles.cartIconWrapper}>
              <Ionicons name="cart" size={24} color="white" />
              <View style={styles.cartBadgeFloating}>
                <Text style={styles.cartBadgeTextFloating}>{cartItems.length}</Text>
              </View>
            </View>
            <View style={styles.cartTextWrapper}>
              <Text style={styles.cartTitleFloating}>Lihat Keranjang</Text>
              <Text style={styles.cartSubtitleFloating}>Selesaikan pesananmu</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </View>
        </TouchableOpacity>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 20, color: Colors.primary, fontSize: 16, fontWeight: 'bold' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,

    backgroundColor: '#fff'
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  backButton: {
    width: 40,
    height: 40,

    justifyContent: 'center',
    alignItems: 'center',
  },
  locationContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIconWrapper: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
    paddingTop: 6,
  },
  iconDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  verticalLine: {
    width: 2,
    height: 40,
    backgroundColor: '#E0E0E0',
    marginVertical: 4,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    color: '#9E9E9E',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  locationName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#212121',
  },
  locationAddress: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  distanceBadge: {
    backgroundColor: '#FAEEDA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8
  },
  distanceText: { fontSize: 10, fontWeight: 'bold', color: Colors.primary },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  menuContainer: { flex: 1 },
  categoryContainer: { marginBottom: 12, marginTop: 16 },
  categoryList: { paddingHorizontal: 16 },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  activeCategoryTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryTabText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '600',
  },
  activeCategoryTabText: {
    color: 'white',
  },
  productListPadding: { paddingHorizontal: 8, paddingBottom: 100 },
  floatingCart: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 16,
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  floatingCartContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cartBadgeFloating: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  cartBadgeTextFloating: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cartTextWrapper: {
    flex: 1,
  },
  cartTitleFloating: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartSubtitleFloating: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  productCard: { flex: 1, margin: 8, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F5F5F5', overflow: 'hidden' },
  productImage: { width: '100%', height: 130, backgroundColor: '#F5F5F5' },
  productInfo: { padding: 10 },
  productName: { fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  productPrice: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { marginTop: 12, color: '#BDBDBD', fontSize: 14 },
});
