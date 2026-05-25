import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAYMENT_METHODS = [
  { id: '1', name: 'GoPay / QRIS', type: 'e-wallet', icon: 'qr-code-outline', status: 'Terhubung', color: '#00AED6' },
  { id: '2', name: 'ShopeePay', type: 'e-wallet', icon: 'wallet-outline', status: 'Terhubung', color: '#EE4D2D' },
  { id: '3', name: 'Virtual Account', type: 'bank', icon: 'business-outline', status: 'BCA, Mandiri, BNI', color: '#005596' },
  { id: '4', name: 'Credit / Debit Card', type: 'card', icon: 'card-outline', status: 'Visa, Mastercard, JCB', color: '#4B2C20' },
];

export default function PaymentMethodScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Metode Pembayaran</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Metode Tersedia via Midtrans</Text>
        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity key={method.id} style={styles.methodCard}>
            <View style={[styles.iconBox, { backgroundColor: method.color + '10' }]}>
              <Ionicons name={method.icon as any} size={24} color={method.color} />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{method.name}</Text>
              <Text style={styles.methodStatus}>{method.status}</Text>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeText}>Aktif</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
          <Text style={styles.infoText}>Pembayaran aman & terenkripsi oleh Midtrans</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#212121' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#9E9E9E', marginBottom: 16, textTransform: 'uppercase' },
  methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0', marginBottom: 12 },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  methodInfo: { flex: 1 },
  methodName: { fontSize: 16, fontWeight: 'bold', color: '#212121' },
  methodStatus: { fontSize: 13, color: '#757575', marginTop: 2 },
  activeBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  activeText: { color: '#4CAF50', fontSize: 12, fontWeight: 'bold' },
  infoBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, backgroundColor: '#F5F5F5', padding: 16, borderRadius: 12, gap: 10 },
  infoText: { fontSize: 13, color: '#616161', fontWeight: '500', textAlign: 'center', lineHeight: 18 },
});
