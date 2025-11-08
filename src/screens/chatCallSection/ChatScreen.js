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
//   Alert,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { ChatService } from '../../services/api/chat/ChatService';
// import chatSocket from '../../services/api/socket/chatSocket';

// const USER_ID = '68eba7c81bd75c055cf164ab';
// const ASTROLOGER_ID = '68f55913fcac5b00b4225a8e';

// const ChatScreen = ({ navigation }) => {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState('');
//   const [chatSessionId, setChatSessionId] = useState(null);
//   const [chatStatus, setChatStatus] = useState('idle');
//   const [isSocketConnected, setIsSocketConnected] = useState(false);
//   const [socketId, setSocketId] = useState(null);
//   const flatListRef = useRef(null);

//   // 1. Setup socket connection
//   useEffect(() => {
//     console.log('🔄 Initializing socket connection for user:', USER_ID);

//     chatSocket.connect(USER_ID);

//     // ✅ Listen to connection events
//     chatSocket.on('connect', () => {
//       const id = chatSocket.getSocketId();
//       console.log('✅ Socket connected successfully');
//       console.log('🆔 Socket ID:', id);
//       setIsSocketConnected(true);
//       setSocketId(id);
//     });

//     chatSocket.on('disconnect', reason => {
//       console.log('❌ Socket disconnected. Reason:', reason);
//       setIsSocketConnected(false);
//       setSocketId(null);
//     });

//     chatSocket.on('connect_error', error => {
//       console.error('🔴 Socket connection error:', error.message);
//       Alert.alert(
//         'Connection Error',
//         `Socket failed to connect: ${error.message}`,
//       );
//     });

//     // ✅ Listen to chat events
//     chatSocket.on('chat_accepted', data => {
//       console.log('✅ Chat accepted by astrologer:', data);
//       if (data.threadId === chatSessionId) {
//         setChatStatus('active');
//         Alert.alert('Chat Accepted', 'Astrologer accepted your chat request.');
//       }
//     });

//     chatSocket.on('chat_rejected', data => {
//       console.log('❌ Chat rejected by astrologer:', data);
//       if (data.threadId === chatSessionId) {
//         setChatStatus('rejected');
//         Alert.alert('Chat Rejected', 'Astrologer rejected your chat request.');
//         setChatSessionId(null);
//         setMessages([]);
//       }
//     });

//     chatSocket.on('chat_message', msg => {
//       console.log('📩 Received message:', msg);
//       if (msg.threadId === chatSessionId) {
//         setMessages(prev => [
//           {
//             _id: Date.now(),
//             text: msg.message,
//             user: { _id: msg.senderId === USER_ID ? 'user' : 'consultant' },
//           },
//           ...prev,
//         ]);
//       }
//     });

//     // Check initial connection status
//     const initialStatus = chatSocket.isConnected();
//     console.log('🔍 Initial socket connection status:', initialStatus);
//     setIsSocketConnected(initialStatus);
//     if (initialStatus) {
//       setSocketId(chatSocket.getSocketId());
//     }

//     // Cleanup
//     return () => {
//       console.log('🧹 Cleaning up socket listeners');
//       chatSocket.off('connect');
//       chatSocket.off('disconnect');
//       chatSocket.off('connect_error');
//       chatSocket.off('chat_accepted');
//       chatSocket.off('chat_rejected');
//       chatSocket.off('chat_message');
//       chatSocket.disconnect();
//     };
//   }, [chatSessionId]);

//   // User side screen me bus ye change karo:

//   const handleStartChat = async () => {
//     try {
//       console.log('🚀 [USER] Starting chat with astrologer:', ASTROLOGER_ID);
//       console.log('🔍 [USER] Socket connected?', isSocketConnected);
//       console.log('🔍 [USER] Socket ID:', socketId);

//       if (!isSocketConnected) {
//         Alert.alert('Connection Error', 'Socket not connected. Please wait...');
//         console.error('❌ [USER] Cannot start chat - socket not connected');
//         return;
//       }

//       setChatStatus('loading');

//       console.log('📞 [USER] Calling ChatService.initiateChat API...');
//       const sessionRes = await ChatService.initiateChat(ASTROLOGER_ID);
//       console.log(
//         '📥 [USER] API Response:',
//         JSON.stringify(sessionRes, null, 2),
//       );

//       if (!sessionRes || !sessionRes.success) {
//         throw new Error(sessionRes?.message || 'Failed to create session');
//       }

//       const sessionId = sessionRes.data?.sessionId;
//       if (!sessionId) {
//         throw new Error('No sessionId in response');
//       }

//       console.log('✅ [USER] Session created with ID:', sessionId);

//       setChatSessionId(sessionId);
//       setChatStatus('waiting');

//       const requestData = {
//         userId: USER_ID,
//         astrologerId: ASTROLOGER_ID,
//         threadId: sessionId,
//       };

//       console.log('📤 [USER] Emitting chat_request with data:', requestData);

//       chatSocket.emit('chat_request', requestData, resp => {
//         console.log('📥 [USER] chat_request callback:', resp);
//         if (resp && !resp.success) {
//           console.error('❌ [USER] Chat request failed:', resp.message);
//           setChatStatus('idle');
//           Alert.alert('Chat Failed', resp.message);
//         } else {
//           console.log('✅ [USER] Chat request sent successfully');
//         }
//       });
//     } catch (err) {
//       console.error('❌ [USER] Chat start error:', err.message);
//       console.error('❌ [USER] Full error:', err);
//       setChatStatus('idle');
//       Alert.alert('Chat Error', err.message);
//     }
//   };

//   // 3. Send chat message via socket
//   const sendMessage = () => {
//     if (!chatSessionId || chatStatus !== 'active') {
//       Alert.alert('Wait', 'Chat not active yet.');
//       console.warn('⚠️ Cannot send message - chat status:', chatStatus);
//       return;
//     }

//     if (!input.trim()) {
//       console.warn('⚠️ Empty message - not sending');
//       return;
//     }

//     const messageData = {
//       threadId: chatSessionId,
//       senderId: USER_ID,
//       message: input.trim(),
//     };

//     console.log('📤 Sending message:', messageData);

//     chatSocket.emit('send_message', messageData);

//     setMessages(prev => [
//       {
//         _id: Date.now(),
//         text: input.trim(),
//         user: { _id: 'user' },
//       },
//       ...prev,
//     ]);

//     setInput('');
//   };

//   // 4. Render UI messages
//   const renderMessage = ({ item }) => {
//     const isUser = item.user?._id === 'user';
//     return (
//       <View
//         style={[
//           styles.messageBubble,
//           isUser ? styles.userBubble : styles.consultantBubble,
//         ]}
//       >
//         <Text style={isUser ? styles.userText : styles.consultantText}>
//           {item.text}
//         </Text>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* ✅ Socket Connection Status Indicator */}
//       <View style={styles.statusBar}>
//         <View
//           style={[
//             styles.statusDot,
//             { backgroundColor: isSocketConnected ? '#4CAF50' : '#F44336' },
//           ]}
//         />
//         <Text style={styles.statusText}>
//           {isSocketConnected ? 'Connected' : 'Disconnected'}
//         </Text>
//         {socketId && (
//           <Text style={styles.socketIdText}>
//             {' '}
//             • ID: {socketId.substring(0, 8)}...
//           </Text>
//         )}
//       </View>

//       {!chatSessionId && (
//         <TouchableOpacity
//           style={[
//             styles.startChatBtn,
//             !isSocketConnected && styles.startChatBtnDisabled,
//           ]}
//           onPress={handleStartChat}
//           disabled={chatStatus === 'loading' || !isSocketConnected}
//         >
//           <Text style={styles.startChatBtnText}>
//             {chatStatus === 'loading'
//               ? 'Starting...'
//               : !isSocketConnected
//               ? 'Connecting to server...'
//               : 'Start Chat with Astrologer'}
//           </Text>
//         </TouchableOpacity>
//       )}

//       {chatStatus === 'waiting' && (
//         <Text style={styles.waitingText}>
//           Waiting for astrologer to accept...
//         </Text>
//       )}

//       <FlatList
//         ref={flatListRef}
//         data={messages}
//         inverted
//         keyExtractor={item => item._id.toString()}
//         renderItem={renderMessage}
//         contentContainerStyle={{ padding: 12 }}
//       />

