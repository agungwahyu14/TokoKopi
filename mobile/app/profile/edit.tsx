import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAlertModal from '../../components/CustomAlertModal';
import CustomConfirmModal from '../../components/CustomConfirmModal';
import { API_URL, Colors } from '../../constants/Colors';
import { useAuthStore, useUserStore } from '../../store/useStore';

export default function EditProfileScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { user, updateUser, logout } = useUserStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [gender, setGender] = useState<'pria' | 'wanita' | null>(user?.gender || null);
  const [birthDate, setBirthDate] = useState<Date | null>(user?.birthDate ? new Date(user.birthDate) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(birthDate || new Date());
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' as 'success' | 'error' | 'info', onClose: () => { } });
  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info', onClose = () => { }) => {
    setAlertConfig({ title, message, type, onClose });
    setAlertVisible(true);
  };

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', confirmText: 'Ya', cancelText: 'Batal', iconName: 'trash-outline' as any, isDestructive: false, onConfirm: () => { } });
  const showConfirm = (title: string, message: string, confirmText: string, isDestructive: boolean, onConfirm: () => void) => {
    setConfirmConfig({ title, message, confirmText, cancelText: 'Batal', iconName: 'trash-outline', isDestructive, onConfirm });
    setConfirmVisible(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      if (gender) formData.append('gender', gender);
      if (birthDate) formData.append('birthDate', birthDate.toISOString().split('T')[0]);

      if (image) {
        const filename = image.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;

        // @ts-ignore
        formData.append('image', {
          uri: image,
          name: filename,
          type,
        });
      }

      const response = await axios.put(`${API_URL}/auth/profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.data.success) {
        updateUser(response.data.data);
        showAlert('Berhasil', 'Profil Anda telah diperbarui.', 'success', () => router.back());
      }
    } catch (error: any) {
      console.error('Update profile error:', error.response?.data || error.message);
      showAlert('Gagal', error.response?.data?.message || 'Terjadi kesalahan saat memperbarui profil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    showConfirm(
      'Hapus Akun',
      'Apakah Anda yakin ingin menghapus akun ini secara permanen? Tindakan ini tidak dapat dibatalkan.',
      'Hapus Selamanya',
      true,
      async () => {
        try {
          setLoading(true);
          const response = await axios.delete(`${API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data.success) {
            showAlert('Berhasil', 'Akun Anda telah dihapus.', 'info', () => {
              logout();
              router.replace('/login');
            });
          }
        } catch (error: any) {
          showAlert('Gagal', error.response?.data?.message || 'Terjadi kesalahan saat menghapus akun', 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profil</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Simpan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            {image || user?.photoUrl ? (
              <Image
                source={{ uri: image || (user?.photoUrl?.startsWith('http') ? user.photoUrl : `${API_URL.replace('/api', '')}${user.photoUrl}`) }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>{name.substring(0, 1) || 'U'}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.changePhotoBtn} onPress={pickImage} disabled={loading}>
            <Text style={styles.changePhotoText}>
              {loading ? 'Memproses...' : 'Ganti Foto Profil'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Lengkap</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Masukkan nama lengkap"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nomor Telepon</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.phone}
              editable={false}
            />
            <Text style={styles.helperText}>Nomor telepon tidak dapat diubah</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="nama@email.com"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Jenis Kelamin</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[styles.genderOption, gender === 'pria' && styles.genderOptionActive]}
                onPress={() => setGender('pria')}
              >
                <Ionicons name="male" size={20} color={gender === 'pria' ? '#fff' : '#757575'} />
                <Text style={[styles.genderText, gender === 'pria' && styles.genderTextActive]}>Pria</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderOption, gender === 'wanita' && styles.genderOptionActive]}
                onPress={() => setGender('wanita')}
              >
                <Ionicons name="female" size={20} color={gender === 'wanita' ? '#fff' : '#757575'} />
                <Text style={[styles.genderText, gender === 'wanita' && styles.genderTextActive]}>Wanita</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tanggal Lahir</Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
              <Text style={[styles.dateText, !birthDate && { color: '#BDBDBD' }]}>
                {birthDate ? birthDate.toLocaleDateString('id-ID') : 'Pilih tanggal lahir'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#757575" />
            </TouchableOpacity>
            {Platform.OS === 'ios' ? (
              <Modal
                transparent={true}
                visible={showDatePicker}
                animationType="slide"
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.pickerContainer}>
                    <View style={styles.pickerHeader}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.cancelText}>Batal</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => {
                        setBirthDate(tempDate);
                        setShowDatePicker(false);
                      }}>
                        <Text style={styles.doneText}>Selesai</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={tempDate}
                      mode="date"
                      display="spinner"
                      maximumDate={new Date()}
                      textColor="#000000"
                      style={{ height: 200, width: '100%' }}
                      onChange={(event, selectedDate) => {
                        if (selectedDate) setTempDate(selectedDate);
                      }}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              showDatePicker && (
                <DateTimePicker
                  value={birthDate || new Date()}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setBirthDate(selectedDate);
                  }}
                />
              )
            )}
          </View>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} disabled={loading}>
            <Ionicons name="trash-outline" size={20} color="#F44336" />
            <Text style={styles.deleteBtnText}>Hapus Akun Permanen</Text>
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

      <CustomConfirmModal
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        onConfirm={() => {
          setConfirmVisible(false);
          confirmConfig.onConfirm();
        }}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        iconName={confirmConfig.iconName}
        isDestructive={confirmConfig.isDestructive}
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
  saveText: { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
  content: { flex: 1 },
  avatarSection: { alignItems: 'center', paddingVertical: 30 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: { color: 'white', fontSize: 40, fontWeight: 'bold' },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  changePhotoBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  changePhotoText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  form: { paddingHorizontal: 20 },
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
  inputDisabled: { backgroundColor: '#F5F5F5', color: '#9E9E9E' },
  helperText: { fontSize: 12, color: '#9E9E9E', marginTop: 4 },
  genderContainer: { flexDirection: 'row', gap: 12 },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    gap: 8,
  },
  genderOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  genderText: { fontSize: 16, color: '#757575', fontWeight: '500' },
  genderTextActive: { color: '#fff' },
  dateInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: { fontSize: 16, color: '#212121' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 40,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#FFEBEE',
    borderRadius: 12,
    backgroundColor: '#FFEBEE',
    gap: 8,
  },
  deleteBtnText: { color: '#F44336', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    width: '100%',
  },
  doneText: { color: Colors.primary, fontWeight: 'bold', fontSize: 16 },
  cancelText: { color: '#757575', fontSize: 16 },
});
