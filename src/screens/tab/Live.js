import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
  Pressable,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  ScrollView,
  PermissionsAndroid, // ✅ ADD THIS
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
} from 'react-native-agora';
import livestreamService from '../../services/api/LivestreamService';
import { streamSocketService } from '../../services/api/socket/streamSocketService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';


const { width, height } = Dimensions.get('window');
const AGORA_APP_ID = '203397a168f8469bb8e672cd15eb3eb6';


const LiveStreamScreen = ({ navigation }) => {
  const { user: authUser, isAuthenticated, fetchUserProfile } = useAuth();
  
  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('User');
  const [userInitialized, setUserInitialized] = useState(false);
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [activeGifts, setActiveGifts] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState(new Map());
  const [hostAgoraUid, setHostAgoraUid] = useState(null);
  const [hasRequestedCall, setHasRequestedCall] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callData, setCallData] = useState(null);
  const [waitingForCall, setWaitingForCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false); // ✅ ADD THIS

  // From navigation params or API response
const [streamData, setStreamData] = useState({
  agoraChannelName: null,
  agoraToken: null,
  agoraUid: null,
  hostAgoraUid: null,
});


  // Refs
  const engineRef = useRef(null);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const giftAnimValue = useRef(new Animated.Value(0)).current;


  // ==================== 🆕 ANDROID PERMISSIONS ====================
  
  /**
   * Request camera and microphone permissions for Android
   * This is CRITICAL for video/audio calls to work
   */
  const requestCameraAndAudioPermission = async () => {
    if (Platform.OS !== 'android') {
      setPermissionsGranted(true);
      return true;
    }

    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);

      const cameraGranted = granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED;
      const audioGranted = granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED;

      if (cameraGranted && audioGranted) {
        console.log('✅ Camera and Microphone permissions granted');
        setPermissionsGranted(true);
        return true;
      } else {
        console.log('❌ Camera/Microphone permissions denied');
        Alert.alert(
          'Permissions Required',
          'Camera and Microphone access is required for video calls. Please enable them in Settings.',
          [{ text: 'OK' }]
        );
        setPermissionsGranted(false);
        return false;
      }
    } catch (err) {
      console.warn('Permission request error:', err);
      setPermissionsGranted(false);
      return false;
    }
  };


  // ==================== INITIALIZATION ====================


  useEffect(() => {
    initializeUser();
    return () => cleanup();
  }, []);


  useEffect(() => {
    if (userInitialized && userId) {
      // ✅ Request permissions before fetching streams
      requestCameraAndAudioPermission().then((granted) => {
        if (granted) {
          fetchLiveStreams();
        } else {
          Alert.alert('Error', 'Permissions required to watch livestreams');
          navigation.goBack();
        }
      });
    }
  }, [userInitialized, userId]);  


  const initializeUser = async () => {
    try {
      let id = authUser?._id;
      let name = authUser?.name || 'User';
      
      if (!id && isAuthenticated) {
        const profile = await fetchUserProfile();
        if (profile) {
          id = profile._id || profile.id;
          name = profile.name || 'User';
        }
      }
      
      if (!id) {
        const userString = await AsyncStorage.getItem('user');
        if (userString) {
          const storedUser = JSON.parse(userString);
          id = storedUser._id || storedUser.id;
          name = storedUser.name || 'User';
        }
      }
      
      if (!id) {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          id = payload._id || payload.userId || payload.sub || payload.id;
          name = payload.name || payload.userName || name;
        }
      }
      
      if (!id) {
        Alert.alert('Login Required', 'Please login to watch livestreams', [
          { text: 'Go to Login', onPress: () => navigation.navigate('Login') },
          { text: 'Cancel', onPress: () => navigation.goBack(), style: 'cancel' },
        ]);
        return;
      }
      
      await AsyncStorage.setItem('userId', id);
      await AsyncStorage.setItem('userName', name);
      setUserId(id);
      setUserName(name);
      setUserInitialized(true);
    } catch (error) {
      console.error('Init user error:', error);
      Alert.alert('Error', 'Failed to initialize user');
      navigation.goBack();
    }
  };


  // ==================== FETCH STREAMS ====================


  const fetchLiveStreams = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await livestreamService.getLiveStreams({ page: 1, limit: 10 });
      
      if (response.success && response.data.length > 0) {
        setStreams(response.data);
        joinStream(response.data[0], 0);
      } else {
        Alert.alert('No Live Streams', 'No astrologers are live right now');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Fetch streams error:', error);
      Alert.alert('Error', 'Failed to load live streams');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };


  // ==================== JOIN/LEAVE STREAM ====================


  const joinStream = async (stream, index) => {
  if (!userId) return;

  try {
    if (streams[currentIndex] && currentIndex !== index) {
      await leaveCurrentStream();
    }

    console.log('====================================');
    console.log('📡 JOINING STREAM');
    console.log('Stream ID:', stream.streamId);
    console.log('Stream Title:', stream.title);
    console.log('Host:', stream.hostId?.name);
    console.log('====================================');

    const joinResponse = await livestreamService.joinStream(stream.streamId);
    
    console.log('====================================');
    console.log('✅ JOIN STREAM API RESPONSE');
    console.log('Response:', JSON.stringify(joinResponse, null, 2));
    console.log('====================================');

    if (joinResponse.success) {
      // ✅ CRITICAL: Extract host UID from multiple sources
      const hostUid = joinResponse.data.hostAgoraUid || 
                      joinResponse.data.hostUid || 
                      stream.hostAgoraUid || 
                      stream.hostId?.agoraUid ||
                      stream.agoraUid ||
                      0;
      
      console.log('====================================');
      console.log('🎯 HOST UID RESOLUTION');
      console.log('From joinResponse.data.hostAgoraUid:', joinResponse.data.hostAgoraUid);
      console.log('From joinResponse.data.hostUid:', joinResponse.data.hostUid);
      console.log('From stream.hostAgoraUid:', stream.hostAgoraUid);
      console.log('From stream.hostId?.agoraUid:', stream.hostId?.agoraUid);
      console.log('From stream.agoraUid:', stream.agoraUid);
      console.log('✅ Final hostUid:', hostUid);
      console.log('====================================');
      
      // ✅ Set host UID BEFORE initializing Agora
      setHostAgoraUid(hostUid);

      // ✅ Check for ongoing call
      if (joinResponse.data.streamInfo?.currentCall) {
        console.log('📞 Stream has active call:', joinResponse.data.streamInfo.currentCall);
        setCurrentCall(joinResponse.data.streamInfo.currentCall);
      }

      // ✅ Initialize Agora with proper parameters
      await initializeAgora(
        joinResponse.data.agoraChannelName,
        joinResponse.data.agoraToken,
        joinResponse.data.agoraUid
      );

      // ✅ Connect socket
      await connectSocket(stream.streamId);
      
      // ✅ Update current index
      setCurrentIndex(index);
      
      console.log('✅ Stream join complete');
    }
  } catch (error) {
    console.error('❌ Join stream error:', error);
    Alert.alert('Error', 'Failed to join stream: ' + (error.response?.data?.message || error.message));
  }
};



  const leaveCurrentStream = async () => {
    try {
      const currentStream = streams[currentIndex];
      if (currentStream) {
        await livestreamService.leaveStream(currentStream.streamId);
        
        if (streamSocketService.socket) {
          streamSocketService.socket.emit('leave_stream', { 
            streamId: currentStream.streamId, 
            userId 
          });
        }
        
        if (engineRef.current && isJoined) {
          await engineRef.current.leaveChannel();
        }


        setIsJoined(false);
        setChatMessages([]);
        setCurrentCall(null);
      }
    } catch (error) {
      console.error('Leave stream error:', error);
    }
  };


  // ==================== 🔧 FIXED AGORA INITIALIZATION ====================