//       <KeyboardAvoidingView
//         style={styles.inputContainer}
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       >
//         <TextInput
//           value={input}
//           onChangeText={setInput}
//           placeholder="Type your message"
//           style={styles.input}
//           editable={chatStatus === 'active'}
//         />
//         <TouchableOpacity
//           onPress={sendMessage}
//           style={styles.sendBtn}
//           disabled={chatStatus !== 'active'}
//         >
//           <Icon
//             name="send"
//             size={28}
//             color={chatStatus === 'active' ? '#007AFF' : '#CCCCCC'}
//           />
//         </TouchableOpacity>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#fff' },

//   // ✅ Status Bar Styles
//   statusBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//     backgroundColor: '#f5f5f5',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   statusDot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     marginRight: 8,
//   },
//   statusText: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#333',
//   },
//   socketIdText: {
//     fontSize: 11,
//     color: '#666',
//   },

//   startChatBtn: {
//     backgroundColor: '#007AFF',
//     padding: 15,
//     margin: 12,
//     borderRadius: 10,
//     alignItems: 'center',
//   },
//   startChatBtnDisabled: {
//     backgroundColor: '#CCCCCC',
//   },
//   startChatBtnText: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },

//   waitingText: {
//     color: '#007AFF',
//     textAlign: 'center',
//     margin: 12,
//     fontSize: 14,
//     fontStyle: 'italic',
//   },

//   messageBubble: {
//     borderRadius: 15,
//     padding: 12,
//     marginVertical: 6,
//     maxWidth: '75%',
//   },
//   userBubble: {
//     backgroundColor: '#DCF8C6',
//     alignSelf: 'flex-end',
//   },
//   consultantBubble: {
//     backgroundColor: '#E5E5EA',
//     alignSelf: 'flex-start',
//   },
//   userText: { fontSize: 16, color: '#000' },
//   consultantText: { fontSize: 16, color: '#000' },

//   inputContainer: {
//     flexDirection: 'row',
//     padding: 12,
//     borderTopWidth: 1,
//     borderColor: '#eee',
//     backgroundColor: '#fff',
//     alignItems: 'center',
//   },
//   input: {
//     flex: 1,
//     paddingHorizontal: 12,
//     height: 44,
//     fontSize: 16,
//     backgroundColor: '#f1f1f1',
//     borderRadius: 24,
//   },
//   sendBtn: {
//     marginLeft: 12,
//   },
// });

// export default ChatScreen;



// // src/screens/chat/ChatScreen.js (USER SIDE)
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
//   Alert,
//   ActivityIndicator,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { ChatService } from '../../services/api/chat/ChatService';
// import chatSocket from '../../services/api/socket/chatSocket';

// const USER_ID = '68eba7c81bd75c055cf164ab';
// const ASTROLOGER_ID = '68f55913fcac5b00b4225a8e';

// const ChatScreen = ({ navigation }) => {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState('');
//   const [chatSessionId, setChatSessionId] = useState(null);
//   const [chatStatus, setChatStatus] = useState('idle'); // idle | loading | waiting | active | ended | rejected
//   const [isSocketConnected, setIsSocketConnected] = useState(false);
//   const [socketId, setSocketId] = useState(null);
//   const flatListRef = useRef(null);

//   // ============================================
//   // SOCKET SETUP
//   // ============================================
//   useEffect(() => {
//     console.log('🔄 [USER] Initializing socket connection...');
//     chatSocket.connect(USER_ID);

//     // Connection Events
//     chatSocket.on('connect', () => {
//       const id = chatSocket.getSocketId();
//       console.log('✅ [USER] Socket connected successfully');
//       console.log('🆔 [USER] Socket ID:', id);
//       setIsSocketConnected(true);
//       setSocketId(id);
//     });

//     chatSocket.on('disconnect', (reason) => {
//       console.log('❌ [USER] Socket disconnected. Reason:', reason);
//       setIsSocketConnected(false);
//       setSocketId(null);
//     });

//     chatSocket.on('connect_error', (error) => {
//       console.error('🔴 [USER] Socket connection error:', error.message);
//       Alert.alert('Connection Error', `Socket failed: ${error.message}`);
//     });

//     // ✅ CHAT ACCEPTED BY ASTROLOGER
//     chatSocket.on('chat_accepted', (data) => {
//       console.log('✅ [USER] Chat accepted by astrologer:', data);
//       if (data.threadId === chatSessionId) {
//         setChatStatus('active');
//         Alert.alert('Chat Started! 🎉', 'Astrologer has accepted your request. You can now chat!');
//       }
//     });

//     // ✅ CHAT REJECTED BY ASTROLOGER
//     chatSocket.on('chat_rejected', (data) => {
//       console.log('❌ [USER] Chat rejected by astrologer:', data);
//       if (data.threadId === chatSessionId) {
//         setChatStatus('rejected');
//         Alert.alert('Chat Declined', 'Astrologer rejected the request. Amount has been refunded to your wallet.');
//         setChatSessionId(null);
//         setMessages([]);
//       }
//     });

//     // ✅ INCOMING MESSAGE FROM ASTROLOGER
//     chatSocket.on('chat_message', (msg) => {
//       console.log('📩 [USER] Received message:', msg);
//       if (msg.threadId === chatSessionId) {
//         setMessages((prev) => [
//           {
//             _id: Date.now() + Math.random(), // Unique ID
//             text: msg.message,
//             user: { _id: msg.senderId === USER_ID ? 'user' : 'astrologer' },
//             createdAt: new Date(),
//           },
//           ...prev,
//         ]);
//       }
//     });

//     // ✅ CHAT ENDED BY ASTROLOGER
//     chatSocket.on('chat_ended', (data) => {
//       console.log('🔚 [USER] Chat ended by astrologer:', data);
//       if (data.threadId === chatSessionId) {
//         setChatStatus('ended');
//         Alert.alert(
//           'Chat Ended',
//           `Duration: ${data.duration || 'N/A'} mins\nTotal: ₹${data.totalAmount || 'N/A'}`,
//           [{ text: 'OK', onPress: () => navigation.goBack() }]
//         );
//       }
//     });

//     // Check initial connection
//     const initialStatus = chatSocket.isConnected();
//     console.log('🔍 [USER] Initial connection status:', initialStatus);
//     setIsSocketConnected(initialStatus);
//     if (initialStatus) {
//       setSocketId(chatSocket.getSocketId());
//     }

//     // Cleanup
//     return () => {
//       console.log('🧹 [USER] Cleaning up socket listeners');
//       chatSocket.off('connect');
//       chatSocket.off('disconnect');
//       chatSocket.off('connect_error');
//       chatSocket.off('chat_accepted');
//       chatSocket.off('chat_rejected');
//       chatSocket.off('chat_message');
//       chatSocket.off('chat_ended');
//       chatSocket.disconnect();
//     };
//   }, [chatSessionId]);

//   // ============================================
//   // START CHAT (API + SOCKET)
//   // ============================================
//   const handleStartChat = async () => {
//     try {
//       console.log('🚀 [USER] Starting chat with astrologer:', ASTROLOGER_ID);
//       console.log('🔍 [USER] Socket connected?', isSocketConnected);
//       console.log('🔍 [USER] Socket ID:', socketId);

//       if (!isSocketConnected) {
//         Alert.alert('Connection Error', 'Socket not connected. Please wait...');
//         console.error('❌ [USER] Cannot start - socket not connected');
//         return;
//       }

//       setChatStatus('loading');

//       // ✅ STEP 1: API Call to Create Session
//       console.log('📞 [USER] Calling ChatService.initiateChat API...');
//       const sessionRes = await ChatService.initiateChat(ASTROLOGER_ID);
//       console.log('📥 [USER] API Response:', JSON.stringify(sessionRes, null, 2));

//       if (!sessionRes || !sessionRes.success) {
//         throw new Error(sessionRes?.message || 'Failed to create session');
//       }

//       const sessionId = sessionRes.data?.sessionId;
//       if (!sessionId) {
//         throw new Error('No sessionId in response');
//       }

//       console.log('✅ [USER] Session created with ID:', sessionId);

//       setChatSessionId(sessionId);
//       setChatStatus('waiting');

//       // ✅ STEP 2: Socket Event to Notify Astrologer
//       const requestData = {
//         userId: USER_ID,
//         astrologerId: ASTROLOGER_ID,
//         threadId: sessionId,
//       };

