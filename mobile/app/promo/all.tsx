import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePromos } from '../../services/queries';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function AllPromosScreen() {
  const router = useRouter();
  const { data: promos, isLoading } = usePromos();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promo Hari Ini</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>



      <FlatList
        data={promos}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.promoCard} 
            activeOpacity={0.9}
            onPress={() => router.push(`/promo/${item.id}`)}
          >
            <Image source={{ uri: item.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1000&auto=format&fit=crop' }} style={styles.promoImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.promoGradient}
            />
            <View style={styles.promoBadge}>
              <Text style={styles.promoBadgeText}>
                {item.type === 'percent' ? `${Math.round(item.value)}% OFF` : `DISKON ${Math.round(item.value/1000)}RB`}
              </Text>
            </View>
            <View style={styles.promoContent}>
              <View>
                <Text style={styles.promoTitle}>{item.title}</Text>
                <View style={styles.promoCodeContainer}>
                  <Ionicons name="flash" size={14} color="#FFB300" />
                  <Text style={styles.promoCodeText}>{item.pointCost} Poin</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.klaimButton}
                onPress={() => router.push(`/promo/${item.id}`)}
              >
                <Text style={styles.klaimButtonText}>Detail</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="gift-outline" size={60} color="#E0E0E0" />
            <Text style={styles.emptyText}>Belum ada promo tersedia</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
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
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: '#9E9E9E',
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '800',
  },
  promoCard: {
    height: 200,
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  promoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  promoGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  promoBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  promoBadgeText: {
    color: '#4B2C20',
    fontSize: 12,
    fontWeight: '800',
  },
  promoContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  promoTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  promoCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoCodeLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  promoCodeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
  },
  klaimButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  klaimButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    color: '#9E9E9E',
    fontSize: 16,
  },
});
