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

// الحصول على رابط الشعار المحفوظ
function getSavedLogo() {
    return localStorage.getItem(STORAGE_KEYS.LOGO_URL) || DEFAULT_SETTINGS.LOGO_URL;
}

// الحصول على رابط موقع الخدمات
function getServicesUrl() {
    return localStorage.getItem(STORAGE_KEYS.SERVICES_URL) || DEFAULT_SETTINGS.SERVICES_URL;
}

// الحصول على نص زر الخدمات
function getServicesText() {
    return localStorage.getItem(STORAGE_KEYS.SERVICES_TEXT) || DEFAULT_SETTINGS.SERVICES_TEXT;
}

// هل يتم إظهار زر الخدمات
function shouldShowServices() {
    const value = localStorage.getItem(STORAGE_KEYS.SHOW_SERVICES);
    return value === null ? DEFAULT_SETTINGS.SHOW_SERVICES : value === 'true';
}

// الحصول على بادئة الشكاوى
function getComplaintPrefix() {
    return localStorage.getItem(STORAGE_KEYS.COMPLAINT_PREFIX) || DEFAULT_SETTINGS.COMPLAINT_PREFIX;
}

// الحصول على بادئة المقترحات
function getSuggestionPrefix() {
    return localStorage.getItem(STORAGE_KEYS.SUGGESTION_PREFIX) || DEFAULT_SETTINGS.SUGGESTION_PREFIX;
}

// تحديث جميع الإعدادات
function updateAllSettings(settings) {
    if (settings.logoUrl) localStorage.setItem(STORAGE_KEYS.LOGO_URL, settings.logoUrl);
    if (settings.servicesUrl) localStorage.setItem(STORAGE_KEYS.SERVICES_URL, settings.servicesUrl);
    if (settings.servicesText) localStorage.setItem(STORAGE_KEYS.SERVICES_TEXT, settings.servicesText);
    if (settings.showServices !== undefined) localStorage.setItem(STORAGE_KEYS.SHOW_SERVICES, settings.showServices);
    if (settings.complaintPrefix) localStorage.setItem(STORAGE_KEYS.COMPLAINT_PREFIX, settings.complaintPrefix);
    if (settings.suggestionPrefix) localStorage.setItem(STORAGE_KEYS.SUGGESTION_PREFIX, settings.suggestionPrefix);
    
    // تحديث الشعارات في الصفحة الحالية
    updateAllLogos(settings.logoUrl || getSavedLogo());
    
    // تحديث زر الخدمات
    updateServicesButton();
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
        servicesBtn.querySelector('span').textContent = servicesText;
    } else {
        servicesBtn.style.display = 'none';
    }
}

// إنشاء رقم طلب متسلسل
async function generateRequestNumber(type) {
    const year = new Date().getFullYear();
    const prefix = type === 'شكوى' ? getComplaintPrefix() : getSuggestionPrefix();
    
    try {
        // الحصول على آخر رقم مسلسل لهذا النوع والسنة
        const snapshot = await db.collection("Requests")
            .where("type", "==", type)
            .get();
        
        // تصفية الطلبات التي تنتمي للسنة الحالية
        const thisYearRequests = snapshot.docs.filter(doc => {
            const data = doc.data();
            if (!data.createdAt) return false;
            const docYear = data.createdAt.toDate ? 
                data.createdAt.toDate().getFullYear() : 
                new Date(data.createdAt).getFullYear();
            return docYear === year;
        });
        
        // الحصول على أعلى رقم مسلسل
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
        
        // الرقم المسلسل الجديد
        const newSerial = (maxSerial + 1).toString().padStart(4, '0');
        return `${prefix}-${newSerial}-${year}`;
        
    } catch (error) {
        console.error("Error generating request number:", error);
        // في حالة الخطأ، نستخدم طريقة بديلة
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
