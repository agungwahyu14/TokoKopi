import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreatePayment } from '../../services/queries';
import CustomAlertModal from '../../components/CustomAlertModal';

// --- Types ---
type PaymentMethodType = 'qris' | 'va' | 'minimarket';

interface PaymentItem {
  id: string;
  name: string;
  subText: string;
  type: PaymentMethodType;
  logoColor: string;
  shortName: string;
  isAvailable?: boolean;
}

// --- Data ---
const QRIS_DATA: PaymentItem[] = [
  {
    id: 'qris',
    name: 'QRIS',
    subText: 'Bayar dengan semua e-wallet (GoPay, OVO, DANA, dll)',
    type: 'qris',
    logoColor: '#2B2B2B',
    shortName: 'QR',
    isAvailable: true,
  },
];

const VA_DATA: PaymentItem[] = [
  { id: 'bca', name: 'BCA', subText: 'Virtual Account', type: 'va', logoColor: '#005596', shortName: 'BCA' },
  { id: 'bni', name: 'BNI', subText: 'Virtual Account', type: 'va', logoColor: '#E17817', shortName: 'BNI' },
  { id: 'bri', name: 'BRI', subText: 'Virtual Account', type: 'va', logoColor: '#003670', shortName: 'BRI' },
  { id: 'mandiri', name: 'Mandiri', subText: 'Virtual Account', type: 'va', logoColor: '#FFD700', shortName: 'MDR' },
];

const MINIMARKET_DATA: PaymentItem[] = [
  { id: 'alfamart', name: 'Alfamart', subText: 'Bayar di kasir minimarket terdekat', type: 'minimarket', logoColor: '#ED1C24', shortName: 'ALFA' },
  { id: 'indomaret', name: 'Indomaret', subText: 'Bayar di kasir minimarket terdekat', type: 'minimarket', logoColor: '#005BAA', shortName: 'INDO' },
];

export default function PaymentSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedMethod, setSelectedMethod] = useState<PaymentItem | null>(null);
  const createPaymentMutation = useCreatePayment();

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

  // Ambil orderId dan totalAmount dari params
  const orderId = params.orderId as string;
  const totalAmount = params.totalAmount ? Number(params.totalAmount) : 0;

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderPaymentRow = (item: PaymentItem) => {
    const isSelected = selectedMethod?.id === item.id;

    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.8}
        onPress={() => setSelectedMethod(item)}
        style={[
          styles.paymentRow,
          isSelected && styles.paymentRowSelected,
        ]}
      >
        {/* Logo / Icon */}
        <View style={[styles.logoPlaceholder, { backgroundColor: item.logoColor }]}>
          <Text style={styles.logoText}>{item.shortName}</Text>
        </View>

        {/* Info */}
        <View style={styles.paymentInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.paymentName}>{item.name}</Text>
            {item.isAvailable && (
              <View style={styles.availableBadge}>
                <Text style={styles.availableText}>Tersedia</Text>
              </View>
            )}
          </View>
          <Text style={styles.paymentSubText}>{item.subText}</Text>
        </View>

        {/* Radio Button */}
        <View style={[styles.radioButton, isSelected && styles.radioButtonActive]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </TouchableOpacity>
    );
  };

  const handleProcessPayment = async () => {
    if (!orderId || !selectedMethod) return;

    try {
      const response = await createPaymentMutation.mutateAsync(orderId);
      
      // Navigasi ke WebView dengan token dari Midtrans
      router.push({
        pathname: '/payment/webview' as any,
        params: { 
          token: response.token,
          orderNumber: response.orderNumber 
        }
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      showAlert('Gagal', 'Gagal memproses pembayaran. Silakan coba lagi.', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pilih Pembayaran</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: QRIS */}
        <Text style={styles.sectionTitle}>QRIS</Text>
        <View style={styles.sectionCard}>
          {QRIS_DATA.map(renderPaymentRow)}
        </View>

        {/* Section 2: Transfer Bank — Virtual Account */}
        <Text style={styles.sectionTitle}>Transfer Bank — Virtual Account</Text>
        <View style={styles.sectionCard}>
          {VA_DATA.map(renderPaymentRow)}
        </View>

        {/* Section 3: Minimarket */}
        <Text style={styles.sectionTitle}>Minimarket</Text>
        <View style={styles.sectionCard}>
          {MINIMARKET_DATA.map(renderPaymentRow)}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed Bottom Summary */}
      <View style={styles.bottomCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryInfo}>
            {selectedMethod ? (
              <View style={styles.selectedPreview}>
                <View style={[styles.miniLogo, { backgroundColor: selectedMethod.logoColor }]}>
                   <Text style={styles.miniLogoText}>{selectedMethod.shortName}</Text>
                </View>
                <View>
                  <Text style={styles.summaryLabel}>Metode Terpilih</Text>
                  <Text style={styles.summaryMethodName}>{selectedMethod.name}</Text>
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.summaryLabel}>Total Pembayaran</Text>
                <Text style={styles.placeholderLabel}>Pilih metode pembayaran</Text>
              </View>
            )}
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatRupiah(totalAmount)}</Text>
          </View>
        </View>

        <TouchableOpacity
          disabled={!selectedMethod || createPaymentMutation.isPending}
          style={[
            styles.payBtn,
            (!selectedMethod || createPaymentMutation.isPending) && styles.payBtnDisabled
          ]}
          onPress={handleProcessPayment}
        >
          {createPaymentMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payBtnText}>Lanjut Bayar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Custom Alert Modal */}
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
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#757575',
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  paymentRowSelected: {
    backgroundColor: '#FAEEDA', // Cream
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  paymentInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  availableBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  availableText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: 'bold',
  },
  paymentSubText: {
    fontSize: 12,
    color: '#757575',
    lineHeight: 16,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  radioButtonActive: {
    borderColor: '#854F0B',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#854F0B',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryInfo: {
    flex: 1,
  },
  selectedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  miniLogoText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  summaryMethodName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
  },
  placeholderLabel: {
    fontSize: 13,
    color: '#BDBDBD',
    fontStyle: 'italic',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#854F0B',
  },
  payBtn: {
    backgroundColor: '#854F0B',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payBtnDisabled: {
    backgroundColor: '#E0E0E0',
  },
  payBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
