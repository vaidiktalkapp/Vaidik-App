// // src/services/api/socket/chatSocket.js (USER SIDE)
// import { io } from 'socket.io-client';
// import apiClient from '../config';

// class ChatSocket {
//   constructor() {
//     this.socket = null;
//     this.userId = null;
//   }

//   connect(userId) {
//     if (this.socket?.connected) {
//       console.log('⚠️ Socket already connected');
//       return;
//     }

//     this.userId = userId;

//     const socketUrl = apiClient.defaults.baseURL.replace('/api/v1', '');
//     console.log('🔗 [USER] Connecting to socket server:', socketUrl);

//     this.socket = io(socketUrl, {
//       transports: ['websocket'],
//       autoConnect: false,
//       reconnection: true,
//       reconnectionAttempts: 5,
//       reconnectionDelay: 1000,
//       query: { userId, role: 'user' }, // ✅ Role add kiya
//     });

//     this.setupEventListeners();
//     this.socket.connect();
//   }

//   setupEventListeners() {
//     if (!this.socket) return;

//     this.socket.on('connect', () => {
//       console.log('🟢 [USER] Socket connected successfully');
//       console.log('🆔 [USER] Socket ID:', this.socket.id);
      
//       if (this.userId) {
//         this.socket.emit('join_room', this.userId);
//         console.log('📍 [USER] Joined room for user:', this.userId);
//       }
//     });

//     this.socket.on('connect_error', (error) => {
//       console.error('🔴 [USER] Socket connection error:', error.message);
//     });

//     this.socket.on('disconnect', (reason) => {
//       console.log('🟠 [USER] Socket disconnected:', reason);
      
//       if (reason === 'io server disconnect') {
//         console.log('🔄 [USER] Reconnecting...');
//         this.socket.connect();
//       }
//     });

//     this.socket.on('reconnect', (attemptNumber) => {
//       console.log('🔄 [USER] Socket reconnected after', attemptNumber, 'attempts');
//     });
//   }

//   disconnect() {
//     if (this.socket) {
//       console.log('🔌 [USER] Disconnecting socket...');
//       this.socket.disconnect();
//       this.socket.removeAllListeners();
//       this.socket = null;
//       this.userId = null;
//     }
//   }

//   on(event, callback) {
//     if (!this.socket) {
//       console.warn('⚠️ [USER] Socket not initialized');
//       return;
//     }
//     this.socket.on(event, callback);
//   }

//   off(event, callback) {
//     if (!this.socket) return;
//     if (callback) {
//       this.socket.off(event, callback);
//     } else {
//       this.socket.off(event);
//     }
//   }

//   emit(event, data, callback) {
//     if (!this.socket?.connected) {
//       console.warn('⚠️ [USER] Socket not connected. Cannot emit:', event);
//       return;
//     }
//     console.log('📤 [USER] Emitting event:', event, data);
//     this.socket.emit(event, data, callback);
//   }

//   isConnected() {
//     return this.socket?.connected || false;
//   }

//   getSocketId() {
//     return this.socket?.id || null;
//   }
// }

// const chatSocketInstance = new ChatSocket();
// export default chatSocketInstance;



// src/services/api/socket/chatSocket.js (USER SIDE - FIXED)
import { io } from 'socket.io-client';
import apiClient from '../config';

class ChatSocket {
  constructor() {
    this.socket = null;
    this.userId = null;
  }

  connect(userId) {
    if (this.socket?.connected) {
      console.log('⚠️ Socket already connected');
      return;
    }

    this.userId = userId;

    // ✅ ADD /chat NAMESPACE
    const socketUrl = apiClient.defaults.baseURL.replace('/api/v1', '') + '/chat';
    console.log('🔗 [USER] Connecting to socket server:', socketUrl);

    this.socket = io(socketUrl, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      query: { userId, role: 'user' },
    });

    this.setupEventListeners();
    this.socket.connect();
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🟢 [USER] Socket connected successfully');
      console.log('🆔 [USER] Socket ID:', this.socket.id);
      
      if (this.userId) {
        this.socket.emit('join_room', this.userId);
        console.log('📍 [USER] Joined room for user:', this.userId);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 [USER] Socket connection error:', error.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🟠 [USER] Socket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        console.log('🔄 [USER] Reconnecting...');
        this.socket.connect();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 [USER] Socket reconnected after', attemptNumber, 'attempts');
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 [USER] Disconnecting socket...');
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
      this.userId = null;
    }
  }

  on(event, callback) {
    if (!this.socket) {
      console.warn('⚠️ [USER] Socket not initialized');
      return;
    }
    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  emit(event, data, callback) {
    if (!this.socket?.connected) {
      console.warn('⚠️ [USER] Socket not connected. Cannot emit:', event);
      return;
    }
    console.log('📤 [USER] Emitting event:', event, data);
    this.socket.emit(event, data, callback);
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  getSocketId() {
    return this.socket?.id || null;
  }
}

const chatSocketInstance = new ChatSocket();
export default chatSocketInstance;
