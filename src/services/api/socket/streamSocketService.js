// src/services/socket/streamSocketService.js
import io from 'socket.io-client';
import { storageService } from '../../storage/storage.service';
import { STORAGE_KEYS } from '../../../config/constants';

class StreamSocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.streamId = null;
    this.listeners = new Map();
  }

  /**
   * Connect to stream namespace
   */
  async connect(streamId, userId, userName, isHost = false) {
    try {
      const accessToken = await storageService.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (this.socket) {
        this.disconnect();
      }

      console.log('====================================');
      console.log('🔌 Creating socket connection...');
      console.log('URL: http://192.168.1.10:3001/stream');
      console.log('User ID:', userId);
      console.log('User Name:', userName);
      console.log('Is Host:', isHost);
      console.log('====================================');

      return new Promise((resolve, reject) => {
        this.socket = io('http://192.168.1.10:3001/stream', {
          transports: ['websocket'],
          query: { userId, userName },
          auth: { token: accessToken },
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          timeout: 10000,
        });

        this.streamId = streamId;

        const timeout = setTimeout(() => {
          console.error('❌ Socket connection timeout after 10 seconds');
          reject(new Error('Socket connection timeout'));
        }, 10000);

        this.socket.on('connect', () => {
          clearTimeout(timeout);
          
          console.log('====================================');
          console.log('✅ SOCKET CONNECTED');
          console.log('Socket ID:', this.socket.id);
          console.log('====================================');
          
          this.connected = true;
          
          // Join stream room
          this.socket.emit('join_stream', { streamId, userId, userName, isHost });
          console.log('✅ Emitted join_stream event as', isHost ? 'HOST' : 'VIEWER');
          
          // Debug all incoming events
          this.socket.onAny((eventName, ...args) => {
            console.log('🔔 INCOMING EVENT:', eventName, JSON.stringify(args, null, 2));
          });
          
          resolve(true);
        });

        this.socket.on('disconnect', () => {
          console.log('❌ Socket disconnected');
          this.connected = false;
        });

        this.socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          console.error('❌ SOCKET CONNECTION ERROR:', error.message);
          reject(error);
        });

        this.socket.on('error', (error) => {
          console.error('❌ SOCKET ERROR EVENT:', error);
        });
      });
    } catch (error) {
      console.error('❌ Socket connection setup failed:', error.message);
      throw error;
    }
  }

  /**
   * Disconnect from socket
   */
  disconnect() {
    if (this.socket) {
      if (this.streamId) {
        this.socket.emit('leave_stream', { streamId: this.streamId });
      }
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.streamId = null;
      this.listeners.clear();
      console.log('✅ Socket disconnected and cleaned up');
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected && this.socket !== null;
  }

  // ==================== EVENT EMITTERS ====================

  sendComment(streamId, userId, userName, userAvatar, comment) {
    if (!this.socket?.connected) {
      console.error('❌ Socket not connected - cannot send comment');
      return;
    }
    this.socket.emit('send_comment', { streamId, userId, userName, userAvatar, comment });
    console.log('💬 Comment sent:', { userName, comment });
  }

  sendLike(streamId, userId, userName) {
    if (!this.socket?.connected) return;
    this.socket.emit('send_like', { streamId, userId, userName });
    console.log('❤️ Like sent:', { userName });
  }

  sendGift(streamId, userId, userName, userAvatar, giftType, giftName, amount) {
    if (!this.socket?.connected) return;
    this.socket.emit('send_gift', { streamId, userId, userName, userAvatar, giftType, giftName, amount });
    console.log('🎁 Gift sent:', { userName, giftName, amount });
  }

  // ✅ FIX ISSUE 1: Enhanced call acceptance with proper data
  notifyCallAccepted(streamId, userId, userName, callType, callMode, callerAgoraUid) {
    if (!this.socket?.connected) {
      console.error('❌ Socket not connected - cannot notify call accepted');
      return;
    }
    
    const data = { 
      streamId, 
      userId, 
      userName, 
      callType, 
      callMode, 
      callerAgoraUid,
      timestamp: new Date().toISOString()
    };
    
    console.log('====================================');
    console.log('📞 EMITTING call_accepted EVENT');
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('====================================');
    
    this.socket.emit('call_accepted', data);
  }

  // ✅ FIX ISSUE 3: Enhanced call rejection
  notifyCallRejected(streamId, userId) {
    if (!this.socket?.connected) {
      console.error('❌ Socket not connected - cannot notify call rejected');
      return;
    }
    
    const data = { streamId, userId, timestamp: new Date().toISOString() };
    
    console.log('====================================');
    console.log('❌ EMITTING call_rejected EVENT');
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('====================================');
    
    this.socket.emit('call_rejected', data);
  }

  // ✅ FIX ISSUE 2 & 3: Enhanced call end notification
  notifyCallEnded(streamId, duration, charge) {
    if (!this.socket?.connected) {
      console.error('❌ Socket not connected - cannot notify call ended');
      return;
    }
    
    const data = { 
      streamId, 
      duration, 
      charge,
      timestamp: new Date().toISOString()
    };
    
    console.log('====================================');
    console.log('📞 EMITTING call_ended EVENT');
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('====================================');
    
    this.socket.emit('call_ended', data);
  }

  notifyHostMicToggled(streamId, enabled) {
    if (!this.socket?.connected) return;
    this.socket.emit('host_mic_toggled', { streamId, enabled, timestamp: new Date().toISOString() });
    console.log('🎤 Host mic toggled:', enabled);
  }

  notifyHostCameraToggled(streamId, enabled) {
    if (!this.socket?.connected) return;
    this.socket.emit('host_camera_toggled', { streamId, enabled, timestamp: new Date().toISOString() });
    console.log('📹 Host camera toggled:', enabled);
  }

  // ==================== EVENT LISTENERS ====================

  on(eventName, callback) {
    if (!this.socket) {
      console.error('❌ Socket not initialized - cannot add listener for:', eventName);
      return;
    }
    
    console.log('🎧 Registering listener for:', eventName);
    this.socket.on(eventName, callback);
    
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
  }

  off(eventName, callback) {
    if (!this.socket) return;
    this.socket.off(eventName, callback);
    if (this.listeners.has(eventName)) {
      const callbacks = this.listeners.get(eventName);
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  }

  removeAllListeners(eventName) {
    if (!this.socket) return;
    this.socket.removeAllListeners(eventName);
    this.listeners.delete(eventName);
  }

  // ==================== CONVENIENCE METHODS ====================

  // Chat & Interaction
  onNewComment(callback) { 
    this.on('new_comment', (data) => {
      console.log('💬 New comment received:', data);
      callback(data);
    }); 
  }
  
  onNewLike(callback) { 
    this.on('new_like', (data) => {
      console.log('❤️ New like received:', data);
      callback(data);
    }); 
  }
  
  onNewGift(callback) { 
    this.on('new_gift', (data) => {
      console.log('🎁 New gift received:', data);
      callback(data);
    }); 
  }

  // Viewer Management
  onViewerJoined(callback) { 
    this.on('viewer_joined', (data) => {
      console.log('👋 Viewer joined:', data);
      callback(data);
    }); 
  }
  
  onViewerLeft(callback) { 
    this.on('viewer_left', (data) => {
      console.log('👋 Viewer left:', data);
      callback(data);
    }); 
  }
  
  onViewerCountUpdated(callback) { 
    this.on('viewer_count_updated', (data) => {
      console.log('👥 Viewer count updated:', data);
      callback(data);
    }); 
  }

  // ✅ Call Management - HOST PERSPECTIVE
  onCallRequestReceived(callback) {
    if (!this.socket) {
      console.error('❌ Socket not initialized');
      return;
    }
    
    console.log('🎧 Setting up call_request_received listener (HOST)');
    
    this.socket.on('call_request_received', (data) => {
      console.log('====================================');
      console.log('📞 HOST: call_request_received EVENT');
      console.log('Data:', JSON.stringify(data, null, 2));
      console.log('====================================');
      callback(data);
    });
  }

  // ✅ FIX ISSUE 1 & 3: VIEWER PERSPECTIVE - Listen for call acceptance
  onCallAccepted(callback) {
    if (!this.socket) {
      console.error('❌ Socket not initialized');
      return;
    }
    
    console.log('🎧 Setting up call_accepted listener (VIEWER)');
    
    this.socket.on('call_accepted', (data) => {
      console.log('====================================');
      console.log('📞 VIEWER: call_accepted EVENT RECEIVED');
      console.log('Data:', JSON.stringify(data, null, 2));
      console.log('====================================');
      callback(data);
    });
  }

  // ✅ FIX ISSUE 3: VIEWER PERSPECTIVE - Listen for call rejection
  onCallRejected(callback) {
    if (!this.socket) {
      console.error('❌ Socket not initialized');
      return;
    }
    
    console.log('🎧 Setting up call_rejected listener (VIEWER)');
    
    this.socket.on('call_rejected', (data) => {
      console.log('====================================');
      console.log('❌ VIEWER: call_rejected EVENT RECEIVED');
      console.log('Data:', JSON.stringify(data, null, 2));
      console.log('====================================');
      callback(data);
    });
  }

  // ✅ FIX ISSUE 2 & 3: BOTH PERSPECTIVES - Listen for call end
  onCallEnded(callback) {
    if (!this.socket) {
      console.error('❌ Socket not initialized');
      return;
    }
    
    console.log('🎧 Setting up call_ended listener');
    
    this.socket.on('call_ended', (data) => {
      console.log('====================================');
      console.log('📞 call_ended EVENT RECEIVED');
      console.log('Data:', JSON.stringify(data, null, 2));
      console.log('====================================');
      callback(data);
    });
  }

  // ✅ Legacy support - kept for compatibility
  onCallStarted(callback) {
    if (!this.socket) return;
    console.log('🎧 Setting up call_started listener (legacy)');
    
    this.socket.on('call_started', (data) => {
      console.log('📞 call_started event (legacy):', data);
      callback(data);
    });
  }

  onCallFinished(callback) {
    if (!this.socket) return;
    console.log('🎧 Setting up call_finished listener (legacy)');
    
    // Handle both old and new event names
    this.socket.on('call_finished', (data) => {
      console.log('📞 call_finished event (legacy):', data);
      callback(data);
    });
    
    this.socket.on('call_ended', (data) => {
      console.log('📞 call_ended event:', data);
      callback(data);
    });
  }

  onCallRequestRejected(callback) {
    if (!this.socket) return;
    console.log('🎧 Setting up call_request_rejected listener (legacy)');
    
    this.socket.on('call_request_rejected', (data) => {
      console.log('❌ call_request_rejected event (legacy):', data);
      callback(data);
    });
    
    // Also listen to the new event name
    this.socket.on('call_rejected', (data) => {
      console.log('❌ call_rejected event:', data);
      callback(data);
    });
  }

  // ✅ Host Settings
  onHostMicToggled(callback) {
    if (!this.socket) return;
    console.log('🎧 Setting up host_mic_toggled listener');
    
    this.socket.on('host_mic_toggled', (data) => {
      console.log('🎤 Host mic toggled:', data);
      callback(data);
    });
  }

  onHostCameraToggled(callback) {
    if (!this.socket) return;
    console.log('🎧 Setting up host_camera_toggled listener');
    
    this.socket.on('host_camera_toggled', (data) => {
      console.log('📹 Host camera toggled:', data);
      callback(data);
    });
  }
}

export const streamSocketService = new StreamSocketService();
export default streamSocketService;
