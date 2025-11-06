// import React, { useState, useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   TextInput,
//   FlatList,
//   SafeAreaView,
//   StyleSheet,
//   KeyboardAvoidingView,
//   Platform,
//   Image,
//   Alert,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import ChatService from '../../services/api/chat/ChatService';
// import {
//   initChatSocket,
//   joinChatSession,
//   leaveChatSession,
//   sendMessageSocket,
//   onNewMessage,
//   disconnectChatSocket,
// } from '../../services/api/socket/chatSocket';

// const ChatScreen = ({ navigation, route }) => {
//   const { sessionId, astrologerId } = route.params || {};
//   const [messages, setMessages] = useState([
//     {
//       _id: 1,
//       text: 'Welcome to Astrotalk. Consultant will take a minute to analyse your details. You may ask your question in the meanwhile.',
//       system: true,
//     },
//   ]);
//   const [input, setInput] = useState('');
//   const [secondsLeft, setSecondsLeft] = useState(600);
//   const [isConnected, setIsConnected] = useState(false);

//   const timerRef = useRef(null);
//   const flatListRef = useRef(null);

//   // 🕒 Timer
//   useEffect(() => {
//     timerRef.current = setInterval(() => {
//       setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
//     }, 1000);
//     return () => clearInterval(timerRef.current);
//   }, []);

//   const formatTimer = () => {
//     const min = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
//     const sec = (secondsLeft % 60).toString().padStart(2, '0');
//     return `${min}:${sec}`;
//   };

//   // 🔌 Initialize socket connection
//   useEffect(() => {
//     const setupSocket = async () => {
//       const socket = await initChatSocket();
//       if (!socket) {
//         console.error('❌ Socket not initialized');
//         return;
//       }

//       setIsConnected(true);
//       joinChatSession(sessionId);

//       onNewMessage(newMsg => {
//         console.log('📨 New message:', newMsg);
//         setMessages(prev => [
//           {
//             _id: newMsg._id || Date.now(),
//             text: newMsg.content,
//             user: { _id: newMsg.senderId },
//           },
//           ...prev,
//         ]);
//       });
//     };

//     setupSocket();

//     return () => {
//       leaveChatSession(sessionId);
//       disconnectChatSocket();
//     };
//   }, [sessionId]);

//   // 💾 Load old chat messages
//   useEffect(() => {
//     const loadHistory = async () => {
//       try {
//         if (!sessionId) return;
//         const history = await ChatService.getMessagesBySession(sessionId);
//         const formatted = history.map(msg => ({
//           _id: msg._id,
//           text: msg.content,
//           user: { _id: msg.senderId },
//         }));
//         setMessages(prev => [...prev, ...formatted.reverse()]);
//       } catch (err) {
//         console.error('❌ Error fetching chat history:', err);
//       }
//     };
//     loadHistory();
//   }, [sessionId]);

//   // ✉️ Send message
//   const sendMessage = async () => {
//     const trimmed = input.trim();
//     if (!trimmed) return;

//     const tempMsg = {
//       _id: Date.now(),
//       text: trimmed,
//       user: { _id: 'user' },
//     };
//     setMessages(prev => [tempMsg, ...prev]);
//     setInput('');

//     try {
//       if (isConnected) {
//         sendMessageSocket(sessionId, trimmed);
//       } else {
//         console.warn('⚠️ Socket not connected, trying REST fallback');
//         await ChatService.sendMessage(sessionId, trimmed);
//       }
//     } catch (err) {
//       console.error('❌ Message send failed:', err);
//     }
//   };

//   // ❌ End Chat
//   const endChat = async () => {
//     clearInterval(timerRef.current);
//     try {
//       await ChatService.endChatSession(sessionId);
//       Alert.alert('Chat Ended', 'Your chat session has ended.');
//       navigation.goBack();
//     } catch (err) {
//       console.error('❌ Error ending chat:', err);
//     }
//   };

//   // 💬 Render message bubble
//   const renderMessage = ({ item }) => {
//     if (item.system) {
//       return (
//         <View style={styles.systemBubble}>
//           <Text style={styles.systemText}>{item.text}</Text>
//         </View>
//       );
//     }
//     if (item.user?._id === 'user') {
//       return (
//         <View style={styles.userBubble}>
//           <Text style={styles.userText}>{item.text}</Text>
//         </View>
//       );
//     }
//     return (
//       <View style={styles.consultantBubble}>
//         <Text style={styles.consultantText}>{item.text}</Text>
//       </View>
//     );
//   };

