import React, { useState, useEffect } from 'react';
import { api, loadAuthFromStorage } from './api';
import logo from '../assites/logo.png';

const statusMap = {
    'pending': { label: 'قيد الانتظار', step: 1, color: 'text-amber-400', bg: 'bg-amber-400', glow: 'shadow-amber-500/30', isPaid: false },
    'paid': { label: 'تم الدفع', step: 1, color: 'text-blue-400', bg: 'bg-blue-400', glow: 'shadow-blue-500/30', isPaid: true },
    'processing': { label: 'جاري التجهيز', step: 2, color: 'text-indigo-400', bg: 'bg-indigo-400', glow: 'shadow-indigo-500/30', isPaid: null },
    'ready': { label: 'جاهز للاستلام', step: 3, color: 'text-emerald-400', bg: 'bg-emerald-400', glow: 'shadow-emerald-500/30', isPaid: null },
    'completed': { label: 'مكتمل', step: 4, color: 'text-green-500', bg: 'bg-green-500', glow: 'shadow-green-500/30', isPaid: true },
    'cancelled': { label: 'ملغي', step: 0, color: 'text-red-500', bg: 'bg-red-500', glow: 'shadow-red-500/30', isPaid: null }
};

const adminStatuses = [
    { value: 'pending', label: 'قيد الانتظار', icon: '⏳' },
    { value: 'paid', label: 'تم الدفع', icon: '💳' },
    { value: 'processing', label: 'جاري التجهيز', icon: '⚙️' },
    { value: 'ready', label: 'جاهز للاستلام', icon: '✅' },
    { value: 'completed', label: 'مكتمل', icon: '🎉' },
    { value: 'cancelled', label: 'ملغي', icon: '❌' }
];

