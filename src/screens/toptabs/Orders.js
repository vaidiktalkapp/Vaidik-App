// // screens/TabOneScreen.js
// import React from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
//   FlatList,
// } from 'react-native';

// // Dummy Data
// const orders = [
//   {
//     id: '1',
//     name: 'Astrologer',
//     message: 'Aane wale 6 mahine mein kuch badlav dik...',
//     date: '20 Sep 2025',
//     // avatar: require('./assets/astrologer.png'), // replace with your astrologer icon
//   },
//   {
//     id: '2',
//     name: 'Astrologer',
//     message: 'Ek baar recharge karke chat time badha lij...',
//     date: '23 Mar 2025',
//     // avatar: require('./assets/astrologer.png'),
//   },
//   {
//     id: '3',
//     name: 'Vanshujeet',
//     message: 'last December tak',
//     date: '10 Jul 2024',
//     // avatar: require('./assets/vanshujeet.png'), // replace with real image
//   },
//   {
//     id: '4',
//     name: 'Maaya',
//     message: 'aapki taraf se jawab na aane Ke Karan ha...',
//     date: '08 Sep 2023',
//     // avatar: require('./assets/maaya.png'),
//   },
// ];
// const Orders = () => {
//   const renderItem = ({ item }) => (
//     <TouchableOpacity style={styles.orderItem}>
//       <Image source={item.avatar} style={styles.avatar} />
//       <View style={styles.orderDetails}>
//         <View style={styles.row}>
//           <Text style={styles.name}>{item.name}</Text>
//           <Text style={styles.date}>{item.date}</Text>
//         </View>
//         <Text style={styles.message} numberOfLines={1}>
//           {item.message}
//         </Text>
//       </View>
//     </TouchableOpacity>
//   );

//   return (
//     <FlatList
//       data={orders}
//       keyExtractor={item => item.id}
//       renderItem={renderItem}
//       contentContainerStyle={{ paddingVertical: 8 }}
//     />
//   );
// };

// const styles = StyleSheet.create({
//   orderItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 14,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   avatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//   },
//   orderDetails: {
//     flex: 1,
//     marginLeft: 12,
//   },
//   row: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   name: {
//     fontSize: 15,
//     fontWeight: '600',
//   },
//   date: {
//     fontSize: 12,
//     color: '#777',
//   },
//   message: {
//     fontSize: 13,
//     color: '#555',
//     marginTop: 2,
//   },
// });

// export default Orders;

// ====================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import orderService from '../../services/api/OrderService';

const OrderScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // ✅ Fetch user orders
  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrders({ page: 1, limit: 20 });
      if (response.success) {
        setOrders(response.data.orders || []);
      } else {
        Alert.alert('Error', 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Something went wrong while fetching orders.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Get single order details
  const viewOrderDetails = async orderId => {
    try {
      setLoading(true);
      const response = await orderService.getOrderDetails(orderId);
      if (response.success) {
        setSelectedOrder(response.data);
        Alert.alert('Order Details', JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cancel order
  const cancelOrder = async orderId => {
    Alert.alert('Confirm', 'Are you sure you want to cancel this order?', [
      {
        text: 'Yes',
        onPress: async () => {
          try {
            const response = await orderService.cancelOrder(
              orderId,
              'User cancelled',
            );
            if (response.success) {
              Alert.alert('Success', 'Order cancelled successfully');
              loadOrders(); // Refresh
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to cancel order');
          }
        },
      },
      { text: 'No' },
    ]);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#5636B8" />
        <Text>Loading Orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Orders</Text>

      <FlatList
        data={orders}
        keyExtractor={item => item._id?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <Text style={styles.orderText}>Order ID: {item._id}</Text>
            <Text style={styles.orderText}>Type: {item.type}</Text>
            <Text style={styles.orderText}>Status: {item.status}</Text>
            <Text style={styles.orderText}>Price: ₹{item.price}</Text>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.detailBtn}
                onPress={() => viewOrderDetails(item._id)}
              >
                <Text style={styles.btnText}>View</Text>
              </TouchableOpacity>

              {item.status !== 'cancelled' && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => cancelOrder(item._id)}
                >
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No orders found</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 15 },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5636B8',
    marginBottom: 15,
  },
  orderCard: {
    backgroundColor: '#f9f9ff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  orderText: { fontSize: 15, color: '#333', marginBottom: 3 },
  btnRow: { flexDirection: 'row', marginTop: 10 },
  detailBtn: {
    flex: 1,
    backgroundColor: '#5636B8',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 5,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#e53935',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 5,
  },
  btnText: { color: '#fff', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 50 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default OrderScreen;