//       console.log('📤 [USER] Emitting chat_request event:', requestData);

//       chatSocket.emit('chat_request', requestData, (resp) => {
//         console.log('📥 [USER] chat_request callback:', resp);
//         if (resp && !resp.success) {
//           console.error('❌ [USER] Chat request failed:', resp.message);
//           setChatStatus('idle');
//           Alert.alert('Request Failed', resp.message);
//         } else {
//           console.log('✅ [USER] Chat request sent successfully');
//         }
//       });
//     } catch (err) {
//       console.error('❌ [USER] Chat start error:', err.message);
//       console.error('❌ [USER] Full error:', err);
//       setChatStatus('idle');
//       Alert.alert('Error', err.message);
//     }
//   };

//   // ============================================
//   // SEND MESSAGE (SOCKET ONLY - USER NEVER CALLS ACCEPT API)
//   // ============================================
//   const sendMessage = () => {
//     if (!chatSessionId || chatStatus !== 'active') {
//       Alert.alert('Wait', 'Chat is not active yet. Waiting for astrologer...');
//       console.warn('⚠️ [USER] Cannot send - chat status:', chatStatus);
//       return;
//     }

//     if (!input.trim()) {
//       console.warn('⚠️ [USER] Empty message - not sending');
//       return;
//     }

//     const messageData = {
//       threadId: chatSessionId,
//       senderId: USER_ID,
//       receiverId: ASTROLOGER_ID,
//       message: input.trim(),
//     };

//     console.log('📤 [USER] Sending message:', messageData);

//     // Emit via socket for real-time delivery
//     chatSocket.emit('send_message', messageData);

//     // Update UI immediately (optimistic update)
//     setMessages((prev) => [
//       {
//         _id: Date.now(),
//         text: input.trim(),
//         user: { _id: 'user' },
//         createdAt: new Date(),
//       },
//       ...prev,
//     ]);

//     setInput('');
//   };

//   // ============================================
//   // END CHAT (API CALL)
//   // ============================================
//   const handleEndChat = async () => {
//     if (!chatSessionId) return;

//     Alert.alert(
//       'End Chat?',
//       'Are you sure you want to end this chat session?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'End Chat',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               console.log('🔚 [USER] Ending chat session');

//               const response = await ChatService.endChatSession(
//                 chatSessionId,
//                 'Session ended by user'
//               );

//               if (!response.success) {
//                 throw new Error(response.message);
//               }

//               setChatStatus('ended');
//               setChatSessionId(null);
//               setMessages([]);

//               Alert.alert(
//                 'Chat Ended',
//                 `Duration: ${response.data.duration} mins\nTotal: ₹${response.data.totalAmount}`,
//                 [{ text: 'OK', onPress: () => navigation.goBack() }]
//               );
//             } catch (error) {
//               console.error('❌ [USER] End chat error:', error);
//               Alert.alert('Error', error.message);
//             }
//           },
//         },
//       ]
//     );
//   };

//   // ============================================
//   // RENDER MESSAGE
//   // ============================================
//   const renderMessage = ({ item }) => {
//     const isUser = item.user?._id === 'user';
//     return (
//       <View
//         style={[
//           styles.messageBubble,
//           isUser ? styles.userBubble : styles.astrologerBubble,
//         ]}
//       >
//         <Text style={styles.messageText}>{item.text}</Text>
//       </View>
//     );
//   };

//   // ============================================
//   // UI RENDER
//   // ============================================
//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Socket Status Bar */}
//       <View style={styles.statusBar}>
//         <View
//           style={[
//             styles.statusDot,
//             { backgroundColor: isSocketConnected ? '#4CAF50' : '#F44336' },
//           ]}
//         />
//         <Text style={styles.statusText}>
//           {isSocketConnected ? 'Connected' : 'Disconnected'}
//         </Text>
//         {socketId && (
//           <Text style={styles.socketIdText}> • {socketId.substring(0, 8)}</Text>
//         )}

//         {/* End Chat Button */}
//         {chatStatus === 'active' && (
//           <TouchableOpacity onPress={handleEndChat} style={styles.endBtn}>
//             <Text style={styles.endBtnText}>End</Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       {/* Start Chat Button */}
//       {chatStatus === 'idle' && !chatSessionId && (
//         <TouchableOpacity
//           style={[
//             styles.startChatBtn,
//             !isSocketConnected && styles.startChatBtnDisabled,
//           ]}
//           onPress={handleStartChat}
//           disabled={!isSocketConnected}
//         >
//           <Text style={styles.startChatBtnText}>
//             {!isSocketConnected
//               ? 'Connecting to server...'
//               : 'Start Chat with Astrologer'}
//           </Text>
//         </TouchableOpacity>
//       )}

//       {/* Loading State */}
//       {chatStatus === 'loading' && (
//         <View style={styles.centerContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.statusMessage}>Creating session...</Text>
//         </View>
//       )}

//       {/* Waiting for Acceptance */}
//       {chatStatus === 'waiting' && (
//         <View style={styles.centerContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.statusMessage}>
//             Waiting for astrologer to accept...
//           </Text>
//         </View>
//       )}

//       {/* Active Chat - Messages List */}
//       {chatStatus === 'active' && (
//         <>
//           <FlatList
//             ref={flatListRef}
//             data={messages}
//             inverted
//             keyExtractor={(item) => item._id.toString()}
//             renderItem={renderMessage}
//             contentContainerStyle={{ padding: 12 }}
//           />

//           {/* Input Area */}
//           <KeyboardAvoidingView
//             style={styles.inputContainer}
//             behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//           >
//             <TextInput
//               value={input}
//               onChangeText={setInput}
//               placeholder="Type your message"
//               style={styles.input}
//             />
//             <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
//               <Icon name="send" size={28} color="#007AFF" />
//             </TouchableOpacity>
//           </KeyboardAvoidingView>
//         </>
//       )}

//       {/* Chat Ended */}
//       {chatStatus === 'ended' && (
//         <View style={styles.centerContainer}>
//           <Text style={styles.endedText}>Chat session has ended</Text>
//           <TouchableOpacity
//             style={styles.backBtn}
//             onPress={() => navigation.goBack()}
//           >
//             <Text style={styles.backBtnText}>Go Back</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// };

// // ============================================
// // STYLES
// // ============================================
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#fff' },
//   statusBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//     backgroundColor: '#f5f5f5',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   statusDot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     marginRight: 8,
//   },
//   statusText: { fontSize: 13, fontWeight: '600', color: '#333' },
//   socketIdText: { fontSize: 11, color: '#666', flex: 1 },
//   endBtn: {
//     backgroundColor: '#FF3B30',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 6,
//   },
//   endBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
//   startChatBtn: {
//     backgroundColor: '#007AFF',
//     padding: 15,
//     margin: 12,
//     borderRadius: 10,
//     alignItems: 'center',
//   },
//   startChatBtnDisabled: { backgroundColor: '#CCCCCC' },
//   startChatBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
//   centerContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   statusMessage: {
//     marginTop: 12,
//     fontSize: 14,
//     color: '#666',
//     fontStyle: 'italic',
//   },
//   messageBubble: {
//     borderRadius: 15,
//     padding: 12,
//     marginVertical: 6,
//     maxWidth: '75%',
//   },
//   userBubble: {
//     backgroundColor: '#DCF8C6',
//     alignSelf: 'flex-end',
//   },
//   astrologerBubble: {
//     backgroundColor: '#E5E5EA',
//     alignSelf: 'flex-start',
//   },
//   messageText: { fontSize: 16, color: '#000' },
//   inputContainer: {
//     flexDirection: 'row',
//     padding: 12,
//     borderTopWidth: 1,
//     borderColor: '#eee',
//     backgroundColor: '#fff',
//     alignItems: 'center',
//   },
//   input: {
//     flex: 1,
//     paddingHorizontal: 12,
//     height: 44,
//     fontSize: 16,
//     backgroundColor: '#f1f1f1',
//     borderRadius: 24,
//   },
//   sendBtn: { marginLeft: 12 },
//   endedText: { fontSize: 18, color: '#999', marginBottom: 20 },
//   backBtn: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   backBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
// });

// export default ChatScreen;




