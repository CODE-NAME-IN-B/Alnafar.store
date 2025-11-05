const axios = require('axios');

/**
 * طابعة Sunmi محسنة - تم إصلاح مشكلة الرموز الغريبة في الطباعة
 * 
 * الإصلاحات المطبقة:
 * 1. إزالة جميع أوامر ESC/POS التي تسبب رموز غريبة
 * 2. تنظيف النص من رموز التحكم الخاصة
 * 3. استخدام نص خالص فقط (Plain Text)
 * 4. فلترة الأحرف غير المدعومة
 * 
 * تاريخ الإصلاح: نوفمبر 2025
 */
class SunmiPrinter {
  constructor() {
    // إعدادات افتراضية لجهاز Sunmi V2
    this.deviceIP = process.env.SUNMI_DEVICE_IP || '192.168.1.100'; // يجب تحديد IP الجهاز
    this.devicePort = process.env.SUNMI_DEVICE_PORT || '8080';
    this.baseURL = `http://${this.deviceIP}:${this.devicePort}`;
    
    // إعدادات الطباعة
    this.printSettings = {
      paperWidth: 58, // عرض الورق بالمليمتر (58mm للطابعات الحرارية)
      fontSize: 'normal', // small, normal, large
      alignment: 'center', // left, center, right
      charset: 'UTF-8'
    };
    
    // تحقق من البيئة
    this.isCloudEnvironment = process.env.NODE_ENV === 'production' && !process.env.SUNMI_DEVICE_IP;
  }