// ==================== 🔧 FIXED AGORA INITIALIZATION ====================

const initializeAgora = async (channelName, token, uid) => {
  try {
    console.log('====================================');
    console.log('🎥 VIEWER: Initializing Agora...');
    console.log('App ID:', AGORA_APP_ID);
    console.log('Channel:', channelName);
    console.log('Token:', token?.substring(0, 20) + '...');
    console.log('My UID:', uid);
    console.log('Host UID:', hostAgoraUid);
    console.log('====================================');
    
    // ✅ Create engine
    const engine = createAgoraRtcEngine();
    engineRef.current = engine;

    // ✅ STEP 1: Initialize with proper config
    engine.initialize({
      appId: AGORA_APP_ID,
      channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
    });

    // ✅ STEP 2: Register event handlers FIRST
    engine.registerEventHandler({
      onJoinChannelSuccess: (connection, elapsed) => {
        console.log('====================================');
        console.log('✅ VIEWER JOINED CHANNEL');
        console.log('Connection:', connection);
        console.log('Elapsed:', elapsed);
        console.log('====================================');
        setIsJoined(true);
      },
      
      onUserJoined: (connection, remoteUid) => {
        console.log('====================================');
        console.log('👤 REMOTE USER JOINED (HOST OR CALLER)');
        console.log('Remote UID:', remoteUid);
        console.log('Expected Host UID:', hostAgoraUid);
        console.log('====================================');
        
        setRemoteUsers(prev => {
          const newMap = new Map(prev);
          newMap.set(remoteUid, { uid: remoteUid });
          console.log('📝 Remote users:', Array.from(newMap.keys()));
          return newMap;
        });
        
        // ✅ If we don't have host UID yet, assume this is the host
        if (!hostAgoraUid || hostAgoraUid === 0) {
          console.log('✅ Setting host UID to:', remoteUid);
          setHostAgoraUid(remoteUid);
        }
      },
      
      onUserOffline: (connection, remoteUid, reason) => {
        console.log('👋 Remote user left:', remoteUid);
        setRemoteUsers(prev => {
          const newMap = new Map(prev);
          newMap.delete(remoteUid);
          return newMap;
        });
      },
      
      onRemoteVideoStateChanged: (connection, remoteUid, state, reason, elapsed) => {
        console.log('====================================');
        console.log('📹 REMOTE VIDEO STATE CHANGED');
        console.log('Remote UID:', remoteUid);
        console.log('State:', state); // 0=stopped, 1=frozen, 2=decoding
        console.log('Reason:', reason);
        console.log('====================================');
      },
      
      onError: (err, msg) => {
        console.error('❌ Agora error:', err, msg);
      },
      
      onLeaveChannel: (connection, stats) => {
        console.log('📤 Left channel:', stats);
        setIsJoined(false);
      },
    });

    // ✅ STEP 3: Enable video and audio
    await engine.enableVideo();
    await engine.enableAudio();
    console.log('✅ Video/Audio enabled');
    
    // ✅ STEP 4: Set AUDIENCE role (viewers don't broadcast)
    await engine.setClientRole(ClientRoleType.ClientRoleAudience);
    console.log('✅ Set role to AUDIENCE');

    // ✅ STEP 5: Join channel with proper options
    await engine.joinChannel(token, channelName, uid, {
      clientRoleType: ClientRoleType.ClientRoleAudience,
      autoSubscribeAudio: true,
      autoSubscribeVideo: true,
    });

    console.log('✅ Viewer Agora initialization complete');
    
  } catch (error) {
    console.error('❌ Agora init error:', error);
    Alert.alert('Error', 'Failed to initialize video: ' + error.message);
  }
};





  // ==================== SOCKET ====================


  const connectSocket = async (streamId) => {
  if (!userId) return;
  
  try {
    console.log('🔌 Viewer connecting socket:', { streamId, userId, userName });

    await streamSocketService.connect(streamId, userId, userName, false);
    
    console.log('✅ Socket connected');

    // ✅ Existing listeners
    streamSocketService.onNewComment(handleNewComment);
    streamSocketService.onNewLike(handleNewLike);
    streamSocketService.onNewGift(handleNewGift);
    streamSocketService.onViewerJoined(handleViewerJoined);
    streamSocketService.onViewerCountUpdated(handleViewerCountUpdate);
    
    // ✅ FIX ISSUE: Listen for call_accepted (THIS IS THE KEY!)
    streamSocketService.onCallAccepted((data) => {
      console.log('====================================');
      console.log('📞 VIEWER: call_accepted EVENT RECEIVED');
      console.log('Data:', JSON.stringify(data, null, 2));
      console.log('My User ID:', userId);
      console.log('Accepted User ID:', data.userId);
      console.log('====================================');
      
      // Check if this call acceptance is for ME
      if (String(data.userId) === String(userId)) {
        console.log('✅ MY CALL WAS ACCEPTED!');
        handleCallStarted(data);
      } else {
        console.log('ℹ️ Another viewer\'s call was accepted');
        setCurrentCall({
          userId: data.userId,
          userName: data.userName,
          callType: data.callType,
          callMode: data.callMode,
          callerAgoraUid: data.callerAgoraUid,
        });
      }
    });
    
    // ✅ FIX: Listen for call_rejected
    streamSocketService.onCallRejected((data) => {
      console.log('====================================');
      console.log('❌ VIEWER: call_rejected EVENT RECEIVED');
      console.log('Data:', JSON.stringify(data, null, 2));
      console.log('====================================');
      
      if (String(data.userId) === String(userId)) {
        console.log('❌ MY CALL WAS REJECTED');
        
        setCallAccepted(false);
        setCallData(null);
        setWaitingForCall(false);
        setHasRequestedCall(false);
        
        Alert.alert('Call Rejected', 'The astrologer rejected your call request');
      }
    });
    
    // ✅ Listen for call_ended (for call end sync)
streamSocketService.onCallEnded((data) => {
  console.log('====================================');
  console.log('📞 VIEWER: call_ended EVENT RECEIVED');
  console.log('Data:', JSON.stringify(data, null, 2));
  console.log('====================================');
  
  // ✅ Clear BOTH call states
  setCurrentCall(null);
  setCallData(null);
  setCallAccepted(false);
  setHasRequestedCall(false);
  setWaitingForCall(false);
  
  // If I was on the call, downgrade
  if (callAccepted) {
    console.log('🔄 I was on call - performing cleanup');
    leaveCall();
  }
  
  console.log('✅ All call state cleared from socket event');
});
    
    // ✅ Keep existing call_started listener for backward compatibility
    streamSocketService.onCallStarted((data) => {
      console.log('📞 CALL STARTED (legacy):', data);
      setCurrentCall({
        userId: data.userId,
        userName: data.userName,
        callType: data.callType,
        callMode: data.callMode,
        callerAgoraUid: data.callerAgoraUid,
      });
      
      if (String(data.userId) === String(userId)) {
        handleCallStarted(data);
      }
    });
    
    // ✅ Keep call_finished for call end
    streamSocketService.onCallFinished((data) => {
      console.log('📞 CALL FINISHED:', data);
      setCurrentCall(null);
      if (callAccepted && callData) leaveCall();
    });
    
    streamSocketService.onCallRequestRejected((data) => {
      console.log('❌ CALL REJECTED (legacy):', data);
      if (String(data.userId) === String(userId)) {
        setWaitingForCall(false);
        setHasRequestedCall(false);
        setCallAccepted(false);
        setCallData(null);
        Alert.alert('Call Rejected', data.reason || 'The astrologer declined your request');
      }
    });

    streamSocketService.on('stream_ended', (data) => {
      Alert.alert('Stream Ended', `The livestream has ended: ${data.reason}`, [
        { text: 'OK', onPress: () => { cleanup(); navigation.goBack(); }}
      ]);
    });

    console.log('✅ All listeners registered');
  } catch (error) {
    console.error('❌ Socket connection error:', error);
  }
};




  // ==================== 🔧 FIXED CALL HANDLING ====================


  const handleCallRequest = async () => {
    // ✅ Check permissions first
    if (!permissionsGranted) {
      const granted = await requestCameraAndAudioPermission();
      if (!granted) {
        Alert.alert('Permissions Required', 'Camera and microphone access required for calls');
        return;
      }
    }

    try {
      setWaitingForCall(true);
      setHasRequestedCall(true);
      
      const response = await livestreamService.requestCall(streams[currentIndex].streamId, {
        callType: 'video',
        callMode: 'public',
      });
      
      if (response.success) {
        Alert.alert('Call Requested', 'Waiting for astrologer to accept...');
      }
    } catch (error) {
      console.error('Request call error:', error);
      setWaitingForCall(false);
      setHasRequestedCall(false);
      Alert.alert('Error', error.response?.data?.message || 'Failed to request call');
    }
  };


  const handleCallStarted = async (data) => {
  console.log('====================================');
  console.log('📞 PROCESSING CALL START');
  console.log('Event Data:', JSON.stringify(data, null, 2));
  console.log('====================================');
  
  const isForMe = String(data.userId) === String(userId);
  const hasCredentials = !!data.token || !!data.channelName;
  
  console.log('🔍 Is for me:', isForMe);
  console.log('🔍 Has credentials:', hasCredentials);
  console.log('🔍 Already in call:', callAccepted);
  
  if (!isForMe) {
    console.log('ℹ️ Call is not for me, ignoring');
    return;
  }
  
  if (callAccepted) {
    console.log('⚠️ Already in call, ignoring duplicate event');
    return;
  }
  
  console.log('✅ Processing MY call...');
  
  try {
    // Mark as accepted immediately
    setCallAccepted(true);
    setWaitingForCall(false);
    setHasRequestedCall(false);
    
    console.log('====================================');
    console.log('🎥 UPGRADING TO BROADCASTER');
    console.log('====================================');
    
    // ✅ Step 1: Set client role to BROADCASTER
    await engineRef.current.setClientRole(ClientRoleType.ClientRoleBroadcaster);
    console.log('✅ Role set to BROADCASTER');
    
    // ✅ Step 2: Enable LOCAL video and audio
    await engineRef.current.enableLocalVideo(true);
    await engineRef.current.enableLocalAudio(true);
    console.log('✅ Local video/audio enabled');
    
    // ✅ Step 3: Start preview
    await engineRef.current.startPreview();
    console.log('✅ Preview started');
    
    // ✅ Step 4: Force unmute to publish streams
    await engineRef.current.muteLocalVideoStream(false);
    await engineRef.current.muteLocalAudioStream(false);
    console.log('✅ Streams unmuted and publishing');
    
    // ✅ Step 5: Update state
    setCallData({
      callType: data.callType,
      callMode: data.callMode,
      callerAgoraUid: data.callerAgoraUid || data.uid,
    });
    
    console.log('====================================');
    console.log('✅✅✅ BROADCASTER UPGRADE COMPLETE');
    console.log('Now publishing video to all viewers!');
    console.log('====================================');
    
    Alert.alert('Call Started', 'You are now live!');
    
  } catch (error) {
    console.error('❌ Error upgrading to broadcaster:', error);
    setCallAccepted(false);
    setWaitingForCall(false);
    Alert.alert('Error', 'Failed to join call: ' + error.message);
  }
};



  /**
   * ✅ FIXED: Properly enable camera and microphone when joining call
   */
  const joinCallAsViewer = async (callData) => {
  try {
    console.log('====================================');
    console.log('📞 JOINING CALL AS BROADCASTER');
    console.log('Call Data:', callData);
    console.log('====================================');
    
    // ✅ DO NOT LEAVE - Just upgrade role
    console.log('🎤 Upgrading to BROADCASTER role...');
    await engineRef.current.setClientRole(ClientRoleType.ClientRoleBroadcaster);
    
    console.log('🎥 Enabling video and audio...');
    await engineRef.current.enableVideo();
    await engineRef.current.enableAudio();
    
    console.log('📹 Starting camera preview...');
    await engineRef.current.startPreview();
    
    console.log('✅ Successfully upgraded to broadcaster');
    
    setCallData(callData);
    setCallAccepted(true);
    
  } catch (error) {
    console.error('❌ Join call error:', error);
    throw error;
  }
};

