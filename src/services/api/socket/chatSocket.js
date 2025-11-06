// import { io } from 'socket.io-client';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Config from '../../../config/env';

// let socket = null;

// /**
//  * Initialize and connect the chat socket.
//  */
// export const initChatSocket = async () => {
//   if (socket && socket.connected) return socket;

//   try {
//     const token = await AsyncStorage.getItem('accessToken');
//     if (!token) {
//       console.warn('⚠️ No access token found in storage');
//     }

//     socket = io(`${Config.SOCKET_URL}/chat`, {
//       transports: ['websocket'],
//       auth: { token },
//       reconnection: true,
//       reconnectionAttempts: 5,
//       reconnectionDelay: 2000,
//       autoConnect: true,
//       forceNew: true,
//     });

//     // ✅ Connection events
//     socket.on('connect', () => {
//       console.log('✅ Connected to chat socket:', socket.id);
//     });

//     socket.on('disconnect', reason => {
//       console.log('⚠️ Chat socket disconnected:', reason);
//     });

//     socket.on('connect_error', err => {
//       console.log('❌ Chat socket connection error:', err.message);
//     });

//     return socket;
//   } catch (error) {
//     console.error('🔥 Socket initialization failed:', error.message);
//     return null;
//   }
// };

// /**
//  * Join chat session room.
//  */
// export const joinChatSession = sessionId => {
//   if (!socket || !socket.connected) {
//     console.warn('⚠️ Cannot join session — socket not connected');
//     return;
//   }
//   socket.emit('joinSession', { sessionId });
//   console.log('📥 Joined chat session:', sessionId);
// };

// /**
//  * Leave chat session room.
//  */
// export const leaveChatSession = sessionId => {
//   if (!socket || !socket.connected) return;
//   socket.emit('leaveSession', { sessionId });
//   console.log('📤 Left chat session:', sessionId);
// };

// /**
//  * Send chat message.
//  */
// export const sendMessageSocket = (sessionId, content) => {
//   if (!socket || !socket.connected) {
//     console.warn('⚠️ Socket not connected, message not sent');
//     return;
//   }
//   socket.emit('sendMessage', { sessionId, content });
//   console.log('💬 Message sent:', content);
// };

// /**
//  * Listen for incoming messages.
//  */
// export const onNewMessage = callback => {
//   if (!socket) return;
//   socket.off('newMessage'); // prevent duplicate listeners
//   socket.on('newMessage', msg => {
//     console.log('📨 Message received:', msg);
//     callback(msg);
//   });
// };

// /**
//  * Typing indicator listeners.
//  */
// export const onTyping = callback => {
//   if (!socket) return;
//   socket.off('typing');
//   socket.on('typing', callback);
// };

// export const emitTyping = (sessionId, isTyping) => {
//   if (!socket || !socket.connected) return;
//   socket.emit('typing', { sessionId, isTyping });
// };

// /**
//  * Mark messages as read.
//  */
// export const markMessagesRead = sessionId => {
//   if (!socket || !socket.connected) return;
//   socket.emit('markRead', { sessionId });
// };

// /**
//  * Disconnect socket manually.
//  */
// export const disconnectChatSocket = () => {
//   if (socket) {
//     socket.disconnect();
//     console.log('🔌 Chat socket disconnected');
//     socket = null;
//   }
// };


// socket.on('connect', () => console.log('✅ Connected:', socket.id));
// socket.on('disconnect', () => console.log('❌ Disconnected'));

// /**
//  * Get current socket instance.
//  */
// export const getSocketInstance = () => socket;



// src/service/api/socket/chatSocket.js
import { io } from 'socket.io-client';
import apiClient from '../config'; 

class ChatSocket {
  constructor() {
    this.socket = null;
  }

  connect(userId) {
    if (this.socket) return;

    // const socketUrl = apiClient.replace('/api/v1', '');

    const socketUrl = apiClient.defaults.baseURL.replace('/api/v1', '');

    this.socket = io(socketUrl, {
      transports: ['websocket'],
      autoConnect: false,
    });

    this.socket.connect();
    this.socket.emit('join_room', userId);

    this.socket.on('connect', () => {
      console.log('🟢 Socket connected:', this.socket.id);
    });
    this.socket.on('connect_error', (err) => {
      console.error('🔴 Socket connection error:', err);
    });
    this.socket.on('disconnect', (reason) => {
      console.log('🟠 Socket disconnected:', reason);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }

  emit(event, data, callback) {
    if (!this.socket) return;
    this.socket.emit(event, data, callback);
  }
}

const chatSocketInstance = new ChatSocket();
export default chatSocketInstance;

