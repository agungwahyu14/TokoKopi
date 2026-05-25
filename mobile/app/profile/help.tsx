import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FAQS = [
  { id: '1', question: 'Bagaimana cara menggunakan voucher?', answer: 'Anda dapat memilih voucher yang tersedia di halaman Checkout sebelum melakukan pemesanan.' },
  { id: '2', question: 'Berapa lama waktu pengiriman?', answer: 'Waktu pengiriman rata-rata adalah 15-30 menit tergantung jarak lokasi Anda.' },
  { id: '3', question: 'Metode pembayaran apa saja yang tersedia?', answer: 'Kami mendukung Tunai, GoPay, OVO, dan ShopeePay.' },
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bantuan & Dukungan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Hubungi Kami</Text>
        <View style={styles.contactSection}>
          <TouchableOpacity style={styles.contactCard}>
            <View style={[styles.contactIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="logo-whatsapp" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.contactLabel}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactCard}>
            <View style={[styles.contactIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="mail-outline" size={24} color="#2196F3" />
            </View>
            <Text style={styles.contactLabel}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactCard}>
            <View style={[styles.contactIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="call-outline" size={24} color="#FF9800" />
            </View>
            <Text style={styles.contactLabel}>Pusat Bantuan</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>FAQ (Tanya Jawab)</Text>
        {FAQS.map((faq) => (
          <TouchableOpacity key={faq.id} style={styles.faqCard}>
            <Text style={styles.faqQuestion}>{faq.question}</Text>
            <Text style={styles.faqAnswer}>{faq.answer}</Text>
          </TouchableOpacity>
        ))}
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
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#9E9E9E', marginBottom: 20, textTransform: 'uppercase' },
  contactSection: { flexDirection: 'row', justifyContent: 'space-between' },
  contactCard: { flex: 1, alignItems: 'center' },
  contactIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  contactLabel: { fontSize: 12, color: '#212121', fontWeight: '600' },
  faqCard: { backgroundColor: '#F9F9F9', padding: 16, borderRadius: 16, marginBottom: 12 },
  faqQuestion: { fontSize: 15, fontWeight: 'bold', color: '#212121', marginBottom: 8 },
  faqAnswer: { fontSize: 13, color: '#757575', lineHeight: 20 },
});