const leaveCall = async () => {
  try {
    console.log('====================================');
    console.log('📴 LEAVING CALL - COMPLETE CLEANUP');
    console.log('Clearing callData:', callData);
    console.log('Clearing currentCall:', currentCall);
    console.log('====================================');
    
    // ✅ CRITICAL: Clear BOTH call states
    setCallAccepted(false);
    setCallData(null);           // ✅ My call data
    setCurrentCall(null);         // ✅ OTHER people's call data
    setHasRequestedCall(false);
    setWaitingForCall(false);
    setIsMuted(false);
    setIsCameraOff(false);
    
    console.log('✅ Both callData and currentCall cleared');
    
    // Small delay for state to propagate
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Then cleanup Agora
    if (engineRef.current) {
      try {
        await engineRef.current.stopPreview();
        console.log('✅ Preview stopped');
      } catch (e) {
        console.warn('Preview stop error:', e);
      }
      
      try {
        await engineRef.current.muteLocalVideoStream(true);
        await engineRef.current.muteLocalAudioStream(true);
        await engineRef.current.enableLocalVideo(false);
        await engineRef.current.enableLocalAudio(false);
        console.log('✅ Local streams disabled');
      } catch (e) {
        console.warn('Disable streams error:', e);
      }
      
      try {
        await engineRef.current.setClientRole(ClientRoleType.ClientRoleAudience);
        console.log('✅ Downgraded to AUDIENCE');
      } catch (e) {
        console.warn('Role change error:', e);
      }
    }
    
    console.log('✅ Call cleanup complete - back to viewing mode');
    console.log('====================================');
    
  } catch (error) {
    console.error('❌ Leave call error:', error);
  }
};



  // ✅ FIX ISSUE 2 & 3: Comprehensive call end handler
