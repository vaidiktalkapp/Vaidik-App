// components/CustomDrawerContent.js

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
// import VaidikBlog from '../screens/SidebarScreens/VaidikBlog';
import { DrawerActions } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const CustomDrawerContent = ({ navigation }) => {
  const { user, isAuthenticated } = useAuth();

  // Default guest user info
  const guestName = 'Guest User';
  const guestPhone = '+91 0000000000';

  const hanleGift = () => {
    navigation.navigate('RedeemGift');
  };
  const hanleCustomerSupport = () => {
    navigation.navigate('CustomerSupport');
  };
  const handleSetting = () => {
    navigation.navigate('Setting');
  };
  const handleMembership = () => {
    navigation.navigate('membership');
  };
  const handleFollowing = () => {
    navigation.navigate('Following');
  };

  const handleOrderHistory = () => {
    navigation.navigate('OrderHistory');
  };

  const handleHome = () => {
    navigation.navigate('DrawerNavigation', {
      screen: 'RootTabs',
      params: { screen: 'Home' },
    });
  };

  const handleWallet = () => {
    navigation.navigate('Wallet');
  };

  const handleEdit = () => {
    navigation.navigate('Profile');
  };
  const handleCancel = () => {
    navigation.dispatch(DrawerActions.closeDrawer());
  };

  const handleRemedies = () => {
    navigation.navigate('DrawerNavigation', {
      screen: 'RootTabs',
      params: { screen: 'Remedies' },
    });
  };

  const handleChat = () => {
    navigation.navigate('DrawerNavigation', {
      screen: 'RootTabs',
      params: { screen: 'Chat' },
    });
  };
  return (
    <View style={styles.drawerContent}>
      <View style={styles.container}>
        {/* Profile Section */}
        <TouchableOpacity style={styles.profileSection} onPress={handleEdit}>
          <Image
            source={require('../assets/profile.png')}
            resizeMode="contain"
            style={styles.profileIcon}
          />
          <View style={styles.textContainer}>
            <Text style={styles.name}>
              {isAuthenticated && user && user.name ? user.name : guestName}
              <Image
                source={require('../assets/pen.png')}
                resizeMode="contain"
                style={styles.penIcon}
              />
            </Text>
            <Text style={styles.number}>
              {isAuthenticated && user && user.phoneNumber
                ? `${user.phoneNumber}`
                : guestPhone}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Buttons Section */}
        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.crossButton} onPress={handleCancel}>
            <Image
              source={require('../assets/cancel.png')}
              resizeMode="contain"
              style={styles.cancelIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.line1} />

      {/* sidebar elements start from here */}
      <View style={styles.sidebarContainer}>
        <TouchableOpacity style={styles.sidebarItem} onPress={handleHome}>
          <Image
            source={require('../assets/house.png')}
            resizeMode="contain"
            style={styles.icon}
          />
          <Text style={styles.label}>Home</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.sidebarItem} onPress={hanleBookpooja}>
          <Image
            source={require('../assets/kalash.png')}
            resizeMode="contain"
            style={styles.icon}
          />
          <Text style={styles.label}>Book Pooja</Text>
        </TouchableOpacity> */}

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={hanleCustomerSupport}
        >
          <Image
            source={require('../assets/customer-service.png')}
            resizeMode="contain"
            style={styles.icon}
          />
          <Text style={styles.label}>Customer Support Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarItem} onPress={handleWallet}>
          <Image
            source={require('../assets/wallet.png')}
            resizeMode="contain"
            style={styles.icon}
          />
          <Text style={styles.label}>Wallet Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarItem} onPress={hanleGift}>
          <Image
            source={require('../assets/gift-box.png')}
            resizeMode="contain"
            style={styles.icon}
          />
          <Text style={styles.label}>Redeem Gift Card</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={handleOrderHistory}
        >
          <Image
            source={require('../assets/history.png')}
            resizeMode="contain"
            style={styles.icon}
          />
          <Text style={styles.label}>Order History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarItem} onPress={handleMembership}>
          <Image
            source={require('../assets/gift-box.png')}
            resizeMode="contain"
            style={styles.icon}
          />
          <Text style={styles.label}>Buy Membership</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarItem} onPressIn={handleRemedies}>
          <Image
            source={require('../assets/Vaidik-remedy.png')}
            resizeMode="contain"
            style={styles.icon}
          />
          <Text style={styles.label}>VaidikRemedy</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.sidebarItem} onPress={handleBlog}>
          <Image
            source={require('../assets/blogs.png')}
            resizeMode="contain"
            style={styles.icon}
          />
          <Text style={styles.label}>Vaidik Blogs</Text>
        </TouchableOpacity> */}

        <TouchableOpacity style={styles.sidebarItem} onPress={handleChat}>
          <Image
            source={require('../assets/chat.png')}
            resizeMode="contain"
            style={styles.icon}
          />
          <Text style={styles.label}>Chat with Astrologers</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarItem} onPress={handleFollowing}>
          <Image
            source={require('../assets/following.png')}
            resizeMode="contain"
            style={styles.icon}
          />
          <Text style={styles.label}>My Following</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity
          style={styles.sidebarItem}
          onPress={handleFreeServices}
        >
          <Image
            source={require('../assets/free.png')}
            resizeMode="contain"
            style={styles.icon}
          />
          <Text style={styles.label}>Free Services</Text>
        </TouchableOpacity> */}

        <TouchableOpacity style={styles.sidebarItem} onPress={handleSetting}>
          <Image
            source={require('../assets/setting.png')}
            resizeMode="contain"
            style={styles.icon}
          />
          <Text style={styles.label}>Setting</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.aviable}>also available on </Text>

      <View style={styles.avaibleOnSocialMediaCantainer}>
        <TouchableOpacity>
          <Image
            source={require('../assets/apple-logo.png')}
            style={styles.aviableIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image
            source={require('../assets/internet.png')}
            style={styles.aviableIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity>
          <Image
            source={require('../assets/youtube-logo.png')}
            style={styles.aviableIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image
            source={require('../assets/facebook-logo.png')}
            style={styles.aviableIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image
            source={require('../assets/instagram-logo.png')}
            style={styles.aviableIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image
            source={require('../assets/linkedin-logo.png')}
            resizeMode="contain"
            style={styles.aviableIcon}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.VersionCantainer}>
        <Image
          source={require('../assets/onlyLogoVaidik.png')}
          style={styles.VersionLogoIcon}
        />
        <Text style={styles.versionText}>Version 10.1.03</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    backgroundColor: '#eee',
    paddingTop: 15,
  },
  drawerText: {
    fontSize: 18,
  },
  DrawerProfileCantainer: {
    flexDirection: 'row',
  },
  profileIcon: {
    width: 55,
    height: 55,
    marginRight: 10,
  },
  line1: {
    marginTop: 15,
    height: 1,
    width: '100%',
    backgroundColor: '#ccc',
    // marginLeft: 10,
  },
  sidebarContainer: {
    padding: 15,
    marginLeft: 4,
  },
  sidebarItem: {
    flexDirection: 'row', // icon and text in a row
    alignItems: 'center', // vertically center
    marginBottom: 22, // spacing between rows
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 15, // space between icon and text
    tintColor: 'grey',
  },
  label: {
    fontSize: 14,
    color: '#333',
  },
  aviable: {
    marginLeft: 20,
    marginVertical: -25,
    color: 'grey',
    fontWeight: '500',
  },
  avaibleOnSocialMediaCantainer: {
    flexDirection: 'row',
    alignContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginVertical: 30,
  },
  aviableIcon: {
    width: 25,
    height: 25,
    marginLeft: 12,
  },
  VersionCantainer: {
    flexDirection: 'row',
    alignContent: 'center',
    alignItems: 'center',
    marginVertical: -25,
  },
  versionText: {
    fontSize: 16,
    fontWeight: '300',
    color: 'green',
    left: 70,
    top: 35,
  },
  VersionLogoIcon: {
    width: 45,
    height: 45,
    marginRight: 8,
    fontWeight: '600',
    left: 60,
    top: 35,
  },
  penIcon: {
    width: 14,
    height: 14,
  },
  cancelIcon: {
    width: 24,
    height: 24,
  },
  container: {
    flexDirection: 'row',
    // alignItems: 'center',
    padding: 5,
    justifyContent: 'space-between',
    marginLeft: 8,
    width: '100%',
  },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '500',
  },
  number: {
    fontSize: 14,
    color: 'blue',
  },
  buttonSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -14,
  },
  crossButton: {
    marginLeft: 10,
    marginRight: 6,
    marginTop: -1,
  },
});

export default CustomDrawerContent;
