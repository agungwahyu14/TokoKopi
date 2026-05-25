import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAlertModal from '../../components/CustomAlertModal';
import { API_URL, Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/useStore';

export default function AddressFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuthStore();

  const [label, setLabel] = useState('');
  const [address, setAddress] = useState(params.address as string || '');
  const [city, setCity] = useState(params.city as string || '');
  const [postalCode, setPostalCode] = useState(params.postalCode as string || '');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' as 'success' | 'error' | 'info', onClose: () => { } });
  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info', onClose = () => { }) => {
    setAlertConfig({ title, message, type, onClose });
    setAlertVisible(true);
  };

  const handleSave = async () => {
    if (!label || !address || !city || !postalCode) {
      showAlert('Gagal', 'Semua field wajib diisi. Pastikan semua kolom terisi dengan benar.', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/users/addresses`, {
        label,
        address,
        city,
        postalCode,
        latitude: params.latitude,
        longitude: params.longitude,
        isDefault,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        showAlert('Berhasil', 'Alamat baru berhasil ditambahkan ke profil Anda.', 'success', () => {
          router.dismissAll();
          router.push('/profile/addresses');
        });
      }
    } catch (error: any) {
      console.error('Save address error:', error.response?.data || error.message);
      showAlert('Gagal', 'Terjadi kesalahan saat menyimpan alamat. Silakan coba lagi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Alamat</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Label Alamat (Contoh: Rumah, Kantor)</Text>
            <TextInput
              style={styles.input}
              value={label}
              onChangeText={setLabel}
              placeholder="Masukkan label alamat"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Alamat Lengkap</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder="Masukkan alamat lengkap"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Kota</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="Kota"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Kode Pos</Text>
              <TextInput
                style={styles.input}
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="Kode Pos"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Jadikan Alamat Utama</Text>
              <Text style={styles.switchSublabel}>Alamat ini akan otomatis terpilih saat checkout</Text>
            </View>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: '#767577', true: Colors.primary + '80' }}
              thumbColor={isDefault ? Colors.primary : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveBtnText}>
              {loading ? 'Menyimpan...' : 'Simpan Alamat'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomAlertModal
        visible={alertVisible}
        onClose={() => {
          setAlertVisible(false);
          alertConfig.onClose();
        }}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,

  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#212121' },
  content: { flex: 1 },
  form: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, color: '#757575', marginBottom: 8, fontWeight: '500' },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#212121',
  },
  textArea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F5F5F5',
    marginBottom: 30,
  },
  switchLabel: { fontSize: 16, fontWeight: 'bold', color: '#212121' },
  switchSublabel: { fontSize: 12, color: '#757575', marginTop: 2 },
  saveBtn: {
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