const handleCallEnd = async () => {
  console.log('====================================');
  console.log('🧹 HANDLING CALL END - CLEANUP');
  console.log('Was I on call?', callAccepted);
  console.log('Was watching call?', currentCall);
  console.log('====================================');
  
  try {
    // ✅ If I was on the call, downgrade back to audience
    if (callAccepted && engineRef.current) {
      console.log('📉 Downgrading from broadcaster to audience');
      
      // Stop local video
      await engineRef.current.muteLocalVideoStream(true);
      await engineRef.current.muteLocalAudioStream(true);
      await engineRef.current.enableLocalVideo(false);
      await engineRef.current.enableLocalAudio(false);
      
      // Switch back to audience
      await engineRef.current.setClientRole(ClientRoleType.ClientRoleAudience);
      
      console.log('✅ Downgraded to audience');
    }
    
    // ✅ Clear ALL call-related state
    setCallAccepted(false);
    setCallData(null);
    setCallRequestSent(false);
    setCurrentCall(null);
    setShowCallModal(false);
    
    console.log('✅ Call state cleared');
    
    // ✅ Force re-render to update UI
    setTimeout(() => {
      console.log('🔄 State after cleanup:', {
        callAccepted,
        callRequestSent,
        currentCall,
        callData,
      });
    }, 100);
    
  } catch (error) {
    console.error('❌ Call end cleanup error:', error);
  }
};

