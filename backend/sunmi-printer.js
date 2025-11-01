const axios = require('axios');

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
  }

  // دالة لتحويل النص العربي لتنسيق مناسب للطباعة
  formatArabicText(text) {
    // تحويل الأرقام الإنجليزية للعربية إذا لزم الأمر
    return text.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
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

  // إنشاء محتوى الفاتورة للطباعة
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
    
    // رأس الفاتورة
    content.push(this.centerText(settings.store_name));
    if (settings.store_name_english) {
      content.push(this.centerText(settings.store_name_english));
    }
    content.push(this.centerText(settings.header_logo_text));
    content.push(this.createSeparatorLine('='));
    content.push('');
    
    // معلومات الفاتورة
    content.push(`رقم الفاتورة: ${invoiceNumber}`);
    content.push(`التاريخ: ${new Date(date).toLocaleDateString('ar-LY')}`);
    content.push(`الوقت: ${new Date(date).toLocaleTimeString('ar-LY')}`);
    content.push(this.createSeparatorLine());
    content.push('');
    
    // معلومات العميل
    content.push('بيانات العميل:');
    content.push(`الاسم: ${customerName}`);
    content.push(`الهاتف: ${customerPhone}`);
    if (customerAddress) {
      content.push(`العنوان: ${customerAddress}`);
    }
    content.push(this.createSeparatorLine());
    content.push('');
    
    // تفاصيل الألعاب
    content.push('تفاصيل الطلب:');
    content.push(this.createSeparatorLine('-'));
    
    items.forEach((item, index) => {
      content.push(`${index + 1}. ${item.title}`);
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
      content.push(notes);
      content.push('');
    }
    
    // معلومات المتجر (اختيارية)
    if (settings.show_store_info) {
      content.push('معلومات المتجر:');
      if (settings.store_address) {
        content.push(`العنوان: ${settings.store_address}`);
      }
      if (settings.store_phone) {
        content.push(`الهاتف: ${settings.store_phone}`);
      }
      if (settings.store_email) {
        content.push(`البريد: ${settings.store_email}`);
      }
      if (settings.store_website) {
        content.push(`الموقع: ${settings.store_website}`);
      }
      content.push(this.createSeparatorLine());
      content.push('');
    }
    
    // تذييل الفاتورة
    if (settings.show_footer && settings.footer_message) {
      content.push(this.centerText(settings.footer_message));
      content.push('');
    }
    
    content.push(this.centerText('تم الإنشاء بواسطة ' + settings.store_name));
    content.push('');
    content.push('');
    content.push('');
    
    return content.join('\n');
  }

  // طباعة الفاتورة على جهاز Sunmi V2
  async printInvoice(invoiceData, storeSettings = null) {
    try {
      const content = this.generateInvoiceContent(invoiceData, storeSettings);
      
      // إعداد أمر الطباعة لجهاز Sunmi V2
      const printCommand = {
        type: 'print_text',
        data: {
          text: content,
          fontSize: this.printSettings.fontSize,
          alignment: 'right', // للنصوص العربية
          charset: this.printSettings.charset
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
