import { io } from 'socket.io-client';

// إعداد الاتصال بـ Socket.IO
const socket = io(
  import.meta.env.PROD ? window.location.origin : 'http://localhost:5000',
  {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 20000,
  }
);

// أحداث الاتصال
socket.on('connect', () => {
  console.log('🔌 متصل بالخادم للتحديثات الفورية');
});

socket.on('disconnect', () => {
  console.log('🔌 انقطع الاتصال مع الخادم');
});

socket.on('connect_error', (error) => {
  console.error('🔌 خطأ في الاتصال:', error);
});

export default socket;
