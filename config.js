// =====================================================================
// VR 2.05.2026 - تهيئة Firebase والإعدادات العامة
// الإصدار الماسي - النسخة النهائية
// جميع الحقوق محفوظة لنقابة تكنولوجيا المعلومات والبرمجيات © 2026
// =====================================================================

// ------------------------------ تهيئة Firebase ------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE",
    authDomain: "itwsreq.firebaseapp.com",
    projectId: "itwsreq",
    storageBucket: "itwsreq.firebasestorage.app",
    messagingSenderId: "417900842360",
    appId: "1:417900842360:web:83d9310f36fef5bbbe4c8d",
    measurementId: "G-P3YQFRSBMM"
};

// تهيئة Firebase (مع التحقق من عدم تكرار التهيئة)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); // استخدام التهيئة الموجودة
}

// تعريف Firestore
const db = firebase.firestore();

// ------------------------------ مفاتيح التخزين المحلي ------------------------------
const STORAGE_KEYS = {
    // إعدادات الشعار
    LOGO_URL: 'union_logo_url',
    
    // إعدادات موقع الخدمات
    SERVICES_URL: 'services_url',
    SERVICES_TEXT: 'services_text',
    SHOW_SERVICES: 'show_services',
    
    // إعدادات الترقيم
    COMPLAINT_PREFIX: 'complaint_prefix',
    SUGGESTION_PREFIX: 'suggestion_prefix',
    
    // إعدادات الأدمن
    ADMIN_AUTH: 'admin',
    SYSTEM_RESET_DONE: 'system_reset_done'
};

// ------------------------------ الإعدادات الافتراضية ------------------------------
const DEFAULT_SETTINGS = {
    // الشعار الافتراضي
    LOGO_URL: 'https://via.placeholder.com/200x200?text=Logo',
    
    // موقع الخدمات الافتراضي
    SERVICES_URL: 'https://services.egeng.org',
    SERVICES_TEXT: 'موقع تقديم خدمات النقابة',
    SHOW_SERVICES: true,
    
    // بادئات الترقيم الافتراضية
    COMPLAINT_PREFIX: 'REQ',
    SUGGESTION_PREFIX: 'REP',
    
    // كلمات السر الافتراضية (للاستخدام الداخلي)
    ADMIN_PASSWORD: 'itws@2026',
    DELETE_PASSWORD: '11111@',
    
    // إصدار النظام
    SYSTEM_VERSION: 'VR 2.05.2026'
};

// ------------------------------ متغيرات عامة ------------------------------
let autoSaveTimeout; // مؤقت للحفظ التلقائي

// ------------------------------ دوال الإعدادات الأساسية ------------------------------

/**
 * الحصول على قيمة إعداد من التخزين المحلي
 * @param {string} key - مفتاح الإعداد (من STORAGE_KEYS)
 * @param {any} defaultValue - القيمة الافتراضية إذا لم يوجد
 * @returns {any} قيمة الإعداد
 */
function getSetting(key, defaultValue) {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
}

/**
 * الحصول على رابط الشعار المحفوظ
 * @returns {string} رابط الشعار
 */
function getSavedLogo() {
    return getSetting(STORAGE_KEYS.LOGO_URL, DEFAULT_SETTINGS.LOGO_URL);
}

/**
 * الحصول على رابط موقع الخدمات
 * @returns {string} رابط الموقع
 */
function getServicesUrl() {
    return getSetting(STORAGE_KEYS.SERVICES_URL, DEFAULT_SETTINGS.SERVICES_URL);
}

/**
 * الحصول على نص زر الخدمات
 * @returns {string} نص الزر
 */
function getServicesText() {
    return getSetting(STORAGE_KEYS.SERVICES_TEXT, DEFAULT_SETTINGS.SERVICES_TEXT);
}

/**
 * معرفة ما إذا كان يجب إظهار زر الخدمات
 * @returns {boolean} true للإظهار، false للإخفاء
 */
