// =====================================================================
// VR 2.05.2026 - إعدادات Firebase والثوابت العامة
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
    SYSTEM_RESET_DONE: 'system_reset_done',
    
    // معلومات المستخدم الحالي
    CURRENT_USER_ID: 'currentUserId',
    CURRENT_USER: 'currentUser',
    CURRENT_USER_ROLE: 'currentUserRole',
    CURRENT_USER_LAST_LOGIN: 'currentUserLastLogin'
};

// ------------------------------ الإعدادات الافتراضية ------------------------------
const DEFAULT_SETTINGS = {
    // الشعار الافتراضي
    LOGO_URL: 'https://placehold.co/200x200/0a0f1f/00ffff/png?text=Logo',
    
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

// ------------------------------ أدوار المستخدمين ------------------------------
const USER_ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    REVIEWER: 'reviewer',
    DATA_ENTRY: 'data_entry'
};

// ------------------------------ أسماء الأدوار بالعربية ------------------------------
const ROLE_NAMES = {
    [USER_ROLES.SUPER_ADMIN]: 'سوبر أدمن',
    [USER_ROLES.ADMIN]: 'أدمن',
    [USER_ROLES.REVIEWER]: 'مراجع',
    [USER_ROLES.DATA_ENTRY]: 'مدخل بيانات'
};

// ------------------------------ حالات الطلبات ------------------------------
const REQUEST_STATUS = {
    RECEIVED: 'تم الاستلام',
    UNDER_REVIEW: 'قيد المراجعة',
    IN_PROGRESS: 'جاري التنفيذ',
    SOLVED: 'تم الحل',
    FINAL_CLOSED: 'تم الإغلاق النهائي',
    READ: 'تمت القراءة',
    UNREAD: 'لم يقرأ'
};

// ------------------------------ أنواع الطلبات ------------------------------
const REQUEST_TYPES = {
    COMPLAINT: 'شكوى',
    SUGGESTION: 'اقتراح'
};

// ------------------------------ أنواع العضوية ------------------------------
const MEMBERSHIP_TYPES = {
    MEMBER: 'عضو نقابة',
    NON_MEMBER: 'غير عضو'
};

// ------------------------------ المحافظات المصرية ------------------------------
const EGYPT_GOVS = [
    'القاهرة',
    'الجيزة',
    'الإسكندرية',
    'الدقهلية',
    'البحر الأحمر',
    'البحيرة',
    'الفيوم',
    'الغربية',
    'الإسماعيلية',
    'المنوفية',
    'المنيا',
    'القليوبية',
    'الوادي الجديد',
    'السويس',
    'أسوان',
    'أسيوط',
    'بني سويف',
    'بورسعيد',
    'جنوب سيناء',
    'دمياط',
    'سوهاج',
    'شمال سيناء',
    'قنا',
    'كفر الشيخ',
    'مطروح',
    'الأقصر',
    'حلوان',
    '6 أكتوبر'
];

// ------------------------------ دوال الإعدادات الأساسية ------------------------------

/**
 * الحصول على قيمة إعداد من التخزين المحلي
 * @param {string} key - مفتاح الإعداد (من STORAGE_KEYS)
 * @param {any} defaultValue - القيمة الافتراضية إذا لم يوجد
 * @returns {any} قيمة الإعداد
 */
function getSetting(key, defaultValue) {
    try {
        const value = localStorage.getItem(key);
        return value !== null ? value : defaultValue;
    } catch (error) {
        console.error('خطأ في قراءة الإعدادات:', error);
        return defaultValue;
    }
}

/**
 * حفظ قيمة إعداد في التخزين المحلي
 * @param {string} key - مفتاح الإعداد
 * @param {any} value - القيمة المراد حفظها
 */
function setSetting(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        console.error('خطأ في حفظ الإعدادات:', error);
    }
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

/**
 * الحصول على اسم الدور بالعربية
 * @param {string} role - الدور بالإنجليزية
 * @returns {string} اسم الدور بالعربية
 */
