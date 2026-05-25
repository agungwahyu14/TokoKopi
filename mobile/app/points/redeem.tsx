import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import CustomConfirmModal from '../../components/CustomConfirmModal';
import CustomAlertModal from '../../components/CustomAlertModal';
import { API_URL, Colors } from '../../constants/Colors';
import { useClaimPromo, useProfile, usePromos } from '../../services/queries';
import { useUserStore } from '../../store/useStore';

const { width } = Dimensions.get('window');



export default function RedeemPointsScreen() {
  const router = useRouter();
  const { user, updateUser } = useUserStore();
  const { data: promos, isLoading: promosLoading } = usePromos();
  const { data: profileData, refetch: refetchProfile } = useProfile();
  const claimMutation = useClaimPromo();

  // State for Confirmation Modals
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    confirmText: 'Konfirmasi',
    cancelText: 'Batal',
    iconName: 'gift-outline' as any,
    onConfirm: () => {},
  });

  const showConfirm = (title: string, message: string, confirmText: string, cancelText: string, iconName: string, onConfirm: () => void) => {
    setConfirmConfig({ title, message, confirmText, cancelText, iconName, onConfirm });
    setConfirmVisible(true);
  };

  // State for Alert Modals
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

  React.useEffect(() => {
    if (profileData) {
      updateUser(profileData);
    }
  }, [profileData]);

  const redeemableItems = promos?.filter((p: any) => p.pointCost > 0 && p.isActive) || [];

  const handleRedeem = (item: any) => {
    if ((user?.points || 0) < item.pointCost) {
      showAlert('Poin Tidak Cukup', 'Maaf, poin Anda tidak mencukupi untuk menukar penawaran ini.', 'info');
      return;
    }

    showConfirm(
      'Konfirmasi Penukaran',
      `Tukarkan ${item.pointCost} poin dengan ${item.title}?`,
      'Tukarkan',
      'Batal',
      'gift-outline',
      () => {
        claimMutation.mutate(item.id, {
          onSuccess: (data) => {
            refetchProfile();
            // Show Success Custom Confirm Modal
            setTimeout(() => {
              showConfirm(
                'Berhasil!',
                data.message || 'Penukaran poin berhasil.',
                'Lihat Voucher',
                'Nanti',
                'checkmark-circle-outline',
                () => router.push('/profile/vouchers')
              );
            }, 500);
          },
          onError: (error: any) => {
            setTimeout(() => {
              showAlert(
                'Gagal',
                error.response?.data?.message || 'Terjadi kesalahan saat penukaran.',
                'error'
              );
            }, 500);
          }
        });
      }
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primary, '#4B2C20']} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tukar Poin</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.pointsDisplay}>
            <Text style={styles.currentPointsLabel}>Poin Anda Saat Ini</Text>
            <Text style={styles.currentPointsValue}>{user?.points?.toLocaleString() || 0}</Text>
            <View style={styles.tierBadge}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.tierText}>{user?.tier || 'Member'} Member</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Penawaran Menarik</Text>

        {promosLoading ? (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <Text style={{ color: '#757575' }}>Memuat penawaran...</Text>
          </View>
        ) : redeemableItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="gift-outline" size={60} color="#E0E0E0" />
            <Text style={styles.emptyText}>Belum ada penawaran tersedia saat ini.</Text>
          </View>
        ) : (
          redeemableItems.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              style={styles.redeemCard}
              disabled={(user?.points || 0) < item.pointCost || claimMutation.isPending}
              onPress={() => handleRedeem(item)}
            >
              <View style={styles.productImageContainer}>
                <ExpoImage
                  source={{
                    uri: item.imageUrl
                      ? (item.imageUrl.startsWith('http') ? item.imageUrl : `${API_URL.replace('/api', '')}${item.imageUrl}`)
                      : 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=500&auto=format&fit=crop'
                  }}
                  style={styles.itemImage}
                  contentFit="cover"
                />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <View style={styles.pointsNeeded}>
                  <Ionicons name="flash" size={14} color="#FFB300" />
                  <Text style={styles.pointsNeededText}>{item.pointCost} Poin</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.redeemButton,
                    ((user?.points || 0) < item.pointCost || claimMutation.isPending) && styles.redeemButtonDisabled
                  ]}
                  disabled={(user?.points || 0) < item.pointCost || claimMutation.isPending}
                  onPress={() => handleRedeem(item)}
                >
                  <Text style={styles.redeemButtonText}>
                    {claimMutation.isPending && claimMutation.variables === item.id
                      ? 'Memproses...'
                      : ((user?.points || 0) < item.pointCost ? 'Poin Tidak Cukup' : 'Tukarkan')}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#757575" />
          <Text style={styles.infoText}>
            Poin akan berkurang otomatis setelah penukaran berhasil. Voucher yang telah ditukar dapat dilihat di menu 'Voucher Saya'.
          </Text>
        </View>
      </ScrollView>
      {/* Custom Confirmation Modal */}
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
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
  },
  pointsDisplay: {
    alignItems: 'center',
    marginTop: 10,
  },
  currentPointsLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  currentPointsValue: {
    color: '#FFB300',
    fontSize: 48,
    fontWeight: '900',
    marginVertical: 4,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tierText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  redeemCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 16,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  pointsNeeded: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointsNeededText: {
    fontSize: 13,
    color: '#FFB300',
    fontWeight: '700',
    marginLeft: 4,
  },
  redeemButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  redeemButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  redeemButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 40,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#757575',
    marginLeft: 10,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 16,
    fontWeight: '500',
  },
  productImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
});
