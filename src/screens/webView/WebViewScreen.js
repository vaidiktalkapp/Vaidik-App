import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import Ionicons from 'react-native-vector-icons/Ionicons'; // ✅ correct import for CLI

const WebViewScreen = ({ route, navigation }) => {
  const { title, url } = route.params;



  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {/* WebView */}
      <WebView
        source={{ uri: url }}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        style={styles.webview}
      />
    </View>
  );
};

export default WebViewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 56,
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 3,
  },
  line:{
    width: '100%',
    height: 1,
    backgroundColor: '#e0e0e0',

  },
  backButton: {
    padding: 5,
    marginRight: 10,
    left:10
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    flex: 1,
    left:25
  },
  webview: {
    flex: 1,
  },
});
