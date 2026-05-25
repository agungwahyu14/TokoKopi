import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL, Colors } from '../../constants/Colors';
import { useUserVouchers } from '../../services/queries';

const { width } = Dimensions.get('window');

export default function MyVouchersScreen() {
  const router = useRouter();
  const { data: vouchers, isLoading, refetch } = useUserVouchers();

  const renderVoucher = ({ item }: { item: any }) => {
    const promo = item.promo;
    if (!promo) return null;

    const isExpired = promo.endDate && new Date(promo.endDate) < new Date();
    const isUsed = item.isUsed;

    return (
      <View style={[styles.voucherCard, (isExpired || isUsed) && styles.disabledCard]}>
        <View style={styles.voucherImageContainer}>
          <Image
            source={{
              uri: promo.imageUrl
                ? (promo.imageUrl.startsWith('http') ? promo.imageUrl : `${API_URL.replace('/api', '')}${promo.imageUrl}`)
                : 'https://via.placeholder.com/150?text=Voucher'
            }}
            style={styles.voucherImage}
          />
        </View>
        <View style={styles.voucherContent}>
          <View style={styles.voucherHeader}>
            <Text style={styles.voucherTitle} numberOfLines={1}>{promo.title}</Text>
            {isUsed && <View style={styles.usedBadge}><Text style={styles.usedText}>TERPAKAI</Text></View>}
          </View>
          <Text style={styles.voucherDesc} numberOfLines={2}>{promo.description}</Text>
          <View style={styles.voucherFooter}>
            <View style={styles.expiryBadge}>
              <Ionicons name="time-outline" size={12} color="#757575" />
              <Text style={styles.expiryText}>
                {promo.endDate ? `s/d ${new Date(promo.endDate).toLocaleDateString('id-ID')}` : 'No Expired'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.useBtn, (isExpired || isUsed) && styles.useBtnDisabled]}
              onPress={() => !isExpired && !isUsed && router.push('/(tabs)')}
              disabled={isExpired || isUsed}
            >
              <Text style={styles.useBtnText}>{isUsed ? 'Selesai' : 'Gunakan'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voucher Saya</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Memuat voucher...</Text>
        </View>
      ) : (
        <FlatList
          data={vouchers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderVoucher}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="ticket-outline" size={80} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>Belum ada voucher</Text>
              <Text style={styles.emptySubtitle}>Kumpulkan poin dan tukarkan dengan voucher menarik!</Text>
              <TouchableOpacity
                style={styles.redeemBtn}
                onPress={() => router.push('/points/redeem')}
              >
                <Text style={styles.redeemBtnText}>Tukar Poin</Text>
              </TouchableOpacity>
            </View>
          }
          refreshing={isLoading}
          onRefresh={refetch}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#757575' },
  listContainer: { padding: 16, paddingBottom: 32 },
  voucherCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  expiredCard: { opacity: 0.6 },
  disabledCard: { opacity: 0.6, backgroundColor: '#F5F5F5' },
  voucherImageContainer: { width: 100, height: 100 },
  voucherImage: { width: '100%', height: '100%', backgroundColor: '#F5F5F5' },
  voucherContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  voucherHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  voucherTitle: { fontSize: 16, fontWeight: 'bold', color: '#212121', flex: 1 },
  usedBadge: { backgroundColor: '#E0E0E0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  usedText: { fontSize: 8, fontWeight: 'bold', color: '#757575' },
  voucherDesc: { fontSize: 12, color: '#757575', marginTop: 4 },
  voucherFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  expiryBadge: { flexDirection: 'row', alignItems: 'center' },
  expiryText: { fontSize: 10, color: '#757575', marginLeft: 4 },
  useBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  useBtnDisabled: { backgroundColor: '#BDBDBD' },
  useBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#212121', marginTop: 16 },
  emptySubtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  redeemBtn: {
    marginTop: 24,
    backgroundColor: '#FAEEDA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1DAB5',
  },
  redeemBtnText: { color: Colors.primary, fontWeight: 'bold' },
});