// ✅ FIX ISSUE 1: Upgrade viewer to broadcaster when call accepted
const upgradeToHost = async (myAgoraUid) => {
  try {
    console.log('====================================');
    console.log('⬆️ UPGRADING TO BROADCASTER');
    console.log('My Agora UID:', myAgoraUid);
    console.log('====================================');
    
    if (!engineRef.current) {
      console.error('❌ Engine not initialized');
      return;
    }
    
    // ✅ STEP 1: Enable local video/audio
    await engineRef.current.enableLocalVideo(true);
    await engineRef.current.enableLocalAudio(true);
    console.log('✅ Local video/audio enabled');
    
    // ✅ STEP 2: Unmute streams
    await engineRef.current.muteLocalVideoStream(false);
    await engineRef.current.muteLocalAudioStream(false);
    console.log('✅ Streams unmuted');
    
    // ✅ STEP 3: Set broadcaster role
    await engineRef.current.setClientRole(ClientRoleType.ClientRoleBroadcaster);
    console.log('✅ Role set to BROADCASTER');
    
    // ✅ STEP 4: Start preview (critical for showing own video)
    await engineRef.current.startPreview();
    console.log('✅ Preview started');
    
    console.log('====================================');
    console.log('✅ UPGRADE COMPLETE - YOU ARE NOW BROADCASTER');
    console.log('====================================');
    
  } catch (error) {
    console.error('❌ Upgrade to broadcaster error:', error);
    Alert.alert('Error', 'Failed to enable video: ' + error.message);
  }
};

