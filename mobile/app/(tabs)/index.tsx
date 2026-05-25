import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL, Colors } from '../../constants/Colors';
import { useCart, useCategories, useMenu, usePromos, useUnreadNotificationCount } from '../../services/queries';
import { useUserStore } from '../../store/useStore';
import { formatRupiah } from '../../utils/formatter';

const { width } = Dimensions.get('window');

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 19) return 'Selamat Sore';
  return 'Selamat Malam';
};

const LoadingSkeleton = () => (
  <View style={styles.skeletonContainer}>
    <View style={[styles.skeleton, { height: 150, width: '90%', borderRadius: 16 }]} />
    <View style={[styles.skeleton, { height: 200, width: '100%', marginTop: 24 }]} />
  </View>
);

// Header Slider Images
const HEADER_IMAGES = [
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80\u0026w=1000\u0026auto=format\u0026fit=crop',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80\u0026w=1000\u0026auto=format\u0026fit=crop',
  'https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80\u0026w=1000\u0026auto=format\u0026fit=crop',
];

export default function BerandaScreen() {
  const { user } = useUserStore();
  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useMenu();
  const { data: promos, isLoading: promosLoading, refetch: refetchPromos } = usePromos();
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { data: cartItems } = useCart();
  const { data: unreadCount } = useUnreadNotificationCount();
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const randomizedProducts = useMemo(() => {
    if (!products) return [];
    return [...products].sort(() => 0.5 - Math.random()).slice(0, 8);
  }, [products]);

  // Auto scroll effect
  useEffect(() => {
    const timer = setInterval(() => {
      if (flatListRef.current) {
        let nextIndex = (activeSlide + 1) % HEADER_IMAGES.length;
        flatListRef.current.scrollToIndex({ index: nextIndex, animated: true });
        setActiveSlide(nextIndex);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [activeSlide]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProducts(), refetchPromos()]);
    setRefreshing(false);
  };

  if (productsLoading || promosLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSkeleton />
      </SafeAreaView>
    );
  }

  const handleOrderPress = (type: 'pickup' | 'delivery') => {
    if (!user || user.isGuest) {
      router.push('/login');
      return;
    }
    router.push(`/order?type=${type}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        {/* Header Slider */}
        <View style={styles.headerContainer}>
          <FlatList
            ref={flatListRef}
            data={HEADER_IMAGES}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveSlide(index);
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.headerImage} />
            )}
            keyExtractor={(_, index) => index.toString()}
          />
          <View style={styles.headerOverlay} />
          <View style={styles.headerContent}>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.notificationCircle}
                onPress={() => router.push('/notifications')}
              >
                <Ionicons name="notifications-outline" size={22} color="white" />
                {unreadCount && unreadCount > 0 ? (
                  <View style={styles.notifBadge}>
                    {unreadCount < 10 ? (
                      <Text style={styles.notifBadgeText}>{unreadCount}</Text>
                    ) : (
                      <Text style={styles.notifBadgeText}>9+</Text>
                    )}
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>
          </View>
          {/* Pagination Dots */}
          <View style={styles.paginationDots}>
            {HEADER_IMAGES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  activeSlide === i ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Points Card */}
        <View style={styles.pointsCardWrapper}>
          <View style={styles.pointsCard}>
            <View style={styles.pointsHeader}>
              <View>
                <Text style={styles.pointsLabel}>Kopi Points</Text>
                <Text style={styles.pointsValue}>{user?.points?.toLocaleString()}</Text>
              </View>
              <View style={styles.tierBadge}>
                <Text style={styles.tierText}>{user?.tier || 'Member'}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.redeemButton}
              onPress={() => router.push('/points/redeem')}
            >
              <Text style={styles.redeemText}>Tukarkan poinmu dengan hadiah menarik</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFB300" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Options Section */}
        <View style={styles.orderContainer}>
          <Text style={styles.orderGreeting}>Hi, {user?.name || 'Agungwahyu'}, Pesan Sekarang?</Text>
          <View style={styles.orderRow}>
            <TouchableOpacity
              style={styles.orderBox}
              onPress={() => handleOrderPress('pickup')}
            >
              <View style={styles.orderIconBg}>
                <Ionicons name="walk-outline" size={28} color={Colors.primary} />
              </View>
              <Text style={styles.orderLabel}>Pickup</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.orderBox}
              onPress={() => handleOrderPress('delivery')}
            >
              <View style={styles.orderIconBg}>
                <Ionicons name="bicycle-outline" size={28} color={Colors.primary} />
              </View>
              <Text style={styles.orderLabel}>Delivery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Promo Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Promo Hari Ini</Text>
              <Text style={styles.sectionSubtitle}>Dapatkan diskon menarik setiap hari</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/promo/all')}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          {promosLoading ? (
            <View style={{ paddingLeft: 20, marginTop: 12 }}>
              <View style={[styles.skeleton, { width: 300, height: 160, borderRadius: 20 }]} />
            </View>
          ) : (
            <FlatList
              horizontal
              data={promos}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListPadding}
              snapToInterval={316} // card width (300) + marginRight (16)
              decelerationRate="fast"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.promoCard}
                  activeOpacity={0.9}
                  onPress={() => router.push('/points/redeem')}
                >
                  <Image
                    source={{
                      uri: item.imageUrl
                        ? (item.imageUrl.startsWith('http') ? item.imageUrl : `${API_URL.replace('/api', '')}${item.imageUrl}`)
                        : 'https://via.placeholder.com/500x300?text=Promo'
                    }}
                    style={styles.promoImage}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.promoGradient}
                  />
                  <View style={styles.promoBadgeFloating}>
                    <Text style={styles.promoBadgeTextFloating}>
                      {item.type === 'percent' ? `${Math.round(item.value)}% OFF` : `DISKON ${Math.round(item.value/1000)}RB`}
                    </Text>
                  </View>
                  <View style={styles.promoContent}>
                    <View style={styles.promoTextContainer}>
                      <Text style={styles.promoTitleNew}>{item.title}</Text>
                      <View style={styles.promoCodeContainer}>
                        <Ionicons name="flash" size={12} color="#FFD700" />
                        <Text style={styles.promoCodeNew}>{item.pointCost} Poin</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.promoButton}
                      onPress={() => router.push('/points/redeem')}
                    >
                      <Text style={styles.promoButtonText}>Klaim</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>



        {/* Popular Menu Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Menu</Text>
              <Text style={styles.sectionSubtitle}>Pilihan terbaik dari pelanggan kami</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/menu')}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          {productsLoading ? (
            <View style={{ paddingLeft: 20, marginTop: 12, flexDirection: 'row' }}>
              {[1, 2].map(i => <View key={i} style={[styles.skeleton, { width: 160, height: 240, borderRadius: 20, marginRight: 16 }]} />)}
            </View>
          ) : randomizedProducts?.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cafe-outline" size={40} color="#E0E0E0" />
              <Text style={styles.emptyText}>Belum ada menu di kategori ini</Text>
            </View>
          ) : (
            <FlatList
              horizontal
              data={randomizedProducts}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListPadding}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.productCardNew}
                  activeOpacity={0.9}
                  onPress={() => router.push(`/product/${item.id}`)}
                >
                  <View style={styles.productImageContainer}>
                    <Image
                      source={{
                        uri: item.imageUrl
                          ? (item.imageUrl.startsWith('http') ? item.imageUrl : `${API_URL.replace('/api', '')}${item.imageUrl}`)
                          : 'https://via.placeholder.com/300x300?text=Kopi'
                      }}
                      style={styles.productImageNew}
                    />
                    <View style={styles.bestSellerBadge}>
                      <Ionicons name="flame" size={10} color="white" />
                      <Text style={styles.bestSellerText}>HOT</Text>
                    </View>
                  </View>
                  <View style={styles.productInfoNew}>
                    <Text style={styles.productNameNew} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.productCategory}>Coffee & Milk</Text>
                    <View style={styles.productFooter}>
                      <Text style={styles.productPriceNew}>{formatRupiah(item.price)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <TouchableOpacity style={styles.helpCard}>
            <View style={styles.helpLeft}>
              <View style={styles.helpIconCircle}>
                <Ionicons name="help-buoy-outline" size={24} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.helpTitle}>Perlu bantuan?</Text>
                <Text style={styles.helpSubtitle}>Hubungi customer service kami</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
          </TouchableOpacity>
        </View>

        {/* Extra Space at bottom */}
        <View style={{ height: cartItems && cartItems.length > 0 ? 150 : 100 }} />
      </ScrollView>

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
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    height: 220,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  headerImage: {
    width: width,
    height: 220,
    resizeMode: 'cover',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerContent: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 20,
    backgroundColor: '#FFB300',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  greetingText: {
    color: '#E0E0E0',
    fontSize: 14,
  },
  userName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  floatingCart: {
    position: 'absolute',
    bottom: 90, // Above tab bar
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
    zIndex: 999,
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#633806',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
  },
  pointsCardWrapper: {
    marginTop: -40,
    paddingHorizontal: 16,
  },
  pointsCard: {
    backgroundColor: '#633806',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pointsLabel: {
    color: 'white',
    fontSize: 12,
  },
  pointsValue: {
    color: '#FFB300',
    fontSize: 28,
    fontWeight: 'bold',
  },
  tierBadge: {
    backgroundColor: '#854F0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tierText: {
    color: '#FFD54F',
    fontSize: 12,
    fontWeight: 'bold',
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  redeemText: {
    color: '#E0E0E0',
    fontSize: 12,
    fontWeight: '500',
  },
  sectionContainer: {
    marginTop: 24,
  },
  orderContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  orderGreeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderBox: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  orderIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FAEEDA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B2C20',
  },
  helpSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  helpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAEEDA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#212121',
  },
  helpSubtitle: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  categoryContainer: {
    marginTop: 24,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    color: '#757575',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  horizontalListPadding: {
    paddingLeft: 20,
    paddingRight: 10,
    paddingBottom: 10,
  },
  promoCard: {
    width: 300,
    height: 180,
    borderRadius: 24,
    marginRight: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  promoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  promoGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  promoBadgeFloating: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.9)', // Accent gold
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 2,
  },
  promoBadgeTextFloating: {
    color: '#4B2C20',
    fontSize: 12,
    fontWeight: '800',
  },
  promoContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 2,
  },
  promoTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  promoTitleNew: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  promoCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  promoCodeNew: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  promoButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  promoButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  productCardNew: {
    width: 170,
    backgroundColor: '#fff',
    borderRadius: 24,
    marginRight: 16,
    padding: 12,
    borderColor: '#F5F5F5',
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
  },
  productImageNew: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bestSellerBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF4B2B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  bestSellerText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  productInfoNew: {
    paddingHorizontal: 4,
  },
  productNameNew: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  productCategory: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 2,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  productPriceNew: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '800',
  },
  skeletonContainer: {
    padding: 20,
    alignItems: 'center',
  },
  skeleton: {
    backgroundColor: '#F0F0F0',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emptyText: {
    marginTop: 10,
    color: '#9E9E9E',
    fontSize: 14,
  },
});
