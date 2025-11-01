// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Image,
//   TouchableOpacity,
//   FlatList,
//   ActivityIndicator,
//   Alert,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import userService from '../../services/api/UserService';  // adjust path as needed

// const FollowingScreen = ({ navigation }) => {
//   const [favorites, setFavorites] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const handleGoBack = () => {
//     navigation.goBack();
//   };

//   // Fetch favorites on mount
//   useEffect(() => {
//     fetchFavorites();
//   }, []);

//   const fetchFavorites = async () => {
//     try {
//       setLoading(true);
//       const result = await userService.getFavorites();
//       if (result.success) {
//         setFavorites(result.data);
//       }
//     } catch (error) {
//       Alert.alert('Error', error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const addFavorite = async (astrologerId) => {
//     try {
//       setLoading(true);
//       const result = await userService.addFavorite(astrologerId);
//       if (result.success) {
//         Alert.alert('Success', 'Added to favorites');
//         fetchFavorites();
//       }
//     } catch (error) {
//       Alert.alert('Error', error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const removeFavorite = async (astrologerId) => {
//     try {
//       setLoading(true);
//       const result = await userService.removeFavorite(astrologerId);
//       if (result.success) {
//         Alert.alert('Success', 'Removed from favorites');
//         fetchFavorites();
//       }
//     } catch (error) {
//       Alert.alert('Error', error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderFavorite = ({ item }) => (
//     <View style={styles.favoriteItem}>
//       <Text style={styles.favoriteName}>{item.name}</Text>
//       <TouchableOpacity
//         style={styles.removeButton}
//         onPress={() => removeFavorite(item._id)}  // Use _id here
//       >
//         <Text style={styles.removeButtonText}>Unfollow</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
//       <View style={styles.container}>
//         <View style={styles.headerContainer}>
//           <TouchableOpacity onPress={handleGoBack}>
//             <Image
//               source={require('../../assets/back.png')}
//               style={styles.leftIcon}
//             />
//           </TouchableOpacity>
//           <Text style={styles.headText}>Following</Text>
//         </View>

//         <View style={styles.line} />

//         {loading && <ActivityIndicator size="large" color="#000" />}

//         {!loading && (favorites.length === 0 ? (
//           <Text style={styles.emptyText}>No favorites found.</Text>
//         ) : (
//           <FlatList
//             data={favorites}
//             keyExtractor={(item) => item._id.toString()}  // Use _id here
//             renderItem={renderFavorite}
//             style={{ marginTop: 10 ,}}
//           />
//         ))}

//         {/* Demo add favorite button */}
//         {/* Replace 'someAstrologerId' with actual ID to add */}
//         <TouchableOpacity
//           style={styles.addButton}
//           onPress={() => addFavorite('someAstrologerId')} // Replace with valid _id string
//         >
//           <Text style={styles.addButtonText}>Add Favorite (Demo)</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// };

// export default FollowingScreen;

// const styles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
//   container: {
//     flex: 1,
//     marginTop: 20,
//     paddingHorizontal: 20,
//   },
//   headerContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   leftIcon: {
//     width: 20,
//     height: 20,
//     marginRight: 10,
//   },
//   headText: {
//     fontSize: 18,
//     fontWeight: '300',
//     marginLeft: 5,
//   },
//   line: {
//     marginTop: 10,
//     height: 1,
//     width: '100%',
//     backgroundColor: '#ccc',
//   },
//   emptyText: {
//     marginTop: 20,
//     fontStyle: 'italic',
//     color: '#666',
//   },
//   favoriteItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderColor: '#ddd',
//   },
//   favoriteName: {
//     fontSize: 16,
//   },
//   removeButton: {
//     backgroundColor: '#FFAA1D',
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     borderRadius: 5,
//   },
//   removeButtonText: {
//     color: '#fff',
//   },
//   addButton: {
//     marginTop: 20,
//     backgroundColor: '#007bff',
//     padding: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   addButtonText: {
//     color: '#fff',
//     fontWeight: 'bold',
//   },
// });






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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import userService from '../../services/api/UserService';  // adjust path as needed

const FollowingScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newAstrologerId, setNewAstrologerId] = useState('');

  const handleGoBack = () => {
    navigation.goBack();
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const result = await userService.getFavorites();
      if (result.success) {
        setFavorites(result.data);
      } else {
        Alert.alert('Error', result.message || 'Failed to load favorites');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const addFavorite = async () => {
    if (!newAstrologerId.trim()) {
      Alert.alert('Validation', 'Please enter a valid Astrologer ID');
      return;
    }
    try {
      setLoading(true);
      const result = await userService.addFavorite(newAstrologerId.trim());
      if (result.success) {
        Alert.alert('Success', 'Added to favorites');
        setNewAstrologerId('');
        fetchFavorites();
      } else {
        Alert.alert('Error', result.message || 'Failed to add favorite');
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
      } else {
        Alert.alert('Error', result.message || 'Failed to remove favorite');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderFavorite = ({ item }) => (
    <View style={styles.card}>
      <Image 
        source={{ uri: item.profilePicture || 'https://via.placeholder.com/60' }} 
        style={styles.avatar}
      />
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.name}</Text>
        {item.bio ? <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text> : null}
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFavorite(item._id)}
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

        {/* Add Favorite Section */}
        <View style={styles.addFavoriteSection}>
          <TextInput
            placeholder="Enter Astrologer ID"
            value={newAstrologerId}
            onChangeText={setNewAstrologerId}
            style={styles.input}
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={addFavorite}
            disabled={loading}
          >
            <Text style={styles.addButtonText}>Add Favorite</Text>
          </TouchableOpacity>
        </View>

        {!loading && (favorites.length === 0 ? (
          <Text style={styles.emptyText}>No favorites found.</Text>
        ) : (
          <FlatList
            data={favorites}
            keyExtractor={(item) => item._id.toString()}
            renderItem={renderFavorite}
            style={{ marginTop: 10 }}
          />
        ))}
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
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  cardContent: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bio: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  removeButton: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  addFavoriteSection: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#007bff',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

