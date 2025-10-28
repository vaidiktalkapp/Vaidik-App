import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import userService from '../../services/api/UserService';  // adjust path as needed

const FollowingScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Fetch favorites on mount
  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const result = await userService.getFavorites();
      if (result.success) {
        setFavorites(result.data);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const addFavorite = async (astrologerId) => {
    try {
      setLoading(true);
      const result = await userService.addFavorite(astrologerId);
      if (result.success) {
        Alert.alert('Success', 'Added to favorites');
        fetchFavorites();
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (astrologerId) => {
    try {
      setLoading(true);
      const result = await userService.removeFavorite(astrologerId);
      if (result.success) {
        Alert.alert('Success', 'Removed from favorites');
        fetchFavorites();
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderFavorite = ({ item }) => (
    <View style={styles.favoriteItem}>
      <Text style={styles.favoriteName}>{item.name}</Text>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFavorite(item.id)}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={handleGoBack}>
            <Image
              source={require('../../assets/back.png')}
              style={styles.leftIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headText}>Following</Text>
        </View>

        <View style={styles.line} />

        {loading && <ActivityIndicator size="large" color="#000" />}

        {!loading && (favorites.length === 0 ? (
          <Text style={styles.emptyText}>No favorites found.</Text>
        ) : (
          <FlatList
            data={favorites}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderFavorite}
            style={{ marginTop: 10 }}
          />
        ))}

        {/* Demo add favorite button */}
        {/* Replace 'someAstrologerId' with actual ID to add */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => addFavorite('someAstrologerId')}
        >
          <Text style={styles.addButtonText}>Add Favorite (Demo)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default FollowingScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  container: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  headText: {
    fontSize: 18,
    fontWeight: '300',
    marginLeft: 5,
  },
  line: {
    marginTop: 10,
    height: 1,
    width: '100%',
    backgroundColor: '#ccc',
  },
  emptyText: {
    marginTop: 20,
    fontStyle: 'italic',
    color: '#666',
  },
  favoriteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  favoriteName: {
    fontSize: 16,
  },
  removeButton: {
    backgroundColor: '#ff4d4d',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  removeButtonText: {
    color: '#fff',
  },
  addButton: {
    marginTop: 20,
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
