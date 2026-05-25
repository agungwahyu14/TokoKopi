import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
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
import { API_URL, Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/useStore';

export default function SavedAddressesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuthStore();
  const [addresses, setAddresses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchAddresses = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAddresses(response.data.data);
      }
    } catch (error) {
      console.error('Fetch addresses error:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAddresses();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const response = await axios.delete(`${API_URL}/users/addresses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAddresses(addresses.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error('Delete address error:', error);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alamat Tersimpan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {addresses.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color="#E0E0E0" />
            <Text style={styles.emptyText}>Belum ada alamat tersimpan</Text>
          </View>
        ) : (
          addresses.map((addr) => (
            <View key={addr.id} style={styles.addressCard}>
              <View style={styles.iconBox}>
                <Ionicons
                  name={addr.label.toLowerCase() === 'rumah' ? 'home-outline' : 'business-outline'}
                  size={24}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.addressInfo}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{addr.label}</Text>
                  {addr.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Utama</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addressText}>{addr.address}</Text>
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(addr.id)}>
                <Ionicons name="trash-outline" size={18} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/address/map')}
        >
          <Ionicons name="location-outline" size={24} color={Colors.primary} />
          <Text style={styles.addBtnText}>Tambah Alamat Baru</Text>
        </TouchableOpacity>
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
  addressCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0', marginBottom: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F9F9F9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  addressInfo: { flex: 1 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#212121' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  defaultBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  defaultText: { color: '#4CAF50', fontSize: 10, fontWeight: 'bold' },
  addressText: { fontSize: 13, color: '#757575', marginTop: 4, lineHeight: 18 },
  deleteBtn: { padding: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.primary, marginTop: 10 },
  addBtnText: { marginLeft: 8, fontSize: 15, fontWeight: 'bold', color: Colors.primary },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: '#9E9E9E', marginTop: 16, fontSize: 16 },
});