function shouldShowServices() {
    const value = localStorage.getItem(STORAGE_KEYS.SHOW_SERVICES);
    return value === null ? DEFAULT_SETTINGS.SHOW_SERVICES : value === 'true';
}

/**
 * الحصول على بادئة الشكاوى
 * @returns {string} بادئة الشكاوى
 */
function getComplaintPrefix() {
    return getSetting(STORAGE_KEYS.COMPLAINT_PREFIX, DEFAULT_SETTINGS.COMPLAINT_PREFIX);
}

/**
 * الحصول على بادئة المقترحات
 * @returns {string} بادئة المقترحات
 */
function getSuggestionPrefix() {
    return getSetting(STORAGE_KEYS.SUGGESTION_PREFIX, DEFAULT_SETTINGS.SUGGESTION_PREFIX);
}

// ------------------------------ دوال حفظ الإعدادات ------------------------------

/**
 * حفظ جميع الإعدادات
 * @param {Object} settings - كائن يحتوي على الإعدادات المراد حفظها
 * @param {boolean} showMessage - هل يتم إظهار رسالة التأكيد
 */
function saveSettings(settings, showMessage = true) {
    // حفظ الإعدادات إذا تم تمريرها
    if (settings.logoUrl !== undefined) 
        localStorage.setItem(STORAGE_KEYS.LOGO_URL, settings.logoUrl);
    
    if (settings.servicesUrl !== undefined) 
        localStorage.setItem(STORAGE_KEYS.SERVICES_URL, settings.servicesUrl);
    
    if (settings.servicesText !== undefined) 
        localStorage.setItem(STORAGE_KEYS.SERVICES_TEXT, settings.servicesText);
    
    if (settings.showServices !== undefined) 
        localStorage.setItem(STORAGE_KEYS.SHOW_SERVICES, settings.showServices);
    
    if (settings.complaintPrefix !== undefined) 
        localStorage.setItem(STORAGE_KEYS.COMPLAINT_PREFIX, settings.complaintPrefix);
    
    if (settings.suggestionPrefix !== undefined) 
        localStorage.setItem(STORAGE_KEYS.SUGGESTION_PREFIX, settings.suggestionPrefix);
    
    // تحديث الشعارات في الصفحة
    updateAllLogos(settings.logoUrl || getSavedLogo());
    
    // تحديث زر الخدمات
    updateServicesButton();
    
    // إظهار رسالة تأكيد إذا طُلب ذلك
    if (showMessage) {
        showAutoSaveMessage();
    }
}

/**
 * إظهار رسالة الحفظ التلقائي
 */
function showAutoSaveMessage() {
    const messageEl = document.getElementById('auto-save-message');
    if (messageEl) {
        messageEl.style.display = 'flex';
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 2000);
    }
}

/**
 * الحفظ التلقائي (يتم استدعاؤه عند التغيير)
 */
function autoSaveSettings() {
    // إلغاء المؤقت السابق
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }
    
    // تعيين مؤقت جديد للحفظ بعد 500ms من آخر تغيير
    autoSaveTimeout = setTimeout(() => {
        // جمع الإعدادات من الحقول
        const settings = {
            logoUrl: document.getElementById('logo-url')?.value,
            servicesUrl: document.getElementById('services-url')?.value,
            servicesText: document.getElementById('services-text')?.value,
            showServices: document.getElementById('show-services-btn')?.checked,
            complaintPrefix: document.getElementById('complaint-prefix')?.value,
            suggestionPrefix: document.getElementById('suggestion-prefix')?.value
        };
        
        // تصفية القيم غير المعرفة
        Object.keys(settings).forEach(key => {
            if (settings[key] === undefined) {
                delete settings[key];
            }
        });
        
        // حفظ الإعدادات مع إظهار الرسالة
        saveSettings(settings, true);
    }, 500);
}

