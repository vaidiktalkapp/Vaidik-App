// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   TextInput,
//   StyleSheet,
//   FlatList,
//   Alert,
//   Image,
//   RefreshControl,
// } from 'react-native';
// import Feather from 'react-native-vector-icons/Feather';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import userService from '../services/api/UserService'; // has getStatistics()

// const amounts = [
//   { id: 1, value: 50, bonus: '100% Extra' },
//   { id: 2, value: 100, bonus: '100% Extra' },
//   { id: 3, value: 200, bonus: '100% Extra', popular: true },
//   { id: 4, value: 500, bonus: '100% Extra', popular: true },
//   { id: 5, value: 1000, bonus: '10% Extra' },
//   { id: 6, value: 2000, bonus: '10% Extra' },
//   { id: 7, value: 3000, bonus: '10% Extra' },
//   { id: 8, value: 4000, bonus: '12% Extra' },
//   { id: 9, value: 8000, bonus: '12% Extra' },
//   { id: 10, value: 15000, bonus: '15% Extra' },
//   { id: 11, value: 20000, bonus: '15% Extra' },
//   { id: 12, value: 50000, bonus: '20% Extra' },
//   { id: 13, value: 100000, bonus: '20% Extra' },
// ];

// const AddMoneyScreen = ({ navigation, route }) => {
//   const [amount, setAmount] = useState('');
//   const [walletBalance, setWalletBalance] = useState(0);
//   const [refreshing, setRefreshing] = useState(false);

//   // ✅ Fetch wallet balance using getStatistics
//   const fetchWalletBalance = useCallback(async () => {
//     try {
//       setRefreshing(true);
//       const response = await userService.getStatistics();
//       if (response.success && response.data.wallet) {
//         setWalletBalance(response.data.wallet.balance ?? 0);
//       } else {
//         Alert.alert('Error', response.message || 'Failed to fetch wallet balance');
//       }
//     } catch (error) {
//       console.error('Wallet fetch error:', error);
//       Alert.alert('Error', 'Something went wrong fetching wallet balance.');
//     } finally {
//       setRefreshing(false);
//     }
//   }, []);

//   // 🔁 Fetch on mount
//   useEffect(() => {
//     fetchWalletBalance();
//   }, [fetchWalletBalance]);

//   // 🔁 When returning from PaymentInfo, update wallet instantly
//   useEffect(() => {
//     if (route.params?.addedAmount) {
//       const added = Number(route.params.addedAmount);
//       if (!isNaN(added)) {
//         setWalletBalance(prev => prev + added);
//       }
//     }
//   }, [route.params?.addedAmount]);

//   // Proceed with manual or preset amount
//   const handleProceed = () => {
//     if (!amount || amount.trim() === '') {
//       Alert.alert('Validation', 'Please enter the amount');
//       return;
//     }
//     const numericAmount = Number(amount);
//     if (isNaN(numericAmount) || numericAmount <= 0) {
//       Alert.alert('Validation', 'Enter a valid amount greater than 0');
//       return;
//     }

//     navigation.navigate('PaymentInfo', {
//       amount: numericAmount,
//       onSuccess: addedAmount => {
//         // update balance locally when payment success
//         setWalletBalance(prev => prev + addedAmount);
//       },
//     });
//   };

//   const renderCard = ({ item }) => (
//     <TouchableOpacity
//       style={styles.card}
//       onPress={() =>
//         navigation.navigate('PaymentInfo', {
//           amount: item.value,
//           onSuccess: addedAmount => setWalletBalance(prev => prev + addedAmount),
//         })
//       }
//     >
//       {item.popular && (
//         <View style={styles.popularTag}>
//           <Text style={styles.popularText}>★ Most Popular</Text>
//         </View>
//       )}
//       <Text style={styles.amount}>₹{item.value}</Text>
//       <Text style={styles.bonus}>{item.bonus}</Text>
//     </TouchableOpacity>
//   );

//   return (
//     <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
//       <View style={styles.container}>
//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => navigation.goBack()}>
//             <Image source={require('../assets/back.png')} style={styles.leftIcon} />
//           </TouchableOpacity>

