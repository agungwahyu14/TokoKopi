import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomAlertModal from '../../components/CustomAlertModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useUserStore, useAuthStore } from '../../store/useStore';
import api from '../../services/api';

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useUserStore();
  const { token } = useAuthStore();

  const [settings, setSettings] = useState({
    promo: user?.notifyPromo !== false,
    orderStatus: user?.notifyOrderStatus !== false,
    newsletter: false,
    security: true,
  });

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'error' as 'success' | 'error' | 'info' });
  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  const toggleSwitch = async (key: keyof typeof settings) => {
    const newValue = !settings[key];
    
    // Update local state first for instant visual response
    setSettings(prev => ({ ...prev, [key]: newValue }));

    if (key === 'promo' || key === 'orderStatus') {
      const updatePayload: any = {};
      if (key === 'promo') {
        updatePayload.notifyPromo = newValue;
      } else if (key === 'orderStatus') {
        updatePayload.notifyOrderStatus = newValue;
      }

      try {
        if (token && token !== 'guest-token') {
          // Update to backend API
          await api.put('/auth/profile', updatePayload);
        }
        // Update to local store
        updateUser(updatePayload);
      } catch (error) {
        console.error('Failed to sync notification settings:', error);
        // Rollback on error
        setSettings(prev => ({ ...prev, [key]: !newValue }));
        showAlert('Gagal', 'Gagal menyimpan pengaturan notifikasi. Silakan coba lagi.', 'error');
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifikasi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Pengaturan Notifikasi</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingName}>Promo & Penawaran</Text>
            <Text style={styles.settingDesc}>Dapatkan info diskon dan promo menarik</Text>
          </View>
          <Switch
            value={settings.promo}
            onValueChange={() => toggleSwitch('promo')}
            trackColor={{ false: '#E0E0E0', true: Colors.primary + '80' }}
            thumbColor={settings.promo ? Colors.primary : '#F5F5F5'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingName}>Status Pesanan</Text>
            <Text style={styles.settingDesc}>Update real-time proses pesananmu</Text>
          </View>
          <Switch
            value={settings.orderStatus}
            onValueChange={() => toggleSwitch('orderStatus')}
            trackColor={{ false: '#E0E0E0', true: Colors.primary + '80' }}
            thumbColor={settings.orderStatus ? Colors.primary : '#F5F5F5'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingName}>Newsletter</Text>
            <Text style={styles.settingDesc}>Artikel dan tips seputar kopi</Text>
          </View>
          <Switch
            value={settings.newsletter}
            onValueChange={() => toggleSwitch('newsletter')}
            trackColor={{ false: '#E0E0E0', true: Colors.primary + '80' }}
            thumbColor={settings.newsletter ? Colors.primary : '#F5F5F5'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingName}>Keamanan Akun</Text>
            <Text style={styles.settingDesc}>Info login dan aktivitas mencurigakan</Text>
          </View>
          <Switch
            value={settings.security}
            onValueChange={() => toggleSwitch('security')}
            trackColor={{ false: '#E0E0E0', true: Colors.primary + '80' }}
            thumbColor={settings.security ? Colors.primary : '#F5F5F5'}
          />
        </View>
      </ScrollView>

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
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#212121' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#9E9E9E', marginBottom: 20, textTransform: 'uppercase' },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  settingInfo: { flex: 1, marginRight: 16 },
  settingName: { fontSize: 16, fontWeight: 'bold', color: '#212121' },
  settingDesc: { fontSize: 13, color: '#757575', marginTop: 4 },
});
