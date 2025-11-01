import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Linking } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/api/UserService';
import { SafeAreaView } from 'react-native-safe-area-context';

// Language options matching your design
const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'ENG' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
];

const Settings = ({ navigation }) => {
  const { logout } = useAuth();

  const [astroChat, setAstroChat] = useState(false);
  const [liveEvents, setLiveEvents] = useState(false);
  const [privacyToggle, setPrivacyToggle] = useState(false);
  const [language, setLanguage] = useState('en');
  const [tempLanguage, setTempLanguage] = useState('en');

  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [chatAccess, setChatAccess] = useState(false);
  const [imageDownload, setImageDownload] = useState(false);
  const [screenshot, setScreenshot] = useState(false);
  const [callRecording, setCallRecording] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const response = await userService.getPreferences();
      const data = response.data;

      console.log('📋 Loaded data:', data);

      setAstroChat(data.notifications?.normal === true);
      setLiveEvents(data.notifications?.liveEvents === true);
      setPrivacyToggle(data.privacy?.nameVisibleInReviews === true);

      const loadedLang = data.appLanguage || 'en';
      setLanguage(loadedLang);
      setTempLanguage(loadedLang);

      setChatAccess(
        data.privacy?.restrictions?.astrologerChatAccessAfterEnd === true,
      );
      setImageDownload(
        data.privacy?.restrictions?.downloadSharedImages === true,
      );
      setScreenshot(
        data.privacy?.restrictions?.restrictChatScreenshots === true,
      );
      setCallRecording(
        data.privacy?.restrictions?.accessCallRecording === true,
      );
    } catch (error) {
      console.error('❌ Failed to load preferences:', error);
      Alert.alert('Error', 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreference = async patch => {
    try {
      console.log('💾 Saving preference:', patch);
      const response = await userService.updatePreferences(patch);
      console.log('✅ Saved successfully:', response.data);
    } catch (error) {
      console.error('❌ Failed to update preferences:', error);
      Alert.alert('Error', 'Failed to update preferences');
    }
  };

  const toggleAstroChat = val => {
    setAstroChat(val);
    savePreference({ normalNotification: val });
  };

  const toggleLiveEvents = val => {
    setLiveEvents(val);
    savePreference({ liveEventsNotification: val });
  };

  const togglePrivacyToggle = val => {
    setPrivacyToggle(val);
    savePreference({ nameVisibleInReviews: val });
  };

  const toggleChatAccess = val => {
    setChatAccess(val);
    savePreference({ astrologerChatAccessAfterEnd: val });
  };

  const toggleImageDownload = val => {
    setImageDownload(val);
    savePreference({ downloadSharedImages: val });
  };

  const toggleScreenshot = val => {
    setScreenshot(val);
    savePreference({ restrictChatScreenshots: val });
  };

  const toggleCallRecording = val => {
    setCallRecording(val);
    savePreference({ accessCallRecording: val });
  };

  const openLanguageModal = () => {
    setTempLanguage(language);
    setLanguageModalVisible(true);
  };

  const applyLanguageChange = () => {
    setLanguage(tempLanguage);
    savePreference({ appLanguage: tempLanguage });
    setLanguageModalVisible(false);
  };

  const getLanguageLabel = code => {
    const lang = LANGUAGES.find(l => l.code === code);
    return lang ? lang.label : 'English';
  };

  const onLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const onDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.deleteAccount();
              await logout();
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } catch {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 10, color: '#666' }}>
            Loading preferences...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={require('../../assets/back.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerText}>Settings</Text>
        </View>

        <View style={styles.divider} />

        {/* Notifications Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notifications</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Astromall chat</Text>
            <Switch
              value={astroChat}
              onValueChange={toggleAstroChat}
              trackColor={{ false: '#d3d3d3', true: '#FFDB58' }}
              thumbColor={astroChat ? '#DAA520' : '#f4f3f4'}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Live Events</Text>
            <Switch
              value={liveEvents}
              onValueChange={toggleLiveEvents}
              trackColor={{ false: '#d3d3d3', true: '#FFDB58' }}
              thumbColor={liveEvents ? '#DAA520' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Privacy Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Privacy</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Show name in reviews</Text>
            <Switch
              value={privacyToggle}
              onValueChange={togglePrivacyToggle}
              trackColor={{ false: '#d3d3d3', true: '#FFDB58' }}
              thumbColor={privacyToggle ? '#DAA520' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Language Card - Replaced with custom modal trigger */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>App Language</Text>
          <TouchableOpacity
            style={styles.languageSelector}
            onPress={openLanguageModal}
          >
            <Text style={styles.languageSelectorText}>
              {getLanguageLabel(language)}
            </Text>
            <Icon name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setPrivacyModalVisible(true)}
        >
          <Text style={styles.actionText}>Manage Your Privacy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Notification')}
        >
          <Text style={styles.actionText}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            Linking.openURL('https://vaidiktalk.store/pages/terms-conditions')
          }
        >
          <Text style={styles.actionText}>Terms and Conditions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            Linking.openURL('https://vaidiktalk.store/pages/privacy-policy')
          }
        >
          <Text style={styles.actionText}>Privacy Policy</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, loggingOut && { opacity: 0.6 }]}
          onPress={onLogout}
          disabled={loggingOut}
        >
          <Image
            source={require('../../assets/exit.png')}
            style={styles.logoutIcon}
          />
          {loggingOut && (
            <ActivityIndicator
              size="small"
              color="#333"
              style={{ marginRight: 8 }}
            />
          )}
          <Text style={styles.logoutText}>
            {loggingOut ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity style={styles.deleteBtn} onPress={onDeleteAccount}>
          <Icon name="delete" size={20} color="red" />
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>

        {/*========= logo and version =============== */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 20,
          }}
        >
          <Image
            source={require('../../assets/onlyLogoVaidik.png')}
            style={styles.VersionLogoIcon}
          />
          <Text style={{color:'green'}}>Version 10.1.03</Text>
        </View>

        {/* Language Selection Modal */}
        <Modal
          animationType="fade"
          transparent
          visible={languageModalVisible}
          onRequestClose={() => setLanguageModalVisible(false)}
        >
          <View style={styles.languageModalOverlay}>
            <View style={styles.languageModalContent}>
              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setLanguageModalVisible(false)}
              >
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>

              {/* Title */}
              <Text style={styles.languageModalTitle}>
                Choose your app language
              </Text>

              {/* Language Grid */}
              <View style={styles.languageGrid}>
                {LANGUAGES.map(lang => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageOption,
                      tempLanguage === lang.code &&
                        styles.languageOptionSelected,
                    ]}
                    onPress={() => setTempLanguage(lang.code)}
                  >
                    <Text style={styles.languageNative}>
                      {lang.nativeLabel}
                    </Text>
                    <Text style={styles.languageEnglish}>{lang.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Coming Soon Text */}
              <Text style={styles.comingSoonText}>
                *Malayalam, Tamil, Gujarati and Odia are coming soon!
              </Text>

              {/* Apply Button */}
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyLanguageChange}
              >
                <Text style={styles.applyButtonText}>APPLY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Privacy Modal */}
        <Modal
          animationType="slide"
          transparent
          visible={privacyModalVisible}
          onRequestClose={() => setPrivacyModalVisible(false)}
        >
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Manage Your Privacy</Text>
              <View style={styles.modalRow}>
                <Text style={styles.modalText}>
                  Restrict chat access after session
                </Text>
                <Switch
                  value={chatAccess}
                  onValueChange={toggleChatAccess}
                  trackColor={{ false: '#d3d3d3', true: '#81b0ff' }}
                  thumbColor={chatAccess ? '#007AFF' : '#f4f3f4'}
                />
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalText}>Restrict image downloads</Text>
                <Switch
                  value={imageDownload}
                  onValueChange={toggleImageDownload}
                  trackColor={{ false: '#d3d3d3', true: '#81b0ff' }}
                  thumbColor={imageDownload ? '#007AFF' : '#f4f3f4'}
                />
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalText}>Restrict screenshots</Text>
                <Switch
                  value={screenshot}
                  onValueChange={toggleScreenshot}
                  trackColor={{ false: '#d3d3d3', true: '#81b0ff' }}
                  thumbColor={screenshot ? '#007AFF' : '#f4f3f4'}
                />
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalText}>Restrict call recordings</Text>
                <Switch
                  value={callRecording}
                  onValueChange={toggleCallRecording}
                  trackColor={{ false: '#d3d3d3', true: '#81b0ff' }}
                  thumbColor={callRecording ? '#007AFF' : '#f4f3f4'}
                />
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setPrivacyModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 50,
    paddingHorizontal: 15,
  },
  backIcon: { width: 20, height: 20 },
  logoutIcon: { width: 15, height: 15, marginRight: 8, fontWeight: '600' },
  VersionLogoIcon: { width: 25, height: 25, marginRight: 8, fontWeight: '600' },
  headerText: { fontSize: 18, fontWeight: '400', marginLeft: 20 },
  divider: { height: 1, backgroundColor: '#ddd' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  label: { fontSize: 12, flex: 1, color: '#555' },

  // Language Selector Button
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#fafafa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 6,
  },
  languageSelectorText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },

  // Language Modal Styles
  languageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  languageModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  languageModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 24,
    textAlign: 'center',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  languageOption: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
  },
  languageOptionSelected: {
    backgroundColor: '#FFF9E6',
    borderColor: '#FFD700',
    borderWidth: 3,
  },
  languageNative: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  languageEnglish: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  applyButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 1,
  },

  actionBtn: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionText: { fontSize: 14, color: 'green', fontWeight: '600' },
  logoutBtn: {
    backgroundColor: '#FFDB58',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 10,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  logoutText: { fontSize: 14, color: '#333', fontWeight: '600' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 10,
    marginTop: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  deleteText: { fontSize: 14, color: 'red', fontWeight: '600', marginLeft: 6 },
  modalBg: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  modalText: { flex: 1, fontSize: 13, marginRight: 15, color: '#333' },
  closeBtn: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginTop: 15,
  },
  closeBtnText: { fontSize: 14, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default Settings;