//           <Text style={styles.headerTitle}>Add money to wallet</Text>

//           {/* ✅ Wallet balance */}
//           <View style={styles.walletBox}>
//             <Feather name="credit-card" size={18} color="#000" style={{ right: 8 }} />
//             <Text style={styles.walletText}>₹{walletBalance.toFixed(2)}</Text>
//           </View>
//         </View>

//         <View style={styles.line} />

//         {/* Input + Proceed button */}
//         <View style={styles.phoneContainer}>
//           <TextInput
//             style={styles.input}
//             placeholder="Enter amount in INR"
//             placeholderTextColor="grey"
//             keyboardType="numeric"
//             value={amount}
//             onChangeText={setAmount}
//           />
//           <TouchableOpacity style={styles.buttonProceed} onPress={handleProceed}>
//             <Text style={styles.buttonProceedText}>Proceed</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Amount Grid */}
//         <FlatList
//           data={amounts}
//           renderItem={renderCard}
//           keyExtractor={item => item.id.toString()}
//           numColumns={3}
//           columnWrapperStyle={{ justifyContent: 'space-between' }}
//           contentContainerStyle={{ paddingBottom: 40 }}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={fetchWalletBalance}
//               colors={['#5636B8']}
//             />
//           }
//         />
//       </View>
//     </SafeAreaView>
//   );
// };

// export default AddMoneyScreen;

// const styles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
//   container: { flex: 1, backgroundColor: 'rgb(245, 245, 245)', padding: 15 },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   headerTitle: {
//     fontSize: 16,
//     fontWeight: '400',
//     marginLeft: 30,
//     flex: 1,
//   },
//   walletBox: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f5f5f5',
//     paddingVertical: 4,
//     paddingHorizontal: 8,
//     borderRadius: 20,
//     right: 8,
//   },
//   walletText: { fontSize: 13, fontWeight: '600' },
//   card: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 10,
//     margin: 5,
//     alignItems: 'center',
//     paddingVertical: 15,
//     backgroundColor: '#fff',
//   },
//   amount: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
//   bonus: { fontSize: 13, color: 'green', fontWeight: '500' },
//   popularTag: {
//     position: 'absolute',
//     top: -7,
//     left: 0,
//     backgroundColor: '#ff7043',
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderTopLeftRadius: 10,
//     borderBottomRightRadius: 10,
//   },
//   popularText: { fontSize: 10, color: '#fff', fontWeight: '600' },
//   input: {
//     flex: 1,
//     fontSize: 16,
//     paddingVertical: 14,
//     fontWeight: 'bold',
//     marginLeft: 10,
//   },
//   phoneContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#d1d5db',
//     borderRadius: 10,
//     paddingHorizontal: 10,
//     width: '95%',
//     marginBottom: 15,
//     backgroundColor: 'white',
//     marginTop: 16,
//     marginLeft: 14,
//   },
//   buttonProceed: {
//     backgroundColor: '#f8d900',
//     paddingVertical: 8,
//     paddingHorizontal: 15,
//     borderRadius: 10,
//   },
//   buttonProceedText: {
//     color: '#000',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   leftIcon: {
//     width: 20,
//     height: 20,
//     marginLeft: 15,
//     marginTop: 5,
//     tintColor: 'grey',
//   },
//   line: {
//     marginTop: 1,
//     height: 1,
//     width: '110%',
//     backgroundColor: '#ccc',
//     right: 10,
//   },
// });




import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import walletService from '../services/api/WalletService'; // ✅ now using wallet service

const amounts = [
  { id: 1, value: 50, bonus: '100% Extra' },
  { id: 2, value: 100, bonus: '100% Extra' },
  { id: 3, value: 200, bonus: '100% Extra', popular: true },
  { id: 4, value: 500, bonus: '100% Extra', popular: true },
  { id: 5, value: 1000, bonus: '10% Extra' },
  { id: 6, value: 2000, bonus: '10% Extra' },
  { id: 7, value: 3000, bonus: '10% Extra' },
  { id: 8, value: 4000, bonus: '12% Extra' },
  { id: 9, value: 8000, bonus: '12% Extra' },
  { id: 10, value: 15000, bonus: '15% Extra' },
  { id: 11, value: 20000, bonus: '15% Extra' },
  { id: 12, value: 50000, bonus: '20% Extra' },
  { id: 13, value: 100000, bonus: '20% Extra' },
];

