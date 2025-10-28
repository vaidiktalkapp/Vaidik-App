// src/screens/Home/Home.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import HeaderIcons from '../../component/HeaderIcons';
// import astrologerService from '../../services/api/AstrologerService';
import astrologerService from '../../services/api/astrologerService';
import livestreamService from '../../services/api/LivestreamService';
import walletService from '../../services/api/WalletService';
import userService from '../../services/api/UserService';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const Home = ({ navigation }) => {
  const { user } = useAuth();
  
  const scrollViewRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('ENG');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  
  // ✅ NEW: Separate state for live streams and astrologers
  const [liveStreams, setLiveStreams] = useState([]);
  const [liveAstrologers, setLiveAstrologers] = useState([]);
  const [chatAstrologers, setChatAstrologers] = useState([]);

  const languages = [
    { code: 'ENG', name: 'English' },
    { code: 'हिंदी', name: 'Hindi' },
    { code: 'FRA', name: 'French' },
  ];

  const banners = [
    {
      id: 1,
      text: 'What will my future be in the next 5 years?',
      icon: 'person',
      color: '#ff9800',
      bg: '#fff8e1',
    },
    {
      id: 2,
      text: 'Get instant answers to your questions',
      icon: 'chatbubble-ellipses',
      color: '#e91e63',
      bg: '#fce4ec',
    },
  ];

  useEffect(() => {
    loadHomeData();
    
    // Auto-toggle banners every 5 seconds
    const bannerInterval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    // Auto-refresh live streams every 30 seconds
    const liveInterval = setInterval(() => {
      loadLiveStreams();
    }, 30000);

    return () => {
      clearInterval(bannerInterval);
      clearInterval(liveInterval);
    };
  }, );

  // ✅ Load all home screen data
  const loadHomeData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadWalletBalance(),
        loadLiveStreams(),
        loadAstrologers(),
      ]);
    } catch (error) {
      console.error('Load home data error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  // ✅ Load wallet balance
  const loadWalletBalance = async () => {
    try {
      const walletResponse = await walletService.getWalletStats();
      if (walletResponse.success) {
        setWalletBalance(walletResponse.data.currentBalance || 0);
      }
    } catch (error) {
      console.log('⚠️ Wallet fetch skipped');
    }
  };

  // ✅ Load live streams
  const loadLiveStreams = async () => {
    try {
      console.log('📡 Fetching live streams...');
      const response = await livestreamService.getLiveStreams({ page: 1, limit: 10 });
      
      if (response.success) {
        console.log('✅ Live streams fetched:', response.data.length, 'items');
        setLiveStreams(response.data);
      }
    } catch (error) {
      console.log('⚠️ Live streams fetch error:', error.message);
      setLiveStreams([]);
    }
  };

  // ✅ Load astrologers (using your method)
  const loadAstrologers = async () => {
    try {
      console.log('📡 Fetching astrologers...');
      
      const params = {
        page: 1,
        limit: 20,
        sortBy: 'popularity',
      };

      const response = await astrologerService.searchAstrologers(params);
      
      console.log('📦 Astrologers response:', response);

      if (response.success && response.data) {
        const astrologersList = Array.isArray(response.data) 
          ? response.data 
          : response.data.astrologers || [];
        
        console.log('✅ Astrologers fetched:', astrologersList.length, 'items');

        // Format data
        const formattedData = astrologersList.map((astro, index) => {
          const astrologerId = astro._id?.toString() || astro.id?.toString() || `astro-${index}`;

          return {
            id: astrologerId,
            _id: astrologerId, // Keep original
            name: astro.name,
            skills: astro.specializations || [],
            languages: astro.languages || [],
            experienceYears: astro.experienceYears || 0,
            pricing: astro.pricing || {},
            rating: astro.ratings?.average || 5,
            totalOrders: astro.stats?.totalOrders || 0,
            profilePicture: astro.profilePicture || 'https://i.pravatar.cc/100',
            isOnline: astro.availability?.isOnline || false,
            isAvailable: astro.availability?.isAvailable || false,
          };
        });

        // Separate online and all astrologers
        const onlineAstros = formattedData.filter(astro => astro.isOnline);
        
        setLiveAstrologers(onlineAstros);
        setChatAstrologers(formattedData);

        console.log('✅ Online astrologers:', onlineAstros.length);
        console.log('✅ Total astrologers:', formattedData.length);
      } else {
        console.warn('⚠️ No astrologers data');
        setLiveAstrologers([]);
        setChatAstrologers([]);
      }
    } catch (error) {
      console.error('❌ Astrologers fetch error:', error);
      setLiveAstrologers([]);
      setChatAstrologers([]);
    }
  };

  const handleApplyLanguage = async () => {
    try {
      const langCode = selectedLanguage === 'ENG' ? 'en' : selectedLanguage === 'हिंदी' ? 'hi' : 'fr';
      await userService.updatePreferences({ appLanguage: langCode });
      setModalVisible(false);
      Alert.alert('Success', 'Language updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update language');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView 
        ref={scrollViewRef} 
        style={styles.mainContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#fdd835']} />
        }
      >
        <View style={styles.container}>
          {/* Top Row */}
          <View style={styles.topRow}>
            <HeaderIcons />

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddCash')}
              >
                <Ionicons name="wallet" size={18} color="#0d1a3c" />
                <Text style={styles.addText}>₹{walletBalance.toFixed(0)}</Text>
                <Ionicons name="add-circle" size={18} color="#0d1a3c" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.translatorIconContainer]}
                onPress={() => setModalVisible(true)}
              >
                <Image
                  source={require('../../assets/translator.png')}
                  style={styles.translator}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.profileIconContainer}
                onPress={() => navigation.navigate('ChatSupport')}
              >
                <Image
                  source={require('../../assets/call-agent.png')}
                  style={{ width: 30, height: 30 }}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <TouchableOpacity
            style={styles.searchBarContainer}
            onPress={() => navigation.navigate('SearchScreen')}
          >
            <Text style={styles.searchInput}>Search astrologers, astromall products</Text>
            <Feather name="search" size={24} color="#888" style={styles.searchIcon} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fdd835" />
          </View>
        ) : (
          <>
            {/* 1. AUTO-TOGGLE BANNER */}
            <View style={[styles.banner, { backgroundColor: banners[currentBannerIndex].bg }]}>
              <Ionicons name={banners[currentBannerIndex].icon} size={50} color={banners[currentBannerIndex].color} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.bannerText}>{banners[currentBannerIndex].text}</Text>
                <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chat')}>
                  <Text style={styles.chatBtnText}>Chat Now</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ✅ 2. LIVE STREAMS SECTION */}
            {liveStreams.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="video" size={20} color="#ff0000" />
                    <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>Live Streams</Text>
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('LiveStreamScreen')}>
                    <Text style={styles.viewAll}>View All</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
                  {liveStreams.map((stream) => (
                    <TouchableOpacity
                      key={stream._id}
                      style={styles.liveStreamCard}
                      onPress={() => navigation.navigate('LiveStreamScreen', { streamId: stream.streamId })}
                    >
                      {/* Thumbnail */}
                      <View style={styles.thumbnailContainer}>
                        <Image
                          source={{ uri: stream.hostId?.profilePicture || 'https://i.pravatar.cc/150' }}
                          style={styles.streamThumbnail}
                        />
                        <View style={styles.liveIndicator}>
                          <View style={styles.liveIndicatorDot} />
                          <Text style={styles.liveIndicatorText}>LIVE</Text>
                        </View>
                        <View style={styles.viewerCount}>
                          <Ionicons name="eye" size={12} color="#fff" />
                          <Text style={styles.viewerCountText}>{stream.viewerCount || 0}</Text>
                        </View>
                      </View>
                      
                      {/* Info */}
                      <View style={styles.streamInfo}>
                        <Text style={styles.streamTitle} numberOfLines={2}>
                          {stream.title}
                        </Text>
                        <Text style={styles.streamHost} numberOfLines={1}>
                          {stream.hostId?.name || 'Astrologer'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* ✅ 3. LIVE ASTROLOGERS (Online) */}
            {liveAstrologers.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.onlineDotSmall} />
                    <Text style={styles.sectionTitle}>Online Astrologers</Text>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('Call')}>
                    <Text style={styles.viewAll}>View All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
                  {liveAstrologers.map((astro) => (
                    <TouchableOpacity
                      key={astro.id}
                      style={styles.astrologerCard}
                      onPress={() => navigation.navigate('AstrologerProfile', { astrologerId: astro._id })}
                    >
                      <Image
                        source={{ uri: astro.profilePicture }}
                        style={styles.liveAvatar}
                      />
                      <Text style={styles.astroName} numberOfLines={1}>
                        {astro.name}
                      </Text>
                      <View style={styles.onlineDot} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* 4. MIDDLE BANNER */}
            <View style={styles.offerCard}>
              <Ionicons name="gift" size={40} color="#4CAF50" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.offerText}>First Chat Free!</Text>
                <Text style={styles.offerSubText}>Get 5 minutes consultation absolutely free</Text>
              </View>
            </View>

            {/* ✅ 5. ASTROLOGERS FOR CHAT (Working) */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Astrologers for Chat</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Chat')}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
              {chatAstrologers.slice(0, 5).map((astro) => (
                <View key={astro.id} style={styles.astroCard}>
                  <Image
                    source={{ uri: astro.profilePicture }}
                    style={styles.astroAvatar}
                  />
                  <Text style={styles.astroName} numberOfLines={1}>
                    {astro.name}
                  </Text>
                  <Text style={styles.astroRate}>₹ {astro.pricing?.chat || 5}/min</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.ratingText}>{astro.rating.toFixed(1)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.chatBtnOutline}
                    onPress={() => navigation.navigate('AstrologerProfile', { astrologerId: astro._id })}
                  >
                    <Text style={{ color: 'green', fontWeight: 'bold' }}>Chat</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {/* 6. VAIDIK REMEDY */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Vaidik Remedy</Text>
              <TouchableOpacity>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
              {['Gemstone', 'Rudraksha', 'Yantra', 'Pooja'].map((remedy, idx) => (
                <View key={idx} style={styles.remedyCard}>
                  <Image
                    source={{ uri: `https://cdn-icons-png.flaticon.com/512/${1000 + idx}/1000${idx}.png` }}
                    style={styles.remedyImage}
                  />
                  <Text style={styles.remedyText}>{remedy}</Text>
                </View>
              ))}
            </ScrollView>

            {/* 7. VAIDIKTALK STORE */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Vaidiktalk Store</Text>
              <TouchableOpacity>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
              {['Books', 'Idols', 'Crystals', 'Incense'].map((product, idx) => (
                <View key={idx} style={styles.productCard}>
                  <Image
                    source={{ uri: `https://cdn-icons-png.flaticon.com/512/${2000 + idx}/2000${idx}.png` }}
                    style={styles.productImage}
                  />
                  <Text style={styles.productName}>{product}</Text>
                  <Text style={styles.productPrice}>₹ {(idx + 1) * 100}</Text>
                </View>
              ))}
            </ScrollView>

            {/* 8. TRUST INDICATORS */}
            <View style={styles.trustSection}>
              <View style={styles.trustCard}>
                <MaterialCommunityIcons name="shield-lock" size={40} color="#4CAF50" />
                <Text style={styles.trustTitle}>Private & Confidential</Text>
                <Text style={styles.trustDesc}>Your information is 100% secure</Text>
              </View>
              <View style={styles.trustCard}>
                <MaterialCommunityIcons name="certificate" size={40} color="#2196F3" />
                <Text style={styles.trustTitle}>Verified Astrologers</Text>
                <Text style={styles.trustDesc}>All astrologers are certified</Text>
              </View>
              <View style={styles.trustCard}>
                <MaterialCommunityIcons name="credit-card-check" size={40} color="#FF9800" />
                <Text style={styles.trustTitle}>Secure Payments</Text>
                <Text style={styles.trustDesc}>100% payment protection</Text>
              </View>
            </View>

            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>

      {/* FLOATING ACTION BUTTONS */}
      <View style={styles.floatingButtons}>
        <TouchableOpacity
          style={[styles.floatingBtn, { backgroundColor: '#4CAF50' }]}
          onPress={() => navigation.navigate('Chat')}
        >
          <MaterialCommunityIcons name="chat" size={20} color="#fff" />
          <Text style={styles.floatingBtnText}>Chat with Astrologer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.floatingBtn, { backgroundColor: '#2196F3' }]}
          onPress={() => navigation.navigate('Call')}
        >
          <MaterialCommunityIcons name="phone" size={20} color="#fff" />
          <Text style={styles.floatingBtnText}>Call with Astrologer</Text>
        </TouchableOpacity>
      </View>

      {/* Language Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.crossButton} onPress={() => setModalVisible(false)}>
              <Image source={require('../../assets/cross.png')} style={styles.sidebargirls} />
            </TouchableOpacity>
            <Text style={styles.cardTitle}>Choose Language</Text>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langOption,
                  selectedLanguage === lang.code && styles.selectedLangOption,
                ]}
                onPress={() => setSelectedLanguage(lang.code)}
              >
                <Text
                  style={[
                    styles.langText,
                    selectedLanguage === lang.code && styles.selectedLangText,
                  ]}
                >
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.applyBtn} onPress={handleApplyLanguage}>
              <Text style={{ fontWeight: 'bold' }}>APPLY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: 'white' },
  container: {
    paddingTop: 10,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 5,
    paddingBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: { flexDirection: 'row', alignItems: 'center' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 10,
  },
  addText: { color: '#0d1a3c', fontWeight: 'bold', marginLeft: 5, marginRight: 5, fontSize: 13 },
  translatorIconContainer: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  translator: { width: 28, height: 28, tintColor: 'grey' },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'lightgrey',
    marginHorizontal: 10,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: '#999' },
  searchIcon: { marginLeft: 10 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    margin: 10,
    marginTop: 15,
  },
  bannerText: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#000' },
  chatBtn: {
    backgroundColor: '#fdd835',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  chatBtnText: { fontWeight: '700', fontSize: 12 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: 20,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#000' },
  viewAll: { fontSize: 13, color: '#fdd835', fontWeight: '600' },
  
  // ✅ Live stream styles
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff0000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginLeft: 8,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#fff',
    marginRight: 3,
  },
  liveText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  liveStreamCard: {
    width: 180,
    marginLeft: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnailContainer: {
    width: '100%',
    height: 100,
    position: 'relative',
  },
  streamThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
  },
  liveIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 4,
  },
  liveIndicatorText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  viewerCount: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  viewerCountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  streamInfo: {
    padding: 10,
  },
  streamTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  streamHost: {
    fontSize: 11,
    color: '#666',
  },
  onlineDotSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  
  astrologerCard: {
    alignItems: 'center',
    marginLeft: 10,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 12,
    width: 90,
    position: 'relative',
  },
  liveAvatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#4CAF50' },
  astroName: { marginTop: 6, fontSize: 12, fontWeight: '600', textAlign: 'center', color: '#000' },
  onlineDot: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 12,
    margin: 10,
    marginTop: 15,
  },
  offerText: { fontSize: 16, fontWeight: '700', color: '#000' },
  offerSubText: { fontSize: 12, color: '#666', marginTop: 4 },
  astroCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginLeft: 10,
    alignItems: 'center',
    width: 130,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  astroAvatar: { width: 70, height: 70, borderRadius: 35, marginBottom: 8 },
  astroRate: { fontSize: 12, color: '#4CAF50', fontWeight: '600', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ratingText: { fontSize: 12, marginLeft: 4, color: '#666' },
  chatBtnOutline: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  remedyCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: 'center',
    width: 100,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  remedyImage: { width: 50, height: 50, marginBottom: 8 },
  remedyText: { fontSize: 12, fontWeight: '600', color: '#000' },
  productCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: 'center',
    width: 110,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productImage: { width: 60, height: 60, marginBottom: 8 },
  productName: { fontSize: 12, fontWeight: '600', color: '#000', marginBottom: 4 },
  productPrice: { fontSize: 13, fontWeight: '700', color: '#4CAF50' },
  trustSection: {
    marginTop: 30,
    paddingHorizontal: 10,
  },
  trustCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  trustTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginTop: 10 },
  trustDesc: { fontSize: 12, color: '#666', marginTop: 4, textAlign: 'center' },
  floatingButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  floatingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  floatingBtnText: { fontSize: 13, fontWeight: '700', color: '#fff', marginLeft: 6 },
  sidebargirls: { width: 25, height: 25 },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 20,
  },
  cardTitle: { fontWeight: 'bold', marginBottom: 15, fontSize: 18, textAlign: 'center' },
  langOption: {
    paddingVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  selectedLangOption: { backgroundColor: 'lightyellow' },
  langText: { fontSize: 16, color: '#333', textAlign: 'center' },
  selectedLangText: { fontWeight: 'bold', color: '#000' },
  applyBtn: {
    backgroundColor: '#ffd700',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  crossButton: { borderRadius: 12, alignItems: 'flex-end', marginBottom: -5 },
});
