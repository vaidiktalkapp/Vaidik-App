import { StyleSheet } from 'react-native';
const RemediesStyle = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgb(245, 245, 245)' },
  // ===== Header =====
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', right: 15 },
  title: { fontSize: 18, fontWeight: '300', marginLeft: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 6,
    left: -5,
    backgroundColor: '#fff',
    paddingTop: 10,
  },
  headerIconOnly: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    padding: 8,
    marginLeft: 10,
    backgroundColor: '#fff',
  },
  orders: { fontSize: 14, color: '#444', marginLeft: 6, fontWeight: '500' },
  icon: { width: 20, height: 20, resizeMode: 'contain' },

  // ===== Banner =====
  bannerCard: {
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 8,
    marginHorizontal: 10,
  },
  bannerImage: { width: '100%', height: 180 },
  bannerOverlay: { position: 'absolute', top: 20, left: 15 },
  bannerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  bannerBtn: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bannerBtnText: { fontWeight: 'bold' },

  // ===== Categories =====
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 15,
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', left: 1 },
  visitStore: { fontSize: 14, color: '#FF9800' },

  sectionTitleKudali: { fontSize: 20, fontWeight: 'bold', left: 15 },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    marginRight: 15,
    width: 100,
    elevation: 2,
  },
  categoryImage: {
    width: 50,
    height: 50,
    marginBottom: 6,
    resizeMode: 'contain',
  },
  categoryText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },

  // ===== Products =====
  card: {
    width: '47%',
    height: 180,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    position: 'relative',
    top: 20,
  },
  cardImage: { width: '100%', height: '100%', position: 'absolute' },
  ribbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    backgroundColor: 'rgba(220,0,0,0.8)',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  ribbonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardBottom: { position: 'absolute', bottom: 10, left: 10 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  sectioTitle: {
    top: 90,
    alignContent: 'center',
    alignItems: 'center',
    left: 15,
    color: 'gold',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    top: 10,
  },
});

export default RemediesStyle;