  // دالة لتحويل النص العربي لتنسيق مناسب للطباعة (بدون رموز خاصة)
  formatArabicText(text) {
    // إزالة أي رموز خاصة قد تسبب مشاكل في الطباعة
    return String(text)
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // إزالة رموز التحكم
      .replace(/[^\u0000-\u007F\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '') // الاحتفاظ بالعربية والإنجليزية فقط
      .trim();
  }

  // دالة لتنظيف النص من أي رموز قد تسبب مشاكل
  cleanText(text) {
    return this.formatArabicText(text);
  }

  // دالة لإنشاء فاتورة آمنة للطباعة الحرارية (بدون أي رموز خاصة)
  generateSafePrintContent(invoiceData, storeSettings = null) {
    const content = this.generateInvoiceContent(invoiceData, storeSettings);
    
    // تنظيف شامل للمحتوى من أي رموز قد تسبب مشاكل
    return content
      .split('\n')
      .map(line => this.cleanText(line))
      .filter(line => line.trim().length > 0 || line === '') // الاحتفاظ بالأسطر الفارغة للتنسيق
      .join('\n');
  }

  // دالة لإنشاء خط فاصل
  createSeparatorLine(char = '-', length = 32) {
    return char.repeat(length);
  }

  // دالة لتنسيق النص في عمودين
  formatTwoColumns(left, right, totalWidth = 32) {
    const leftText = String(left);
    const rightText = String(right);
    const spaces = totalWidth - leftText.length - rightText.length;
    return leftText + ' '.repeat(Math.max(1, spaces)) + rightText;
  }

  // دالة لتنسيق النص في الوسط
  centerText(text, width = 32) {
    const spaces = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(spaces) + text;
  }

  // إنشاء محتوى الفاتورة للطباعة (نص خالص بدون أوامر ESC/POS)
  generateInvoiceContent(invoiceData, storeSettings = null) {
    const {
      invoiceNumber,
      customerName,
      customerPhone,
      customerAddress,
      items,
      total,
      date,
      notes
    } = invoiceData;

    // استخدام الإعدادات المخصصة أو الافتراضية
    const settings = storeSettings || {
      store_name: 'متجر الألعاب',
      store_name_english: 'Alnafar Store',
      store_address: 'طرابلس، ليبيا',
      store_phone: '+218xxxxxxxxx',
      store_email: 'info@alnafar.store',
      store_website: 'www.alnafar.store',
      header_logo_text: 'فاتورة مبيعات',
      footer_message: 'شكراً لتسوقكم معنا - للاستفسارات اتصل بنا',
      show_store_info: true,
      show_footer: true
    };

    let content = [];
    
    // رأس الفاتورة (نص خالص بدون رموز خاصة)
    content.push(this.centerText(this.cleanText(settings.store_name)));
    if (settings.store_name_english) {
      content.push(this.centerText(this.cleanText(settings.store_name_english)));
    }
    content.push(this.centerText(this.cleanText(settings.header_logo_text)));
    content.push(this.createSeparatorLine('='));
    content.push('');
    
    // معلومات الفاتورة
    content.push(`رقم الفاتورة: ${this.cleanText(invoiceNumber)}`);
    content.push(`التاريخ: ${new Date(date).toLocaleDateString('ar-LY')}`);
    content.push(`الوقت: ${new Date(date).toLocaleTimeString('ar-LY')}`);
    content.push(this.createSeparatorLine());
    content.push('');
    
    // معلومات العميل
    content.push('بيانات العميل:');
    content.push(`الاسم: ${this.cleanText(customerName)}`);
    content.push(`الهاتف: ${this.cleanText(customerPhone)}`);
    if (customerAddress) {
      content.push(`العنوان: ${this.cleanText(customerAddress)}`);
    }
    content.push(this.createSeparatorLine());
    content.push('');
    
    // تفاصيل الألعاب
    content.push('تفاصيل الطلب:');
    content.push(this.createSeparatorLine('-'));
    
    items.forEach((item, index) => {
      content.push(`${index + 1}. ${this.cleanText(item.title)}`);
      content.push(this.formatTwoColumns('', `${item.price.toFixed(3)} د.ل`));
      content.push('');
    });
    
    content.push(this.createSeparatorLine('-'));
    
    // الإجمالي
    content.push(this.formatTwoColumns('الإجمالي:', `${total.toFixed(3)} د.ل`));
    content.push(this.createSeparatorLine('='));
    content.push('');
    
    // ملاحظات
    if (notes) {
      content.push('ملاحظات:');
      content.push(this.cleanText(notes));
      content.push('');
    }
    
    // معلومات المتجر (اختيارية)
    if (settings.show_store_info) {
      content.push('معلومات المتجر:');
      if (settings.store_address) {
        content.push(`العنوان: ${this.cleanText(settings.store_address)}`);
      }
      if (settings.store_phone) {
        content.push(`الهاتف: ${this.cleanText(settings.store_phone)}`);
      }
      if (settings.store_email) {
        content.push(`البريد: ${this.cleanText(settings.store_email)}`);
      }
      if (settings.store_website) {
        content.push(`الموقع: ${this.cleanText(settings.store_website)}`);
      }
      content.push(this.createSeparatorLine());
      content.push('');
    }
    
    // تذييل الفاتورة
    if (settings.show_footer && settings.footer_message) {
      content.push(this.centerText(this.cleanText(settings.footer_message)));
      content.push('');
    }
    
    content.push(this.centerText('تم الإنشاء بواسطة ' + this.cleanText(settings.store_name)));
    content.push('');
    content.push('');
    content.push('');
    
    return content.join('\n');
  }

  // طباعة الفاتورة على جهاز Sunmi V2
  async printInvoice(invoiceData, storeSettings = null) {
    try {
      const content = this.generateSafePrintContent(invoiceData, storeSettings);
      
      // تحقق من البيئة السحابية
      if (this.isCloudEnvironment) {
        console.log('⚠️ الطباعة غير متاحة في البيئة السحابية');
        console.log('📄 محتوى الفاتورة:');
        console.log(content);
        
        return {
          success: true,
          message: 'تم إنشاء الفاتورة (الطباعة غير متاحة في البيئة السحابية)',
          invoiceNumber: invoiceData.invoiceNumber,
          content: content,
          cloudMode: true
        };
      }
      
      // إعداد أمر الطباعة لجهاز Sunmi V2 (نص خالص بدون أوامر خاصة)
      const printCommand = {
        type: 'print_text',
        data: {
          text: content, // المحتوى منظف مسبقاً
          fontSize: 'normal',
          alignment: 'left',
          charset: 'UTF-8',
          raw: false,
          // إعدادات إضافية لضمان الطباعة الآمنة
          escapeSpecialChars: true,
          removeControlChars: true
        }
      };

      // إرسال أمر الطباعة لجهاز Sunmi V2
      const response = await this.sendPrintCommand(printCommand);
      
      console.log('✅ تم طباعة الفاتورة بنجاح:', invoiceData.invoiceNumber);
      return {
        success: true,
        message: 'تم طباعة الفاتورة بنجاح',
        invoiceNumber: invoiceData.invoiceNumber
      };
      
    } catch (error) {
      console.error('❌ خطأ في طباعة الفاتورة:', error);
      throw new Error(`فشل في طباعة الفاتورة: ${error.message}`);
    }
  }

  // إرسال أمر الطباعة لجهاز Sunmi V2
  async sendPrintCommand(command) {
    try {
      // التحقق من اتصال الجهاز أولاً
      await this.checkDeviceConnection();
      
      // إرسال أمر الطباعة
      const response = await axios.post(`${this.baseURL}/api/print`, command, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      return response.data;
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('لا يمكن الاتصال بجهاز الطباعة. تأكد من تشغيل الجهاز واتصاله بالشبكة.');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('انتهت مهلة الاتصال بجهاز الطباعة.');
      } else {
        throw new Error(`خطأ في الاتصال بجهاز الطباعة: ${error.message}`);
      }
    }
  }

  // التحقق من اتصال الجهاز
  async checkDeviceConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/api/status`, {
        timeout: 5000
      });
      
      if (response.data.status !== 'ready') {
        throw new Error('جهاز الطباعة غير جاهز');
      }
      
      return true;
      
    } catch (error) {
      throw new Error('لا يمكن الاتصال بجهاز الطباعة');
    }
  }

  // طباعة اختبارية
  async printTest() {
    try {
      const testData = {
        invoiceNumber: 'TEST-001',
        customerName: 'عميل تجريبي',
        customerPhone: '+218123456789',
        customerAddress: 'طرابلس، ليبيا',
        items: [
          { title: 'لعبة تجريبية 1', price: 50.000 },
          { title: 'لعبة تجريبية 2', price: 75.500 }
        ],
        total: 125.500,
        date: new Date().toISOString(),
        notes: 'هذه فاتورة تجريبية'
      };
      
      return await this.printInvoice(testData);
      
    } catch (error) {
      throw new Error(`فشل في الطباعة التجريبية: ${error.message}`);
    }
  }

  // تحديث إعدادات الجهاز
  updateSettings(newSettings) {
    this.printSettings = { ...this.printSettings, ...newSettings };
  }

  // تحديث عنوان IP للجهاز
  updateDeviceIP(ip, port = '8080') {
    this.deviceIP = ip;
    this.devicePort = port;
    this.baseURL = `http://${this.deviceIP}:${this.devicePort}`;
  }
}

module.exports = SunmiPrinter;
