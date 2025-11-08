// محول تخزين الصور - يدعم التخزين المحلي (للتطوير) و Cloudinary (للإنتاج المجاني)
const fs = require('fs');
const path = require('path');

let storageType = 'local'; // 'local' or 'cloudinary'
let cloudinary = null;

// تهيئة التخزين حسب البيئة
function initStorage() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    // استخدام Cloudinary في الإنتاج
    console.log('☁️  Using Cloudinary for image storage...');
    const cloudinaryLib = require('cloudinary').v2;
    
    cloudinaryLib.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });
    
    cloudinary = cloudinaryLib;
    storageType = 'cloudinary';
    console.log('✅ Cloudinary storage configured');
  } else {
    // استخدام التخزين المحلي في التطوير
    console.log('💾 Using local file storage...');
    storageType = 'local';
    console.log('✅ Local storage ready');
  }
  
  return { storageType, cloudinary };
}

// رفع صورة
async function uploadImage(fileBuffer, filename, folder = 'games') {
  if (storageType === 'cloudinary') {
    // رفع إلى Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `alnafar-store/${folder}`,
          public_id: path.parse(filename).name,
          resource_type: 'image',
          overwrite: true
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id
            });
          }
        }
      );
      
      uploadStream.end(fileBuffer);
    });
  } else {
    // حفظ محلياً
    const DATA_DIR = path.join(__dirname, 'data');
    const UPLOADS_DIR = path.join(DATA_DIR, 'uploads', folder);
    
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const unique = `${Date.now()}_${safeName}`;
    const filePath = path.join(UPLOADS_DIR, unique);
    
    fs.writeFileSync(filePath, fileBuffer);
    
    return {
      url: `/uploads/${folder}/${unique}`,
      publicId: null
    };
  }
}

// رفع صورة من base64
async function uploadBase64Image(base64Data, filename, folder = 'games') {
  const buffer = Buffer.from(base64Data, 'base64');
  return uploadImage(buffer, filename, folder);
}

// حذف صورة
async function deleteImage(urlOrPublicId) {
  if (storageType === 'cloudinary') {
    // حذف من Cloudinary
    if (urlOrPublicId.includes('cloudinary.com')) {
      // استخراج public_id من URL
      const parts = urlOrPublicId.split('/');
      const fileWithExt = parts[parts.length - 1];
      const publicId = `alnafar-store/${parts[parts.length - 2]}/${path.parse(fileWithExt).name}`;
      
      try {
        await cloudinary.uploader.destroy(publicId);
        return { success: true };
      } catch (error) {
        console.error('Cloudinary delete error:', error);
        return { success: false, error };
      }
    } else {
      // استخدام public_id مباشرة
      try {
        await cloudinary.uploader.destroy(urlOrPublicId);
        return { success: true };
      } catch (error) {
        console.error('Cloudinary delete error:', error);
        return { success: false, error };
      }
    }
  } else {
    // حذف محلياً
    try {
      const DATA_DIR = path.join(__dirname, 'data');
      const relativePath = urlOrPublicId.replace(/^\//, '');
      const filePath = path.join(DATA_DIR, relativePath);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return { success: true };
      }
      return { success: false, error: 'File not found' };
    } catch (error) {
      console.error('Local delete error:', error);
      return { success: false, error };
    }
  }
}

// الحصول على نوع التخزين
function getStorageType() {
  return storageType;
}

module.exports = {
  initStorage,
  uploadImage,
  uploadBase64Image,
  deleteImage,
  getStorageType
};
