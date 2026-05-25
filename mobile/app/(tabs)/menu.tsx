import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, API_URL } from '../../constants/Colors';
import { useCategories, useMenu, useNearbyStores } from '../../services/queries';
import { formatRupiah } from '../../utils/formatter';

const { width } = Dimensions.get('window');

export default function MenuScreen() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [isDelayOver, setIsDelayOver] = useState(false);
  const router = useRouter();

  // Queries
  const { data: products, isLoading: productsLoading, refetch: refetchMenu } = useMenu();
  const { data: categoriesData, isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();
  const { data: stores } = useNearbyStores(userLocation?.lat || null, userLocation?.lng || null);

  const nearestStore = stores && stores.length > 0 ? stores[0] : null;
  const scrollViewRef = useRef<ScrollView>(null);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchMenu(), refetchCategories()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchMenu, refetchCategories]);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
        }
      } catch (error) {
        console.warn('GPS Error:', error);
        // Fallback ke lokasi Denpasar jika GPS gagal agar tidak crash
        setUserLocation({ lat: -8.6478, lng: 115.2166 });
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsDelayOver(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Set default active category when data loaded
  useEffect(() => {
    if (categoriesData && categoriesData.length > 0 && !activeCategory) {
      setActiveCategory(categoriesData[0].name);
    }
  }, [categoriesData]);

  const handleProductPress = (product: any) => {
    router.push(`/product/${product.id}`);
  };

  // Group products by category
  const groupedMenu = useMemo(() => {
    if (!products || !categoriesData) return [];

    return categoriesData.map((cat: any) => ({
      ...cat,
      items: products.filter((p: any) => {
        // Cek jika p.category adalah string atau p.categories adalah array
        const matchString = p.category === cat.name;
        const matchArray = p.categories?.some((c: any) => c.name === cat.name);
        return matchString || matchArray;
      })
    })).filter((group: any) => group.items.length > 0);
  }, [products, categoriesData]);

  if (!isDelayOver || productsLoading || categoriesLoading || locationLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Menyiapkan menu dan mencari lokasi terdekat...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Store Card */}
      <View style={styles.header}>
        <View style={styles.locationCard}>
          <View style={styles.locationIconBg}>
            <Ionicons name="location" size={20} color={Colors.primary} />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Pesan dari outlet terdekat:</Text>
            <Text style={styles.storeName} numberOfLines={1}>
              {nearestStore ? nearestStore.name : 'Mencari outlet...'}
            </Text>
            <Text style={styles.storeAddress} numberOfLines={1}>
              {nearestStore ? `${nearestStore.address} (${nearestStore.distance} km)` : 'Alamat tidak ditemukan'}
            </Text>
          </View>

        </View>
      </View>

      {/* Category Tabs (Filtered, No "Semua") */}
      <View style={styles.categoryTabs}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categoriesData || []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveCategory(item.name)}
              style={[
                styles.categoryTab,
                activeCategory === item.name && styles.categoryTabActive,
              ]}
            >
              <Text style={[styles.categoryTabText, activeCategory === item.name && styles.categoryTabTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoryListPadding}
        />
      </View>

      {/* Grouped Product List */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {groupedMenu
          .filter((group: any) => !activeCategory || group.name === activeCategory)
          .map((group: any) => (
            <View key={group.id} style={styles.categorySection}>
              <Text style={styles.categoryHeader}>{group.name}</Text>
              <View style={styles.productGrid}>
                {group.items.map((item: any) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.productCard}
                    onPress={() => handleProductPress(item)}
                  >
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
                ))}
              </View>
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, backgroundColor: '#fff' },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  locationIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAEEDA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: { flex: 1 },
  locationLabel: { fontSize: 10, color: '#9E9E9E', textTransform: 'uppercase', fontWeight: 'bold' },
  storeName: { fontSize: 14, fontWeight: 'bold', color: '#212121', marginTop: 2 },
  storeAddress: { fontSize: 12, color: '#757575', marginTop: 1 },
  changeLocationBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F5F5F5', borderRadius: 8 },
  changeText: { fontSize: 12, fontWeight: 'bold', color: Colors.primary },
  categoryTabs: { marginBottom: 16 },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  categoryTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryTabText: { color: '#757575', fontWeight: 'bold', fontSize: 14 },
  categoryTabTextActive: { color: 'white' },
  categoryListPadding: { paddingLeft: 16, paddingRight: 8 },
  scrollContent: { paddingBottom: 100 },
  categorySection: { marginBottom: 24, paddingHorizontal: 16 },
  categoryHeader: { fontSize: 20, fontWeight: 'bold', color: '#212121', marginBottom: 16, textTransform: 'capitalize' },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  productCard: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    marginBottom: 16,
    overflow: 'hidden',
  },
  productImage: { width: '100%', height: 160, backgroundColor: '#F5F5F5' },
  productInfo: { padding: 12 },
  productName: { fontSize: 14, fontWeight: 'bold', color: '#212121' },
  productPrice: { fontSize: 14, color: Colors.primary, fontWeight: 'bold', marginTop: 4 },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
});
