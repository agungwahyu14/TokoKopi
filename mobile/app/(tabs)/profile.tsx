import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomConfirmModal from '../../components/CustomConfirmModal';
import { API_URL, Colors } from '../../constants/Colors';
import { useLogout, useProfile } from '../../services/queries';
import { useUserStore } from '../../store/useStore';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, logout, updateUser } = useUserStore();
  const router = useRouter();
  const logoutMutation = useLogout();
  const { data: profileData, isLoading, refetch, isRefetching } = useProfile();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  useEffect(() => {
    if (!user || user.isGuest) {
      router.replace('/login');
    }
  }, [user]);

  useEffect(() => {
    if (profileData) {
      updateUser(profileData);
    }
  }, [profileData]);

  const onRefresh = React.useCallback(() => {
    refetch();
  }, []);

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const MenuButton = ({ icon, label, route, isError = false, showBorder = true }: any) => (
    <TouchableOpacity
      style={[styles.menuItem, !showBorder && { borderBottomWidth: 0 }]}
      onPress={() => route ? router.push(route) : (isError ? handleLogout() : null)}
    >
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={22} color={isError ? '#F44336' : Colors.primary} />
        <Text style={[styles.menuLabel, isError && { color: '#F44336' }]}>{label}</Text>
      </View>
      {!isError && <Ionicons name="chevron-forward" size={18} color="#BDBDBD" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              {user?.photoUrl ? (
                <Image
                  source={{ uri: user.photoUrl.startsWith('http') ? user.photoUrl : `${API_URL.replace('/api', '')}${user.photoUrl}` }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>{user?.name?.substring(0, 1) || 'U'}</Text>
              )}
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
          <Text style={styles.userPhone}>{user?.phone || '08xxxxxxxxxx'}</Text>
          {user?.createdAt && (
            <Text style={styles.memberSince}>Member sejak: {formatDate(user.createdAt)}</Text>
          )}
        </View>

        {/* Stats Bento */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>POINT BALANCE</Text>
            <Text style={styles.statValue}>{(user?.points || 0).toLocaleString()} <Text style={styles.statUnit}>pts</Text></Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TOTAL ORDERS</Text>
            <Text style={styles.statValue}>{user?.totalOrders || 0}</Text>
          </View>
        </View>

        {/* Settings Section */}
        <Text style={styles.sectionTitle}>Settings & Preferences</Text>
        <View style={styles.card}>
          <MenuButton icon="person-outline" label="Account Settings" route="/profile/edit" />
          <MenuButton icon="ticket-outline" label="Voucher Saya" route="/profile/vouchers" />
          <MenuButton icon="card-outline" label="Payment Methods" route="/profile/payment" />
          <MenuButton icon="location-outline" label="Saved Addresses" route="/profile/addresses" />
          <MenuButton icon="notifications-outline" label="Notifications" route="/profile/notifications" showBorder={false} />
        </View>

        {/* Support Section */}
        <View style={[styles.card, { marginTop: 24 }]}>
          <MenuButton icon="help-circle-outline" label="Help & Support" route="/profile/help" />
          <MenuButton icon="log-out-outline" label="Logout" isError={true} showBorder={false} />
        </View>

        <Text style={styles.versionText}>Toko Kopi Jaya v1.0.0</Text>
      </ScrollView>

      {/* Custom Logout Confirmation Modal */}
      <CustomConfirmModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        onConfirm={() => {
          setLogoutModalVisible(false);
          logoutMutation.mutate(undefined, {
            onSettled: () => logout()
          });
        }}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari akun?"
        confirmText="Keluar"
        cancelText="Batal"
        iconName="log-out-outline"
        isDestructive={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
  },
  logoGroup: { flexDirection: 'row', alignItems: 'center' },
  brandTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.primary, marginLeft: 8 },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 80 },
  header: { alignItems: 'center', marginVertical: 30 },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 40, fontWeight: 'bold', color: Colors.white },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 2,
  },
  userName: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  userPhone: { fontSize: 14, color: Colors.secondary, fontWeight: '500', marginBottom: 4 },
  memberSince: { fontSize: 12, color: '#9E9E9E', fontWeight: '400' },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statLabel: { fontSize: 10, fontWeight: '600', color: Colors.secondary, letterSpacing: 1.2, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: Colors.primary },
  statUnit: { fontSize: 12, fontWeight: '400', color: Colors.secondary },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 16, paddingLeft: 4 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuLabel: { fontSize: 16, color: Colors.text, marginLeft: 16, fontWeight: '500' },
  versionText: { textAlign: 'center', marginTop: 32, color: Colors.secondary, fontSize: 12 },
});
