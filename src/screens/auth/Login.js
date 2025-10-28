// src/screens/auth/Login.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LoginStyle from '../../style/LoginStyle';
import { useAuth } from '../../context/AuthContext';
import { useTruecaller } from '@ajitpatel28/react-native-truecaller';

const Login = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [isValidPhone, setIsValidPhone] = useState(false);
  const countryCode = '91'; // Without + prefix (backend expects "91" not "+91")

  const { sendOtp, loginWithTruecaller, loading, error, clearError } = useAuth();

  const {
    initializeTruecallerSDK,
    openTruecallerForVerification,
    isSdkUsable,
    error: truecallerError,
  } = useTruecaller({
    androidClientId: 'roh4kmkkmy2bvkuq_5pa2rx72ouwa88cwtrbogsqc0g',
    androidSuccessHandler: handleTruecallerSuccess,
    scopes: ['profile', 'phone', 'openid'],
  });

  const styles = LoginStyle;

  useEffect(() => {
    const init = async () => {
      try {
        await initializeTruecallerSDK();
        console.log('✅ Truecaller SDK initialized');
      } catch (error) {
        console.log('⚠️ Truecaller init failed:', error.message);
      }
    };
    init();
  },);


  useEffect(() => {
    if (truecallerError) {
      console.error('❌ Truecaller error:', truecallerError);
      Alert.alert(
        'Truecaller Error',
        'Could not verify with Truecaller. Please use OTP login.'
      );
    }
  }, [truecallerError]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: () => clearError() }]);
    }
  }, );

  /**
   * Handle Truecaller success
   * Backend expects: { authorizationCode, codeVerifier }
   * Backend will verify with Truecaller and get user details
   */
  async function handleTruecallerSuccess(data) {
  try {
    console.log('🔄 Processing Truecaller data...');

    // Send only OAuth tokens to backend
    const truecallerData = {
      authorizationCode: data.authorizationCode,
      codeVerifier: data.codeVerifier,
    };

    console.log('📤 Sending to backend');

    const authResult = await loginWithTruecaller(truecallerData);
    console.log('📥 Backend response:', authResult);

    // ✅ FIX: Check if authResult exists and has success
    if (authResult && authResult.success) {
      console.log('✅ Truecaller login successful');
      
      // ✅ FIX: Safely access nested properties
      const user = authResult.data?.user;
      const isNewUser = authResult.data?.isNewUser;

      if (!user) {
        console.error('❌ No user data in response:', authResult);
        throw new Error('Invalid response from server');
      }

      console.log('👤 User name:', user.name);
      console.log('📱 Phone:', user.phoneNumber);
      console.log('🆕 Is new user:', isNewUser);

      // Navigate based on isNewUser flag
      if (user.isProfileComplete === false || isNewUser) {
        // New user - go to profile completion
        console.log('🔄 Navigating to Details screen (new user)');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Details' }],
        });
      } else {
        // Existing user - go to main app
        console.log('🔄 Navigating to main app (existing user)');
        navigation.reset({
          index: 0,
          routes: [{ name: 'DrawerNavigation' }],
        });
      }
    } else {
      // authResult.success is false
      console.error('❌ Login failed:', authResult?.message);
      throw new Error(authResult?.message || 'Login failed');
    }
  } catch (error) {
    console.error('❌ Truecaller login error:', error);
    console.error('❌ Error stack:', error.stack);
    Alert.alert(
      'Login Failed',
      error.message || 'Could not complete Truecaller login. Please try OTP login.'
    );
  }
}

  const validatePhoneNumber = (phoneNum) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    setIsValidPhone(phoneRegex.test(phoneNum));
  };

  const handleTermsPress = () => {
    Alert.alert('Terms and Conditions', 'Terms will be displayed here');
  };

  const handlePrivacyPress = () => {
    Alert.alert('Privacy Policy', 'Privacy policy will be displayed here');
  };

  /**
   * Handle OTP login
   * Backend expects: { phoneNumber: "9876543210", countryCode: "91" }
   */
  const handleLogin = async () => {
    if (!phone) {
      Alert.alert('Validation Error', 'Please enter your phone number');
      return;
    }

    if (!isValidPhone) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    try {
      clearError();
      console.log('📞 Sending OTP to:', countryCode, phone);

      // AuthService will send: { phoneNumber: "9876543210", countryCode: "91" }
      const result = await sendOtp(phone, countryCode);

      if (result.success) {
        console.log('✅ OTP sent successfully');

        navigation.navigate('OTPScreen', {
          phoneNumber: phone,
          countryCode: countryCode,
          fullPhoneNumber: `+${countryCode}${phone}`, // For display only
        });
      }
    } catch (error) {
      console.error('❌ OTP send error:', error);
    }
  };

  const handleTruecallerLogin = async () => {
    try {
      const isUsable = await isSdkUsable();

      if (!isUsable) {
        Alert.alert(
          'Truecaller Not Available',
          'Please install Truecaller app or use OTP verification.'
        );
        return;
      }

      console.log('📱 Opening Truecaller verification...');
      await openTruecallerForVerification();
    } catch (error) {
      console.error('❌ Truecaller error:', error);
      Alert.alert('Error', 'Could not open Truecaller. Please try OTP login.');
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Login',
      'You can browse astrologers, but some features require login. Continue as guest?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'DrawerNavigation' }],
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.skipWrapper}>
          <TouchableOpacity onPress={handleSkip} disabled={loading}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          <View style={styles.skipLine} />
        </View>

        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/Vaidik-talk1.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          First Chat With Vaidik Talk is FREE! 🎉
        </Text>
      </View>

      <View style={styles.phoneContainer}>
        <Image source={require('../../assets/flag.png')} style={styles.flagIcon} />
        <Text style={styles.INText}>IN</Text>
        <Text style={styles.countryCode}>{countryCode}</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(text) => {
            const cleaned = text.replace(/[^0-9]/g, '').substring(0, 10);
            setPhone(cleaned);
            validatePhoneNumber(cleaned);
          }}
          maxLength={10}
          editable={!loading}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />
      </View>

      <TouchableOpacity
        style={[styles.otpButton, (!isValidPhone || loading) && { opacity: 0.6 }]}
        onPress={handleLogin}
        disabled={!isValidPhone || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.otpText}>SENDING OTP...</Text>
          </View>
        ) : (
          <Text style={styles.otpText}>GET OTP</Text>
        )}
      </TouchableOpacity>

      <View style={styles.termsWrapper}>
        <Text style={styles.termsText}>By signing up, you agree to our </Text>
        <TouchableOpacity onPress={handleTermsPress} disabled={loading}>
          <Text style={styles.link}>Terms of use</Text>
        </TouchableOpacity>
        <Text style={styles.termsText}> and </Text>
        <TouchableOpacity onPress={handlePrivacyPress} disabled={loading}>
          <Text style={styles.link}>Privacy policy</Text>
        </TouchableOpacity>
        <Text style={styles.termsText}>.</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={styles.line} />
        <Text style={styles.orText}>Or</Text>
        <View style={styles.line1} />
      </View>

      <TouchableOpacity
        style={[styles.truecallerButton, loading && { opacity: 0.6 }]}
        onPress={handleTruecallerLogin}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Image
          source={require('../../assets/phone-call.png')}
          style={styles.truecallerIcon}
        />
        <Text style={styles.truecallerText}>Login With Truecaller</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Login;