// // src/screens/chat/ChatScreen.js (USER SIDE - DEBUG VERSION)
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
//   Alert,
//   ActivityIndicator,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { ChatService } from '../../services/api/chat/ChatService';
// import chatSocket from '../../services/api/socket/chatSocket';

// const USER_ID = '68eba7c81bd75c055cf164ab';
// const ASTROLOGER_ID = '68f55913fcac5b00b4225a8e';

// const ChatScreen = ({ navigation }) => {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState('');
//   const [chatSessionId, setChatSessionId] = useState(null);
//   const [chatStatus, setChatStatus] = useState('idle');
//   const [isSocketConnected, setIsSocketConnected] = useState(false);
//   const [socketId, setSocketId] = useState(null);
//   const flatListRef = useRef(null);

//   // ============================================
//   // INITIAL DEBUG CHECK
//   // ============================================
//   useEffect(() => {
//     console.log('==========================================');
//     console.log('🧪 [USER] INITIAL DEBUG CHECK');
//     console.log('🧪 ChatService exists?', !!ChatService);
//     console.log('🧪 ChatService.initiateChat exists?', !!ChatService?.initiateChat);
//     console.log('🧪 chatSocket exists?', !!chatSocket);
//     console.log('🧪 chatSocket.connect exists?', !!chatSocket?.connect);
//     console.log('🧪 USER_ID:', USER_ID);
//     console.log('🧪 ASTROLOGER_ID:', ASTROLOGER_ID);
//     console.log('==========================================');
//   }, []);

//   // ============================================
//   // SOCKET SETUP
//   // ============================================
//   useEffect(() => {
//     console.log('🔄 [USER] Initializing socket connection...');
//     console.log('🔄 [USER] About to call chatSocket.connect with USER_ID:', USER_ID);
    
//     chatSocket.connect(USER_ID);

//     // Connection Events
//     chatSocket.on('connect', () => {
//       const id = chatSocket.getSocketId();
//       console.log('✅ [USER] Socket connected successfully');
//       console.log('🆔 [USER] Socket ID:', id);
//       setIsSocketConnected(true);
//       setSocketId(id);
//     });

//     chatSocket.on('disconnect', (reason) => {
//       console.log('❌ [USER] Socket disconnected. Reason:', reason);
//       setIsSocketConnected(false);
//       setSocketId(null);
//     });

//     chatSocket.on('connect_error', (error) => {
//       console.error('🔴 [USER] Socket connection error:', error.message);
//       Alert.alert('Connection Error', `Socket failed: ${error.message}`);
//     });

//     // ✅ CHAT ACCEPTED BY ASTROLOGER
//     chatSocket.on('chat_accepted', (data) => {
//       console.log('✅ [USER] Chat accepted by astrologer:', data);
//       if (data.threadId === chatSessionId) {
//         setChatStatus('active');
//         Alert.alert('Chat Started! 🎉', 'Astrologer has accepted your request. You can now chat!');
//       }
//     });

//     // ✅ CHAT REJECTED BY ASTROLOGER
//     chatSocket.on('chat_rejected', (data) => {
//       console.log('❌ [USER] Chat rejected by astrologer:', data);
//       if (data.threadId === chatSessionId) {
//         setChatStatus('rejected');
//         Alert.alert('Chat Declined', 'Astrologer rejected the request. Amount has been refunded to your wallet.');
//         setChatSessionId(null);
//         setMessages([]);
//       }
//     });

//     // ✅ INCOMING MESSAGE FROM ASTROLOGER
//     chatSocket.on('chat_message', (msg) => {
//       console.log('📩 [USER] Received message:', msg);
//       if (msg.threadId === chatSessionId) {
//         setMessages((prev) => [
//           {
//             _id: Date.now() + Math.random(),
//             text: msg.message,
//             user: { _id: msg.senderId === USER_ID ? 'user' : 'astrologer' },
//             createdAt: new Date(),
//           },
//           ...prev,
//         ]);
//       }
//     });

//     // ✅ CHAT ENDED BY ASTROLOGER
//     chatSocket.on('chat_ended', (data) => {
//       console.log('🔚 [USER] Chat ended by astrologer:', data);
//       if (data.threadId === chatSessionId) {
//         setChatStatus('ended');
//         Alert.alert(
//           'Chat Ended',
//           `Duration: ${data.duration || 'N/A'} mins\nTotal: ₹${data.totalAmount || 'N/A'}`,
//           [{ text: 'OK', onPress: () => navigation.goBack() }]
//         );
//       }
//     });

//     // Check initial connection
//     const initialStatus = chatSocket.isConnected();
//     console.log('🔍 [USER] Initial connection status:', initialStatus);
//     setIsSocketConnected(initialStatus);
//     if (initialStatus) {
//       setSocketId(chatSocket.getSocketId());
//     }

//     // Cleanup
//     return () => {
//       console.log('🧹 [USER] Cleaning up socket listeners');
//       chatSocket.off('connect');
//       chatSocket.off('disconnect');
//       chatSocket.off('connect_error');
//       chatSocket.off('chat_accepted');
//       chatSocket.off('chat_rejected');
//       chatSocket.off('chat_message');
//       chatSocket.off('chat_ended');
//       chatSocket.disconnect();
//     };
//   }, []);

//   // ============================================
//   // START CHAT (API + SOCKET) - WITH EXTENSIVE DEBUGGING
//   // ============================================
//   const handleStartChat = async () => {
//     console.log('==========================================');
//     console.log('🚀 [USER] START CHAT BUTTON PRESSED');
//     console.log('==========================================');
    
//     try {
//       console.log('1️⃣ [USER] Starting chat with astrologer:', ASTROLOGER_ID);
//       console.log('2️⃣ [USER] Socket connected?', isSocketConnected);
//       console.log('3️⃣ [USER] Socket ID:', socketId);
//       console.log('4️⃣ [USER] chatSocket.isConnected():', chatSocket.isConnected());

//       if (!isSocketConnected) {
//         console.error('❌ [USER] Socket NOT connected - aborting');
//         Alert.alert('Connection Error', 'Socket not connected. Please restart app and try again.');
//         return;
//       }

//       console.log('5️⃣ [USER] Setting status to loading...');
//       setChatStatus('loading');

//       // ✅ STEP 1: API Call to Create Session
//       console.log('6️⃣ [USER] About to call ChatService.initiateChat...');
//       console.log('6️⃣ [USER] ChatService:', ChatService);
//       console.log('6️⃣ [USER] ChatService.initiateChat:', ChatService.initiateChat);
//       console.log('6️⃣ [USER] Astrologer ID param:', ASTROLOGER_ID);
      
//       const sessionRes = await ChatService.initiateChat(ASTROLOGER_ID);
      
//       console.log('7️⃣ [USER] API call completed');
//       console.log('7️⃣ [USER] Response type:', typeof sessionRes);
//       console.log('7️⃣ [USER] Response:', sessionRes);
//       console.log('7️⃣ [USER] Response.success:', sessionRes?.success);
//       console.log('7️⃣ [USER] Response.data:', sessionRes?.data);
//       console.log('7️⃣ [USER] Response.data.sessionId:', sessionRes?.data?.sessionId);

//       if (!sessionRes || !sessionRes.success) {
//         console.error('❌ [USER] API call failed');
//         console.error('❌ [USER] Response:', sessionRes);
//         throw new Error(sessionRes?.message || 'Failed to create session');
//       }

//       const sessionId = sessionRes.data?.sessionId;
//       if (!sessionId) {
//         console.error('❌ [USER] No sessionId in response');
//         throw new Error('No sessionId in response');
//       }

//       console.log('8️⃣ [USER] Session created with ID:', sessionId);

//       setChatSessionId(sessionId);
//       setChatStatus('waiting');
//       console.log('9️⃣ [USER] State updated - sessionId and status set');

//       // ✅ STEP 2: Socket Event to Notify Astrologer
//       const requestData = {
//         userId: USER_ID,
//         astrologerId: ASTROLOGER_ID,
//         threadId: sessionId,
//       };

//       console.log('🔟 [USER] About to emit chat_request');
//       console.log('🔟 [USER] Request data:', requestData);
//       console.log('🔟 [USER] Socket connected?', chatSocket.isConnected());

