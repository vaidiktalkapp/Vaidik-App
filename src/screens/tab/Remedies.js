import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';
import HeaderIcons from '../../component/HeaderIcons';
import Carousel from 'react-native-reanimated-carousel';
import RemediesStyle from '../../style/RemediesStyle';
import RemediesData from '../../Data/RemediesData.json';

const styles = RemediesStyle;
const { width } = Dimensions.get('window');

// Destructure data from JSON
const { bannerData, categoriesData, kundaliData, numerology, vastu, others } = RemediesData;

const Remedies = ({ navigation }) => {

  // ✅ Navigate to WebView screen instead of opening browser
  const openLink = (title, link) => {
    if (link) {
      navigation.navigate('WebViewScreen', { title, url: link });
    }
  };

  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openLink(item.title, item.link)}
    >
      <Image
        source={typeof item.img === 'string' ? { uri: item.img } : item.img}
        style={styles.cardImage}
      />

      <View style={styles.cardBottom}>
        <Text style={styles.sectioTitle}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* ===== Header ===== */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <HeaderIcons />
          <Text style={styles.title}>AstroRemedy</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('OrderHistory')}
          >
            <Image
              source={require('../../assets/order.png')}
              style={styles.icon}
            />
            <Text style={styles.orders}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconOnly}
            onPress={() => navigation.navigate('SearchScreen')}
          >
            <Image
              source={require('../../assets/search.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== Scrollable Content ===== */}
      <FlatList
        data={[]} // Empty main list
        ListHeaderComponent={
          <>
            {/* ===== Banner ===== */}
            <Carousel
              loop
              width={width}
              height={180}
              autoPlay
              data={bannerData}
              scrollAnimationDuration={1500}
              renderItem={({ item }) => (
                <View style={styles.bannerCard}>
                  <Image source={{ uri: item.image }} style={styles.bannerImage} />
                  <View style={styles.bannerOverlay}>
                    <Text style={styles.bannerText}>{item.text}</Text>
                    <TouchableOpacity
                      style={styles.bannerBtn}
                      onPress={() => openLink(item.text, item.image)}
                    >
                      <Text style={styles.bannerBtnText}>Check Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />

            {/* ===== Categories ===== */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Astrotalk Store</Text>
              <TouchableOpacity
                onPress={() => openLink('Astrotalk Store', 'https://vaidiktalk.store/')}
              >
                <Text style={styles.visitStore}>Visit Store</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={categoriesData}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryCard}
                  onPress={() => openLink(item.title, item.link)}
                >
                  <Image
                    source={
                      typeof item.img === 'string'
                        ? { uri: item.img }
                        : item.img
                    }
                    style={styles.categoryImage}
                  />
                  <Text style={styles.categoryTitle}>{item.title}</Text>
                </TouchableOpacity>
              )}
            />

            {/* ======= Sections ======= */}
            <View style={{ marginTop: 15 }}>
              <Text style={styles.sectionTitleKudali}>Kundali</Text>
              <FlatList
                data={kundaliData}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                contentContainerStyle={{ paddingHorizontal: 10 }}
                renderItem={renderCard}
              />
            </View>

            <View style={{ marginTop: 15 }}>
              <Text style={styles.sectionTitleKudali}>Numerology</Text>
              <FlatList
                data={numerology}
                keyExtractor={(item) => item.id + item.title}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                contentContainerStyle={{ paddingHorizontal: 10 }}
                renderItem={renderCard}
              />
            </View>

            <View style={{ marginTop: 15 }}>
              <Text style={styles.sectionTitleKudali}>Vastu</Text>
              <FlatList
                data={vastu}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                contentContainerStyle={{ paddingHorizontal: 10 }}
                renderItem={renderCard}
              />
            </View>

            <View style={{ marginTop: 15, marginBottom: 40 }}>
              <Text style={styles.sectionTitleKudali}>Others Remedies</Text>
              <FlatList
                data={others}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                contentContainerStyle={{ paddingHorizontal: 10 }}
                renderItem={renderCard}
              />
            </View>
          </>
        }
      />
    </View>
  );
};

export default Remedies;

