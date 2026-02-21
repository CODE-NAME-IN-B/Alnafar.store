import React, { useState, useEffect } from 'react';
import { api } from './api';
import logo from '../assites/logo.png';

// status mapping for progress bar logic
const statusMap = {
    'pending': { label: 'قيد الانتظار', step: 1, color: 'text-yellow-400', bg: 'bg-yellow-400' },
    'paid': { label: 'تم الدفع', step: 1, color: 'text-blue-400', bg: 'bg-blue-400' },
    'processing': { label: 'جاري التثبيت', step: 2, color: 'text-indigo-400', bg: 'bg-indigo-400' },
    'ready': { label: 'جاهز للاستلام', step: 3, color: 'text-emerald-400', bg: 'bg-emerald-400' },
    'completed': { label: 'مكتمل', step: 4, color: 'text-green-500', bg: 'bg-green-500' },
    'cancelled': { label: 'ملغي', step: 0, color: 'text-red-500', bg: 'bg-red-500' }
};

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function OrderTracking({ orderId }) {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [subscribed, setSubscribed] = useState(false);
    const [vapidKey, setVapidKey] = useState('');
    const [storeInfo, setStoreInfo] = useState({});

    // Fetch store settings for branding
    useEffect(() => {
        api.get('/invoice-settings').then(({ data }) => {
            if (data?.settings) setStoreInfo(data.settings);
        }).catch(() => { });
    }, []);

    useEffect(() => {
        let active = true;
        let isFirstLoad = true;
        const fetchOrder = async () => {
            try {
                if (isFirstLoad) setLoading(true);
                const response = await api.get(`/orders/${encodeURIComponent(orderId)}`);
                if (active && response.data && response.data.success) {
                    setOrder(response.data.order);
                    setError('');
                }
            } catch (err) {
                if (active && isFirstLoad) setError(err.response?.data?.message || 'تعذر جلب بيانات الطلب');
            } finally {
                if (active) { setLoading(false); isFirstLoad = false; }
            }
        };

        if (orderId) {
            fetchOrder();
            const intervalId = setInterval(fetchOrder, 30000); // poll every 30 seconds
            return () => { active = false; clearInterval(intervalId); };
        }
    }, [orderId]);

    // Fetch VAPID Key and Handle Notifications Setup
    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !orderId || subscribed) return;

        const setupNotifications = async () => {
            try {
                // Get VAPID key from server
                const { data } = await api.get('/notifications/vapid-public-key');
                if (!data.success || !data.publicKey) return;

                const registration = await navigator.serviceWorker.register('/service-worker.js');
                await navigator.serviceWorker.ready;

                let subscription = await registration.pushManager.getSubscription();

                // فقط اشترك إذا كان الإذن ممنوحاً بالفعل
                if (!subscription && (Notification.permission === 'granted')) {
                    const convertedVapidKey = urlBase64ToUint8Array(data.publicKey);
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: convertedVapidKey
                    });
                }

                // أرسل الاشتراك إلى الخادم
                if (subscription) {
                    await api.post('/notifications/subscribe', {
                        orderId: orderId,
                        subscription: subscription
                    });
                    setSubscribed(true);
                }
            } catch (error) {
                console.error('Failed to subscribe to push notifications:', error);
            }
        };

        setupNotifications();
    }, [orderId, subscribed]);

    const requestNotificationPermission = async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                // بعد الموافقة، اشترك مباشرة
                const { data } = await api.get('/notifications/vapid-public-key');
                if (!data.success || !data.publicKey) return;

                const registration = await navigator.serviceWorker.ready;
                let subscription = await registration.pushManager.getSubscription();

                if (!subscription) {
                    const convertedVapidKey = urlBase64ToUint8Array(data.publicKey);
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: convertedVapidKey
                    });
                }

                if (subscription) {
                    await api.post('/notifications/subscribe', {
                        orderId: orderId,
                        subscription: subscription
                    });
                    setSubscribed(true);
                }
            }
        } catch (error) {
            console.error('Notification permission/subscribe error:', error);
        }
    };

    if (loading && !order) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                <p className="text-gray-400">جاري البحث عن الطلب...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <img src={logo} alt="Alnafar Store" className="h-16 mb-6" />
                <div className="bg-red-900/30 border border-red-500/50 p-6 rounded-xl max-w-md w-full text-center">
                    <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-xl font-bold text-red-400 mb-2">خطأ</h2>
                    <p className="text-red-200">{error || 'لم يتم العثور على الطلب.'}</p>
                </div>
            </div>
        );
    }

    const currentStatus = order.status || 'pending';
    const statusInfo = statusMap[currentStatus] || statusMap['pending'];
    const currentStep = statusInfo.step;

    // Calculate Progress percentage (max step 3 means 100% until completed, step 4)
    const totalSteps = 3;
    let progressPercentage = (currentStep / totalSteps) * 100;
    if (currentStep === 0) progressPercentage = 0; // cancelled
    if (currentStep > totalSteps) progressPercentage = 100;

    const orderDate = new Date(order.created_at || order.date).toLocaleDateString('ar-LY', {
        weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-8 font-tajawal selection:bg-primary/30">

            {/* Background ambient glow matching Gamer dark theme */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
            </div>

            <div className="max-w-3xl mx-auto relative z-10">
                <header className="flex flex-col items-center mb-10 text-center">
                    <img src={logo} alt="Alnafar Store" className="h-14 sm:h-20 object-contain mb-4" />
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                        {storeInfo.store_name || 'متجر النفار'}
                    </h1>
                    {storeInfo.store_name_english && <p className="text-gray-400 text-sm mt-1">{storeInfo.store_name_english}</p>}
                    <p className="text-gray-400 mt-2 text-sm sm:text-base">تتبع حالة الطلب</p>
                    {(storeInfo.store_address || storeInfo.store_phone) && (
                        <div className="flex flex-wrap items-center justify-center gap-3 mt-3 text-xs text-gray-500">
                            {storeInfo.store_address && (
                                <span className="flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    {storeInfo.store_address}
                                </span>
                            )}
                            {storeInfo.store_phone && (
                                <a href={`tel:${storeInfo.store_phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    {storeInfo.store_phone}
                                </a>
                            )}
                        </div>
                    )}
                </header>

                <main className="space-y-6">

                    {/* Main Status Card */}
                    <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-6 mb-6">
                            <div>
                                <p className="text-gray-400 text-sm mb-1">رقم الطلب</p>
                                <p className="text-xl font-mono tracking-wider font-bold">{order.invoice_number}</p>
                            </div>
                            <div className="mt-4 sm:mt-0 text-right">
                                <p className="text-gray-400 text-sm mb-1">تاريخ الطلب</p>
                                <p className="text-sm font-medium">{orderDate}</p>
                            </div>
                        </div>

                        {/* Customer Info */}
                        {order.customer_name && (
                            <div className="mb-6 flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2 text-gray-300">
                                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    <span>العميل: <strong className="text-white">{order.customer_name}</strong></span>
                                </div>
                                {order.customer_phone && (
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        <span>{order.customer_phone}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Visual Status Indicator */}
                        {currentStep > 0 && currentStep <= 4 ? (
                            <div className="mb-8 relative">
                                <div className="flex justify-between mb-2">
                                    <span className={`text-xs sm:text-sm font-bold ${currentStep >= 1 ? 'text-primary' : 'text-gray-500'}`}>تم الاستلام</span>
                                    <span className={`text-xs sm:text-sm font-bold ${currentStep >= 2 ? 'text-primary' : 'text-gray-500'}`}>جاري التثبيت</span>
                                    <span className={`text-xs sm:text-sm font-bold ${currentStep >= 3 ? 'text-emerald-400' : 'text-gray-500'}`}>جاهز للاستلام</span>
                                </div>
                                <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-1000 ease-out relative"
                                        style={{ width: `${progressPercentage}%` }}
                                    >
                                        <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-8 text-center p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                                <span className="text-red-400 font-bold">{statusInfo.label}</span>
                            </div>
                        )}

                        {!subscribed && 'Notification' in window && Notification.permission !== 'granted' && (
                            <div className="mb-6 bg-indigo-900/40 border border-indigo-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="text-indigo-400 bg-indigo-500/20 p-2 rounded-full">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                    </div>
                                    <div className="text-right sm:text-right">
                                        <p className="text-sm font-bold text-indigo-300">تفعيل إشعارات الطلب</p>
                                        <p className="text-xs text-indigo-200/70 mt-1">احصل على تنبيه فوري فور الانتهاء من تجهيز ألعابك</p>
                                    </div>
                                </div>
                                <button
                                    onClick={requestNotificationPermission}
                                    className="w-full sm:w-auto px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-bold rounded-lg whitespace-nowrap"
                                >
                                    تفعيل التنبيهات
                                </button>
                            </div>
                        )}

                        <div className={`text-center p-4 rounded-xl border ${currentStep === 2 ? 'border-primary/50 bg-primary/10' : currentStep === 3 || currentStep === 4 ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
                            <h2 className="text-lg text-gray-400 mb-1">الحالة الحالية</h2>
                            <p className={`text-2xl sm:text-4xl font-black ${statusInfo.color}`}>{statusInfo.label}</p>

                            {currentStep === 2 && order.estimated_minutes > 0 && (
                                <div className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-300 bg-indigo-900/30 px-4 py-2 rounded-full">
                                    <svg className="w-5 h-5 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    وقت التثبيت التقديري: ~{order.estimated_minutes} دقيقة
                                </div>
                            )}

                            {currentStep >= 3 && (
                                <div className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-300 bg-emerald-900/30 px-4 py-2 rounded-full">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    يرجى التفضل بزيارة المتجر لاستلام جهازك!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Details Card */}
                    <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            محتويات الطلب
                        </h3>

                        <div className="space-y-4">
                            <ul className="divide-y divide-white/5">
                                {(order.items || []).map((item, idx) => (
                                    <li key={idx} className="py-3 flex justify-between items-center group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium">{item.title}</p>
                                                {item.type === 'service' && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300 mr-2">خدمة</span>}
                                                {item.size_gb > 0 && <span className="text-[10px] text-gray-500 mr-2">{item.size_gb} GB</span>}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <div className="border-t border-white/10 pt-4 mt-4 flex justify-between items-center text-gray-300">
                                <span>إجمالي الحجم المطلوب:</span>
                                <span className="font-mono text-lg text-white font-bold">{Number(order.totalSize || order.total_size_gb || 0).toFixed(2)} GB</span>
                            </div>
                        </div>
                    </div>

                    {/* Store Contact Footer */}
                    <div className="bg-gray-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-5 text-center">
                        <p className="text-sm font-bold text-primary mb-2">{storeInfo.store_name || 'متجر النفار'}</p>
                        {storeInfo.store_address && <p className="text-xs text-gray-400 mb-1">📍 {storeInfo.store_address}</p>}
                        {storeInfo.store_phone && <p className="text-xs text-gray-400 mb-1">📞 <a href={`tel:${storeInfo.store_phone}`} className="hover:text-primary transition-colors">{storeInfo.store_phone}</a></p>}
                        {storeInfo.store_email && <p className="text-xs text-gray-400 mb-1">✉️ {storeInfo.store_email}</p>}
                        {storeInfo.store_website && <p className="text-xs text-gray-400 mb-1">🌐 {storeInfo.store_website}</p>}
                        {storeInfo.footer_message && <p className="text-xs text-gray-500 mt-3 italic">{storeInfo.footer_message}</p>}
                    </div>
                </main>
            </div>
        </div>
    );
}