//       chatSocket.emit('chat_request', requestData, (resp) => {
//         console.log('1️⃣1️⃣ [USER] chat_request callback received');
//         console.log('1️⃣1️⃣ [USER] Callback response:', resp);
        
//         if (resp && !resp.success) {
//           console.error('❌ [USER] Chat request callback failed:', resp.message);
//           setChatStatus('idle');
//           Alert.alert('Request Failed', resp.message);
//         } else {
//           console.log('✅ [USER] Chat request callback success');
//         }
//       });

//       console.log('1️⃣2️⃣ [USER] chat_request emitted successfully');
//       console.log('==========================================');
//     } catch (err) {
//       console.error('==========================================');
//       console.error('❌ [USER] EXCEPTION CAUGHT');
//       console.error('❌ [USER] Error message:', err.message);
//       console.error('❌ [USER] Error stack:', err.stack);
//       console.error('❌ [USER] Full error:', err);
//       console.error('==========================================');
//       setChatStatus('idle');
//       Alert.alert('Error', err.message);
//     }
//   };

//   // ============================================
//   // SEND MESSAGE
//   // ============================================
//   const sendMessage = () => {
//     if (!chatSessionId || chatStatus !== 'active') {
//       Alert.alert('Wait', 'Chat is not active yet. Waiting for astrologer...');
//       console.warn('⚠️ [USER] Cannot send - chat status:', chatStatus);
//       return;
//     }

//     if (!input.trim()) {
//       console.warn('⚠️ [USER] Empty message - not sending');
//       return;
//     }

//     const messageData = {
//       threadId: chatSessionId,
//       senderId: USER_ID,
//       receiverId: ASTROLOGER_ID,
//       message: input.trim(),
//     };

//     console.log('📤 [USER] Sending message:', messageData);

//     chatSocket.emit('send_message', messageData);

//     setMessages((prev) => [
//       {
//         _id: Date.now(),
//         text: input.trim(),
//         user: { _id: 'user' },
//         createdAt: new Date(),
//       },
//       ...prev,
//     ]);

//     setInput('');
//   };

//   // ============================================
//   // END CHAT
//   // ============================================
//   const handleEndChat = async () => {
//     if (!chatSessionId) return;

//     Alert.alert(
//       'End Chat?',
//       'Are you sure you want to end this chat session?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'End Chat',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               console.log('🔚 [USER] Ending chat session');

//               const response = await ChatService.endChatSession(
//                 chatSessionId,
//                 'Session ended by user'
//               );

//               if (!response.success) {
//                 throw new Error(response.message);
//               }

//               setChatStatus('ended');
//               setChatSessionId(null);
//               setMessages([]);

//               Alert.alert(
//                 'Chat Ended',
//                 `Duration: ${response.data.duration} mins\nTotal: ₹${response.data.totalAmount}`,
//                 [{ text: 'OK', onPress: () => navigation.goBack() }]
//               );
//             } catch (error) {
//               console.error('❌ [USER] End chat error:', error);
//               Alert.alert('Error', error.message);
//             }
//           },
//         },
//       ]
//     );
//   };

//   // ============================================
//   // RENDER MESSAGE
//   // ============================================
//   const renderMessage = ({ item }) => {
//     const isUser = item.user?._id === 'user';
//     return (
//       <View
//         style={[
//           styles.messageBubble,
//           isUser ? styles.userBubble : styles.astrologerBubble,
//         ]}
//       >
//         <Text style={styles.messageText}>{item.text}</Text>
//       </View>
//     );
//   };

//   // ============================================
//   // UI RENDER
//   // ============================================
//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Socket Status Bar */}
//       <View style={styles.statusBar}>
//         <View
//           style={[
//             styles.statusDot,
//             { backgroundColor: isSocketConnected ? '#4CAF50' : '#F44336' },
//           ]}
//         />
//         <Text style={styles.statusText}>
//           {isSocketConnected ? 'Connected' : 'Disconnected'}
//         </Text>
//         {socketId && (
//           <Text style={styles.socketIdText}> • {socketId.substring(0, 8)}</Text>
//         )}

//         {/* End Chat Button */}
//         {chatStatus === 'active' && (
//           <TouchableOpacity onPress={handleEndChat} style={styles.endBtn}>
//             <Text style={styles.endBtnText}>End</Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       {/* Start Chat Button */}
//       {chatStatus === 'idle' && !chatSessionId && (
//         <TouchableOpacity
//           style={[
//             styles.startChatBtn,
//             !isSocketConnected && styles.startChatBtnDisabled,
//           ]}
//           onPress={handleStartChat}
//           disabled={!isSocketConnected}
//         >
//           <Text style={styles.startChatBtnText}>
//             {!isSocketConnected
//               ? 'Connecting to server...'
//               : 'Start Chat with Astrologer'}
//           </Text>
//         </TouchableOpacity>
//       )}

//       {/* Loading State */}
//       {chatStatus === 'loading' && (
//         <View style={styles.centerContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.statusMessage}>Creating session...</Text>
//         </View>
//       )}

//       {/* Waiting for Acceptance */}
//       {chatStatus === 'waiting' && (
//         <View style={styles.centerContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.statusMessage}>
//             Waiting for astrologer to accept...
//           </Text>
//         </View>
//       )}

//       {/* Active Chat - Messages List */}
//       {chatStatus === 'active' && (
//         <>
//           <FlatList
//             ref={flatListRef}
//             data={messages}
//             inverted
//             keyExtractor={(item) => item._id.toString()}
//             renderItem={renderMessage}
//             contentContainerStyle={{ padding: 12 }}
//           />

//           {/* Input Area */}
//           <KeyboardAvoidingView
//             style={styles.inputContainer}
//             behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//           >
//             <TextInput
//               value={input}
//               onChangeText={setInput}
//               placeholder="Type your message"
//               style={styles.input}
//             />
//             <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
//               <Icon name="send" size={28} color="#007AFF" />
//             </TouchableOpacity>
//           </KeyboardAvoidingView>
//         </>
//       )}

//       {/* Chat Ended */}
//       {chatStatus === 'ended' && (
//         <View style={styles.centerContainer}>
//           <Text style={styles.endedText}>Chat session has ended</Text>
//           <TouchableOpacity
//             style={styles.backBtn}
//             onPress={() => navigation.goBack()}
//           >
//             <Text style={styles.backBtnText}>Go Back</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// };

// // ... (styles remain same)

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#fff' },
//   statusBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//     backgroundColor: '#f5f5f5',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   statusDot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     marginRight: 8,
//   },
//   statusText: { fontSize: 13, fontWeight: '600', color: '#333' },
//   socketIdText: { fontSize: 11, color: '#666', flex: 1 },
//   endBtn: {
//     backgroundColor: '#FF3B30',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 6,
//   },
//   endBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
//   startChatBtn: {
//     backgroundColor: '#007AFF',
//     padding: 15,
//     margin: 12,
//     borderRadius: 10,
//     alignItems: 'center',
//   },
//   startChatBtnDisabled: { backgroundColor: '#CCCCCC' },
//   startChatBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
//   centerContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   statusMessage: {
//     marginTop: 12,
//     fontSize: 14,
//     color: '#666',
//     fontStyle: 'italic',
//   },
//   messageBubble: {
//     borderRadius: 15,
//     padding: 12,
//     marginVertical: 6,
//     maxWidth: '75%',
//   },
//   userBubble: {
//     backgroundColor: '#DCF8C6',
//     alignSelf: 'flex-end',
//   },
//   astrologerBubble: {
//     backgroundColor: '#E5E5EA',
//     alignSelf: 'flex-start',
//   },
//   messageText: { fontSize: 16, color: '#000' },
//   inputContainer: {
//     flexDirection: 'row',
//     padding: 12,
//     borderTopWidth: 1,
//     borderColor: '#eee',
//     backgroundColor: '#fff',
//     alignItems: 'center',
//   },
//   input: {
//     flex: 1,
//     paddingHorizontal: 12,
//     height: 44,
//     fontSize: 16,
//     backgroundColor: '#f1f1f1',
//     borderRadius: 24,
//   },
//   sendBtn: { marginLeft: 12 },
//   endedText: { fontSize: 18, color: '#999', marginBottom: 20 },
//   backBtn: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   backBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
// });

// export default ChatScreen;