const handleEndMyCall = () => {
  Alert.alert(
    'End Call',
    'Are you sure you want to end this call?',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'End Call', 
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('====================================');
            console.log('📞 USER ENDING CALL');
            console.log('Stream ID:', currentStream?.streamId);
            console.log('====================================');
            
            // ✅ Method 1: Try dedicated end-user-call endpoint (if exists)
            try {
              if (livestreamService.endUserCall) {
                await livestreamService.endUserCall(currentStream.streamId);
                console.log('✅ Call ended via endUserCall');
              } else {
                // ✅ Method 2: Fall back to cancel call
                await livestreamService.cancelCallRequest(currentStream.streamId);
                console.log('✅ Call cancelled via cancelCallRequest');
              }
            } catch (apiError) {
              console.warn('⚠️ API call failed:', apiError.message);
              // Continue to local cleanup even if API fails
            }
            
            // ✅ Always perform local cleanup
            console.log('🧹 Performing local cleanup...');
            await leaveCall();
            
            console.log('✅ Successfully left call');
            
          } catch (error) {
            console.error('❌ End call error:', error);
            
            // ✅ Force cleanup even on error
            try {
              await leaveCall();
            } catch (cleanupError) {
              console.error('❌ Cleanup error:', cleanupError);
            }
            
            Alert.alert('Call Ended', 'You have been disconnected from the call');
          }
        }
      }
    ]
  );
};



  const cancelCallRequest = async () => {
    try {
      console.log('🔴 Canceling call request...');
      
      try {
        await livestreamService.cancelCallRequest(streams[currentIndex].streamId);
        console.log('✅ Call request cancelled via API');
      } catch (error) {
        console.warn('⚠️ API cancel failed (might be already accepted):', error.message);
      }


      setWaitingForCall(false);
      setHasRequestedCall(false);
      
      if (callAccepted && callData) {
        await leaveCall();
      }


      Alert.alert('Success', 'Call request cancelled');
    } catch (error) {
      console.error('❌ Cancel error:', error);
      Alert.alert('Error', 'Failed to cancel request');
    }
  };


  // ==================== ✅ FIXED MUTE/CAMERA CONTROLS ====================


  const toggleMute = () => {
    if (!engineRef.current) return;
    
    const newMuteState = !isMuted;
    engineRef.current.muteLocalAudioStream(newMuteState);
    setIsMuted(newMuteState);
    console.log(newMuteState ? '🔇 Muted' : '🔊 Unmuted');
  };


  const toggleCamera = () => {
    if (!engineRef.current || callData?.callType !== 'video') return;
    
    const newCameraState = !isCameraOff;
    engineRef.current.muteLocalVideoStream(newCameraState);
    setIsCameraOff(newCameraState);
    console.log(newCameraState ? '📷 Camera off' : '📹 Camera on');
  };


  // ==================== EVENT HANDLERS ====================


  const handleNewComment = (data) => {
    setChatMessages(prev => [...prev, {
      id: Date.now().toString() + Math.random(),
      type: 'comment',
      userName: data.userName,
      message: data.comment,
      timestamp: data.timestamp,
    }]);
  };


  const handleNewLike = (data) => {
    setChatMessages(prev => [...prev, {
      id: Date.now().toString() + Math.random(),
      type: 'like',
      userName: data.userName,
      timestamp: data.timestamp,
    }]);
  };


  const handleNewGift = (data) => {
    setChatMessages(prev => [...prev, {
      id: Date.now().toString() + Math.random(),
      type: 'gift',
      userName: data.userName,
      giftName: data.giftName,
      amount: data.amount,
      timestamp: data.timestamp,
    }]);
    showGiftAnimation(data);
  };


  const handleViewerJoined = (data) => {
    setChatMessages(prev => [...prev, {
      id: Date.now().toString() + Math.random(),
      type: 'join',
      userName: data.userName,
      timestamp: data.timestamp,
    }]);
  };


  const handleViewerCountUpdate = (data) => {
    setStreams(prev => prev.map((s, i) => 
      i === currentIndex ? { ...s, viewerCount: data.count } : s
    ));
  };


  const showGiftAnimation = (giftData) => {
    const giftId = Date.now().toString() + Math.random();
    setActiveGifts(prev => [...prev, { ...giftData, id: giftId }]);


    Animated.sequence([
      Animated.timing(giftAnimValue, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(giftAnimValue, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => setActiveGifts(prev => prev.filter(g => g.id !== giftId)));
  };


  // ==================== INTERACTIONS ====================


  const handleSendMessage = () => {
    if (!message.trim()) return;
    streamSocketService.sendComment(streams[currentIndex].streamId, userId, userName, null, message.trim());
    setMessage('');
  };


  const handleSendGift = async (giftType, giftName, amount) => {
    try {
      await livestreamService.sendGift(streams[currentIndex].streamId, { giftType, amount });
      streamSocketService.sendGift(streams[currentIndex].streamId, userId, userName, null, giftType, giftName, amount);
      Alert.alert('Gift Sent!', `You sent ${giftName} (₹${amount})`);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send gift');
    }
  };


  const handleLike = () => {
    streamSocketService.sendLike(streams[currentIndex].streamId, userId, userName);
  };


  const handleToggleFollow = async () => {
    try {
      const response = await livestreamService.toggleFollow(streams[currentIndex].streamId);
      setIsFollowing(response.isFollowing);
      Alert.alert('Success', response.isFollowing ? 'Now following!' : 'Unfollowed');
    } catch (error) {
      console.error('Follow error:', error);
    }
  };


  // ==================== CLEANUP ====================


  const cleanup = async () => {
  try {
    console.log('🧹 Starting cleanup...');
    
    await leaveCurrentStream();
    streamSocketService.disconnect();
    
    if (engineRef.current) {
      try {
        // ✅ Stop preview if active
        await engineRef.current.stopPreview();
      } catch (e) {
        console.warn('Preview stop error:', e);
      }
      
      try {
        // ✅ Disable video/audio
        await engineRef.current.disableVideo();
        await engineRef.current.disableAudio();
      } catch (e) {
        console.warn('Disable error:', e);
      }
      
      try {
        // ✅ Release engine
        engineRef.current.release();
      } catch (e) {
        console.warn('Release error:', e);
      }
      
      engineRef.current = null;
    }
    
    console.log('✅ Cleanup complete');
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
};



  // ==================== NAVIGATION ====================


  const handleSwitchStream = (stream, index) => {
    joinStream(stream, index);
    setLeaveModalVisible(false);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };


  const handleLeave = async () => {
    await leaveCurrentStream();
    setLeaveModalVisible(false);
    navigation.goBack();
  };


  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / height);
    if (index !== currentIndex && index >= 0 && index < streams.length) {
      joinStream(streams[index], index);
    }
  };


  const handleOpenChat = () => {
    setChatOpen(true);
    setTimeout(() => inputRef.current?.focus(), 200);
  };


  // ==================== RENDER ====================


  if (loading || streams.length === 0) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#f6b900" />
        <Text style={styles.loadingText}>Loading live streams...</Text>
      </View>
    );
  }


  const currentStream = streams[currentIndex];


  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={streams}
        keyExtractor={(item) => item._id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        renderItem={({ item, index }) => (
          <View style={styles.streamContainer}>
{/* ✅ FIXED VIDEO RENDERING */}
{index === currentIndex ? (
  isJoined ? (
    // ✅ Check if I'm on a call (callAccepted AND callData exist)
    callAccepted && callData ? (
      // ✅ I'm on a video call - show split screen
      callData.callType === 'video' ? (
        <View style={styles.splitScreenContainer}>
          {/* Host Video - Top */}
          <View style={styles.remoteVideoHalf}>
            <RtcSurfaceView 
              style={styles.halfVideo} 
              canvas={{ uid: hostAgoraUid || Array.from(remoteUsers.keys())[0] }}
              renderMode={1}
              zOrderMediaOverlay={false}
            />
            <View style={styles.videoNameTag}>
              <Text style={styles.videoNameText}>{item.hostId?.name} (Host)</Text>
            </View>
          </View>
          
          {/* MY Video - Bottom */}
          <View style={styles.localVideoHalf}>
            <RtcSurfaceView 
              style={styles.halfVideo} 
              canvas={{ uid: 0 }}
              zOrderMediaOverlay={true}
              renderMode={1}
            />
            <View style={styles.videoNameTag}>
              <Text style={styles.videoNameText}>You</Text>
            </View>
          </View>
        </View>
      ) : (
        // Voice call - just show host
        <RtcSurfaceView 
          style={styles.video} 
          canvas={{ uid: hostAgoraUid || Array.from(remoteUsers.keys())[0] }}
          renderMode={1}
        />
      )
    ) : currentCall && currentCall.callType === 'video' ? (
      // ✅ Watching someone else's call
      <View style={styles.splitScreenContainer}>
        {/* Host Video */}
        <View style={styles.remoteVideoHalf}>
          <RtcSurfaceView 
            style={styles.halfVideo} 
            canvas={{ uid: hostAgoraUid || Array.from(remoteUsers.keys())[0] }}
            renderMode={1}
          />
          <View style={styles.videoNameTag}>
            <Text style={styles.videoNameText}>{item.hostId?.name}</Text>
          </View>
        </View>
        
        {/* Other Caller Video */}
        <View style={styles.localVideoHalf}>
          {currentCall.callerAgoraUid && remoteUsers.has(currentCall.callerAgoraUid) ? (
            <>
              <RtcSurfaceView 
                style={styles.halfVideo} 
                canvas={{ uid: currentCall.callerAgoraUid }}
                zOrderMediaOverlay={true}
                renderMode={1}
              />
              <View style={styles.videoNameTag}>
                <Text style={styles.videoNameText}>{currentCall.userName}</Text>
              </View>
            </>
          ) : (
            <View style={styles.videoPlaceholder}>
              <ActivityIndicator size="large" color="#f6b900" />
              <Text style={styles.videoText}>Caller joining...</Text>
            </View>
          )}
        </View>
      </View>
    ) : (
      // ✅ Normal viewing - full screen host
      <RtcSurfaceView 
        style={styles.video} 
        canvas={{ uid: hostAgoraUid || Array.from(remoteUsers.keys())[0] }}
        renderMode={1}
        zOrderMediaOverlay={false}
      />
    )
  ) : (
    <View style={styles.videoPlaceholder}>
      <ActivityIndicator size="large" color="#f6b900" />
      <Text style={styles.videoText}>Connecting...</Text>
    </View>
  )
) : (
  // Not current slide
  <View style={styles.videoPlaceholder}>
    <Image 
      source={{ uri: item.hostId?.profilePicture }} 
      style={{ width: 100, height: 100, borderRadius: 50, opacity: 0.5 }}
    />
  </View>
)}

          </View>
        )}
      />


      {/* Overlay UI */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.leftProfile}>
            <Image source={{ uri: currentStream?.hostId?.profilePicture || 'https://via.placeholder.com/40' }} style={styles.avatar} />
            <Text style={styles.name}>{currentStream?.hostId?.name}</Text>
          </View>
          <TouchableOpacity style={styles.followBtn} onPress={handleToggleFollow}>
            <Text style={styles.followText}>{isFollowing ? 'Following' : 'Follow'}</Text>
          </TouchableOpacity>
          <View style={styles.viewerBox}>
            <Image source={require('../../assets/view.png')} style={styles.closeIcon} />
            <Text style={styles.viewerText}>{currentStream?.viewerCount || 0}</Text>
          </View>
          <TouchableOpacity><Image source={require('../../assets/share.png')} style={styles.closeIcon} /></TouchableOpacity>
          <TouchableOpacity onPress={() => setLeaveModalVisible(true)}><Image source={require('../../assets/cross.png')} style={styles.closeIcon} /></TouchableOpacity>
        </View>


        {/* ✅ FIXED: Call Controls */}
        {callAccepted && callData && (
<View style={styles.myCallControls}>
    <View style={styles.myCallInfo}>
      <Icon name="call" size={16} color="#10b981" />
      <Text style={styles.myCallText}>
        You're on a {callData?.callType} call
      </Text>
    </View>
    <TouchableOpacity 
      style={styles.endMyCallButton}
      onPress={handleEndMyCall}
    >
      <Icon name="call-end" size={20} color="#fff" />
      <Text style={styles.endMyCallText}>End Call</Text>
    </TouchableOpacity>
  </View>
        )}


        {/* Waiting indicator */}
        {waitingForCall && !callAccepted && (
          <View style={styles.waitingOverlay}>
            <View style={styles.waitingBox}>
              <ActivityIndicator size="large" color="#f6b900" />
              <Text style={styles.waitingText}>Waiting for astrologer...</Text>
              <TouchableOpacity style={styles.cancelWaitingButton} onPress={cancelCallRequest}>
                <Text style={styles.cancelWaitingText}>Cancel Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}


        {/* Right Actions */}
        <View style={styles.rightButtons}>
          <TouchableOpacity style={styles.sideBtn} onPress={handleLike}><Text style={styles.sideIcon}>❤️</Text></TouchableOpacity>
          <TouchableOpacity style={styles.sideBtn} onPress={() => handleSendGift('rose', 'Rose', 50)}><Text style={styles.sideIcon}>🎁</Text></TouchableOpacity>
          <TouchableOpacity style={styles.sideBtn} onPress={handleCallRequest}>
            <Text style={styles.sideIcon}>📞</Text>
            <Text style={styles.priceText}>₹{currentStream?.callSettings?.videoCallPrice || 100}/min</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sideBtn}><Text style={styles.sideIcon}>↗️</Text></TouchableOpacity>
        </View>


        {/* Gift Animations */}
        {activeGifts.map((gift) => (
          <Animated.View key={gift.id} style={[styles.giftAnimation, { opacity: giftAnimValue, transform: [{ translateY: giftAnimValue.interpolate({ inputRange: [0, 1], outputRange: [100, -100] }) }] }]}>
            <Text style={styles.giftEmoji}>🎁</Text>
            <Text style={styles.giftText}>{gift.userName}</Text>
            <Text style={styles.giftAmount}>₹{gift.amount}</Text>
          </Animated.View>
        ))}


        {/* Chat Messages */}
        <ScrollView style={styles.chatMessagesContainer} showsVerticalScrollIndicator={false}>
          {chatMessages.slice(-8).map((msg) => (
            <View key={msg.id} style={styles.chatMessage}>
              {msg.type === 'comment' && (<><Text style={styles.chatUser}>{msg.userName}: </Text><Text style={styles.chatText}>{msg.message}</Text></>)}
              {msg.type === 'join' && (<Text style={styles.chatSystem}>👋 {msg.userName} joined</Text>)}
              {msg.type === 'like' && (<Text style={styles.chatSystem}>❤️ {msg.userName} liked</Text>)}
              {msg.type === 'gift' && (<Text style={styles.chatGift}>🎁 {msg.userName} sent {msg.giftName} (₹{msg.amount})</Text>)}
            </View>
          ))}
        </ScrollView>


        {/* Chat Button */}
        {!chatOpen && (<TouchableOpacity style={styles.chatBubble} onPress={handleOpenChat}><Text style={{ fontSize: 20 }}>💬</Text></TouchableOpacity>)}


        {/* Chat Input */}
        {chatOpen && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.chatBar}>
            <TextInput ref={inputRef} style={styles.chatInput} placeholder="Type a message..." placeholderTextColor="#888" value={message} onChangeText={setMessage} onBlur={() => setChatOpen(false)} />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}><Text style={{ color: '#fff', fontWeight: '600' }}>➤</Text></TouchableOpacity>
          </KeyboardAvoidingView>
        )}
      </View>


      {/* Leave Modal */}
      <Modal visible={leaveModalVisible} animationType="slide" transparent onRequestClose={() => setLeaveModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Switch to another astrologer or leave?</Text>
            <FlatList data={streams.filter((_, i) => i !== currentIndex).slice(0, 3)} keyExtractor={item => item._id} horizontal renderItem={({ item }) => (
              <TouchableOpacity style={styles.astroCard} onPress={() => handleSwitchStream(item, streams.indexOf(item))}>
                <Image source={{ uri: item.hostId?.profilePicture }} style={styles.astroImg} />
                <Text style={styles.astroName}>{item.hostId?.name}</Text>
                <Text style={styles.astroViewers}>👁️ {item.viewerCount}</Text>
              </TouchableOpacity>
            )} contentContainerStyle={{ paddingVertical: 10 }} />
            <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}><Text style={styles.leaveText}>Leave</Text></TouchableOpacity>
            <Pressable onPress={() => setLeaveModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};


