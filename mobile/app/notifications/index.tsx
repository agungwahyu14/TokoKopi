import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import {
  useNotifications,
  useMarkAllNotificationsRead,
} from '../../services/queries';

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  promo:      { icon: 'pricetag',            color: '#E65100', bg: '#FFF3E0' },
  newsletter: { icon: 'newspaper',           color: '#3949AB', bg: '#E8EAF6' },
  order:      { icon: 'receipt',             color: '#1565C0', bg: '#E3F2FD' },
  system:     { icon: 'settings',            color: '#4A148C', bg: '#F3E5F5' },
  info:       { icon: 'information-circle',  color: '#00695C', bg: '#E0F2F1' },
};

function formatRelativeTime(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: notifications, isLoading, refetch } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length ?? 0;

  const handleMarkAll = () => {
    markAllRead.mutate();
  };

  const renderItem = ({ item }: { item: any }) => {
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
        activeOpacity={0.8}
        onPress={() => router.push(`/notifications/${item.id}`)}
      >
        <View style={[styles.iconCircle, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
        </View>
        <View style={styles.notifBody}>
          <View style={styles.notifTop}>
            <Text style={styles.notifTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notifMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notifTime}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#4B2C20" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifikasi</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAll} disabled={markAllRead.isPending}>
            <Text style={styles.markAllText}>Baca Semua</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Ionicons name="mail-unread-outline" size={16} color="#1565C0" />
          <Text style={styles.unreadBannerText}>
            {unreadCount} notifikasi belum dibaca
          </Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : !notifications || notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={64} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>Belum Ada Notifikasi</Text>
          <Text style={styles.emptySubtitle}>
            Kami akan memberitahu kamu tentang promo, pesanan, dan info terbaru di sini.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    width: 80,
    textAlign: 'right',
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  unreadBannerText: {
    color: '#1565C0',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notifCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  notifBody: {
    flex: 1,
  },
  notifTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    flexShrink: 0,
  },
  notifMessage: {
    fontSize: 13,
    color: '#616161',
    lineHeight: 18,
    marginBottom: 6,
  },
  notifTime: {
    fontSize: 11,
    color: '#BDBDBD',
    fontWeight: '500',
  },
  separator: {
    height: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#757575',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#BDBDBD',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
