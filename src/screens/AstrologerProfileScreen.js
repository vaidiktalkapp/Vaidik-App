import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
// import astrologerService from '../services/api/AstrologerService';
import astrologerService from '../services/api/astrologerService';
import userService from '../services/api/UserService';
import orderService from '../services/api/OrderService';
import walletService from '../services/api/WalletService';

const { width, height } = Dimensions.get('window');

const AstrologerProfileScreen = ({ route, navigation }) => {
  const { astrologerId } = route.params;
  
  const [astrologer, setAstrologer] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  
  useEffect(() => {
    fetchAstrologerProfile();
    loadWalletBalance();
  }, );
  
  const loadWalletBalance = async () => {
    try {
      const response = await walletService.getWalletStats();
      if (response.success) {
        setWalletBalance(response.data.currentBalance || 0);
      }
    } catch (error) {
      console.error('Failed to load wallet balance:', error);
      setWalletBalance(0);
    }
  };
  
  const fetchAstrologerProfile = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API
      try {
        const response = await astrologerService.getAstrologerDetails(astrologerId);
        
        if (response.success) {
          const astro = response.data;
          
          setAstrologer({
            id: astro._id,
            name: astro.name,
            profilePicture: astro.profilePicture || 'https://i.pravatar.cc/150?img=32',
            languages: astro.languages || ['English', 'Hindi'],
            experience: astro.experienceYears ? `${astro.experienceYears}+ Years` : '7+ Years',
            rating: astro.ratings?.average || 4.9,
            totalOrders: astro.stats?.totalOrders || 8217,
            price: astro.pricing?.chat || 27,
            oldPrice: astro.pricing?.chat ? Math.ceil(astro.pricing.chat * 1.2) : 33,
            availableMins: `${Math.floor((astro.stats?.totalMinutes || 30000) / 1000)}k mins`,
            consultationMins: `${Math.floor((astro.stats?.totalConsultations || 14000) / 1000)}k mins`,
            specializations: astro.specializations || ['Vedic', 'Numerology', 'Tarot', 'Face Reading'],
            about: astro.description || astro.bio || "Expert astrologer with deep knowledge.",
            isOnline: astro.availability?.isOnline || true,
            reviews: [],
            images: astro.gallery || [],
            audioIntro: astro.audioIntroUrl || null,
          });
        }
      } catch (apiError) {
        console.log('API not available, using mock data');
        
        // Use mock data when API fails
        setAstrologer({
          id: astrologerId,
          name: 'Pavani',
          profilePicture: 'https://i.pravatar.cc/150?img=32',
          languages: ['English', 'Hindi'],
          experience: '7+ Years',
          rating: 4.9,
          totalOrders: 8217,
          price: 27,
          oldPrice: 33,
          availableMins: '30k mins',
          consultationMins: '14k mins',
          specializations: ['Vedic', 'Numerology', 'Tarot', 'Face Reading'],
          about: "Pavani's tarot readings are not just answers—they're awakenings. With a unique ability to tap into the energies around you, she doesn't just predict the future; she helps you shape it. Her readings are deeply intuitive, compassionate, and transformative, guiding you through life's toughest questions with clarity and confidence.",
          isOnline: true,
          reviews: [
            {
              id: '1',
              userName: 'Kourtni',
              userAvatar: 'https://i.pravatar.cc/40?img=1',
              rating: 5,
              comment: "So very kind and has amazing accuracy! She knew exactly what the problem was and gave me great guidance on how to navigate my relationship. I'll update",
              reply: "Thanks for the feedback Mom🙏",
              date: '2 days ago',
            },
            {
              id: '2',
              userName: 'Rahul',
              userAvatar: 'https://i.pravatar.cc/40?img=12',
              rating: 5,
              comment: "Very nice and accurate reading by Pavani, one of the best astrologer on this platform given all details...Accurate...🎯Recommend....Top Tarot",
              reply: "Many Thanks for the feedback 🙏🙏",
              date: '5 days ago',
            },
            {
              id: '3',
              userName: 'KulgFeP',
              userAvatar: 'https://i.pravatar.cc/40?img=8',
              rating: 5,
              comment: "nyc experience. bhut acha lgra maam apisa baat krta, muje lgta sahi help kregi toh kaho😊😊",
              reply: "thank you so much for your feedback 😊",
              date: '1 week ago',
            },
            {
              id: '4',
              userName: 'Amit',
              userAvatar: 'https://i.pravatar.cc/40?img=15',
              rating: 5,
              comment: "ma'am kae guided ma good through tarot and clearly gave me answers of my questions. ma'am is really brilliant in the profession, thank you ma'am.",
              reply: "Many thanks for the feedback 🙏",
              date: '1 week ago',
            },
            {
              id: '5',
              userName: 'DK',
              userAvatar: 'https://i.pravatar.cc/40?img=7',
              rating: 5,
              comment: "After a session with Pavani, I finally feel equipped to navigate the challenges ahead with greater confidence and clarity.",
              reply: "thank you so much for your positive response, God bless you",
              date: '2 weeks ago',
            },
          ],
          images: [
            'https://i.pravatar.cc/200?img=32',
            'https://i.pravatar.cc/200?img=33',
            'https://i.pravatar.cc/200?img=34',
          ],
          audioIntro: null,
        });
      }
      
      checkFollowStatus();
    } catch (error) {
      console.error('Fetch astrologer profile error:', error);
      Alert.alert('Error', 'Failed to load astrologer profile');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };
  
  const checkFollowStatus = async () => {
    try {
      const response = await userService.getFavorites();
      if (response.success) {
        const favorites = response.data || [];
        const isFav = favorites.some(fav => fav._id === astrologerId || fav.astrologerId === astrologerId);
        setIsFollowing(isFav);
      }
    } catch (error) {
      console.error('Check follow status error:', error);
    }
  };
  
  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await userService.removeFavorite(astrologerId);
        setIsFollowing(false);
      } else {
        await userService.addFavorite(astrologerId);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Follow error:', error);
    }
  };
  
  const handleChat = async () => {
    try {
      const balanceCheck = await orderService.checkBalance(astrologer.price, 5);
      if (!balanceCheck.success) {
        Alert.alert(
          'Insufficient Balance',
          `You need ₹${balanceCheck.requiredAmount} for 5 minutes.\n\nBalance: ₹${balanceCheck.currentBalance}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add Cash', onPress: () => navigation.navigate('AddCash') },
          ]
        );
        return;
      }
      
      const orderData = {
        astrologerId: astrologer.id,
        type: 'chat',
        duration: 5,
        pricePerMinute: astrologer.price,
      };
      
      const orderResponse = await orderService.createOrder(orderData);
      if (orderResponse.success) {
        navigation.navigate('ChatRoom', {
          orderId: orderResponse.data._id,
          astrologer,
          order: orderResponse.data,
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      Alert.alert('Error', 'Failed to start chat');
    }
  };
  
  const handleCall = async () => {
    const callPrice = Math.ceil(astrologer.price * 1.2);
    try {
      const balanceCheck = await orderService.checkBalance(callPrice, 5);
      if (!balanceCheck.success) {
        Alert.alert(
          'Insufficient Balance',
          `You need ₹${balanceCheck.requiredAmount} for 5 minutes.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add Cash', onPress: () => navigation.navigate('AddCash') },
          ]
        );
        return;
      }
      
      const orderData = {
        astrologerId: astrologer.id,
        type: 'call',
        duration: 5,
        pricePerMinute: callPrice,
      };
      
      const orderResponse = await orderService.createOrder(orderData);
      if (orderResponse.success) {
        navigation.navigate('CallRoom', {
          orderId: orderResponse.data._id,
          astrologer,
        });
      }
    } catch (error) {
      console.error('Call error:', error);
      Alert.alert('Error', 'Failed to start call');
    }
  };
  
  const handleVideoCall = async () => {
    const videoPrice = Math.ceil(astrologer.price * 1.5);
    Alert.alert('Video Call', `Video call at ₹${videoPrice}/min`);
  };
  
  const handleSendGift = (gift) => {
    if (walletBalance < gift.price) {
      Alert.alert('Insufficient Balance', `You need ₹${gift.price}.`, [
        { text: 'Cancel' },
        { text: 'Add Cash', onPress: () => navigation.navigate('AddCash') },
      ]);
      return;
    }
    setShowGiftModal(false);
    Alert.alert('Gift Sent!', `You sent ${gift.name}`);
    setWalletBalance(prev => prev - gift.price);
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFB300" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!astrologer) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="error-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAstrologerProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const gifts = [
    { name: 'Flowers', price: 15, emoji: '💐' },
    { name: 'Pooja Thali', price: 31, emoji: '🙏' },
    { name: 'Heart', price: 91, emoji: '❤️' },
    { name: 'Chocolates', price: 51, emoji: '🍫' },
    { name: 'Sweets', price: 101, emoji: '🍬' },
    { name: 'Diya', price: 101, emoji: '🪔' },
    { name: 'Rudraksha', price: 251, emoji: '📿' },
    { name: 'Kalash', price: 501, emoji: '🏺' },
    { name: 'Rudraksha', price: 1000, emoji: '📿' },
    { name: 'Ganesha', price: 5100, emoji: '🕉️' },
  ];
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Icon name="share" size={20} color="#10b981" />
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image source={{ uri: astrologer.profilePicture }} style={styles.profileImage} />
            {astrologer.isOnline && <View style={styles.onlineDot} />}
          </View>
          
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{astrologer.name}</Text>
              <Icon name="verified" size={18} color="#FFB300" />
              <TouchableOpacity 
                style={[styles.followBadge, isFollowing && styles.followingBadge]}
                onPress={handleFollow}
              >
                <Text style={styles.followBadgeText}>{isFollowing ? 'Following' : 'Follow'}</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.detailText}>{astrologer.languages.join(', ')}</Text>
            <Text style={styles.detailText}>Exp: {astrologer.experience}</Text>
            
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name={star <= Math.floor(astrologer.rating) ? 'star' : 'star-border'}
                  size={14}
                  color="#FFB300"
                />
              ))}
              <Text style={styles.ratingText}> {astrologer.rating}</Text>
              <Text style={styles.ordersText}> • {astrologer.totalOrders} orders</Text>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Icon name="access-time" size={16} color="#6B7280" />
                <Text style={styles.statText}>{astrologer.availableMins}</Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="phone" size={16} color="#6B7280" />
                <Text style={styles.statText}>{astrologer.consultationMins}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Audio Intro */}
        <View style={styles.audioCard}>
          <View style={styles.audioHeader}>
            <Text style={styles.audioLabel}>Hear from {astrologer.name}</Text>
            <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
          </View>
          <View style={styles.audioPlayer}>
            <TouchableOpacity style={styles.playButton}>
              <Icon name="play-arrow" size={20} color="#FFB300" />
            </TouchableOpacity>
            <View style={styles.waveform}>
              {[...Array(40)].map((_, i) => (
                <View key={i} style={[styles.bar, { height: Math.random() * 20 + 5 }]} />
              ))}
            </View>
            <Text style={styles.duration}>00:37</Text>
          </View>
        </View>
        
        {/* About */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutText}>{astrologer.about}</Text>
          <TouchableOpacity><Text style={styles.showMore}>show more</Text></TouchableOpacity>
        </View>
        
        {/* Images */}
        {astrologer.images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
            {astrologer.images.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.galleryImage} />
            ))}
          </ScrollView>
        )}
        
        {/* Reviews */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.reviewsTitle}>User Reviews</Text>
            <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
          </View>
          
          {astrologer.reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Image source={{ uri: review.userAvatar }} style={styles.reviewAvatar} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.reviewerName}>{review.userName}</Text>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Icon key={s} name="star" size={12} color="#FFB300" />
                    ))}
                  </View>
                </View>
                <Icon name="more-vert" size={20} color="#9CA3AF" />
              </View>
              <Text style={styles.reviewText}>{review.comment}</Text>
              {review.reply && (
                <View style={styles.replyBox}>
                  <Text style={styles.replyAuthor}>{astrologer.name}</Text>
                  <Text style={styles.replyText}>{review.reply}</Text>
                </View>
              )}
              <Text style={styles.reviewDate}>{review.date}</Text>
            </View>
          ))}
          
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>See all reviews</Text>
          </TouchableOpacity>
        </View>
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <Icon name="chat" size={20} color="#FFB300" />
            <Text style={styles.quickActionText}>Chat with Assistant</Text>
            <Icon name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={handleVideoCall}>
            <Icon name="videocam" size={20} color="#FFB300" />
            <Text style={styles.quickActionText}>Video Call @ ₹{Math.ceil(astrologer.price * 1.5)}/min</Text>
            <Icon name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={() => setShowGiftModal(true)}>
            <Icon name="card-giftcard" size={20} color="#FFB300" />
            <Text style={styles.quickActionText}>Send Gift to {astrologer.name}</Text>
            <Icon name="info-outline" size={16} color="#9CA3AF" />
            <View style={styles.walletBadge}>
              <Text style={styles.walletText}>₹ {walletBalance.toFixed(0)}</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Gifts Grid */}
        <View style={styles.giftsSection}>
          <View style={styles.giftsGrid}>
            {gifts.map((gift, i) => (
              <TouchableOpacity key={i} style={styles.giftCard} onPress={() => handleSendGift(gift)}>
                <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                <Text style={styles.giftName}>{gift.name}</Text>
                <Text style={styles.giftPrice}>₹ {gift.price}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Sticky Bottom */}
      <View style={styles.sticky}>
        <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
          <Icon name="chat-bubble" size={20} color="#FFB300" />
          <Text style={styles.chatBtnText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
          <Icon name="phone" size={20} color="#fff" />
          <Text style={styles.callBtnText}>Call</Text>
        </TouchableOpacity>
      </View>
      
      {/* Gift Modal */}
      <Modal visible={showGiftModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.giftModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Gift to {astrologer.name}</Text>
              <TouchableOpacity onPress={() => setShowGiftModal(false)}>
                <Icon name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <View style={styles.giftsGrid}>
                {gifts.slice(0, 6).map((gift, i) => (
                  <TouchableOpacity key={i} style={styles.giftCard} onPress={() => handleSendGift(gift)}>
                    <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                    <Text style={styles.giftName}>{gift.name}</Text>
                    <Text style={styles.giftPrice}>₹ {gift.price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  errorText: { marginTop: 16, fontSize: 16, fontWeight: '600', color: '#EF4444' },
  retryButton: { marginTop: 20, backgroundColor: '#FFB300', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  shareButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#D1FAE5', borderRadius: 16 },
  shareText: { marginLeft: 4, fontSize: 13, fontWeight: '500', color: '#10b981' },
  profileHeader: { backgroundColor: '#fff', padding: 16, flexDirection: 'row', marginBottom: 8 },
  profileImageContainer: { position: 'relative' },
  profileImage: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: '#FFB300' },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#fff' },
  profileInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 18, fontWeight: '700', color: '#111827', marginRight: 4 },
  followBadge: { marginLeft: 'auto', backgroundColor: '#FFB300', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  followingBadge: { backgroundColor: '#E5E7EB' },
  followBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  detailText: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 6 },
  ratingText: { fontSize: 12, fontWeight: '600', color: '#111827' },
  ordersText: { fontSize: 11, color: '#9CA3AF' },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  statText: { marginLeft: 4, fontSize: 11, color: '#6B7280' },
  audioCard: { backgroundColor: '#fff', padding: 16, marginBottom: 8 },
  audioHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  audioLabel: { fontSize: 13, fontWeight: '600', color: '#111827' },
  newBadge: { backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  newBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  audioPlayer: { flexDirection: 'row', alignItems: 'center' },
  playButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  waveform: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 24, marginHorizontal: 10 },
  bar: { width: 2, backgroundColor: '#D1D5DB', marginHorizontal: 0.5, borderRadius: 1 },
  duration: { fontSize: 11, color: '#6B7280' },
  aboutCard: { backgroundColor: '#fff', padding: 16, marginBottom: 8 },
  aboutText: { fontSize: 13, lineHeight: 19, color: '#374151', marginBottom: 6 },
  showMore: { fontSize: 13, fontWeight: '600', color: '#FFB300' },
  imagesScroll: { backgroundColor: '#fff', paddingVertical: 12, marginBottom: 8 },
  galleryImage: { width: 140, height: 180, borderRadius: 10, marginLeft: 12 },
  reviewsSection: { backgroundColor: '#fff', padding: 16, marginBottom: 8 },
  reviewsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  reviewsTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  viewAll: { fontSize: 13, color: '#FFB300', fontWeight: '600' },
  reviewCard: { marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18 },
  reviewerName: { fontSize: 13, fontWeight: '600', color: '#111827' },
  reviewStars: { flexDirection: 'row', marginTop: 2 },
  reviewText: { fontSize: 13, lineHeight: 18, color: '#374151', marginBottom: 8 },
  replyBox: { backgroundColor: '#FEF3C7', padding: 10, borderRadius: 8, marginBottom: 6 },
  replyAuthor: { fontSize: 12, fontWeight: '600', color: '#111827', marginBottom: 2 },
  replyText: { fontSize: 12, color: '#374151' },
  reviewDate: { fontSize: 11, color: '#9CA3AF' },
  seeAllButton: { marginTop: 8, alignItems: 'center', paddingVertical: 10 },
  seeAllText: { fontSize: 13, fontWeight: '600', color: '#FFB300' },
  quickActions: { backgroundColor: '#fff', padding: 16, marginBottom: 8 },
  quickAction: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  quickActionText: { flex: 1, marginLeft: 10, fontSize: 13, fontWeight: '500', color: '#111827' },
  walletBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginLeft: 6 },
  walletText: { fontSize: 11, fontWeight: '600', color: '#111827' },
  giftsSection: { backgroundColor: '#fff', padding: 16, marginBottom: 8 },
  giftsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  giftCard: { width: (width - 64) / 4, alignItems: 'center', paddingVertical: 10, margin: 4, backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  giftEmoji: { fontSize: 28, marginBottom: 4 },
  giftName: { fontSize: 10, color: '#6B7280', marginBottom: 2 },
  giftPrice: { fontSize: 11, fontWeight: '600', color: '#111827' },
  sticky: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB', elevation: 8 },
  chatBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF3C7', paddingVertical: 12, borderRadius: 10, marginRight: 6 },
  chatBtnText: { marginLeft: 6, fontSize: 14, fontWeight: '600', color: '#111827' },
  callBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFB300', paddingVertical: 12, borderRadius: 10, marginLeft: 6 },
  callBtnText: { marginLeft: 6, fontSize: 14, fontWeight: '600', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  giftModal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: height * 0.6 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  modalContent: { padding: 16 },
});

export default AstrologerProfileScreen;