function currency(num) {
    return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(num);
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
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
    const [storeInfo, setStoreInfo] = useState({});
    const [isAdmin, setIsAdmin] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [updatingGames, setUpdatingGames] = useState({});
    const [editingGames, setEditingGames] = useState(false);
    const [gameChecks, setGameChecks] = useState({});

    useEffect(() => {
        loadAuthFromStorage();
        const token = localStorage.getItem('token');
        if (token) {
            api.get('/auth/me').then(r => {
                if (r.data?.user) setIsAdmin(true);
            }).catch(() => { });
        }
    }, []);

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
                    if (response.data.order.items) {
                        const checks = {};
                        response.data.order.items.forEach((item, idx) => {
                            checks[idx] = item.installed || false;
                        });
                        setGameChecks(checks);
                    }
                }
            } catch (err) {
                if (active && isFirstLoad) setError(err.response?.data?.message || 'تعذر جلب بيانات الطلب');
            } finally {
                if (active) { setLoading(false); isFirstLoad = false; }
            }
        };
        if (orderId) {
            fetchOrder();
            const intervalId = setInterval(fetchOrder, 30000);
            return () => { active = false; clearInterval(intervalId); };
        }
    }, [orderId]);

    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !orderId || subscribed) return;
        const setupNotifications = async () => {
            try {
                const { data } = await api.get('/notifications/vapid-public-key');
                if (!data.success || !data.publicKey) return;
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                await navigator.serviceWorker.ready;
                let subscription = await registration.pushManager.getSubscription();
                if (!subscription && Notification.permission === 'granted') {
                    const convertedVapidKey = urlBase64ToUint8Array(data.publicKey);
                    subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: convertedVapidKey });
                }
                if (subscription) {
                    await api.post('/notifications/subscribe', { orderId, subscription });
                    setSubscribed(true);
                }
            } catch (error) {
                console.error('Push notification error:', error);
            }
        };
        setupNotifications();
    }, [orderId, subscribed]);

    const requestNotificationPermission = async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const { data } = await api.get('/notifications/vapid-public-key');
                if (!data.success || !data.publicKey) return;
                const registration = await navigator.serviceWorker.ready;
                let subscription = await registration.pushManager.getSubscription();
                if (!subscription) {
                    const convertedVapidKey = urlBase64ToUint8Array(data.publicKey);
                    subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: convertedVapidKey });
                }
                if (subscription) {
                    await api.post('/notifications/subscribe', { orderId, subscription });
                    setSubscribed(true);
                }
            }
        } catch (error) {
            console.error('Notification error:', error);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        setUpdatingStatus(true);
        try {
            await api.put(`/orders/${orderId}/status`, { status: newStatus });
            setOrder(prev => ({ ...prev, status: newStatus }));
        } catch (err) {
            alert('فشل تحديث الحالة');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleGameCheck = async (itemIdx, checked) => {
        setEditingGames(true);
        try {
            await api.put(`/orders/${orderId}/items/${itemIdx}/installed`, { installed: checked });
            setGameChecks(prev => ({ ...prev, [itemIdx]: checked }));
        } catch (err) {
            alert('فشل تحديث حالة اللعبة');
        } finally {
            setEditingGames(false);
        }
    };

    if (loading && !order) {
        return (
            <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-500/20 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-400 mt-6 font-medium">جاري تحميل بيانات الطلب...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
                <div className="relative mb-8">
                    <div className="absolute -inset-4 bg-red-500/20 rounded-full blur-xl"></div>
                    <img src={logo} alt="Alnafar Store" className="h-20 relative" />
                </div>
                <div className="bg-gray-900/80 backdrop-blur-xl border border-red-500/30 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">لم يتم العثور على الطلب</h2>
                    <p className="text-gray-400">{error || 'الطلب غير موجود أو تم حذفه'}</p>
                </div>
            </div>
        );
    }

    const currentStatus = order.status || 'pending';
    const statusInfo = statusMap[currentStatus] || statusMap['pending'];
    const currentStep = statusInfo.step;
    const totalSteps = 3;
    let progressPercentage = (currentStep / totalSteps) * 100;
    if (currentStep === 0) progressPercentage = 0;
    if (currentStep > totalSteps) progressPercentage = 100;

    const orderDate = new Date(order.created_at || order.date).toLocaleDateString('ar-LY', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const orderTime = new Date(order.created_at || order.date).toLocaleTimeString('ar-LY', {
        hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-6 md:p-8 font-tajawal">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <header className="text-center mb-10">
                    <div className="relative inline-block mb-6">
                        <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-lg opacity-30"></div>
                        <div className="relative bg-gray-900 p-4 rounded-2xl border border-white/10">
                            <img src={logo} alt="Alnafar Store" className="h-16 sm:h-20 mx-auto" />
                        </div>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black mb-2">
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            {storeInfo.store_name || 'متجر النفار'}
                        </span>
                    </h1>
                    {storeInfo.store_name_english && (
                        <p className="text-gray-500 text-sm tracking-wider uppercase">{storeInfo.store_name_english}</p>
                    )}
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-gray-600"></div>
                        <span className="text-gray-500 text-sm">تتبع حالة الطلب</span>
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-gray-600"></div>
                    </div>
                </header>

                <main className="space-y-6">
                    {/* Order Header Card */}
                    <div className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 pb-6 border-b border-white/10">
                            <div>
                                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">رقم الطلب</p>
                                <p className="text-2xl font-mono font-black text-white tracking-wider">{order.invoice_number}</p>
                            </div>
                            <div className="text-left sm:text-right">
                                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">التاريخ</p>
                                <p className="text-white font-medium">{orderDate}</p>
                                <p className="text-gray-500 text-sm">{orderTime}</p>
                            </div>
                        </div>

                        {/* Customer Info */}
                        {(order.customer_name || order.customer_phone) && (
                            <div className="flex flex-wrap gap-4 mb-6">
                                {order.customer_name && (
                                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl">
                                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span className="text-gray-400 text-sm">العميل:</span>
                                        <span className="text-white font-bold">{order.customer_name}</span>
                                    </div>
                                )}
                                {order.customer_phone && (
                                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl">
                                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <span className="text-white font-mono" dir="ltr">{order.customer_phone}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Progress Bar */}
                        {currentStep > 0 && currentStep <= 4 ? (
                            <div className="mb-8">
                                <div className="flex justify-between mb-3">
                                    {['تم الاستلام', 'جاري التجهيز', 'جاهز للاستلام'].map((label, idx) => (
                                        <div key={idx} className="flex flex-col items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-500 ${
                                                currentStep > idx 
                                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30' 
                                                    : currentStep === idx + 1
                                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 animate-pulse'
                                                    : 'bg-gray-800 text-gray-500 border border-gray-700'
                                            }`}>
                                                {currentStep > idx ? (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                ) : (
                                                    <span className="text-sm font-bold">{idx + 1}</span>
                                                )}
                                            </div>
                                            <span className={`text-xs font-medium hidden sm:block ${
                                                currentStep >= idx + 1 ? 'text-white' : 'text-gray-500'
                                            }`}>{label}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out rounded-full relative"
                                        style={{ width: `${progressPercentage}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-8 text-center p-6 bg-red-500/10 border border-red-500/30 rounded-2xl">
                                <svg className="w-10 h-10 text-red-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span className="text-red-400 font-bold text-lg">{statusInfo.label}</span>
                            </div>
                        )}

                        {/* Current Status Display */}
                        <div className={`text-center p-6 rounded-2xl border transition-all duration-500 ${
                            currentStep === 2 ? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/20' 
                            : currentStep >= 3 ? 'border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/20' 
                            : 'border-white/10 bg-white/5'
                        }`}>
                            <p className="text-gray-400 text-sm mb-2">الحالة الحالية</p>
                            <p className={`text-3xl sm:text-5xl font-black ${statusInfo.color} mb-4`}>{statusInfo.label}</p>
                            
                            {currentStep === 2 && order.estimated_minutes > 0 && (
                                <div className="inline-flex items-center gap-2 text-sm text-indigo-300 bg-indigo-500/20 px-5 py-2.5 rounded-full border border-indigo-500/30">
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    الوقت المتبقي تقريباً: {order.estimated_minutes} دقيقة
                                </div>
                            )}
                            {currentStep >= 3 && (
                                <div className="inline-flex items-center gap-2 text-sm text-emerald-300 bg-emerald-500/20 px-5 py-2.5 rounded-full border border-emerald-500/30">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    يرجى التفضل بزيارة المتجر لاستلام جهازك
                                </div>
                            )}
                        </div>

                        {/* Notification Button */}
                        {!subscribed && 'Notification' in window && Notification.permission !== 'granted' && (
                            <div className="mt-6 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-500/20 p-3 rounded-xl">
                                        <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">تفعيل إشعارات الطلب</p>
                                        <p className="text-sm text-gray-400">احصل على تنبيه فوري عند تحديث الحالة</p>
                                    </div>
                                </div>
                                <button
                                    onClick={requestNotificationPermission}
                                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30"
                                >
                                    تفعيل التنبيهات
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Admin Panel */}
                    {isAdmin && (
                        <div className="bg-gray-900/50 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                                <div className="bg-amber-500/20 p-2 rounded-xl">
                                    <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">لوحة التحكم</h3>
                                    <p className="text-sm text-gray-400">إدارة حالة الطلب والألعاب</p>
                                </div>
                            </div>

                            {/* Status Update */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-300 mb-3">تغيير حالة الطلب</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                                    {adminStatuses.map((status) => (
                                        <button
                                            key={status.value}
                                            onClick={() => handleStatusUpdate(status.value)}
                                            disabled={updatingStatus || currentStatus === status.value}
                                            className={`p-3 rounded-xl font-medium text-sm transition-all ${
                                                currentStatus === status.value
                                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {status.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Games Check */}
                            {order.items && order.items.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-medium text-gray-300">حالة تثبيت الألعاب</label>
                                        <span className="text-xs text-gray-500">{Object.values(gameChecks).filter(Boolean).length} / {order.items.length} مكتمل</span>
                                    </div>
                                    <div className="space-y-2">
                                        {order.items.filter(i => i.type !== 'service').map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959V6a2 2 0 00-2-2H5.5a2 2 0 00-2 2v5.5c0 .355.186.676.401.959.221.29.349.634.349 1.003 0 1.036 1.007 1.875 2.25 1.875s2.25-.84 2.25-1.875c0-.369-.128-.713-.349-1.003A1.65 1.65 0 015.5 11.5V6" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium text-sm">{item.title}</p>
                                                        {item.size_gb > 0 && <p className="text-gray-500 text-xs">{item.size_gb} GB</p>}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleGameCheck(idx, !gameChecks[idx])}
                                                    disabled={editingGames}
                                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                                        gameChecks[idx]
                                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                            : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                                                    }`}
                                                >
                                                    {gameChecks[idx] ? 'تم التثبيت' : 'غير مثبّت'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Order Items Card */}
                    <div className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                            <div className="bg-purple-500/20 p-2 rounded-xl">
                                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-white">محتويات الطلب</h3>
                            <span className="text-sm text-gray-500 mr-auto">{order.items?.length || 0} عنصر</span>
                        </div>

                        <div className="space-y-3">
                            {(order.items || []).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/20">
                                            <span className="text-lg font-bold text-indigo-400">{idx + 1}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{item.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {item.type === 'service' && (
                                                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20">خدمة</span>
                                                )}
                                                {item.size_gb > 0 && (
                                                    <span className="text-xs text-gray-500">{item.size_gb} GB</span>
                                                )}
                                                {isAdmin && gameChecks[idx] && (
                                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/20">تم التثبيت</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="font-black text-lg text-indigo-400">{currency(item.price || 0)}</p>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                            <div className="flex justify-between items-center text-gray-400">
                                <span>إجمالي الحجم</span>
                                <span className="font-mono text-white">{Number(order.totalSize || order.total_size_gb || 0).toFixed(2)} GB</span>
                            </div>
                            {Number(order.discount) > 0 && (
                                <div className="flex justify-between items-center text-red-400">
                                    <span>الخصم</span>
                                    <span className="font-mono">-{currency(order.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-3 border-t border-white/10">
                                <span className="font-bold text-white">الإجمالي</span>
                                <span className="text-2xl font-black text-indigo-400">{currency(order.total || 0)}</span>
                            </div>
                            {order.final_total !== undefined && Number(order.discount) > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-white">السعر بعد الخصم</span>
                                    <span className="text-2xl font-black text-emerald-400">{currency(order.final_total || 0)}</span>
                                </div>
                            )}
                            {order.paid_amount !== undefined && order.paid_amount !== null && (
                                <div className="mt-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                    <div className="flex justify-between items-center text-emerald-400">
                                        <span className="font-bold">المدفوع</span>
                                        <span className="font-mono font-bold">{currency(order.paid_amount)}</span>
                                    </div>
                                    {((order.final_total || order.total || 0) - order.paid_amount) > 0 && (
                                        <div className="flex justify-between items-center text-amber-400 mt-2">
                                            <span className="font-bold">المتبقي</span>
                                            <span className="font-mono font-bold">{currency((order.final_total || order.total || 0) - order.paid_amount)}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-900/30 backdrop-blur-sm border border-white/5 rounded-3xl p-6 text-center">
                        <p className="text-lg font-bold text-white mb-3">{storeInfo.store_name || 'متجر النفار'}</p>
                        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
                            {storeInfo.store_address && (
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {storeInfo.store_address}
                                </span>
                            )}
                            {storeInfo.store_phone && (
                                <a href={`tel:${storeInfo.store_phone}`} className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors">
                                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {storeInfo.store_phone}
                                </a>
                            )}
                            {storeInfo.store_email && (
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {storeInfo.store_email}
                                </span>
                            )}
                        </div>
                        {storeInfo.footer_message && (
                            <p className="text-gray-500 text-sm mt-4 italic">{storeInfo.footer_message}</p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