function getRoleName(role) {
    return ROLE_NAMES[role] || role;
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
 * تحديث الشعار في جميع الصفحات
 * @param {string} url - رابط الشعار الجديد
 */
function updateAllLogos(url) {
    const splashLogo = document.getElementById('splash-logo');
    const headerLogo = document.getElementById('header-main-logo');
    const sidebarLogo = document.getElementById('sidebar-logo') || document.getElementById('admin-logo') || document.getElementById('sidebarLogo');
    
    if (splashLogo) splashLogo.src = url;
    if (headerLogo) headerLogo.src = url;
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
 * التحقق من صحة الرقم القومي المصري
 * @param {string} nid - الرقم القومي
 * @returns {boolean} صحة الرقم
 */
function validateNationalID(nid) {
    // الرقم القومي المصري: 14 رقم
    return /^\d{14}$/.test(nid);
}

/**
 * التحقق من صحة رقم الهاتف المصري
 * @param {string} phone - رقم الهاتف
 * @returns {boolean} صحة الرقم
 */
function validatePhone(phone) {
    // أرقام الهواتف المصرية: 01xxxxxxxxx
    return /^01[0-2,5]{1}[0-9]{8}$/.test(phone);
}

/**
 * تشفير بسيط (للاستخدام الداخلي)
 * @param {string} password - كلمة المرور
 * @returns {string} كلمة المرور المشفرة
 */
function hashPassword(password) {
    // في الإنتاج استخدم SHA-256
    return btoa(password);
}

/**
 * الحصول على التاريخ الحالي بتنسيق عربي
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

/**
 * إنشاء رقم طلب متسلسل من Firestore
 * @param {Object} db - كائن قاعدة البيانات
 * @param {string} type - نوع الطلب (شكوى أو اقتراح)
 * @returns {Promise<string>} رقم الطلب المتسلسل
 */
async function generateRequestNumber(db, type) {
    const year = new Date().getFullYear();
    const prefix = type === REQUEST_TYPES.COMPLAINT ? getComplaintPrefix() : getSuggestionPrefix();
    
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

// ------------------------------ دوال جلب الإعدادات ------------------------------

/**
 * تحميل إعدادات الشعار المحفوظة
 */
function loadSavedLogo() {
    const savedLogo = getSavedLogo();
    updateAllLogos(savedLogo);
}

/**
 * تحميل إعدادات الخدمات المحفوظة
 */
function loadServicesSettings() {
    updateServicesButton();
}

// ------------------------------ التصدير ------------------------------

// تصدير الثوابت والدوال للاستخدام العام
window.firebaseConfig = firebaseConfig;
window.STORAGE_KEYS = STORAGE_KEYS;
window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
window.USER_ROLES = USER_ROLES;
window.ROLE_NAMES = ROLE_NAMES;
window.REQUEST_STATUS = REQUEST_STATUS;
window.REQUEST_TYPES = REQUEST_TYPES;
window.MEMBERSHIP_TYPES = MEMBERSHIP_TYPES;
window.EGYPT_GOVS = EGYPT_GOVS;

window.getSetting = getSetting;
window.setSetting = setSetting;
window.getSavedLogo = getSavedLogo;
window.getServicesUrl = getServicesUrl;
window.getServicesText = getServicesText;
window.shouldShowServices = shouldShowServices;
window.getComplaintPrefix = getComplaintPrefix;
window.getSuggestionPrefix = getSuggestionPrefix;
window.getRoleName = getRoleName;
window.saveSettings = saveSettings;
window.updateAllLogos = updateAllLogos;
window.updateServicesButton = updateServicesButton;
window.formatText = formatText;
window.validateNationalID = validateNationalID;
window.validatePhone = validatePhone;
window.hashPassword = hashPassword;
window.getCurrentArabicDate = getCurrentArabicDate;
window.getCurrentArabicTime = getCurrentArabicTime;
window.generateRequestNumber = generateRequestNumber;
window.loadSavedLogo = loadSavedLogo;
window.loadServicesSettings = loadServicesSettings;

// ------------------------------ نهاية ملف الإعدادات ------------------------------
