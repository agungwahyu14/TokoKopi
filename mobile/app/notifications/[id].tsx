import React from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useNotificationDetail } from '../../services/queries';
import { API_URL } from '../../constants/Colors';

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  promo:      { icon: 'pricetag',            color: '#E65100', bg: '#FFF3E0', label: 'Promo & Penawaran' },
  newsletter: { icon: 'newspaper',           color: '#3949AB', bg: '#E8EAF6', label: 'Newsletter'        },
  order:      { icon: 'receipt',             color: '#1565C0', bg: '#E3F2FD', label: 'Status Pesanan'    },
  system:     { icon: 'settings',            color: '#4A148C', bg: '#F3E5F5', label: 'Sistem'            },
  info:       { icon: 'information-circle',  color: '#00695C', bg: '#E0F2F1', label: 'Info'              },
};

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: notif, isLoading } = useNotificationDetail(id);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#4B2C20" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Notifikasi</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!notif) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#4B2C20" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Notifikasi</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={60} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>Notifikasi tidak ditemukan</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
  const imageUri = notif.imageUrl
    ? notif.imageUrl.startsWith('http')
      ? notif.imageUrl
      : `${API_URL.replace('/api', '')}${notif.imageUrl}`
    : null;

  const formattedDate = new Date(notif.createdAt).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#4B2C20" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Notifikasi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Image banner */}
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.bannerImage} resizeMode="cover" />
        )}

        {/* Type badge */}
        <View style={styles.typeBadgeRow}>
          <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
            <Text style={[styles.typeLabel, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          {!notif.isRead ? (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadPillText}>Baru</Text>
            </View>
          ) : (
            <View style={styles.readPill}>
              <Ionicons name="checkmark-done" size={12} color="#757575" />
              <Text style={styles.readPillText}>Sudah dibaca</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{notif.title}</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Message */}
        <Text style={styles.message}>{notif.message}</Text>

        {/* Date */}
        <View style={styles.dateRow}>
          <Ionicons name="time-outline" size={14} color="#BDBDBD" />
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  bannerImage: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    marginBottom: 20,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  unreadPill: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  unreadPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  readPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readPillText: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 30,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 16,
  },
  message: {
    fontSize: 15,
    color: '#424242',
    lineHeight: 24,
    marginBottom: 24,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#BDBDBD',
    marginLeft: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    color: '#757575',
    marginTop: 12,
  },
});
