import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useRequestOTP, useVerifyOTP, useVerifyPIN } from '../services/queries';
import { useAuthStore, useUserStore } from '../store/useStore';
import CustomAlertModal from '../components/CustomAlertModal';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: PIN
  const [isNewUser, setIsNewUser] = useState(false);
   const { setToken } = useAuthStore();
  const { setUser } = useUserStore();

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };
  const router = useRouter();

  const requestOTPMutation = useRequestOTP();
  const verifyOTPMutation = useVerifyOTP();
  const verifyPINMutation = useVerifyPIN();

  const handleRequestOTP = async () => {
    if (phoneNumber.length < 10) return;
    
    requestOTPMutation.mutate(`0${phoneNumber}`, {
      onSuccess: (data) => {
        if (data.success) {
          if (data.requirePIN) {
            router.push({
              pathname: '/auth/pin',
              params: { 
                phone: `0${phoneNumber}`, 
                isNewUser: 'false' 
              }
            });
          } else {
            setStep(2);
            showAlert('OTP Terkirim', 'Silakan cek konsol backend untuk kode OTP (Simulasi).', 'success');
          }
        } else {
          showAlert('Gagal', data.message || 'Gagal mengirim OTP', 'error');
        }
      },
      onError: (error: any) => {
        showAlert('Error', error.response?.data?.message || 'Terjadi kesalahan sistem', 'error');
      }
    });
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 4) return;

    verifyOTPMutation.mutate({ phone: `0${phoneNumber}`, otp }, {
      onSuccess: (data) => {
        if (data.success) {
          router.push({
            pathname: '/auth/pin',
            params: { 
              phone: `0${phoneNumber}`, 
              isNewUser: data.data.isNewUser.toString() 
            }
          });
        } else {
          showAlert('Gagal', data.message || 'Kode OTP salah', 'error');
        }
      },
      onError: (error: any) => {
        showAlert('Error', error.response?.data?.message || 'Verifikasi gagal', 'error');
      }
    });
  };

  const handleVerifyPIN = async () => {
    if (pin.length < 6) {
      showAlert('PIN Pendek', 'PIN harus 6 digit.', 'info');
      return;
    }

    verifyPINMutation.mutate({ phone: `0${phoneNumber}`, pin }, {
      onSuccess: (data) => {
        if (data.success) {
          setToken(data.data.token);
          setUser(data.data);
          router.replace('/(tabs)');
        } else {
          showAlert('Gagal', data.message || 'PIN salah', 'error');
        }
      },
      onError: (error: any) => {
        showAlert('Error', error.response?.data?.message || 'Gagal verifikasi PIN', 'error');
      }
    });
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1000&auto=format&fit=crop' }}
      style={styles.background}
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.container}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => {
            setToken('guest-token');
            setUser({ name: 'Tamu', points: 0, tier: 'Bronze', isGuest: true });
            router.replace('/(tabs)');
          }}
        >
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="cafe" size={50} color={Colors.accent} />
            </View>
            <Text style={styles.title}>Toko Kopi Jaya</Text>
            <Text style={styles.subtitle}>Nikmati setiap tetes kebahagiaan</Text>
          </View>

          <View style={styles.formCard}>
            {step === 1 && (
              <>
                <Text style={styles.inputLabel}>Nomor Telepon</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+62</Text>
                  </View>
                  <TextInput
                    placeholder="812 3456 7890"
                    placeholderTextColor="#9E9E9E"
                    keyboardType="phone-pad"
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.loginBtn, phoneNumber.length < 10 && styles.loginBtnDisabled]}
                  onPress={handleRequestOTP}
                  disabled={requestOTPMutation.isPending || phoneNumber.length < 10}
                >
                  <Text style={styles.loginBtnText}>
                    {requestOTPMutation.isPending ? 'Mengirim...' : 'Lanjutkan'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {step === 2 && (
              <>
                <View style={styles.otpHeader}>
                  <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.inputLabel}>Masukkan Kode OTP</Text>
                </View>
                <Text style={styles.otpSubtitle}>Kode dikirim ke +62 {phoneNumber}</Text>

                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="1234"
                    placeholderTextColor="#9E9E9E"
                    keyboardType="number-pad"
                    maxLength={4}
                    style={[styles.input, { textAlign: 'center', letterSpacing: 10, fontWeight: 'bold' }]}
                    value={otp}
                    onChangeText={setOtp}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.loginBtn, otp.length < 4 && styles.loginBtnDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={verifyOTPMutation.isPending || otp.length < 4}
                >
                  <Text style={styles.loginBtnText}>
                    {verifyOTPMutation.isPending ? 'Memverifikasi...' : 'Verifikasi OTP'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <Text style={styles.termsText}>
              Dengan masuk, Anda menyetujui <Text style={styles.linkText}>Syarat & Ketentuan</Text> kami.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Custom Alert Modal */}
      <CustomAlertModal
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(75, 44, 32, 0.7)', // Deep coffee overlay
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    overflow: 'hidden',
    marginBottom: 24,
  },
  countryCode: {
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    backgroundColor: '#EEEEEE',
    height: 56,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
  },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 18,
    color: '#212121',
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  loginBtnDisabled: {
    backgroundColor: '#BDBDBD',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipBtnText: {
    color: '#757575',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  termsText: {
    textAlign: 'center',
    color: '#9E9E9E',
    fontSize: 12,
    marginTop: 20,
    lineHeight: 18,
  },
  linkText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    marginRight: 12,
  },
  otpSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 20,
  },
});
