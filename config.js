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
    LOGO_URL: 'union_logo_url'
};

// الحصول على رابط الشعار المحفوظ
function getSavedLogo() {
    return localStorage.getItem(STORAGE_KEYS.LOGO_URL) || 'https://via.placeholder.com/100x100?text=Logo';
}

// تحديث الشعار في جميع الصفحات
function updateAllLogos(url) {
    localStorage.setItem(STORAGE_KEYS.LOGO_URL, url);
    const logos = document.querySelectorAll('.header-logo, #admin-logo');
    logos.forEach(logo => {
        if(logo) logo.src = url;
    });
}
