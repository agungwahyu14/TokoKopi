import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

export default function CheckoutSuccessScreen() {
  const router = useRouter();
  const { orderId, orderNumber, type } = useLocalSearchParams();
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Animated Checkmark */}
        <Animated.View 
          style={[
            styles.iconWrapper, 
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim }
          ]}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={60} color="white" />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: opacityAnim, alignItems: 'center' }}>
          <Text style={styles.successTitle}>Pesanan Berhasil!</Text>
          <Text style={styles.orderNumber}>No. Pesanan: {orderNumber || `TKJ-${orderId}`}</Text>
          
          <View style={styles.messageCard}>
            <Ionicons 
              name={type === 'pickup' ? 'walk' : 'bicycle'} 
              size={24} 
              color={Colors.primary} 
            />
            <Text style={styles.messageText}>
              {type === 'pickup' 
                ? 'Silakan datang ke toko dalam 15-20 menit. Baristamu sedang menyiapkan pesanan.' 
                : 'Kurir kami akan segera mengantarkan pesanan ke alamatmu.'}
            </Text>
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.detailBtn}
            onPress={() => router.push({ pathname: '/orders/[id]', params: { id: orderId as string } })}
          >
            <Text style={styles.detailBtnText}>Lihat Detail Pesanan</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.homeBtn}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.homeBtnText}>Kembali ke Beranda</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  iconWrapper: { marginBottom: 30 },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#212121', marginBottom: 8 },
  orderNumber: { fontSize: 16, color: '#757575', marginBottom: 40 },
  messageCard: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    width: width - 48,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  messageText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  footer: { width: '100%', marginTop: 60 },
  detailBtn: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  homeBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  homeBtnText: { color: '#757575', fontSize: 16, fontWeight: '600' },
});