// ------------------------------ دوال التحديث البصري ------------------------------

/**
 * تحديث جميع الشعارات في الصفحات المختلفة
 * @param {string} url - رابط الشعار الجديد
 */
function updateAllLogos(url) {
    // شاشة البداية
    const splashLogo = document.getElementById('splash-logo');
    if (splashLogo) splashLogo.src = url;
    
    // الهيدر الرئيسي
    const headerLogo = document.getElementById('header-main-logo');
    if (headerLogo) headerLogo.src = url;
    
    // شعار صفحة الأدمن
    const adminLogo = document.getElementById('admin-logo');
    if (adminLogo) adminLogo.src = url;
    
    // شعار الشريط الجانبي في الأدمن
    const sidebarLogo = document.getElementById('sidebar-logo');
    if (sidebarLogo) sidebarLogo.src = url;
}

/**
 * تحديث زر الخدمات في الصفحة الرئيسية
 */
function updateServicesButton() {
    const servicesBtn = document.getElementById('services-link');
    if (!servicesBtn) return;
    
    const showServices = shouldShowServices();
    const servicesUrl = getServicesUrl();
    const servicesText = getServicesText();
    
    if (showServices && servicesUrl) {
        servicesBtn.style.display = 'flex';
        servicesBtn.href = servicesUrl;
        const span = servicesBtn.querySelector('span');
        if (span) span.textContent = servicesText;
    } else {
        servicesBtn.style.display = 'none';
    }
}

// ------------------------------ دوال مساعدة ------------------------------

/**
 * تنسيق النص وإزالة المسافات الزائدة
 * @param {string} text - النص المراد تنسيقه
 * @returns {string} النص بعد التنسيق
 */
function formatText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
}

/**
 * إنشاء رقم طلب متسلسل من Firestore
 * @param {string} type - نوع الطلب (شكوى أو اقتراح)
 * @returns {Promise<string>} رقم الطلب المتسلسل
 */
async function generateRequestNumber(type) {
    const year = new Date().getFullYear();
    const prefix = type === 'شكوى' ? getComplaintPrefix() : getSuggestionPrefix();
    
    try {
        // جلب جميع الطلبات من نفس النوع
        const snapshot = await db.collection("Requests")
            .where("type", "==", type)
            .get();
        
        // تصفية طلبات السنة الحالية
        const thisYearRequests = snapshot.docs.filter(doc => {
            const data = doc.data();
            if (!data.createdAt) return false;
            
            // تحويل التاريخ
            let docYear;
            if (data.createdAt.toDate) {
                docYear = data.createdAt.toDate().getFullYear();
            } else {
                docYear = new Date(data.createdAt).getFullYear();
            }
            
            return docYear === year;
        });
        
        // إيجاد أكبر رقم تسلسل
        let maxSerial = 0;
        thisYearRequests.forEach(doc => {
            const refId = doc.data().refId;
            if (refId) {
                const parts = refId.split('-');
                if (parts.length >= 2) {
                    const serial = parseInt(parts[1]);
                    if (!isNaN(serial) && serial > maxSerial) {
                        maxSerial = serial;
                    }
                }
            }
        });
        
        // إنشاء الرقم الجديد
        const newSerial = (maxSerial + 1).toString().padStart(4, '0');
        return `${prefix}-${newSerial}-${year}`;
        
    } catch (error) {
        console.error("خطأ في إنشاء رقم الطلب:", error);
        // في حالة الخطأ، نستخدم طريقة بديلة
        const timestamp = Date.now().toString().slice(-6);
        return `${prefix}-${timestamp}-${year}`;
    }
}

/**
 * التحقق من صحة الرقم القومي
 * @param {string} nid - الرقم القومي
 * @returns {boolean} صحة الرقم
 */
function validateNationalID(nid) {
    // الرقم القومي المصري: 14 رقم
    return /^\d{14}$/.test(nid);
}