// // src/screens/chat/ChatScreen.js (USER SIDE - FIXED)
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
//   Alert,
//   ActivityIndicator,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { ChatService } from '../../services/api/chat/ChatService';
// import chatSocket from '../../services/api/socket/chatSocket';

// const USER_ID = '68eba7c81bd75c055cf164ab';
// const ASTROLOGER_ID = '68f55913fcac5b00b4225a8e';

// const ChatScreen = ({ navigation }) => {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState('');
//   const [chatSessionId, setChatSessionId] = useState(null);
//   const [chatStatus, setChatStatus] = useState('idle');
//   const [isSocketConnected, setIsSocketConnected] = useState(false);
//   const [socketId, setSocketId] = useState(null);
//   const flatListRef = useRef(null);

//   // ✅ USE REF to avoid dependency issues
//   const chatSessionIdRef = useRef(null);

//   // ✅ Update ref whenever chatSessionId changes
//   useEffect(() => {
//     chatSessionIdRef.current = chatSessionId;
//   }, [chatSessionId]);

//   // ============================================
//   // INITIAL DEBUG CHECK
//   // ============================================
//   useEffect(() => {
//     console.log('==========================================');
//     console.log('🧪 [USER] INITIAL DEBUG CHECK');
//     console.log('🧪 ChatService exists?', !!ChatService);
//     console.log('🧪 ChatService.initiateChat exists?', !!ChatService?.initiateChat);
//     console.log('🧪 chatSocket exists?', !!chatSocket);
//     console.log('🧪 chatSocket.connect exists?', !!chatSocket?.connect);
//     console.log('🧪 USER_ID:', USER_ID);
//     console.log('🧪 ASTROLOGER_ID:', ASTROLOGER_ID);
//     console.log('==========================================');
//   }, []);

//   // ============================================
//   // SOCKET SETUP - RUNS ONCE ON MOUNT
//   // ============================================
//   useEffect(() => {
//     console.log('🔄 [USER] Initializing socket connection...');
//     console.log('🔄 [USER] About to call chatSocket.connect with USER_ID:', USER_ID);
    
//     chatSocket.connect(USER_ID);

//     // Connection Events
//     chatSocket.on('connect', () => {
//       const id = chatSocket.getSocketId();
//       console.log('✅ [USER] Socket connected successfully');
//       console.log('🆔 [USER] Socket ID:', id);
//       setIsSocketConnected(true);
//       setSocketId(id);
//     });

//     chatSocket.on('disconnect', (reason) => {
//       console.log('❌ [USER] Socket disconnected. Reason:', reason);
//       setIsSocketConnected(false);
//       setSocketId(null);
//     });

//     chatSocket.on('connect_error', (error) => {
//       console.error('🔴 [USER] Socket connection error:', error.message);
//       Alert.alert('Connection Error', `Socket failed: ${error.message}`);
//     });

//     // ✅ CHAT ACCEPTED BY ASTROLOGER - Use ref
//     chatSocket.on('chat_accepted', (data) => {
//       console.log('✅ [USER] Chat accepted by astrologer:', data);
      
//       // ✅ Use ref instead of state to avoid dependency issues
//       if (data.threadId === chatSessionIdRef.current) {
//         setChatStatus('active');
//         Alert.alert('Chat Started! 🎉', 'Astrologer has accepted your request. You can now chat!');
//       }
//     });

//     // ✅ CHAT REJECTED BY ASTROLOGER - Use ref
//     chatSocket.on('chat_rejected', (data) => {
//       console.log('❌ [USER] Chat rejected by astrologer:', data);
      
//       // ✅ Use ref instead of state
//       if (data.threadId === chatSessionIdRef.current) {
//         setChatStatus('rejected');
//         Alert.alert('Chat Declined', 'Astrologer rejected the request. Amount has been refunded to your wallet.');
//         setChatSessionId(null);
//         setMessages([]);
//       }
//     });

//     // ✅ INCOMING MESSAGE FROM ASTROLOGER - Use ref
//     chatSocket.on('chat_message', (msg) => {
//       console.log('📩 [USER] Received message:', msg);
      
//       // ✅ Use ref instead of state
//       if (msg.threadId === chatSessionIdRef.current) {
//         setMessages((prev) => [
//           {
//             _id: Date.now() + Math.random(),
//             text: msg.message,
//             user: { _id: msg.senderId === USER_ID ? 'user' : 'astrologer' },
//             createdAt: new Date(),
//           },
//           ...prev,
//         ]);
//       }
//     });

//     // ✅ CHAT ENDED BY ASTROLOGER - Use ref
//     chatSocket.on('chat_ended', (data) => {
//       console.log('🔚 [USER] Chat ended by astrologer:', data);
      
//       // ✅ Use ref instead of state
//       if (data.threadId === chatSessionIdRef.current) {
//         setChatStatus('ended');
//         Alert.alert(
//           'Chat Ended',
//           `Duration: ${data.duration || 'N/A'} mins\nTotal: ₹${data.totalAmount || 'N/A'}`,
//           [{ text: 'OK', onPress: () => navigation.goBack() }]
//         );
//       }
//     });

//     // Check initial connection
//     const initialStatus = chatSocket.isConnected();
//     console.log('🔍 [USER] Initial connection status:', initialStatus);
//     setIsSocketConnected(initialStatus);
//     if (initialStatus) {
//       setSocketId(chatSocket.getSocketId());
//     }

//     // ✅ Cleanup ONLY on component unmount
//     return () => {
//       console.log('🧹 [USER] Component unmounting - cleaning up');
//       chatSocket.off('connect');
//       chatSocket.off('disconnect');
//       chatSocket.off('connect_error');
//       chatSocket.off('chat_accepted');
//       chatSocket.off('chat_rejected');
//       chatSocket.off('chat_message');
//       chatSocket.off('chat_ended');
//       chatSocket.disconnect();
//     };
//   }, []); // ✅ EMPTY ARRAY - runs once on mount

//   // ============================================
//   // START CHAT (API + SOCKET)
//   // ============================================
//   const handleStartChat = async () => {
//     console.log('==========================================');
//     console.log('🚀 [USER] START CHAT BUTTON PRESSED');
//     console.log('==========================================');
    
//     try {
//       console.log('1️⃣ [USER] Starting chat with astrologer:', ASTROLOGER_ID);
//       console.log('2️⃣ [USER] Socket connected?', isSocketConnected);
//       console.log('3️⃣ [USER] Socket ID:', socketId);
//       console.log('4️⃣ [USER] chatSocket.isConnected():', chatSocket.isConnected());

//       if (!isSocketConnected) {
//         console.error('❌ [USER] Socket NOT connected - aborting');
//         Alert.alert('Connection Error', 'Socket not connected. Please restart app and try again.');
//         return;
//       }

//       console.log('5️⃣ [USER] Setting status to loading...');
//       setChatStatus('loading');

//       // ✅ STEP 1: API Call to Create Session
//       console.log('6️⃣ [USER] About to call ChatService.initiateChat...');
//       console.log('6️⃣ [USER] ChatService:', ChatService);
//       console.log('6️⃣ [USER] ChatService.initiateChat:', ChatService.initiateChat);
//       console.log('6️⃣ [USER] Astrologer ID param:', ASTROLOGER_ID);
      
//       const sessionRes = await ChatService.initiateChat(ASTROLOGER_ID);
      
//       console.log('7️⃣ [USER] API call completed');
//       console.log('7️⃣ [USER] Response type:', typeof sessionRes);
//       console.log('7️⃣ [USER] Response:', sessionRes);
//       console.log('7️⃣ [USER] Response.success:', sessionRes?.success);
//       console.log('7️⃣ [USER] Response.data:', sessionRes?.data);
//       console.log('7️⃣ [USER] Response.data.sessionId:', sessionRes?.data?.sessionId);

//       if (!sessionRes || !sessionRes.success) {
//         console.error('❌ [USER] API call failed');
//         console.error('❌ [USER] Response:', sessionRes);
//         throw new Error(sessionRes?.message || 'Failed to create session');
//       }

//       const sessionId = sessionRes.data?.sessionId;
//       if (!sessionId) {
//         console.error('❌ [USER] No sessionId in response');
//         throw new Error('No sessionId in response');
//       }

//       console.log('8️⃣ [USER] Session created with ID:', sessionId);

//       setChatSessionId(sessionId);
//       setChatStatus('waiting');
//       console.log('9️⃣ [USER] State updated - sessionId and status set');

