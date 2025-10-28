// src/screens/Call/Call.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import HeaderIcons from '../../component/HeaderIcons';
// import astrologerService from '../../services/api/AstrologerService';
import astrologerService from '../../services/api/astrologerService';
import orderService from '../../services/api/OrderService';
import walletService from '../../services/api/WalletService';
import { useAuth } from '../../context/AuthContext';

const Call = ({ navigation }) => {
  const { user } = useAuth();
  const [astrologers, setAstrologers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [filterVisible, setFilterVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  
  // Filter states
  const [selectedSection, setSelectedSection] = useState('Sort by');
  const [selectedFilters, setSelectedFilters] = useState({
    sortBy: 'Popularity',
    skills: [],
    languages: [],
    genders: [],
    countries: [],
    topAstrologers: [],
  });

  const categories = [
    { id: 'Filter', label: 'Filter' },
    { id: 'All', label: 'All' },
    { id: 'Tarot', label: 'Tarot' },
    { id: 'Palmistry', label: 'Palmistry' },
  ];

  // Filter options
  const filterSections = {
  'Sort by': [
    { id: 'popularity', label: 'Popularity' },
    { id: 'exp-high-low', label: 'Experience: High to Low' },
    { id: 'exp-low-high', label: 'Experience: Low to High' },
    { id: 'orders-high-low', label: 'Orders: High to Low' },
    { id: 'orders-low-high', label: 'Orders: Low to High' },
    { id: 'price-high-low', label: 'Price: High to Low' },
    { id: 'price-low-high', label: 'Price: Low to High' },
    { id: 'rating-high-low', label: 'Rating: High to Low' },
  ],
  'Skill': [
    { id: 'vedic', label: 'Vedic' },
    { id: 'tarot', label: 'Tarot' },
    { id: 'numerology', label: 'Numerology' },
    { id: 'palmistry', label: 'Palmistry' },
    { id: 'face-reading', label: 'Face Reading' },
    { id: 'kp', label: 'KP' },
    { id: 'life-coach', label: 'Life Coach' },
    { id: 'nadi', label: 'Nadi' },
    { id: 'prashana', label: 'Prashana' },
    { id: 'psychic', label: 'Psychic' },
  ],
  'Language': [
    { id: 'english', label: 'English' },
    { id: 'hindi', label: 'Hindi' },
    { id: 'bengali', label: 'Bengali' },
    { id: 'gujarati', label: 'Gujarati' },
    { id: 'kannada', label: 'Kannada' },
    { id: 'malayalam', label: 'Malayalam' },
    { id: 'marathi', label: 'Marathi' },
    { id: 'punjabi', label: 'Punjabi' },
    { id: 'tamil', label: 'Tamil' },
  ],
  'Gender': [
    { id: 'male', label: 'Male' },
    { id: 'female', label: 'Female' },
  ],
  'Country': [
    { id: 'india', label: 'India' },
    { id: 'outside-india', label: 'Outside India' },
  ],
  'Top Astrologers': [
    { id: 'celebrity', label: 'Celebrity', subtitle: 'They have the highest fan following & people are crazy about them' },
    { id: 'top-choice', label: 'Top Choice', subtitle: 'If you talk to them once, you are their customer for life' },
    { id: 'rising-star', label: 'Rising Star', subtitle: 'They are high in demand & have strong customer loyalty' },
    { id: 'all', label: 'All', subtitle: 'It includes all verified astrologers, hired after 5 rounds of interviews' },
  ],
};


  // Badge colors
  const getBadgeStyle = (badge) => {
    switch(badge) {
      case 'celebrity': return { bg: '#000', text: '#FFD700' };
      case 'top-choice': return { bg: '#4CAF50', text: '#fff' };
      case 'rising-star': return { bg: '#FF9800', text: '#fff' };
      default: return { bg: '#666', text: '#fff' };
    }
  };

  // Load wallet balance
  const loadWalletBalance = async () => {
    try {
      const response = await walletService.getWalletStats();
      if (response.success) {
        setWalletBalance(response.data.currentBalance || 0);
      }
    } catch (error) {
      console.error('Failed to load wallet balance:', error);
    }
  };

  // Load recent orders
  const loadRecentOrders = async () => {
    try {
      const response = await orderService.getOrders({ page: 1, limit: 5, type: 'call' });
      if (response.success) {
        // Filter only recent orders from today
        const today = new Date().toDateString();
        const todayOrders = response.data.orders.filter(order => {
          const orderDate = new Date(order.createdAt).toDateString();
          return orderDate === today;
        });
        setRecentOrders(todayOrders);
      }
    } catch (error) {
      console.error('Failed to load recent orders:', error);
    }
  };

  // Load astrologers from API
  const loadAstrologers = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
  
      // Build search params from filters
      const params = {
        page: 1,
        limit: 20,
        sortBy: mapSortByToAPI(selectedFilters.sortBy),
      };
  
      // Handle specialization from tab or filter
      if (activeTab !== 'All' && activeTab !== 'Filter') {
        params.skills = [activeTab.toLowerCase()];
      } else if (selectedFilters.skills.length > 0) {
        params.skills = selectedFilters.skills;
      }
  
      // Apply other filters
      if (selectedFilters.languages.length > 0) {
        params.languages = selectedFilters.languages;
      }
  
      if (selectedFilters.genders.length > 0) {
        params.genders = selectedFilters.genders;
      }
  
      if (selectedFilters.countries.length > 0) {
        params.countries = selectedFilters.countries;
      }
  
      if (selectedFilters.topAstrologers.length > 0) {
        params.topAstrologers = selectedFilters.topAstrologers;
      }
  
      console.log('🔍 Loading astrologers with params:', params);
  
      const response = await astrologerService.searchAstrologers(params);
      
      // ✅ Add defensive checks
      console.log('📦 Full response:', response);
  
      if (response.success && response.data) {
        // ✅ Handle array directly or from nested data property
        const astrologersList = Array.isArray(response.data) 
          ? response.data 
          : response.data.astrologers || [];
        
        console.log('📋 Astrologers list:', astrologersList);
  
        const formattedData = astrologersList.map((astro, index) => {
  // Auto-assign badges based on performance
  let badge = null;
  const rating = astro.ratings?.average || 0;
  const orders = astro.stats?.totalOrders || 0;
  
  if (rating >= 4.8 && orders > 1000) badge = 'celebrity';
  else if (rating >= 4.5 && orders > 500) badge = 'top-choice';
  else if (rating >= 4.3 && orders > 100) badge = 'rising-star';

  // ✅ FIX: Properly extract the ID as a string
  const astrologerId = astro._id?.toString() || astro.id?.toString() || `astro-${index}`;

  return {
    id: astrologerId, // ✅ Add fallback ID
    name: astro.name,
    skills: astro.specializations || [],
    lang: astro.languages?.slice(0, 2).join(', ') || 'English',
    exp: astro.experienceYears || 0,
    price: astro.pricing?.call || 35, // ✅ Use call price for Call screen
    oldPrice: astro.pricing?.call ? Math.round(astro.pricing.call * 1.22) : 42,
    orders: astro.stats?.totalOrders || 0,
    rating: astro.ratings?.average || 5,
    image: astro.profilePicture || 'https://i.pravatar.cc/100',
    isOnline: astro.availability?.isOnline || false,
    isAvailable: astro.availability?.isAvailable || false,
    isBusy: !astro.availability?.isAvailable && astro.availability?.isOnline,
    waitTime: !astro.availability?.isAvailable && astro.availability?.isOnline 
      ? Math.floor(Math.random() * 20) + 5 
      : 0,
    badge,
  };
});

  
        setAstrologers(formattedData);
        console.log('✅ Loaded', formattedData.length, 'astrologers');
      } else {
        console.warn('⚠️ No data in response or request failed');
        setAstrologers([]);
      }
    } catch (error) {
      console.error('❌ Load astrologers error:', error);
      console.error('Error details:', error.response?.data);
      Alert.alert('Error', 'Failed to load astrologers');
      setAstrologers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  
  // Add helper function to map UI sort labels to API enum values
  const mapSortByToAPI = (sortLabel) => {
    const sortMap = {
      'Popularity': 'popularity',
      'Experience: High to Low': 'exp-high-low',
      'Experience: Low to High': 'exp-low-high',
      'Orders: High to Low': 'orders-high-low',
      'Orders: Low to High': 'orders-low-high',
      'Price: High to Low': 'price-high-low',
      'Price: Low to High': 'price-low-high',
      'Rating: High to Low': 'rating-high-low',
    };
    return sortMap[sortLabel] || 'popularity';
  };

  const getSortByParam = () => {
    const sortMap = {
      'Popularity': 'rating',
      'Experience: High to Low': 'experience',
      'Price: High to Low': 'price',
    };
    return sortMap[selectedFilters.sortBy] || 'rating';
  };

  useEffect(() => {
    loadWalletBalance();
    loadRecentOrders();
    loadAstrologers(true);
  }, );

  useEffect(() => {
    loadAstrologers(true);
  }, );

  // Handle call button press
  const handleCallPress = async (astrologer) => {
    if (processingOrder) return;

    try {
      setProcessingOrder(true);

      const balanceCheck = await orderService.checkBalance(astrologer.price, 5);

      if (!balanceCheck.success) {
        Alert.alert(
          'Insufficient Balance',
          `You need ₹${balanceCheck.requiredAmount} for 5 minutes consultation.\n\nYour balance: ₹${balanceCheck.currentBalance}\nShortfall: ₹${balanceCheck.shortfall}`,
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
        pricePerMinute: astrologer.price,
      };

      const orderResponse = await orderService.createOrder(orderData);

      if (orderResponse.success) {
        Alert.alert('Success', 'Call session started!', [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('CallRoom', {
                orderId: orderResponse.data._id || orderResponse.data.orderId,
                astrologer,
                order: orderResponse.data,
              });
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Call press error:', error);
      Alert.alert('Error', error.message || 'Failed to start call session');
    } finally {
      setProcessingOrder(false);
    }
  };

  // Handle filter selection
  const toggleFilter = (section, itemId) => {
    if (section === 'Sort by') {
      setSelectedFilters(prev => ({ ...prev, sortBy: filterSections[section].find(f => f.id === itemId).label }));
    } else {
      const key = section.toLowerCase().replace(' ', '');
      setSelectedFilters(prev => {
        const current = prev[key] || [];
        const isSelected = current.includes(itemId);
        return {
          ...prev,
          [key]: isSelected ? current.filter(id => id !== itemId) : [...current, itemId],
        };
      });
    }
  };

  const isFilterSelected = (section, itemId) => {
    if (section === 'Sort by') {
      return selectedFilters.sortBy === filterSections[section].find(f => f.id === itemId).label;
    }
    const key = section.toLowerCase().replace(' ', '');
    return (selectedFilters[key] || []).includes(itemId);
  };

  const applyFilters = () => {
    setFilterVisible(false);
    loadAstrologers(true);
  };

  // Render recent order
  const renderRecentOrder = ({ item }) => (
    <TouchableOpacity style={styles.recentCard} onPress={() => handleCallPress(item)}>
      <Image source={{ uri: item.image }} style={styles.recentImg} />
      <View style={styles.recentInfo}>
        <Text style={styles.recentName}>{item.name}</Text>
        <Text style={styles.recentPrice}>₹ {item.price}/min</Text>
      </View>
    </TouchableOpacity>
  );

  // Render astrologer card
const renderAstrologer = ({ item }) => {
  const badgeStyle = item.badge ? getBadgeStyle(item.badge) : null;
  const displaySkills = item.skills.slice(0, 2).join(', ');

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('AstrologerProfile', { 
        astrologerId: item.id 
      })}
      activeOpacity={0.7}
    >
      {/* Badge */}
      {badgeStyle && (
        <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
          <Text style={[styles.badgeText, { color: badgeStyle.text }]}>
            {item.badge.replace('-', ' ').toUpperCase()}
          </Text>
        </View>
      )}

      <Image source={{ uri: item.image }} style={styles.avatar} />

      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.name}>{item.name}</Text>
          {item.isOnline && <View style={styles.onlineDot} />}
        </View>
        <Text style={styles.sub} numberOfLines={1}>{displaySkills}</Text>
        <Text style={styles.sub}>{item.lang}</Text>
        <Text style={styles.sub}>Exp: {item.exp} Years</Text>

        {/* Stars + Orders below image */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text style={styles.stars}>{'⭐'.repeat(Math.round(item.rating))}</Text>
          <Text style={styles.orders}> {item.orders} orders</Text>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 4, alignItems: 'center' }}>
          {item.oldPrice && <Text style={styles.oldPrice}>₹{item.oldPrice}</Text>}
          <Text style={styles.price}>₹{item.price}/min</Text>
        </View>
      </View>

      {/* Verified Tick */}
      <View style={styles.tickContainer}>
        <Image source={require('../../assets/check.png')} style={styles.tickIcon} />
      </View>

      {/* Call Button or Wait Time */}
      {item.isBusy ? (
        <View style={styles.waitContainer}>
          <MaterialIcons name="schedule" size={16} color="#FF9800" />
          <Text style={styles.waitText}>Wait ~{item.waitTime}m</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.callBtn, !item.isAvailable && styles.callBtnDisabled]}
          onPress={(e) => {
            e.stopPropagation(); // ✅ Prevent card click when pressing call
            handleCallPress(item);
          }}
          disabled={!item.isAvailable || processingOrder}
        >
          {processingOrder ? (
            <ActivityIndicator size="small" color="green" />
          ) : (
            <Text style={[styles.callText, !item.isAvailable && styles.callTextDisabled]}>
              {item.isAvailable ? 'Call' : 'Offline'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};


  // Render filter content
const renderFilterContent = () => {
  const items = filterSections[selectedSection] || [];
  
  return (
    <ScrollView style={styles.filterContentScroll}>
      {selectedSection !== 'Sort by' && (
        <View style={styles.filterHeader}>
          <TouchableOpacity onPress={() => {
            const key = selectedSection.toLowerCase().replace(' ', '');
            const allIds = items.map(i => i.id);
            setSelectedFilters(prev => ({ ...prev, [key]: allIds }));
          }}>
            <Text style={styles.selectAllText}>Select all</Text>
          </TouchableOpacity>
          <Text style={styles.separator}>  -  </Text>
          <TouchableOpacity onPress={() => {
            const key = selectedSection.toLowerCase().replace(' ', '');
            setSelectedFilters(prev => ({ ...prev, [key]: [] }));
          }}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {items.map((item, index) => ( // ✅ Add index as fallback
        <TouchableOpacity
          key={`${selectedSection}-${item.id}-${index}`} // ✅ Make key more unique
          style={styles.filterOption}
          onPress={() => toggleFilter(selectedSection, item.id)}
        >
          <View style={styles.filterOptionContent}>
            <View style={[
              styles.checkbox,
              isFilterSelected(selectedSection, item.id) && styles.checkboxSelected
            ]}>
              {isFilterSelected(selectedSection, item.id) && (
                <Ionicons name="checkmark" size={18} color="#fff" />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.filterOptionText}>{item.label}</Text>
              {item.subtitle && (
                <Text style={styles.filterOptionSubtitle}>{item.subtitle}</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};


  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.chatHeader}>
  {/* Left: HeaderIcons */}
  <View style={styles.headerLeft}>
    <HeaderIcons />
  </View>

  {/* Right: Actions */}
  <View style={styles.headerRight}>
    <TouchableOpacity
      style={styles.addButton}
      onPress={() => navigation.navigate('AddCash')}
    >
      <Ionicons name="wallet" size={16} color="#0d1a3c" />
      <Text style={styles.addText}>₹{walletBalance.toFixed(0)}</Text>
      <Ionicons name="add-circle" size={16} color="#0d1a3c" />
    </TouchableOpacity>

    <TouchableOpacity 
      style={styles.iconButton}
      onPress={() => navigation.navigate('SearchScreen')}
    >
      <Feather name="search" size={22} color="#333" />
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.iconButton}
      onPress={() => navigation.navigate('Messenger')}
    >
      <Image source={require('../../assets/messenger.png')} style={styles.chatIcon} />
    </TouchableOpacity>
  </View>
</View>

        {/* Banner or Recent Orders */}
        {recentOrders.length > 0 ? (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Connect Again</Text>
            <FlatList
              horizontal
              data={recentOrders}
              renderItem={renderRecentOrder}
              keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 10 }}
            />
          </View>
        ) : (
          <Image
            source={{ uri: 'https://i.ibb.co/qMcBQXPf/Media.jpg' }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        )}

        {/* Category Tabs */}
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow}>
  {categories.map((cat, index) => ( // ✅ Add index
    <TouchableOpacity
      key={`category-${cat.id}-${index}`} // ✅ Make key more unique
      style={[styles.tabButton, activeTab === cat.id && styles.activeTabButton]}
      onPress={() => cat.id === 'Filter' ? setFilterVisible(true) : setActiveTab(cat.id)}
    >
      {cat.id === 'Filter' && <Feather name="sliders" size={16} color={activeTab === cat.id ? '#000' : '#666'} style={{ marginRight: 6 }} />}
      <Text style={[styles.tabText, activeTab === cat.id && styles.activeTabText]}>
        {cat.label}
      </Text>
    </TouchableOpacity>
  ))}
</ScrollView>


        {/* Astrologer List */}
        {loading ? (
          <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={astrologers}
            renderItem={renderAstrologer}
            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
            scrollEnabled={false}
            refreshing={refreshing}
            onRefresh={() => {
              loadWalletBalance();
              loadRecentOrders();
              loadAstrologers(true);
            }}
          />
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={filterVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Sort & Filter</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterBody}>
              <View style={styles.filterSidebar}>
  {Object.keys(filterSections).map((section, index) => ( // ✅ Add index
    <TouchableOpacity
      key={`sidebar-${section}-${index}`} // ✅ Make key more unique
      style={[
        styles.filterSidebarItem,
        selectedSection === section && styles.filterSidebarItemActive,
      ]}
      onPress={() => setSelectedSection(section)}
    >
      <Text
        style={[
          styles.filterSidebarText,
          selectedSection === section && styles.filterSidebarTextActive,
        ]}
      >
        {section}
      </Text>
      {(selectedFilters[section.toLowerCase().replace(' ', '')] || []).length > 0 && (
        <View style={styles.filterDot} />
      )}
    </TouchableOpacity>
  ))}
</View>


              <View style={styles.filterContent}>
                {renderFilterContent()}
              </View>
            </View>

            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Call;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Space between icons
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginRight: 4,
  },
  addText: { 
    color: '#0d1a3c', 
    fontWeight: '600', 
    marginHorizontal: 5, 
    fontSize: 13 
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatIcon: { 
    width: 22, 
    height: 22, 
    resizeMode: 'contain' 
  },
  bannerImage: { width: '100%', height: 100 },
  recentSection: { backgroundColor: '#fff', paddingVertical: 15, paddingHorizontal: 10 },
  recentTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  recentCard: { alignItems: 'center', marginRight: 15 },
  recentImg: { width: 70, height: 70, borderRadius: 35, marginBottom: 6 },
  recentInfo: { alignItems: 'center' },
  recentName: { fontSize: 13, fontWeight: '600', color: '#333' },
  recentPrice: { fontSize: 12, color: '#666' },
  tabRow: { paddingHorizontal: 10, paddingVertical: 12, backgroundColor: '#fff', flexGrow: 0 },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  activeTabButton: { backgroundColor: '#fff200', borderColor: '#d4af37' },
  tabText: { fontSize: 13, color: '#666' },
  activeTabText: { fontWeight: '600', color: '#000' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -1,
    left: -1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 8,
    zIndex: 10,
  },
  badgeText: { fontSize: 9, fontWeight: 'bold' },
  tickContainer: { position: 'absolute', top: 12, left: 52 },
  tickIcon: { width: 18, height: 18 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  name: { fontSize: 15, fontWeight: '600', color: '#000' },
  sub: { fontSize: 12, color: '#666', marginTop: 2 },
  stars: { fontSize: 10 },
  orders: { fontSize: 11, color: '#999', marginLeft: 4 },
  oldPrice: { fontSize: 12, color: '#999', textDecorationLine: 'line-through', marginRight: 6 },
  price: { fontSize: 14, fontWeight: '600', color: '#000' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginLeft: 6 },
  waitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  waitText: { fontSize: 12, color: '#FF9800', marginLeft: 4, fontWeight: '600' },
  callBtn: {
    backgroundColor: '#fff',
    borderColor: '#4CAF50',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 15,
    alignSelf: 'center',
  },
  callBtnDisabled: { borderColor: '#ccc', backgroundColor: '#f5f5f5' },
  callText: { color: '#4CAF50', fontWeight: '600', fontSize: 13 },
  callTextDisabled: { color: '#999' },
  
  // Filter Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  filterModal: { backgroundColor: '#fff', height: '85%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterModalTitle: { fontSize: 18, fontWeight: 'bold' },
  filterBody: { flexDirection: 'row', flex: 1 },
  filterSidebar: { width: 110, backgroundColor: '#f8f8f8' },
  filterSidebarItem: {
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterSidebarItemActive: { backgroundColor: '#fff', borderLeftWidth: 3, borderLeftColor: '#000' },
  filterSidebarText: { fontSize: 13, color: '#666' },
  filterSidebarTextActive: { fontWeight: '600', color: '#000' },
  filterDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF5722' },
  filterContent: { flex: 1 },
  filterContentScroll: { flex: 1 },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fafafa',
  },
  selectAllText: { fontSize: 13, color: '#007AFF', fontWeight: '500' },
  separator: { color: '#999' },
  clearText: { fontSize: 13, color: '#007AFF', fontWeight: '500' },
  filterOption: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  filterOptionContent: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: '#000', borderColor: '#000' },
  filterOptionText: { fontSize: 13, color: '#333' },
  filterOptionSubtitle: { fontSize: 11, color: '#999', marginTop: 3 },
  applyButton: {
    backgroundColor: '#000',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
