// تهيئة Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE",
    authDomain: "itwsreq.firebaseapp.com",
    projectId: "itwsreq",
    storageBucket: "itwsreq.firebasestorage.app",
    messagingSenderId: "417900842360",
    appId: "1:417900842360:web:83d9310f36fef5bbbe4c8d"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// إعدادات التخزين
const STORAGE_KEYS = {
    LOGO_URL: 'union_logo_url',
    SERVICES_URL: 'services_url',
    SERVICES_TEXT: 'services_text',
    SHOW_SERVICES: 'show_services',
    COMPLAINT_PREFIX: 'complaint_prefix',
    SUGGESTION_PREFIX: 'suggestion_prefix'
};

const DEFAULT_SETTINGS = {
    LOGO_URL: 'https://via.placeholder.com/150x150?text=Logo',
    SERVICES_URL: 'https://services.egeng.org',
    SERVICES_TEXT: 'موقع تقديم خدمات النقابة',
    SHOW_SERVICES: true,
    COMPLAINT_PREFIX: 'REQ',
    SUGGESTION_PREFIX: 'REP'
};

function getSetting(key, defaultValue) {
    return localStorage.getItem(STORAGE_KEYS[key]) || defaultValue;
}

function getSavedLogo() {
    return getSetting('LOGO_URL', DEFAULT_SETTINGS.LOGO_URL);
}

function getServicesUrl() {
    return getSetting('SERVICES_URL', DEFAULT_SETTINGS.SERVICES_URL);
}

function getServicesText() {
    return getSetting('SERVICES_TEXT', DEFAULT_SETTINGS.SERVICES_TEXT);
}

function shouldShowServices() {
    const value = localStorage.getItem(STORAGE_KEYS.SHOW_SERVICES);
    return value === null ? DEFAULT_SETTINGS.SHOW_SERVICES : value === 'true';
}

function getComplaintPrefix() {
    return getSetting('COMPLAINT_PREFIX', DEFAULT_SETTINGS.COMPLAINT_PREFIX);
}

function getSuggestionPrefix() {
    return getSetting('SUGGESTION_PREFIX', DEFAULT_SETTINGS.SUGGESTION_PREFIX);
}

function saveSettings(settings) {
    Object.entries(settings).forEach(([key, value]) => {
        if (value !== undefined) {
            localStorage.setItem(STORAGE_KEYS[key], value);
        }
    });
    updateAllLogos(settings.logoUrl || getSavedLogo());
    updateServicesButton();
}

function updateAllLogos(url) {
    ['splash-logo', 'header-main-logo', 'admin-logo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.src = url;
    });
}

function updateServicesButton() {
    const btn = document.getElementById('services-link');
    if (!btn) return;
    btn.style.display = shouldShowServices() && getServicesUrl() ? 'flex' : 'none';
    if (btn.style.display === 'flex') {
        btn.href = getServicesUrl();
        btn.querySelector('span').textContent = getServicesText();
    }
}

async function generateRequestNumber(type) {
    const year = new Date().getFullYear();
    const prefix = type === 'شكوى' ? getComplaintPrefix() : getSuggestionPrefix();
    
    try {
        const snapshot = await db.collection("Requests").where("type", "==", type).get();
        const thisYear = snapshot.docs.filter(doc => {
            const d = doc.data();
            if (!d.createdAt) return false;
            const y = d.createdAt.toDate ? d.createdAt.toDate().getFullYear() : new Date(d.createdAt).getFullYear();
            return y === year;
        });
        
        let max = 0;
        thisYear.forEach(doc => {
            const parts = doc.data().refId?.split('-');
            if (parts?.length >= 2) {
                const num = parseInt(parts[1]);
                if (!isNaN(num) && num > max) max = num;
            }
        });
        
        return `${prefix}-${(max + 1).toString().padStart(4, '0')}-${year}`;
    } catch {
        return `${prefix}-${Date.now().toString().slice(-6)}-${year}`;
    }
}

// بدء التشغيل
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('splash-screen').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
    }, 3000);
});

document.addEventListener('DOMContentLoaded', () => {
    updateAllLogos(getSavedLogo());
    updateServicesButton();
});
