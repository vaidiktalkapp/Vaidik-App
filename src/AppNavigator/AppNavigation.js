import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Splash from '../screens/Splash';
import Login from '../screens/auth/Login';
import OTPScreen from '../screens/auth/OTPScreen';
import RewardScreen from '../screens/RewardScreen';
import Details from '../screens/auth/Details';
// import RootTabNavigation from './RootTabNavigation';
import Profile from '../screens/Profile';
import AddCash from '../screens/AddCash';
import PaymentInfo from '../screens/PaymentInfo';
import ExploreScreen from '../screens/ExploreScreen';
import Messenger from '../screens/OrderHistory';
import { NavigationContainer } from '@react-navigation/native';
import { CardStyleInterpolators } from '@react-navigation/stack';
import DrawerNavigation from './DrawerNavigation';
import BookPooja from '../screens/SidebarScreens/BookPooja';
import CustomerSupport from '../screens/SidebarScreens/CustomerSupport';
import RedeemGiftScreen from '../screens/SidebarScreens/RedemGiftScreen';
import MembershipScreen from '../screens/SidebarScreens/MembershipScreen';
import VaidikBlog from '../screens/SidebarScreens/VaidikBlog';
import Setting from '../screens/setting/Setting';
import FollowingScreen from '../screens/SidebarScreens/FollowingScreen';
import OrderHistory from '../screens/OrderHistory';
import SearchScreen from '../screens/SearchScreen';
import ManagePrivacy from '../screens/ManagePrivacy';
import Orders from '../screens/toptabs/Orders';
import Report from '../screens/toptabs/Report';
import Wallet from '../screens/toptabs/Wallet';
// import Remedies from '../screens/toptabs/Remedies';
import NotificationScreen from '../screens/NotificationScreen';
import CustomerChatSupport from '../screens/SidebarScreens/CustomerChatSupport';
import ChatSopport from '../screens/ChatSupport';
import BuyMembership from '../screens/SidebarScreens/BuyMembership';
import LiveStreamScreen from '../screens/tab/Live';

import AstrologerProfileScreen from '../screens/AstrologerProfileScreen';
import WebViewScreen from '../screens/webView/WebViewScreen';
import chatScreen from '../screens/chatCallSection/ChatScreen';
import VideAudioCall  from  '../screens/chatCallSection/VideoAudioCall';

// ADD AUTH PROVIDER IMPORT
import { AuthProvider } from '../context/AuthContext';

const Stack = createStackNavigator();

const AppNavigation = () => {
  return (
    <NavigationContainer>
      <AuthProvider>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          }}
        >
          <Stack.Screen name="Splash" component={Splash} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="OTPScreen" component={OTPScreen} />
          <Stack.Screen name="RewardScreen" component={RewardScreen} />
          <Stack.Screen
            name="DrawerNavigation"
            component={DrawerNavigation}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="AddCash" component={AddCash} />
          <Stack.Screen
            name="AstrologerProfile"
            component={AstrologerProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="PaymentInfo" component={PaymentInfo} />
          <Stack.Screen name="Explore" component={ExploreScreen} />
          <Stack.Screen name="Details" component={Details} />
          <Stack.Screen name="Messenger" component={Messenger} />
          <Stack.Screen name="BookPooja" component={BookPooja} />
          <Stack.Screen name="CustomerSupport" component={CustomerSupport} />
          <Stack.Screen name="RedeemGift" component={RedeemGiftScreen} />
          <Stack.Screen name="membership" component={MembershipScreen} />
          <Stack.Screen name="Blog" component={VaidikBlog} />
          <Stack.Screen name="Setting" component={Setting} />
          <Stack.Screen name="Following" component={FollowingScreen} />
          <Stack.Screen name="OrderHistory" component={OrderHistory} />
          <Stack.Screen name="SearchScreen" component={SearchScreen} />
          <Stack.Screen name="ManagePrivacy" component={ManagePrivacy} />
          {/* <Stack.Screen name='Roottab' component={RootTabNavigation}/> */}
          <Stack.Screen name="order" component={Orders} />
          <Stack.Screen name="Wallet" component={Wallet} />
          <Stack.Screen name="Report" component={Report} />
          <Stack.Screen name="Notification" component={NotificationScreen} />
          <Stack.Screen
            name="CustomerChatSupport"
            component={CustomerChatSupport}
          />
          <Stack.Screen name="ChatSupport" component={ChatSopport} />
          <Stack.Screen name="BuyMembership" component={BuyMembership} />
          <Stack.Screen name="LiveStreamScreen" component={LiveStreamScreen} />
          <Stack.Screen name="WebViewScreen" component={WebViewScreen} />
          <Stack.Screen name="ChatScreen" component={chatScreen} />
          <Stack.Screen name="VideoAudioCall" component={VideAudioCall} />
        </Stack.Navigator>
      </AuthProvider>
    </NavigationContainer>
  );
};

export default AppNavigation;
