import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const BHAGWA = '#ff6d00';
const RED = '#e53935';
const GRAY = '#cccccc';
const LIGHT_BG = '#c1bfff';
const DARK_BG = '#24264d';
const PER_SECOND_RATE = 0.33;

const VideoAudioCall = ({ route }) => {
  const [seconds, setSeconds] = useState(0);
  const [isMicOn, setMicOn] = useState(true);
  const [isVideoOn, setVideoOn] = useState(route.params?.initialVideo ?? true);
  const [isMuted, setMuted] = useState(false);

  const otherUserName = 'Rajesh S';
  const otherUserInitials = 'RS';

  // Animation for FrameuserBubble
  const bubbleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(bubbleAnim, {
        toValue: -10,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(bubbleAnim, {
        toValue: 10,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(bubbleAnim, {
        toValue: -5,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(bubbleAnim, {
        toValue: 5,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(bubbleAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  });

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = s =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(
      2,
      '0',
    )}`;
  const totalPrice = (seconds * PER_SECOND_RATE).toFixed(2);

  function renderContent() {
    switch (isVideoOn) {
      case true:
        return (
          <>
            <Animated.View style={{ transform: [{ translateY: bubbleAnim }] }}>
              <View style={styles.FrameuserBubble}>
                <Icon name="user-outline" size={68} color="grey" />
              </View>
            </Animated.View>
            <View style={styles.userBubble}>
              <Icon name="video" size={68} color="grey" />
            </View>
            <Text style={styles.callStatus}>Call Active</Text>
          </>
        );
      case false:
        return (
          <>
            <View style={styles.bigLetterCircle}>
              <Text style={styles.bigLetter}>{otherUserInitials[0]}</Text>
            </View>
            <Text style={[styles.userName, { marginTop: 22 }]}>
              {otherUserName}
            </Text>
          </>
        );
      default:
        return null;
    }
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isVideoOn ? DARK_BG : LIGHT_BG },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.statusRow}>
          {!isMicOn && (
            <View style={[styles.statusChip, { backgroundColor: RED }]}>
              <Icon name="microphone-off" size={20} color="white" />
              <Text style={styles.statusText}>Muted</Text>
            </View>
          )}
          {!isVideoOn && (
            <View
              style={[
                styles.statusChip,
                { backgroundColor: RED, marginLeft: 6 },
              ]}
            >
              <Icon name="video-off" size={20} color="white" />
              <Text style={styles.statusText}>Video Off</Text>
            </View>
          )}
        </View>
        <View style={styles.topRightPill}>
          <Text style={styles.topRightPillText}>
            {isVideoOn ? 'Video Call' : 'Audio Call'}
          </Text>
        </View>
      </View>
      <View style={styles.topPillContainer}>
        <View style={styles.topPillTimer}>
          <Text style={styles.timer}>{formatTime(seconds)}</Text>
          <Text style={styles.earning}>Earning ₹{totalPrice}</Text>
        </View>
      </View>
      <View style={styles.centerMain}>{renderContent()}</View>
      <View style={styles.controlsRow}>
        <TouchableOpacity
          onPress={() => setMicOn(m => !m)}
          style={[
            styles.controlBtnMute,
            isMicOn && { backgroundColor: 'lightgrey' },
          ]}
        >
          <Icon
            name={isMicOn ? 'microphone' : 'microphone-off'}
            size={28}
            color="#fff"
          />
        </TouchableOpacity>
        {/* Switch between Video/Audio */}
        <TouchableOpacity
          onPress={() => setVideoOn(v => !v)}
          style={[styles.controlBtn, !isVideoOn && { backgroundColor: RED }]}
        >
          <Icon
            name={isVideoOn ? 'video' : 'video-off'}
            size={28}
            color="#fff"
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMuted(m => !m)}
          style={[styles.controlBtnMute, isMuted && { backgroundColor: GRAY }]}
        >
          <Icon
            name={isMuted ? 'volume-off' : 'volume-high'}
            size={28}
            color="#fff"
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            /* hang up function */
          }}
          style={[styles.controlBtn, { backgroundColor: RED }]}
        >
          <Icon name="phone-hangup" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusChip: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
  },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  topRightPill: {
    position: 'absolute',
    right: 14,
    top: -4,
    backgroundColor: '#ff8a2b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    elevation: 5,
  },
  topRightPillText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  topPillContainer: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  topPillTimer: {
    minWidth: 150,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  centerMain: { alignItems: 'center', marginTop: 30, marginBottom: 60 },
  timer: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
  earning: { color: '#13df7d', fontSize: 18, marginTop: 2 },
  userBubble: {
    borderRadius: 40,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  FrameuserBubble: {
    backgroundColor: LIGHT_BG,
    borderWidth: 1,
    borderColor: '#ffa94d',
    borderRadius: 10,
    width: 110,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    left: 130,
    bottom: 100,
    zIndex: 20,
  },
  userInitials: { color: '#fff', fontWeight: 'bold', fontSize: 28 },
  userName: { marginTop: 8, fontSize: 21, color: '#fff', fontWeight: 'bold' },
  callStatus: { color: GRAY, fontSize: 16, marginTop: 2 },
  bigLetterCircle: {
    backgroundColor: '#ffd054',
    width: 120,
    height: 120,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  bigLetter: { color: '#721803', fontSize: 49, fontWeight: 'bold' },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '84%',
    marginBottom: 40,
  },
  controlBtn: {
    backgroundColor: GRAY,
    borderRadius: 32,
    padding: 17,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnMute: {
    backgroundColor: BHAGWA,
    borderRadius: 32,
    padding: 17,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VideoAudioCall;
