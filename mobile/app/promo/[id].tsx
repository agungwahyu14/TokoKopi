import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL, Colors } from '../../constants/Colors';
import { usePromoDetail } from '../../services/queries';

const { width } = Dimensions.get('window');

export default function PromoDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data: promo, isLoading } = usePromoDetail(id as string);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!promo) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Promo tidak ditemukan</Text>
        <TouchableOpacity style={styles.backButtonError} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Kembali ke Beranda</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const onShare = async () => {
    try {
      await Share.share({
        message: `Dapatkan promo menarik "${promo.title}" di Toko Kopi Jaya! Gunakan kode: ${promo.code}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Image */}
        <View style={styles.headerImageContainer}>
          <Image
            source={{
              uri: promo.imageUrl
                ? (promo.imageUrl.startsWith('http') ? promo.imageUrl : `${API_URL.replace('/api', '')}${promo.imageUrl}`)
                : 'https://via.placeholder.com/1000x600?text=Promo'
            }}
            style={styles.headerImage}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent']}
            style={styles.topGradient}
          />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={onShare}>
            <Ionicons name="share-social-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.contentCard}>
          <View style={styles.badgeContainer}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{promo.type?.toUpperCase() || 'PROMO'}</Text>
            </View>
            <Text style={styles.expiryText}>Berlaku s/d {promo.endDate ? new Date(promo.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Selesai'}</Text>
          </View>

          <Text style={styles.title}>{promo.title}</Text>
          <Text style={styles.description}>
            {promo.description || 'Nikmati penawaran spesial ini hanya di Toko Kopi Jaya. Syarat dan ketentuan berlaku.'}
          </Text>

          <View style={styles.divider} />

          {/* Promo Points Section */}
          <View style={styles.codeSection}>
            <Text style={styles.codeLabel}>Biaya Penukaran</Text>
            <View style={styles.codeContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="flash" size={24} color="#FFB300" style={{ marginRight: 8 }} />
                <Text style={styles.codeText}>{promo.pointCost} Poin</Text>
              </View>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsBadgeText}>STOK TERSEDIA</Text>
              </View>
            </View>
          </View>

          {/* Terms & Conditions */}

        </View>
      </ScrollView>

      {/* Footer Button */}
      <SafeAreaView style={styles.footer} edges={['bottom']}>
        <TouchableOpacity
          style={styles.usePromoButton}
          onPress={() => router.push('/points/redeem')}
        >
          <Text style={styles.usePromoText}>Klaim Voucher Ini</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  errorText: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 20,
  },
  backButtonError: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  headerImageContainer: {
    position: 'relative',
    height: 300,
    width: width,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentCard: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -30,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    backgroundColor: '#FAEEDA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  expiryText: {
    color: '#9E9E9E',
    fontSize: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#616161',
    lineHeight: 24,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 24,
  },
  codeSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderStyle: 'dashed',
    marginBottom: 32,
  },
  codeLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 2,
  },
  pointsBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pointsBadgeText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: 'bold',
  },
  termsSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  termItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingRight: 10,
  },
  termDot: {
    fontSize: 18,
    color: Colors.primary,
    marginRight: 8,
    marginTop: -2,
  },
  termText: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
    flex: 1,
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  usePromoButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  usePromoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
});