export default LiveStreamScreen;


// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { color: '#fff', marginTop: 10, fontSize: 14 },
  streamContainer: { width, height },
  video: { 
    width: '100%', 
    height: '100%',
    backgroundColor: '#000',
  },
  fullVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  loadingVideo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  videoPlaceholder: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#1a1a1a' 
  },
  videoText: { color: '#fff', fontSize: 14, marginTop: 10 },
  overlay: { ...StyleSheet.absoluteFillObject },
  splitScreenContainer: { 
    flex: 1, 
    flexDirection: 'column',
    width: '100%',
    height: '100%',
  },
  remoteVideoHalf: { 
    flex: 1, 
    backgroundColor: '#000', 
    borderBottomWidth: 2, 
    borderBottomColor: '#f6b900', 
    position: 'relative',
    width: '100%',
  },

  localVideoHalf: { 
    flex: 1, 
    backgroundColor: '#1a1a1a', 
    position: 'relative',
    width: '100%',
  },
   halfVideo: { 
    width: '100%', 
    height: '100%',
    backgroundColor: '#000',
  },
  videoNameTag: { 
    position: 'absolute', 
    top: 16, 
    left: 16, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16 
  },

  videoNameText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  chatMessagesContainer: { position: 'absolute', bottom: 100, left: 12, right: 12, maxHeight: 200 },
  chatMessage: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginBottom: 8, flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'flex-start', maxWidth: '80%' },
  chatUser: { color: '#f6b900', fontSize: 13, fontWeight: '700' },
  chatText: { color: '#fff', fontSize: 13 },
  chatSystem: { color: '#9ca3af', fontSize: 12, fontStyle: 'italic' },
  chatGift: { color: '#f6b900', fontSize: 13, fontWeight: '600' },
  giftAnimation: { position: 'absolute', right: 16, top: height * 0.3, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16 },
  giftEmoji: { fontSize: 48 },
  giftText: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 4 },
  giftAmount: { color: '#f6b900', fontSize: 16, fontWeight: '700', marginTop: 2 },
  topBar: { position: 'absolute', top: 30, left: 10, right: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leftProfile: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 35, height: 35, borderRadius: 18 },
  name: { color: '#fff', marginLeft: 6, fontSize: 14, fontWeight: '600' },
  followBtn: { marginLeft: 10, backgroundColor: '#f6b900', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  followText: { fontSize: 12, fontWeight: '600', color: '#000' },
  viewerBox: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  viewerText: { color: '#fff', marginLeft: 4, fontSize: 12 },
  closeIcon: { width: 22, height: 22, tintColor: '#fff', marginLeft: 10 },
  rightButtons: { position: 'absolute', bottom: 120, right: 15, alignItems: 'center' },
  sideBtn: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 30, padding: 12, alignItems: 'center', marginVertical: 8 },
  sideIcon: { fontSize: 22, color: '#fff' },
  priceText: { fontSize: 10, color: '#fff', marginTop: 3 },
  callControlsOverlay: { position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center', zIndex: 101 },
  callIndicatorBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.9)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', marginRight: 8 },
  callBadgeText: { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 4 },
  callControlsRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  controlButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#f6b900' },
  endCallBtn: { flexDirection: 'column', alignItems: 'center', backgroundColor: '#ef4444', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 28, minWidth: 100 },
  endCallText: { color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 4 },
  waitingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 99 },
  waitingBox: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', minWidth: 250 },
  waitingText: { fontSize: 16, fontWeight: '600', color: '#000', marginTop: 16, marginBottom: 24 },
  cancelWaitingButton: { backgroundColor: '#ef4444', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  cancelWaitingText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  chatBubble: { position: 'absolute', bottom: 30, left: 20, backgroundColor: '#fff', borderRadius: 20, padding: 10 },
  chatBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', padding: 8, position: 'absolute', bottom: 0, left: 0, right: 0 },
  chatInput: { flex: 1, color: '#fff', padding: 8, borderRadius: 6, backgroundColor: '#333', marginRight: 8 },
  sendBtn: { backgroundColor: '#f6b900', padding: 10, borderRadius: 6 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  astroCard: { alignItems: 'center', marginHorizontal: 10 },
  astroImg: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#f6b900' },
  astroName: { marginTop: 5, fontSize: 13, fontWeight: '500' },
  astroViewers: { fontSize: 11, color: '#666', marginTop: 2 },
  leaveBtn: { backgroundColor: '#f6b900', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginVertical: 12 },
  leaveText: { fontSize: 15, fontWeight: '600', color: '#000' },
  cancelText: { textAlign: 'center', color: '#3366cc', fontSize: 14, marginTop: 6 },
  debugOverlay: { 
    position: 'absolute', 
    top: 100, 
    left: 16, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    padding: 12, 
    borderRadius: 8,
    zIndex: 999,
  },
  
  debugText: { 
    color: '#fff', 
    fontSize: 10, 
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
myCallControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  
  myCallInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  myCallText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  endMyCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  
  endMyCallText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
