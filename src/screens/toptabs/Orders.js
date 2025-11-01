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
import orderService from '../../services/api/OrderService'; // ✅ correct import path

const OrderScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ===== Fetch orders with pagination =====
  const loadOrders = async (pageNum = 1, append = false) => {
    try {
      if (loading) return;
      setLoading(true);

      const response = await orderService.getOrders({ page: pageNum, limit: 10 });

      if (response.success && response.data) {
        const fetchedOrders = response.data.orders || [];
        setTotalPages(response.data.pagination?.pages || 1);

        setOrders(prev =>
          append ? [...prev, ...fetchedOrders] : fetchedOrders
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      Alert.alert('Error', 'Something went wrong while fetching orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // ===== View order details =====
  const viewOrderDetails = async (orderId) => {
    try {
      setLoading(true);
      const response = await orderService.getOrderDetails(orderId);
      if (response.success) {
        Alert.alert('Order Details', JSON.stringify(response.data, null, 2));
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Something went wrong fetching order details.');
    } finally {
      setLoading(false);
    }
  };

  // ===== Cancel order =====
  const cancelOrder = (orderId) => {
    Alert.alert('Confirm', 'Are you sure you want to cancel this order?', [
      {
        text: 'Yes',
        onPress: async () => {
          try {
            const response = await orderService.cancelOrder(orderId, 'User cancelled');
            if (response.success) {
              Alert.alert('Success', 'Order cancelled successfully');
              loadOrders(1); // Refresh first page
            } else {
              Alert.alert('Error', response.message || 'Failed to cancel order');
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to cancel order');
          }
        },
      },
      { text: 'No' },
    ]);
  };

  // ===== Load more pagination =====
  const loadMore = () => {
    if (page < totalPages && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadOrders(nextPage, true);
    }
  };

  // ===== Pull to refresh =====
  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadOrders(1);
  };

  // ===== Render each order card =====
  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <Text style={styles.orderText}>Order ID: {item.orderId}</Text>
      <Text style={styles.orderText}>Astrologer: {item.astrologerName || 'N/A'}</Text>
      <Text style={styles.orderText}>Type: {item.type || 'N/A'}</Text>
      <Text style={styles.orderText}>Status: {item.status}</Text>
      <Text style={styles.orderText}>Amount: ₹{item.totalAmount || 0}</Text>

      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.detailBtn}
          onPress={() => viewOrderDetails(item.orderId)}
        >
          <Text style={styles.btnText}>View</Text>
        </TouchableOpacity>

        {item.status !== 'cancelled' && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => cancelOrder(item.orderId)}
          >
            <Text style={styles.btnText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Orders</Text>

      {loading && page === 1 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#5636B8" />
          <Text>Loading Orders...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item, index) => item.orderId || index.toString()}
          renderItem={renderOrder}
          contentContainerStyle={{ paddingBottom: 20 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            !loading && <Text style={styles.emptyText}>No orders found</Text>
          }
          ListFooterComponent={
            loading && page > 1 ? (
              <ActivityIndicator size="small" color="#5636B8" style={{ marginVertical: 10 }} />
            ) : null
          }
        />
      )}
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