const AddMoneyScreen = ({ navigation, route }) => {
  const [amount, setAmount] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Fetch wallet stats using getWalletStats()
  const fetchWalletBalance = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await walletService.getWalletStats();
      if (response.success && response.data) {
        setWalletBalance(response.data.currentBalance ?? 0);
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch wallet balance');
      }
    } catch (error) {
      console.error('Wallet fetch error:', error);
      Alert.alert('Error', 'Something went wrong fetching wallet balance.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // 🔁 Fetch on mount
  useEffect(() => {
    fetchWalletBalance();
  }, [fetchWalletBalance]);

  // 🔁 When returning from PaymentInfo, update wallet instantly
  useEffect(() => {
    if (route.params?.addedAmount) {
      const added = Number(route.params.addedAmount);
      if (!isNaN(added)) {
        setWalletBalance(prev => prev + added);
      }
    }
  }, [route.params?.addedAmount]);

  // ✅ Proceed manually entered amount
  const handleProceed = () => {
    if (!amount || amount.trim() === '') {
      Alert.alert('Validation', 'Please enter an amount');
      return;
    }
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Validation', 'Enter a valid amount greater than 0');
      return;
    }

    navigation.navigate('PaymentInfo', {
      amount: numericAmount,
      onSuccess: addedAmount => {
        setWalletBalance(prev => prev + addedAmount);
      },
    });
  };

  // ✅ Render each card
  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('PaymentInfo', {
          amount: item.value,
          onSuccess: addedAmount => setWalletBalance(prev => prev + addedAmount),
        })
      }
    >
      {item.popular && (
        <View style={styles.popularTag}>
          <Text style={styles.popularText}>★ Most Popular</Text>
        </View>
      )}
      <Text style={styles.amount}>₹{item.value}</Text>
      <Text style={styles.bonus}>{item.bonus}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={require('../assets/back.png')} style={styles.leftIcon} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Add Money to Wallet</Text>

          {/* Wallet balance */}
          <View style={styles.walletBox}>
            <Feather name="credit-card" size={18} color="#000" style={{ right: 6 }} />
            <Text style={styles.walletText}>₹{walletBalance.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.line} />

        {/* Input + Proceed button */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter amount in INR"
            placeholderTextColor="grey"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          <TouchableOpacity style={styles.buttonProceed} onPress={handleProceed}>
            <Text style={styles.buttonProceedText}>Proceed</Text>
          </TouchableOpacity>
        </View>

        {/* Amount Grid */}
        <FlatList
          data={amounts}
          renderItem={renderCard}
          keyExtractor={item => item.id.toString()}
          numColumns={3}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchWalletBalance}
              colors={['#f8d900']}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default AddMoneyScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff', padding: 15 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '500',
    marginLeft: 30,
    flex: 1,
  },
  walletBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    right: 8,
  },
  walletText: { fontSize: 13, fontWeight: '600' },
  line: {
    height: 1,
    width: '110%',
    backgroundColor: '#ccc',
    marginBottom: 10,
    right: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 10,
    width: '95%',
    backgroundColor: 'white',
    marginTop: 12,
    marginBottom: 18,
    marginLeft: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  buttonProceed: {
    backgroundColor: '#f8d900',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  buttonProceedText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#f8d900',
    borderRadius: 10,
    margin: 5,
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  amount: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  bonus: { fontSize: 13, color: 'green', fontWeight: '500' },
  popularTag: {
    position: 'absolute',
    top: -7,
    left: 0,
    backgroundColor: '#ff7043',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  popularText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  leftIcon: {
    width: 20,
    height: 20,
    marginLeft: 15,
    marginTop: 5,
    tintColor: 'grey',
  },
});
