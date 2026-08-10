// import { io } from 'socket.io-client';

// محاكي لـ Socket.IO لتجنب مشاكل الاتصال في Vercel
// Vercel Serverless Functions لا تدعم WebSockets بشكل دائم
const socket = {
  on: (event, callback) => {
    // console.log(`[Socket Mock] Subscribed to ${event}`);
  },
  off: (event, callback) => {
    // console.log(`[Socket Mock] Unsubscribed from ${event}`);
  },
  emit: (event, data) => {
    console.log(`[Socket Mock] Emitted ${event}`, data);
  },
  connect: () => { },
  disconnect: () => { }
};

/*
// إعداد الاتصال بـ Socket.IO (معطل حالياً للانتقال لـ Vercel)
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
*/

export default socket;

