import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import CustomAlertModal from '../../components/CustomAlertModal';
import { Colors } from '../../constants/Colors';
import { useCart, useUserVouchers } from '../../services/queries';
import { useOrderStore } from '../../store/useOrderStore';
import { formatRupiah } from '../../utils/formatter';

export default function PromoSelectionScreen() {
  const router = useRouter();
  const { data: vouchers, isLoading } = useUserVouchers();
  const { data: cartItems } = useCart();
  const { selectedPromo, setSelectedPromo } = useOrderStore();

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' as 'success' | 'error' | 'info' });
  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  const calculateSubtotal = () => {
    if (!cartItems) return 0;
    return cartItems.reduce((total: number, item: any) => total + (item.product.price * item.quantity), 0);
  };

  const subtotal = calculateSubtotal();

  const handleSelectPromo = (promo: any) => {
    // Validasi Minimal Belanja
    if (subtotal < promo.minSpend) {
      showAlert(
        'Minimal Belanja Belum Terpenuhi',
        `Voucher ini hanya dapat digunakan dengan minimal pembelian ${formatRupiah(promo.minSpend)}. Kurang ${formatRupiah(promo.minSpend - subtotal)} lagi.`,
        'info'
      );
      return;
    }

    setSelectedPromo(promo);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voucher Saya</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>
            Subtotal Anda saat ini: <Text style={styles.subtotalText}>{formatRupiah(subtotal)}</Text>
          </Text>
        </View>

        {isLoading ? (
          <Text style={styles.loadingText}>Memuat voucher...</Text>
        ) : vouchers?.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={64} color="#E0E0E0" />
            <Text style={styles.emptyText}>Anda belum memiliki voucher</Text>
            <TouchableOpacity
              style={styles.redeemBtn}
              onPress={() => router.push('/points/redeem')}
            >
              <Text style={styles.redeemBtnText}>Tukar Poin</Text>
            </TouchableOpacity>
          </View>
        ) : (
          vouchers?.map((item: any) => {
            const promo = item.promo;
            if (!promo || item.isUsed) return null; // Jangan tampilkan yang sudah terpakai

            const isSelectable = subtotal >= promo.minSpend;
            const isSelected = selectedPromo?.id === promo.id;

            return (
              <TouchableOpacity
                key={item.id}
                disabled={isSelected || !isSelectable}
                style={[
                  styles.promoCard,
                  !isSelectable && styles.promoCardDisabled,
                  isSelected && styles.promoCardSelected,
                ]}
                onPress={() => handleSelectPromo(promo)}
              >
                <View style={styles.promoIconContainer}>
                  <View style={[styles.iconCircle, !isSelectable && styles.iconCircleDisabled]}>
                    <Ionicons name="pricetag" size={24} color="white" />
                  </View>
                </View>

                <View style={styles.promoDetails}>
                  <Text style={[styles.promoTitle, !isSelectable && styles.textDisabled]}>
                    {promo.title}
                  </Text>
                  <Text style={styles.promoDesc}>{promo.description}</Text>

                  <View style={styles.badgeContainer}>
                    <View style={[styles.badge, !isSelectable && styles.badgeDisabled]}>
                      <Text style={styles.badgeText}>
                        Min. Belanja {formatRupiah(promo.minSpend)}
                      </Text>
                    </View>
                    {promo.type === 'percent' && (
                      <View style={styles.badgeAccent}>
                        <Text style={styles.badgeAccentText}>Diskon {Math.round(promo.value)}%</Text>
                      </View>
                    )}
                  </View>

                  {!isSelectable && (
                    <Text style={styles.warningText}>
                      Kurang {formatRupiah(promo.minSpend - subtotal)} untuk gunakan voucher ini
                    </Text>
                  )}
                </View>

                {isSelected && (
                  <View style={styles.selectedMarker}>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {selectedPromo && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => {
              setSelectedPromo(null);
              router.back();
            }}
          >
            <Text style={styles.removeBtnText}>Lepas Voucher</Text>
          </TouchableOpacity>
        </View>
      )}

      <CustomAlertModal
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  scrollContent: {
    padding: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FAEEDA',
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#757575',
  },
  subtotalText: {
    fontWeight: 'bold',
    color: '#212121',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#757575',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#BDBDBD',
  },
  redeemBtn: {
    marginTop: 20,
    backgroundColor: '#FAEEDA',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1DAB5',
  },
  redeemBtnText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  promoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  promoCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FAEEDA',
  },
  promoCardDisabled: {
    opacity: 0.7,
    backgroundColor: '#FAFAFA',
  },
  promoIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleDisabled: {
    backgroundColor: '#BDBDBD',
  },
  promoDetails: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  textDisabled: {
    color: '#9E9E9E',
  },
  promoDesc: {
    fontSize: 13,
    color: '#757575',
    lineHeight: 18,
    marginBottom: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeDisabled: {
    backgroundColor: '#EEEEEE',
  },
  badgeText: {
    fontSize: 11,
    color: '#757575',
    fontWeight: '600',
  },
  badgeAccent: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeAccentText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  warningText: {
    fontSize: 11,
    color: '#F44336',
    marginTop: 8,
    fontWeight: '500',
  },
  selectedMarker: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  removeBtn: {
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#F44336',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