//       // ✅ STEP 2: Socket Event to Notify Astrologer
//       const requestData = {
//         userId: USER_ID,
//         astrologerId: ASTROLOGER_ID,
//         threadId: sessionId,
//       };

//       console.log('🔟 [USER] About to emit chat_request');
//       console.log('🔟 [USER] Request data:', requestData);
//       console.log('🔟 [USER] Socket connected?', chatSocket.isConnected());

//       chatSocket.emit('chat_request', requestData, (resp) => {
//         console.log('1️⃣1️⃣ [USER] chat_request callback received');
//         console.log('1️⃣1️⃣ [USER] Callback response:', resp);
        
//         if (resp && !resp.success) {
//           console.error('❌ [USER] Chat request callback failed:', resp.message);
//           setChatStatus('idle');
//           Alert.alert('Request Failed', resp.message);
//         } else {
//           console.log('✅ [USER] Chat request callback success');
//         }
//       });

//       console.log('1️⃣2️⃣ [USER] chat_request emitted successfully');
//       console.log('==========================================');
//     } catch (err) {
//       console.error('==========================================');
//       console.error('❌ [USER] EXCEPTION CAUGHT');
//       console.error('❌ [USER] Error message:', err.message);
//       console.error('❌ [USER] Error stack:', err.stack);
//       console.error('❌ [USER] Full error:', err);
//       console.error('==========================================');
//       setChatStatus('idle');
//       Alert.alert('Error', err.message);
//     }
//   };

//   // ============================================
//   // SEND MESSAGE
//   // ============================================
//   const sendMessage = () => {
//     if (!chatSessionId || chatStatus !== 'active') {
//       Alert.alert('Wait', 'Chat is not active yet. Waiting for astrologer...');
//       console.warn('⚠️ [USER] Cannot send - chat status:', chatStatus);
//       return;
//     }

//     if (!input.trim()) {
//       console.warn('⚠️ [USER] Empty message - not sending');
//       return;
//     }

//     const messageData = {
//       threadId: chatSessionId,
//       senderId: USER_ID,
//       receiverId: ASTROLOGER_ID,
//       message: input.trim(),
//     };

//     console.log('📤 [USER] Sending message:', messageData);

//     chatSocket.emit('send_message', messageData);

//     setMessages((prev) => [
//       {
//         _id: Date.now(),
//         text: input.trim(),
//         user: { _id: 'user' },
//         createdAt: new Date(),
//       },
//       ...prev,
//     ]);

//     setInput('');
//   };

//   // ============================================
//   // END CHAT
//   // ============================================
//   const handleEndChat = async () => {
//     if (!chatSessionId) return;

//     Alert.alert(
//       'End Chat?',
//       'Are you sure you want to end this chat session?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'End Chat',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               console.log('🔚 [USER] Ending chat session');

//               const response = await ChatService.endChatSession(
//                 chatSessionId,
//                 'Session ended by user'
//               );

//               if (!response.success) {
//                 throw new Error(response.message);
//               }

//               setChatStatus('ended');
//               setChatSessionId(null);
//               setMessages([]);

//               Alert.alert(
//                 'Chat Ended',
//                 `Duration: ${response.data.duration} mins\nTotal: ₹${response.data.totalAmount}`,
//                 [{ text: 'OK', onPress: () => navigation.goBack() }]
//               );
//             } catch (error) {
//               console.error('❌ [USER] End chat error:', error);
//               Alert.alert('Error', error.message);
//             }
//           },
//         },
//       ]
//     );
//   };

//   // ============================================
//   // RENDER MESSAGE
//   // ============================================
//   const renderMessage = ({ item }) => {
//     const isUser = item.user?._id === 'user';
//     return (
//       <View
//         style={[
//           styles.messageBubble,
//           isUser ? styles.userBubble : styles.astrologerBubble,
//         ]}
//       >
//         <Text style={styles.messageText}>{item.text}</Text>
//       </View>
//     );
//   };

//   // ============================================
//   // UI RENDER
//   // ============================================
//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Socket Status Bar */}
//       <View style={styles.statusBar}>
//         <View
//           style={[
//             styles.statusDot,
//             { backgroundColor: isSocketConnected ? '#4CAF50' : '#F44336' },
//           ]}
//         />
//         <Text style={styles.statusText}>
//           {isSocketConnected ? 'Connected' : 'Disconnected'}
//         </Text>
//         {socketId && (
//           <Text style={styles.socketIdText}> • {socketId.substring(0, 8)}</Text>
//         )}

//         {/* End Chat Button */}
//         {chatStatus === 'active' && (
//           <TouchableOpacity onPress={handleEndChat} style={styles.endBtn}>
//             <Text style={styles.endBtnText}>End</Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       {/* Start Chat Button */}
//       {chatStatus === 'idle' && !chatSessionId && (
//         <TouchableOpacity
//           style={[
//             styles.startChatBtn,
//             !isSocketConnected && styles.startChatBtnDisabled,
//           ]}
//           onPress={handleStartChat}
//           disabled={!isSocketConnected}
//         >
//           <Text style={styles.startChatBtnText}>
//             {!isSocketConnected
//               ? 'Connecting to server...'
//               : 'Start Chat with Astrologer'}
//           </Text>
//         </TouchableOpacity>
//       )}

//       {/* Loading State */}
//       {chatStatus === 'loading' && (
//         <View style={styles.centerContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.statusMessage}>Creating session...</Text>
//         </View>
//       )}

//       {/* Waiting for Acceptance */}
//       {chatStatus === 'waiting' && (
//         <View style={styles.centerContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.statusMessage}>
//             Waiting for astrologer to accept...
//           </Text>
//         </View>
//       )}

//       {/* Active Chat - Messages List */}
//       {chatStatus === 'active' && (
//         <>
//           <FlatList
//             ref={flatListRef}
//             data={messages}
//             inverted
//             keyExtractor={(item) => item._id.toString()}
//             renderItem={renderMessage}
//             contentContainerStyle={{ padding: 12 }}
//           />

//           {/* Input Area */}
//           <KeyboardAvoidingView
//             style={styles.inputContainer}
//             behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//           >
//             <TextInput
//               value={input}
//               onChangeText={setInput}
//               placeholder="Type your message"
//               style={styles.input}
//             />
//             <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
//               <Icon name="send" size={28} color="#007AFF" />
//             </TouchableOpacity>
//           </KeyboardAvoidingView>
//         </>
//       )}

//       {/* Chat Ended */}
//       {chatStatus === 'ended' && (
//         <View style={styles.centerContainer}>
//           <Text style={styles.endedText}>Chat session has ended</Text>
//           <TouchableOpacity
//             style={styles.backBtn}
//             onPress={() => navigation.goBack()}
//           >
//             <Text style={styles.backBtnText}>Go Back</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// };

// // Styles remain the same...
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#fff' },
//   statusBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//     backgroundColor: '#f5f5f5',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   statusDot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     marginRight: 8,
//   },
//   statusText: { fontSize: 13, fontWeight: '600', color: '#333' },
//   socketIdText: { fontSize: 11, color: '#666', flex: 1 },
//   endBtn: {
//     backgroundColor: '#FF3B30',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 6,
//   },
//   endBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
//   startChatBtn: {
//     backgroundColor: '#007AFF',
//     padding: 15,
//     margin: 12,
//     borderRadius: 10,
//     alignItems: 'center',
//   },
//   startChatBtnDisabled: { backgroundColor: '#CCCCCC' },
//   startChatBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
//   centerContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   statusMessage: {
//     marginTop: 12,
//     fontSize: 14,
//     color: '#666',
//     fontStyle: 'italic',
//   },
//   messageBubble: {
//     borderRadius: 15,
//     padding: 12,
//     marginVertical: 6,
//     maxWidth: '75%',
//   },
//   userBubble: {
//     backgroundColor: '#DCF8C6',
//     alignSelf: 'flex-end',
//   },
//   astrologerBubble: {
//     backgroundColor: '#E5E5EA',
//     alignSelf: 'flex-start',
//   },
//   messageText: { fontSize: 16, color: '#000' },
//   inputContainer: {
//     flexDirection: 'row',
//     padding: 12,
//     borderTopWidth: 1,
//     borderColor: '#eee',
//     backgroundColor: '#fff',
//     alignItems: 'center',
//   },
//   input: {
//     flex: 1,
//     paddingHorizontal: 12,
//     height: 44,
//     fontSize: 16,
//     backgroundColor: '#f1f1f1',
//     borderRadius: 24,
//   },
//   sendBtn: { marginLeft: 12 },
//   endedText: { fontSize: 18, color: '#999', marginBottom: 20 },
//   backBtn: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   backBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
// });