/**
 * التحقق من صحة رقم الهاتف
 * @param {string} phone - رقم الهاتف
 * @returns {boolean} صحة الرقم
 */
function validatePhone(phone) {
    // أرقام الهواتف المصرية: 01xxxxxxxxx
    return /^01[0-2,5]{1}[0-9]{8}$/.test(phone);
}

/**
 * الحصول على تاريخ اليوم بتنسيق عربي
 * @returns {string} التاريخ بالتنسيق العربي
 */
function getCurrentArabicDate() {
    const now = new Date();
    return now.toLocaleDateString('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * الحصول على الوقت الحالي بتنسيق عربي
 * @returns {string} الوقت بالتنسيق العربي
 */
function getCurrentArabicTime() {
    const now = new Date();
    return now.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// ------------------------------ دوال تهيئة النظام ------------------------------

/**
 * إعادة ضبط النظام (مسح جميع البيانات)
 * @returns {Promise<boolean>} نجاح العملية
 */
async function resetSystem() {
    try {
        // جلب جميع المستندات
        const snapshot = await db.collection("Requests").get();
        
        // حذفها دفعة واحدة
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        // تخزين أن التهيئة تمت
        localStorage.setItem(STORAGE_KEYS.SYSTEM_RESET_DONE, 'true');
        
        return true;
    } catch (error) {
        console.error("خطأ في تهيئة النظام:", error);
        return false;
    }
}

/**
 * إنشاء مستخدم أدمن افتراضي (للاستقبال المستقبلي)
 */
async function createDefaultAdmin() {
    // هذه الدالة للاستخدام المستقبلي عند إضافة نظام المستخدمين
    console.log("سيتم إضافة نظام المستخدمين قريباً");
}

// ------------------------------ التهيئة عند تحميل الصفحة ------------------------------

document.addEventListener('DOMContentLoaded', function() {
    // تحميل الإعدادات المحفوظة
    const savedLogo = getSavedLogo();
    updateAllLogos(savedLogo);
    
    // تحديث زر الخدمات
    updateServicesButton();
    
    // التحقق من تهيئة النظام
    const systemResetDone = localStorage.getItem(STORAGE_KEYS.SYSTEM_RESET_DONE);
    if (systemResetDone === 'true') {
        console.log('تم تهيئة النظام مسبقاً');
    }
    
    // إضافة معلومات الإصدار
    console.log(`%c
    ╔══════════════════════════════════════╗
    ║     نقابة تكنولوجيا المعلومات        ║
    ║     ${DEFAULT_SETTINGS.SYSTEM_VERSION}          ║
    ║     جميع الحقوق محفوظة © 2026        ║
    ╚══════════════════════════════════════╝
    `, 'color: #00ffff; font-family: monospace; font-size: 12px;');
});

// ------------------------------ دوال التصدير (للإستخدام في الملفات الأخرى) ------------------------------
// هذه الدوال متاحة عالمياً للاستخدام في أي مكان

window.getSavedLogo = getSavedLogo;
window.getServicesUrl = getServicesUrl;
window.getServicesText = getServicesText;
window.shouldShowServices = shouldShowServices;
window.getComplaintPrefix = getComplaintPrefix;
window.getSuggestionPrefix = getSuggestionPrefix;
window.saveSettings = saveSettings;
window.autoSaveSettings = autoSaveSettings;
window.updateAllLogos = updateAllLogos;
window.updateServicesButton = updateServicesButton;
window.generateRequestNumber = generateRequestNumber;
window.validateNationalID = validateNationalID;
window.validatePhone = validatePhone;
window.getCurrentArabicDate = getCurrentArabicDate;
window.getCurrentArabicTime = getCurrentArabicTime;
window.resetSystem = resetSystem;

// تصدير الثوابت
window.STORAGE_KEYS = STORAGE_KEYS;
window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
window.db = db;

// ------------------------------ نهاية ملف الإعدادات ------------------------------
