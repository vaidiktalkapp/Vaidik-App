import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import reportService from '../../services/api/ReportService';

// Loader helper function in same style
const getLoader = (loading, page) => loading && page === 1;

const Reports = ({ userId }) => {
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Fetch Reports with pagination
  const loadReports = async (pageNum = 1, append = false) => {
    try {
      if (loading) return;
      setLoading(true);
      setError('');

      const response = await reportService.getUserReports(userId, pageNum, 10, {});

      if (response.success && response.data) {
        const fetchedReports = response.data.reports || [];
        setTotalPages(response.data.pagination?.pages || 1);

        setReports(prev => (append ? [...prev, ...fetchedReports] : fetchedReports));
      } else {
        setError(response.message || 'Failed to load reports');
      }
    } catch (err) {
      setError('Error fetching reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadReports();
    } else {
      setError('User ID is required');
    }
  }, [userId]);

  // Load more reports for pagination
  const loadMore = () => {
    if (page < totalPages && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadReports(nextPage, true);
    }
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadReports(1);
  };

  // Render each report card
  const renderReport = ({ item }) => (
    <TouchableOpacity style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text>Type: {item.type || 'N/A'}</Text>
      <Text>Status: {item.status}</Text>
      <Text>Created: {new Date(item.createdAt).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Reports</Text>

      {getLoader(loading, page) ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#ff6d00" />
          <Text>Loading Reports...</Text>
        </View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No reports found</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id}
          renderItem={renderReport}
          contentContainerStyle={{ paddingBottom: 20 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListFooterComponent={
            loading && page > 1 ? (
              <ActivityIndicator size="small" color="#ff6d00" style={{ marginVertical: 10 }} />
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 15 },
  header: { fontSize: 22, fontWeight: '700', color: '#ff6d00', marginBottom: 15 },
  card: {
    backgroundColor: '#fff8f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  error: { color: 'red', textAlign: 'center', marginTop: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default Reports;