// export default ChatScreen;


// src/screens/chat/ChatScreen.js (USER SIDE - UPDATED)

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
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ChatService } from '../../services/api/chat/ChatService';
import chatSocket from '../../services/api/socket/chatSocket';

const USER_ID = '68eba7c81bd75c055cf164ab';
const ASTROLOGER_ID = '68f55913fcac5b00b4225a8e';

const ChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatSessionId, setChatSessionId] = useState(null);
  const [chatStatus, setChatStatus] = useState('idle');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const flatListRef = useRef(null);

  const chatSessionIdRef = useRef(null);

  useEffect(() => {
    chatSessionIdRef.current = chatSessionId;
  }, [chatSessionId]);

  useEffect(() => {
    console.log('🔄 [USER] Initializing socket connection...');
    chatSocket.connect(USER_ID);

    chatSocket.on('connect', () => {
      setIsSocketConnected(true);
      setSocketId(chatSocket.getSocketId());
      if (USER_ID) {
        chatSocket.emit('join_room', USER_ID);
      }
    });

    chatSocket.on('disconnect', (reason) => {
      setIsSocketConnected(false);
      setSocketId(null);
    });

    chatSocket.on('connect_error', (error) => {
      Alert.alert('Connection Error', `Socket failed: ${error.message}`);
    });

    // Listen for chat accepted event
    chatSocket.on('chat_accepted', (data) => {
      console.log('[USER] Chat accepted by astrologer:', data);
      if (data.threadId === chatSessionIdRef.current) {
        setChatStatus('active');
        Alert.alert('Chat Started! 🎉', 'Astrologer has accepted your request. You can now chat!');
      }
    });

    // Listen for chat rejected event
    chatSocket.on('chat_rejected', (data) => {
      console.log('[USER] Chat rejected by astrologer:', data);
      if (data.threadId === chatSessionIdRef.current) {
        setChatStatus('rejected');
        Alert.alert('Chat Declined', 'Astrologer rejected the request. Amount has been refunded to your wallet.');
        setChatSessionId(null);
        setMessages([]);
      }
    });

    // Listen for new messages
    chatSocket.on('chat_message', (msg) => {
      if (msg.threadId === chatSessionIdRef.current) {
        setMessages((prev) => [
          {
            _id: Date.now() + Math.random(),
            text: msg.message,
            user: { _id: msg.senderId === USER_ID ? 'user' : 'astrologer' },
            createdAt: new Date(),
          },
          ...prev,
        ]);
      }
    });

    // Listen for chat ended by astrologer
    chatSocket.on('chat_ended', (data) => {
      if (data.threadId === chatSessionIdRef.current) {
        setChatStatus('ended');
        Alert.alert(
          'Chat Ended',
          `Duration: ${data.duration || 'N/A'} mins\nTotal: ₹${data.totalAmount || 'N/A'}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    });

    return () => {
      chatSocket.off('connect');
      chatSocket.off('disconnect');
      chatSocket.off('connect_error');
      chatSocket.off('chat_accepted');
      chatSocket.off('chat_rejected');
      chatSocket.off('chat_message');
      chatSocket.off('chat_ended');
      chatSocket.disconnect();
    };
  }, []);

  const handleStartChat = async () => {
    try {
      if (!isSocketConnected) {
        Alert.alert('Connection Error', 'Socket not connected. Please restart app and try again.');
        return;
      }

      setChatStatus('loading');

      const sessionRes = await ChatService.initiateChat(ASTROLOGER_ID);

      if (!sessionRes || !sessionRes.success) {
        throw new Error(sessionRes?.message || 'Failed to create session');
      }

      const sessionId = sessionRes.data?.sessionId;
      if (!sessionId) throw new Error('No sessionId in response');

      setChatSessionId(sessionId);
      setChatStatus('waiting');

      // Notify astrologer via socket
      const requestData = {
        userId: USER_ID,
        astrologerId: ASTROLOGER_ID,
        threadId: sessionId,
      };

      chatSocket.emit('chat_request', requestData, (resp) => {
        if (resp && !resp.success) {
          Alert.alert('Request Failed', resp.message);
          setChatStatus('idle');
        }
      });
    } catch (err) {
      setChatStatus('idle');
      Alert.alert('Error', err.message);
    }
  };

  const sendMessage = () => {
    if (!chatSessionId || chatStatus !== 'active') {
      Alert.alert('Wait', 'Chat is not active yet. Waiting for astrologer...');
      return;
    }
    if (!input.trim()) return;

    const messageData = {
      threadId: chatSessionId,
      senderId: USER_ID,
      receiverId: ASTROLOGER_ID,
      message: input.trim(),
    };

    chatSocket.emit('send_message', messageData);

    setMessages((prev) => [
      {
        _id: Date.now(),
        text: input.trim(),
        user: { _id: 'user' },
        createdAt: new Date(),
      },
      ...prev,
    ]);
    setInput('');
  };

  const handleEndChat = async () => {
    if (!chatSessionId) return;

    Alert.alert(
      'End Chat?',
      'Are you sure you want to end this chat session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Chat',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ChatService.endChatSession(chatSessionId, 'Session ended by user');
              if (!response.success) throw new Error(response.message);

              setChatStatus('ended');
              setChatSessionId(null);
              setMessages([]);

              Alert.alert('Chat Ended', `Duration: ${response.data.duration} mins\nTotal: ₹${response.data.totalAmount}`, [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  // Render messages
  const renderMessage = ({ item }) => {
    const isUser = item.user?._id === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.astrologerBubble]}>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, { backgroundColor: isSocketConnected ? '#4CAF50' : '#F44336' }]} />
        <Text style={styles.statusText}>{isSocketConnected ? 'Connected' : 'Disconnected'}</Text>
        {socketId && <Text style={styles.socketIdText}> • {socketId.substring(0, 8)}</Text>}
        {chatStatus === 'active' && (
          <TouchableOpacity onPress={handleEndChat} style={styles.endBtn}>
            <Text style={styles.endBtnText}>End</Text>
          </TouchableOpacity>
        )}
      </View>

      {chatStatus === 'idle' && !chatSessionId && (
        <TouchableOpacity
          style={[styles.startChatBtn, !isSocketConnected && styles.startChatBtnDisabled]}
          onPress={handleStartChat}
          disabled={!isSocketConnected}
        >
          <Text style={styles.startChatBtnText}>
            {!isSocketConnected ? 'Connecting to server...' : 'Start Chat with Astrologer'}
          </Text>
        </TouchableOpacity>
      )}

      {chatStatus === 'loading' && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.statusMessage}>Creating session...</Text>
        </View>
      )}

      {chatStatus === 'waiting' && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.statusMessage}>Waiting for astrologer to accept...</Text>
        </View>
      )}

      {chatStatus === 'active' && (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            inverted
            keyExtractor={(item) => item._id.toString()}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: 12 }}
          />
          <KeyboardAvoidingView style={styles.inputContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <TextInput value={input} onChangeText={setInput} placeholder="Type your message" style={styles.input} />
            <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
              <Icon name="send" size={28} color="#007AFF" />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </>
      )}

      {chatStatus === 'ended' && (
        <View style={styles.centerContainer}>
          <Text style={styles.endedText}>Chat session has ended</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: { fontSize: 13, fontWeight: '600', color: '#333' },
  socketIdText: { fontSize: 11, color: '#666', flex: 1 },
  endBtn: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  endBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  startChatBtn: {
    backgroundColor: '#007AFF',
    padding: 15,
    margin: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  startChatBtnDisabled: { backgroundColor: '#CCCCCC' },
  startChatBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusMessage: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
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
  astrologerBubble: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
  },
  messageText: { fontSize: 16, color: '#000' },
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
  sendBtn: { marginLeft: 12 },
  endedText: { fontSize: 18, color: '#999', marginBottom: 20 },
  backBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default ChatScreen;