//   useEffect(() => {
//     flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
//   }, [messages]);

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <Image source={require('../../assets/left.png')} style={styles.backIcon} />
//         <View style={styles.profileCircle} />
//         <View style={{ flexDirection: 'column', flex: 1 }}>
//           <Text style={styles.headerTitle}>Rupanshi</Text>
//           <Text style={styles.timerDigits}>{formatTimer()}</Text>
//         </View>

//         <TouchableOpacity
//           style={styles.icon}
//           onPress={() => navigation.navigate('VideoAudioCall', { initialVideo: true })}
//         >
//           <Icon name="videocam" size={26} color="#007AFF" />
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.icon}
//           onPress={() => navigation.navigate('VideoAudioCall', { initialVideo: false })}
//         >
//           <Icon name="call" size={26} color="#007AFF" />
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.icon} onPress={endChat}>
//           <Icon name="exit-to-app" size={26} color="#DD2C00" />
//         </TouchableOpacity>
//       </View>

//       <KeyboardAvoidingView
//         style={styles.flex}
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         keyboardVerticalOffset={72}
//       >
//         <FlatList
//           ref={flatListRef}
//           style={styles.messagesList}
//           data={messages}
//           renderItem={renderMessage}
//           keyExtractor={item => item._id.toString()}
//           inverted
//         />

//         <View style={styles.inputBar}>
//           <View style={styles.inputContainer}>
//             <TextInput
//               style={styles.input}
//               value={input}
//               onChangeText={setInput}
//               placeholder="Type a message"
//             />
//             <TouchableOpacity style={styles.attachIcon}>
//               <Icon name="attach-file" size={24} color="#007AFF" />
//             </TouchableOpacity>
//           </View>

//           <TouchableOpacity style={styles.icon} onPress={sendMessage}>
//             <Icon name="send" size={28} color="#007AFF" />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.icon}>
//             <Icon name="mic" size={28} color="#007AFF" />
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// // 💅 Styles (same as before)
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#fff' },
//   flex: { flex: 1 },
//   header: {
//     height: 80,
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 8,
//     backgroundColor: '#F5F5F5',
//     borderBottomWidth: 1,
//     borderColor: '#eee',
//   },
//   profileCircle: {
//     width: 40,
//     height: 40,
//     borderRadius: 19,
//     backgroundColor: '#ddd',
//     marginRight: 25,
//     left: 10,
//   },
//   headerTitle: { fontWeight: 'bold', fontSize: 18 },
//   timerDigits: { fontSize: 16, color: '#444', marginTop: 2 },
//   icon: { marginHorizontal: 7 },
//   messagesList: { flex: 1, paddingHorizontal: 12 },
//   systemBubble: {
//     backgroundColor: '#FFF9C4',
//     alignSelf: 'center',
//     borderRadius: 13,
//     margin: 6,
//     padding: 10,
//     maxWidth: '95%',
//   },
//   systemText: { color: '#555', fontSize: 13 },
//   userBubble: {
//     backgroundColor: '#C8E6C9',
//     alignSelf: 'flex-end',
//     borderRadius: 13,
//     margin: 6,
//     padding: 10,
//     maxWidth: '75%',
//   },
//   userText: { color: '#222', fontSize: 15 },
//   consultantBubble: {
//     backgroundColor: '#fff',
//     borderColor: '#eee',
//     borderWidth: 1,
//     alignSelf: 'flex-start',
//     borderRadius: 13,
//     margin: 6,
//     padding: 10,
//     maxWidth: '75%',
//   },
//   consultantText: { color: '#444', fontSize: 15 },
//   inputBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderTopWidth: 1,
//     borderColor: '#eee',
//     paddingHorizontal: 4,
//     backgroundColor: '#fafafa',
//   },
//   inputContainer: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderRadius: 25,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     marginRight: 6,
//     paddingRight: 6,
//   },
//   input: {
//     width: '100%',
//     height: 42,
//     flex: 1,
//     fontSize: 15,
//     paddingHorizontal: 14,
//   },
//   attachIcon: { paddingLeft: 2, paddingRight: 2 },
//   backIcon: { width: 35, height: 35, left: 5 },
// });

// export default ChatScreen;

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
// import chatSocket from '../../service/api/socket/chatSocket';
import { ChatService } from '../../services/api/chat/ChatService';
import chatSocket from '../../services/api/socket/chatSocket';

const USER_ID = '68eba7c81bd75c055cf164ab'; // Replace with real login ID from redux/auth
const ASTROLOGER_ID = '68f55913fcac5b00b4225a8e'; // Replace with actual astrologer

const ChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatSessionId, setChatSessionId] = useState(null);
  const [chatStatus, setChatStatus] = useState('idle'); // idle | waiting | active | rejected
  const flatListRef = useRef(null);

  // 1. Setup socket connection
  useEffect(() => {
    chatSocket.connect(USER_ID);

    // Listen events
    chatSocket.on('chat_accepted', (data) => {
        console.log('✅ Socket connected with id:', chatSocket.socket.id);
      if (data.threadId === chatSessionId) {
        setChatStatus('active');
        Alert.alert('Chat Accepted', 'Astrologer accepted your chat request.');
      }
    });
    chatSocket.on('chat_rejected', (data) => {
      if (data.threadId === chatSessionId) {
        setChatStatus('rejected');
        Alert.alert('Chat Rejected', 'Astrologer rejected your chat request.');
        setChatSessionId(null);
        setMessages([]);
      }
    });
    chatSocket.on('chat_message', (msg) => {
      if (msg.threadId === chatSessionId) {
        setMessages((prev) => [
          {
            _id: Date.now(),
            text: msg.message,
            user: { _id: msg.senderId === USER_ID ? 'user' : 'consultant' },
          },
          ...prev,
        ]);
      }
    });

    // Cleanup
    return () => {
      chatSocket.off('chat_accepted');
      chatSocket.off('chat_rejected');
      chatSocket.off('chat_message');
      chatSocket.disconnect();
    };
  }, [chatSessionId]);

  // 2. Start chat session via API, then emit socket event
  const handleStartChat = async () => {
    try {
      setChatStatus('loading');
      // First call API to initiate chat, get session info
      const sessionRes = await ChatService.initiateChat(ASTROLOGER_ID);
      console.log('Calling API:', ChatService.defaults.baseURL + '/chat/initiate');

      if (!sessionRes.success) throw new Error(sessionRes.message);
      setChatSessionId(sessionRes.data.sessionId);
      setChatStatus('waiting');

      // Emit socket event for chat request
      chatSocket.emit('chat_request',
        { userId: USER_ID, astrologerId: ASTROLOGER_ID, threadId: sessionRes.data.sessionId },
        (resp) => {
          if (resp && !resp.success) {
            setChatStatus('idle');
            Alert.alert('Chat Failed', resp.message);
          }
        }
      );
    } catch (err) {
      setChatStatus('idle');
      Alert.alert('Chat Error', err.message);
    }
  };

  // 3. Send chat message via socket
  const sendMessage = () => {
    if (!chatSessionId || chatStatus !== 'active') {
      Alert.alert('Wait', 'Chat not active yet.');
      return;
    }
    if (input.trim()) {
      chatSocket.emit('send_message', {
        threadId: chatSessionId,
        senderId: USER_ID,
        message: input.trim(),
      });
      setMessages((prev) => [
        {
          _id: Date.now(),
          text: input.trim(),
          user: { _id: 'user' },
        },
        ...prev,
      ]);
      setInput('');
    }
  };

  // 4. Render UI messages
  const renderMessage = ({ item }) => {
    const isUser = item.user?._id === 'user';
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.consultantBubble,
        ]}
      >
        <Text style={isUser ? styles.userText : styles.consultantText}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {!chatSessionId && (
        <TouchableOpacity style={styles.startChatBtn} onPress={handleStartChat} disabled={chatStatus === 'loading'}>
          <Text style={styles.startChatBtnText}>
            {chatStatus === 'loading' ? 'Starting...' : 'Start Chat with Astrologer'}
          </Text>
        </TouchableOpacity>
      )}
      {chatStatus === 'waiting' && (
        <Text style={{ color: '#007AFF', textAlign: 'center', margin: 12 }}>
          Waiting for astrologer to accept...
        </Text>
      )}
      <FlatList
        ref={flatListRef}
        data={messages}
        inverted
        keyExtractor={item => item._id.toString()}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 12 }}
      />
      <KeyboardAvoidingView
        style={styles.inputContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type your message"
          style={styles.input}
          editable={chatStatus === 'active'}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn} disabled={chatStatus !== 'active'}>
          <Icon name="send" size={28} color="#007AFF" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  startChatBtn: {
    backgroundColor: '#007AFF',
    padding: 15,
    margin: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  startChatBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  messageBubble: {
    borderRadius: 15,
    padding: 12,
    marginVertical: 6,
    maxWidth: '75%',
  },
  userBubble: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
  },
  consultantBubble: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
  },
  userText: { fontSize: 16, color: '#000' },
  consultantText: { fontSize: 16, color: '#000' },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 16,
    backgroundColor: '#f1f1f1',
    borderRadius: 24,
  },
  sendBtn: {
    marginLeft: 12,
  },
});

export default ChatScreen;

