// تهيئة Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE",
    authDomain: "itwsreq.firebaseapp.com",
    projectId: "itwsreq",
    storageBucket: "itwsreq.firebasestorage.app",
    messagingSenderId: "417900842360",
    appId: "1:417900842360:web:83d9310f36fef5bbbe4c8d",
    measurementId: "G-P3YQFRSBMM"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// إعدادات التخزين المحلي
const STORAGE_KEYS = {
    LOGO_URL: 'union_logo_url',
    SERVICES_URL: 'services_url',
    SERVICES_TEXT: 'services_text',
    SHOW_SERVICES: 'show_services',
    COMPLAINT_PREFIX: 'complaint_prefix',
    SUGGESTION_PREFIX: 'suggestion_prefix'
};

// الإعدادات الافتراضية
const DEFAULT_SETTINGS = {
    LOGO_URL: 'https://via.placeholder.com/150x150?text=Logo',
    SERVICES_URL: 'https://services.egeng.org',
    SERVICES_TEXT: 'موقع تقديم خدمات النقابة',
    SHOW_SERVICES: true,
    COMPLAINT_PREFIX: 'REQ',
    SUGGESTION_PREFIX: 'REP'
};

// متغير للتأخير في الحفظ التلقائي
let autoSaveTimeout;

// الحصول على قيمة إعداد معين
function getSetting(key, defaultValue) {
    const value = localStorage.getItem(STORAGE_KEYS[key]);
    return value !== null ? value : defaultValue;
}

// الحصول على رابط الشعار المحفوظ
function getSavedLogo() {
    return getSetting('LOGO_URL', DEFAULT_SETTINGS.LOGO_URL);
}

// الحصول على رابط موقع الخدمات
function getServicesUrl() {
    return getSetting('SERVICES_URL', DEFAULT_SETTINGS.SERVICES_URL);
}

// الحصول على نص زر الخدمات
function getServicesText() {
    return getSetting('SERVICES_TEXT', DEFAULT_SETTINGS.SERVICES_TEXT);
}

// هل يتم إظهار زر الخدمات
function shouldShowServices() {
    const value = localStorage.getItem(STORAGE_KEYS.SHOW_SERVICES);
    return value === null ? DEFAULT_SETTINGS.SHOW_SERVICES : value === 'true';
}

// الحصول على بادئة الشكاوى
function getComplaintPrefix() {
    return getSetting('COMPLAINT_PREFIX', DEFAULT_SETTINGS.COMPLAINT_PREFIX);
}

// الحصول على بادئة المقترحات
function getSuggestionPrefix() {
    return getSetting('SUGGESTION_PREFIX', DEFAULT_SETTINGS.SUGGESTION_PREFIX);
}

// حفظ جميع الإعدادات مع رسالة تأكيد
function saveSettings(settings, showMessage = true) {
    if (settings.logoUrl !== undefined) localStorage.setItem(STORAGE_KEYS.LOGO_URL, settings.logoUrl);
    if (settings.servicesUrl !== undefined) localStorage.setItem(STORAGE_KEYS.SERVICES_URL, settings.servicesUrl);
    if (settings.servicesText !== undefined) localStorage.setItem(STORAGE_KEYS.SERVICES_TEXT, settings.servicesText);
    if (settings.showServices !== undefined) localStorage.setItem(STORAGE_KEYS.SHOW_SERVICES, settings.showServices);
    if (settings.complaintPrefix !== undefined) localStorage.setItem(STORAGE_KEYS.COMPLAINT_PREFIX, settings.complaintPrefix);
    if (settings.suggestionPrefix !== undefined) localStorage.setItem(STORAGE_KEYS.SUGGESTION_PREFIX, settings.suggestionPrefix);
    
    // تحديث الشعارات
    updateAllLogos(settings.logoUrl || getSavedLogo());
    
    // تحديث زر الخدمات
    updateServicesButton();
    
    // إظهار رسالة تأكيد إذا طُلب ذلك
    if (showMessage) {
        showAutoSaveMessage();
    }
}

// إظهار رسالة الحفظ التلقائي
function showAutoSaveMessage() {
    const messageEl = document.getElementById('auto-save-message');
    if (messageEl) {
        messageEl.style.display = 'flex';
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 2000);
    }
}

// الحفظ التلقائي (يتم استدعاؤه عند التغيير)
function autoSaveSettings() {
    // إلغاء المؤقت السابق
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }
    
    // تعيين مؤقت جديد للحفظ بعد 500ms من آخر تغيير
    autoSaveTimeout = setTimeout(() => {
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
        
        saveSettings(settings, true);
    }, 500);
}

// تحديث الشعار في جميع الصفحات
function updateAllLogos(url) {
    const splashLogo = document.getElementById('splash-logo');
    const headerLogo = document.getElementById('header-main-logo');
    const adminLogo = document.getElementById('admin-logo');
    
    if(splashLogo) splashLogo.src = url;
    if(headerLogo) headerLogo.src = url;
    if(adminLogo) adminLogo.src = url;
}

// تحديث زر الخدمات
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

// إنشاء رقم طلب متسلسل
async function generateRequestNumber(type) {
    const year = new Date().getFullYear();
    const prefix = type === 'شكوى' ? getComplaintPrefix() : getSuggestionPrefix();
    
    try {
        const snapshot = await db.collection("Requests")
            .where("type", "==", type)
            .get();
        
        const thisYearRequests = snapshot.docs.filter(doc => {
            const data = doc.data();
            if (!data.createdAt) return false;
            const docYear = data.createdAt.toDate ? 
                data.createdAt.toDate().getFullYear() : 
                new Date(data.createdAt).getFullYear();
            return docYear === year;
        });
        
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
        
        const newSerial = (maxSerial + 1).toString().padStart(4, '0');
        return `${prefix}-${newSerial}-${year}`;
        
    } catch (error) {
        console.error("Error generating request number:", error);
        const timestamp = Date.now().toString().slice(-6);
        return `${prefix}-${timestamp}-${year}`;
    }
}

// إخفاء شاشة البداية بعد التحميل
window.addEventListener('load', function() {
    setTimeout(function() {
        const splash = document.getElementById('splash-screen');
        const mainContent = document.getElementById('main-content');
        if (splash) splash.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
    }, 3000);
});

// تطبيق الإعدادات المحفوظة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    const savedLogo = getSavedLogo();
    updateAllLogos(savedLogo);
    updateServicesButton();
});
