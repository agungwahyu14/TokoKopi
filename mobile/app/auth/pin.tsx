import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import CustomAlertModal from '../../components/CustomAlertModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuthStore, useUserStore } from '../../store/useStore';
import { useVerifyPIN } from '../../services/queries';

export default function PinScreen() {
  const router = useRouter();
  const { phone, isNewUser } = useLocalSearchParams<{ phone: string, isNewUser: string }>();
  const [pin, setPin] = useState('');
  const { setToken } = useAuthStore();
  const { setUser } = useUserStore();
  const verifyPINMutation = useVerifyPIN();

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'error' as 'success' | 'error' | 'info' });
  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  const handlePress = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      
      // Auto submit when 6 digits reached
      if (newPin.length === 6) {
        handleVerify(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleVerify = (finalPin: string) => {
    verifyPINMutation.mutate({ phone: phone as string, pin: finalPin }, {
      onSuccess: (data) => {
        if (data.success) {
          setToken(data.data.token);
          setUser(data.data);
          router.replace('/(tabs)');
        } else {
          setPin('');
          Vibration.vibrate(500);
        }
      },
      onError: (error: any) => {
        setPin('');
        Vibration.vibrate(500);
        const message = error.response?.data?.message || 'Gagal memverifikasi PIN. Silakan coba lagi.';
        showAlert('Gagal', message, 'error');
      }
    });
  };

  const renderDot = (index: number) => {
    const isActive = pin.length > index;
    return (
      <View 
        key={index} 
        style={[
          styles.dot, 
          isActive && styles.dotActive
        ]} 
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {isNewUser === 'true' ? 'Buat PIN Keamanan' : 'Masukkan PIN Anda'}
        </Text>
        <Text style={styles.subtitle}>
          {isNewUser === 'true' 
            ? 'Atur 6 digit PIN untuk mengamankan akun Anda' 
            : `Masukkan PIN untuk nomor +62 ${phone?.substring(1)}`}
        </Text>

        <View style={styles.dotsContainer}>
          {[0, 1, 2, 3, 4, 5].map(renderDot)}
        </View>

        {verifyPINMutation.isPending && (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
        )}
      </View>

      <View style={styles.keypad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <TouchableOpacity 
            key={num} 
            style={styles.key} 
            onPress={() => handlePress(num.toString())}
          >
            <Text style={styles.keyText}>{num}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.key} />
        <TouchableOpacity 
          style={styles.key} 
          onPress={() => handlePress('0')}
        >
          <Text style={styles.keyText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.key} 
          onPress={handleDelete}
        >
          <Ionicons name="backspace-outline" size={28} color="#212121" />
        </TouchableOpacity>
      </View>
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
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  content: { flex: 1, alignItems: 'center', paddingTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#212121', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#757575', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
  dotsContainer: { flexDirection: 'row', marginTop: 50, gap: 15 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#E0E0E0', backgroundColor: '#fff' },
  dotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  keypad: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 30, 
    paddingBottom: 50,
    backgroundColor: '#F9F9F9',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  key: { width: '33.33%', height: 80, justifyContent: 'center', alignItems: 'center' },
  keyText: { fontSize: 28, fontWeight: '600', color: '#212121' },
});
