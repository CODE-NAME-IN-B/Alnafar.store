#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// إنشاء فواتير تجريبية لاختبار قائمة "الأكثر طلباً"
async function createTestInvoices() {
  try {
    console.log('🧪 إنشاء فواتير تجريبية...');
    
    // فواتير تجريبية مع ألعاب مختلفة
    const testInvoices = [
      {
        customerName: 'أحمد محمد',
        customerPhone: '+218123456789',
        customerAddress: 'طرابلس',
        items: [
          { id: 1, title: 'FIFA 24', price: 75 },
          { id: 2, title: 'Call of Duty', price: 120 }
        ]
      },
      {
        customerName: 'فاطمة علي',
        customerPhone: '+218987654321',
        customerAddress: 'بنغازي',
        items: [
          { id: 1, title: 'FIFA 24', price: 75 }, // FIFA مرة أخرى
          { id: 3, title: 'Assassins Creed', price: 90 }
        ]
      },
      {
        customerName: 'محمد سالم',
        customerPhone: '+218555666777',
        customerAddress: 'مصراتة',
        items: [
          { id: 1, title: 'FIFA 24', price: 75 }, // FIFA مرة ثالثة
          { id: 4, title: 'GTA V', price: 100 },
          { id: 5, title: 'Spider-Man', price: 85 }
        ]
      },
      {
        customerName: 'عائشة أحمد',
        customerPhone: '+218444555666',
        customerAddress: 'الزاوية',
        items: [
          { id: 2, title: 'Call of Duty', price: 120 }, // COD مرة أخرى
          { id: 6, title: 'Mortal Kombat', price: 80 }
        ]
      },
      {
        customerName: 'يوسف خالد',
        customerPhone: '+218333444555',
        customerAddress: 'صبراتة',
        items: [
          { id: 1, title: 'FIFA 24', price: 75 }, // FIFA مرة رابعة (الأكثر طلباً)
          { id: 7, title: 'Tekken 8', price: 95 }
        ]
      }
    ];

    for (let i = 0; i < testInvoices.length; i++) {
      const invoice = testInvoices[i];
      const total = invoice.items.reduce((sum, item) => sum + item.price, 0);
      
      const response = await axios.post(`${API_BASE}/invoices`, {
        ...invoice,
        total: total,
        customerNotes: `فاتورة تجريبية ${i + 1}`
      });
      
      console.log(`✅ تم إنشاء الفاتورة ${i + 1}: ${response.data.invoiceNumber}`);
    }
    
    // الآن اختبر endpoint الإحصائيات
    console.log('\n📊 جلب الإحصائيات...');
    const statsResponse = await axios.get(`${API_BASE}/stats`);
    console.log('الإحصائيات:', JSON.stringify(statsResponse.data, null, 2));
    
    console.log('\n🎉 تم إنشاء الفواتير التجريبية بنجاح!');
    console.log('الآن يمكنك رؤية قائمة "الأكثر طلباً" في الموقع');
    
  } catch (error) {
    console.error('❌ خطأ:', error.response?.data || error.message);
  }
}

// تشغيل الاختبار
createTestInvoices();
