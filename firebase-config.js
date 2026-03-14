// =====================================================================
// VR 2.05.2026 - تهيئة Firebase وإعداد قاعدة البيانات
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

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// تفعيل التخزين المؤقت
db.settings({ 
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
    ignoreUndefinedProperties: true,
    merge: true
});

console.log('✅ Firebase initialized successfully');

// ------------------------------ الثوابت العامة ------------------------------
const STORAGE_KEYS = {
    LOGO_URL: 'union_logo_url',
    COMPLAINT_PREFIX: 'complaint_prefix',
    SUGGESTION_PREFIX: 'suggestion_prefix',
    SERVICES_URL: 'services_url',
    SERVICES_TEXT: 'services_text',
    SHOW_SERVICES: 'show_services',
    CURRENT_USER_ID: 'currentUserId',
    CURRENT_USER: 'currentUser',
    CURRENT_USER_ROLE: 'currentUserRole',
    CURRENT_USER_LAST_LOGIN: 'currentUserLastLogin',
    SYSTEM_RESET_DONE: 'system_reset_done'
};

const DEFAULT_SETTINGS = {
    LOGO_URL: 'https://placehold.co/200x200/0a0f1f/00ffff/png?text=Logo',
    COMPLAINT_PREFIX: 'REQ',
    SUGGESTION_PREFIX: 'REP',
    SERVICES_URL: 'https://services.egeng.org',
    SERVICES_TEXT: 'موقع تقديم خدمات النقابة',
    SHOW_SERVICES: true,
    SYSTEM_VERSION: 'VR 2.05.2026'
};

const USER_ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    REVIEWER: 'reviewer',
    DATA_ENTRY: 'data_entry'
};

// =====================================================================
// نظام اللوجو المتكامل - حل مشكلة المزامنة بين الأجهزة
// =====================================================================

/**
 * تحميل اللوجو من Firebase (المصدر الرئيسي)
 */
async function loadLogoFromFirebase() {
    try {
        console.log('🔄 جاري تحميل اللوجو من Firebase...');
        
        // محاولة جلب اللوجو من Firebase
        const settingsDoc = await db.collection('Settings').doc('system').get();
        
        if (settingsDoc.exists) {
            const settings = settingsDoc.data();
            
            // إذا كان فيه لوجو في Firebase
            if (settings.logo && settings.logo.trim() !== '') {
                // حفظ في localStorage كنسخة احتياطية
                localStorage.setItem(STORAGE_KEYS.LOGO_URL, settings.logo);
                console.log('✅ تم تحميل اللوجو من Firebase:', settings.logo);
                return settings.logo;
            }
        }
        
        // لو مفيش لوجو في Firebase، نشوف localStorage
        const localLogo = localStorage.getItem(STORAGE_KEYS.LOGO_URL);
        if (localLogo && localLogo.trim() !== '') {
            console.log('✅ استخدام اللوجو من localStorage:', localLogo);
            
            // حفظ اللوجو المحلي في Firebase للمزامنة
            await saveLogoToFirebase(localLogo, false);
            
            return localLogo;
        }
        
        // استخدام اللوجو الافتراضي
        console.log('✅ استخدام اللوجو الافتراضي');
        localStorage.setItem(STORAGE_KEYS.LOGO_URL, DEFAULT_SETTINGS.LOGO_URL);
        return DEFAULT_SETTINGS.LOGO_URL;
        
    } catch (error) {
        console.error('❌ خطأ في تحميل اللوجو من Firebase:', error);
        
        // في حالة الخطأ، نستخدم المخزن المحلي أو الافتراضي
        const localLogo = localStorage.getItem(STORAGE_KEYS.LOGO_URL);
        if (localLogo && localLogo.trim() !== '') {
            return localLogo;
        }
        
        return DEFAULT_SETTINGS.LOGO_URL;
    }
}

/**
 * حفظ اللوجو في Firebase (المصدر الرئيسي)
 */
async function saveLogoToFirebase(logoUrl, showLog = true) {
    try {
        // التحقق من صحة الرابط
        if (!logoUrl || logoUrl.trim() === '') {
            logoUrl = DEFAULT_SETTINGS.LOGO_URL;
        }
        
        // حفظ في localStorage أولاً
        localStorage.setItem(STORAGE_KEYS.LOGO_URL, logoUrl);
        
        // الحصول على اسم المستخدم الحالي
        const currentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'system';
        
        // حفظ في Firebase
        await db.collection('Settings').doc('system').set({
            logo: logoUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: currentUser
        }, { merge: true });
        
        if (showLog) {
            console.log('✅ تم حفظ اللوجو في Firebase:', logoUrl);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ خطأ في حفظ اللوجو في Firebase:', error);
        return false;
    }
}

/**
 * الحصول على اللوجو (يحاول Firebase أولاً)
 */
async function getLogo() {
    return await loadLogoFromFirebase();
}

/**
 * تحديث جميع اللوجوهات في الصفحة
 */
async function updateAllLogos() {
    const logo = await getLogo();
    
    // قائمة بكل العناصر التي تحمل اللوجو
    const logoElements = [
        'splash-logo',
        'header-main-logo',
        'sidebar-logo',
        'admin-logo',
        'setup-logo',
        'sidebarLogo'
    ];
    
    // تحديث كل العناصر
    logoElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.src = logo;
            element.onerror = function() {
                console.warn(`⚠️ فشل تحميل اللوجو للمعرف: ${id}، استخدام الافتراضي`);
                this.src = DEFAULT_SETTINGS.LOGO_URL;
            };
        }
    });
    
    console.log('✅ تم تحديث جميع اللوجوهات في الصفحة');
    return logo;
}

/**
 * تغيير اللوجو (للإستخدام من صفحة الإعدادات)
 */
async function changeLogo(newLogoUrl) {
    const result = await saveLogoToFirebase(newLogoUrl);
    
    if (result) {
        await updateAllLogos();
        return true;
    }
    
    return false;
}

// =====================================================================
// التحقق من وجود قاعدة البيانات وإنشاء المستخدم الأساسي فقط
// =====================================================================
async function checkDatabase() {
    console.log('🔄 جاري التحقق من قاعدة البيانات...');
    
    try {
        // التحقق من وجود مستخدم سوبر أدمن
        const usersSnapshot = await db.collection('Users')
            .where('role', '==', USER_ROLES.SUPER_ADMIN)
            .limit(1)
            .get();
        
        // إذا مفيش مستخدم سوبر أدمن، ننشئ واحد بس
        if (usersSnapshot.empty) {
            console.log('⚠️ لا يوجد مستخدم سوبر أدمن، جاري إنشاء مستخدم أساسي...');
            
            // تشفير كلمة المرور
            const hashedPassword = await hashPassword('keyatech@');
            
            // إنشاء مستخدم سوبر أدمن فقط (بدون بيانات تجريبية)
            const superAdmin = {
                username: 'admin',
                password: hashedPassword,
                name: 'المشرف العام',
                email: 'admin@itws.org',
                phone: '01234567890',
                role: USER_ROLES.SUPER_ADMIN,
                isActive: true,
                permissions: {
                    all: true,
                    users: { view: true, create: true, edit: true, delete: true },
                    requests: { view: true, create: true, edit: true, delete: true },
                    settings: { view: true, edit: true },
                    reports: { view: true, export: true },
                    system: { backup: true, restore: true, reset: true }
                },
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: null,
                lastLoginString: null,
                createdBy: 'system'
            };
            
            await db.collection('Users').add(superAdmin);
            console.log('✅ تم إنشاء مستخدم سوبر أدمن');
        }
        
        // التحقق من وجود العدادات
        const countersSnapshot = await db.collection('Counters').get();
        if (countersSnapshot.empty) {
            console.log('⚠️ لا توجد عدادات، جاري إنشائها...');
            
            const counters = [
                { 
                    id: 'complaints', 
                    year: new Date().getFullYear(), 
                    count: 0, 
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp() 
                },
                { 
                    id: 'suggestions', 
                    year: new Date().getFullYear(), 
                    count: 0, 
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp() 
                }
            ];
            
            for (const counter of counters) {
                await db.collection('Counters').doc(counter.id).set(counter);
            }
            console.log('✅ تم إنشاء العدادات');
        }
        
        // التحقق من وجود إعدادات النظام
        const settingsDoc = await db.collection('Settings').doc('system').get();
        if (!settingsDoc.exists) {
            console.log('⚠️ لا توجد إعدادات للنظام، جاري إنشائها...');
            
            const settings = {
                logo: DEFAULT_SETTINGS.LOGO_URL,
                complaintPrefix: DEFAULT_SETTINGS.COMPLAINT_PREFIX,
                suggestionPrefix: DEFAULT_SETTINGS.SUGGESTION_PREFIX,
                servicesUrl: DEFAULT_SETTINGS.SERVICES_URL,
                servicesText: DEFAULT_SETTINGS.SERVICES_TEXT,
                showServices: DEFAULT_SETTINGS.SHOW_SERVICES,
                systemVersion: DEFAULT_SETTINGS.SYSTEM_VERSION,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: 'system'
            };
            
            await db.collection('Settings').doc('system').set(settings);
            console.log('✅ تم إنشاء إعدادات النظام');
        } else {
            // إذا كانت الإعدادات موجودة، نتأكد من تحميل اللوجو
            const settings = settingsDoc.data();
            if (settings.logo) {
                localStorage.setItem(STORAGE_KEYS.LOGO_URL, settings.logo);
                console.log('✅ تم تحميل اللوجو من الإعدادات');
            }
        }
        
        console.log('✅ قاعدة البيانات جاهزة للعمل');
        
        // جلب بيانات مستخدم سوبر أدمن للعرض
        const adminSnapshot = await db.collection('Users')
            .where('role', '==', USER_ROLES.SUPER_ADMIN)
            .limit(1)
            .get();
        
        const adminDoc = adminSnapshot.docs[0];
        const adminData = adminDoc.data();
        
        return {
            success: true,
            message: 'قاعدة البيانات جاهزة',
            admin: {
                id: adminDoc.id,
                username: adminData.username,
                password: 'keyatech@'
            }
        };
        
    } catch (error) {
        console.error('❌ خطأ في التحقق من قاعدة البيانات:', error);
        return {
            success: false,
            message: 'حدث خطأ في التحقق من قاعدة البيانات',
            error: error.message
        };
    }
}

// =====================================================================
// دوال مساعدة
// =====================================================================
function getSetting(key, defaultValue) {
    try {
        const value = localStorage.getItem(key);
        return value !== null ? value : defaultValue;
    } catch (error) {
        console.error('خطأ في قراءة الإعدادات:', error);
        return defaultValue;
    }
}

function setSetting(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        console.error('خطأ في حفظ الإعدادات:', error);
    }
}

function getCurrentArabicDate() {
    const now = new Date();
    return now.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getCurrentArabicTime() {
    const now = new Date();
    return now.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function validateNationalID(nid) {
    return /^\d{14}$/.test(nid);
}

function validatePhone(phone) {
    return /^01[0-2,5]{1}[0-9]{8}$/.test(phone);
}

// ------------------------------ تشفير كلمة المرور ------------------------------
async function hashPassword(password) {
    if (typeof bcrypt !== 'undefined') {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }
    console.warn('⚠️ bcryptjs غير متاح، استخدام تشفير بسيط');
    return btoa(password);
}

async function comparePassword(password, hash) {
    if (typeof bcrypt !== 'undefined') {
        return await bcrypt.compare(password, hash);
    }
    return btoa(password) === hash;
}

// =====================================================================
// إعادة تعيين قاعدة البيانات (بدون بيانات تجريبية)
// =====================================================================
async function resetDatabase() {
    console.log('🔄 جاري إعادة تعيين قاعدة البيانات...');
    
    try {
        // حذف المجموعات الموجودة
        const collections = ['Users', 'Requests', 'Counters', 'Settings', 'SystemLogs'];
        
        for (const collectionName of collections) {
            try {
                const snapshot = await db.collection(collectionName).get();
                const batch = db.batch();
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                console.log(`✅ تم حذف مجموعة ${collectionName}`);
            } catch (error) {
                console.log(`⚠️ مجموعة ${collectionName} غير موجودة`);
            }
        }
        
        console.log('🔄 جاري إنشاء الهيكل الأساسي...');
        
        // 1. إنشاء مستخدم سوبر أدمن فقط (بدون مستخدمين إضافيين)
        const hashedPassword = await hashPassword('keyatech@');
        
        const superAdmin = {
            username: 'admin',
            password: hashedPassword,
            name: 'المشرف العام',
            email: 'admin@itws.org',
            phone: '01234567890',
            role: USER_ROLES.SUPER_ADMIN,
            isActive: true,
            permissions: {
                all: true,
                users: { view: true, create: true, edit: true, delete: true },
                requests: { view: true, create: true, edit: true, delete: true },
                settings: { view: true, edit: true },
                reports: { view: true, export: true },
                system: { backup: true, restore: true, reset: true }
            },
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: null,
            lastLoginString: null,
            createdBy: 'system'
        };
        
        const adminRef = await db.collection('Users').add(superAdmin);
        console.log('✅ تم إنشاء مستخدم سوبر أدمن:', adminRef.id);
        
        // 2. إنشاء عدادات
        const counters = [
            { 
                id: 'complaints', 
                year: new Date().getFullYear(), 
                count: 0, 
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp() 
            },
            { 
                id: 'suggestions', 
                year: new Date().getFullYear(), 
                count: 0, 
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp() 
            }
        ];
        
        for (const counter of counters) {
            await db.collection('Counters').doc(counter.id).set(counter);
            console.log(`✅ تم إنشاء عداد ${counter.id}`);
        }
        
        // 3. إنشاء إعدادات النظام - مع اللوجو الافتراضي
        const settings = {
            logo: DEFAULT_SETTINGS.LOGO_URL,
            complaintPrefix: DEFAULT_SETTINGS.COMPLAINT_PREFIX,
            suggestionPrefix: DEFAULT_SETTINGS.SUGGESTION_PREFIX,
            servicesUrl: DEFAULT_SETTINGS.SERVICES_URL,
            servicesText: DEFAULT_SETTINGS.SERVICES_TEXT,
            showServices: DEFAULT_SETTINGS.SHOW_SERVICES,
            systemVersion: DEFAULT_SETTINGS.SYSTEM_VERSION,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: 'system'
        };
        
        await db.collection('Settings').doc('system').set(settings);
        console.log('✅ تم إنشاء إعدادات النظام');
        
        // 4. إنشاء سجل النظام
        const systemLog = {
            action: 'system_reset',
            details: { message: 'تم إعادة تعيين قاعدة البيانات' },
            userId: adminRef.id,
            username: 'admin',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userAgent: navigator.userAgent
        };
        
        await db.collection('SystemLogs').add(systemLog);
        console.log('✅ تم إنشاء سجل النظام');
        
        // حفظ علامة أن النظام تمت إعادة تعيينه
        localStorage.setItem(STORAGE_KEYS.SYSTEM_RESET_DONE, 'true');
        
        // تحديث اللوجو في localStorage
        localStorage.setItem(STORAGE_KEYS.LOGO_URL, DEFAULT_SETTINGS.LOGO_URL);
        
        console.log('🎉 تم إعادة تعيين قاعدة البيانات بنجاح!');
        
        return {
            success: true,
            message: 'تم إعادة تعيين قاعدة البيانات بنجاح',
            admin: {
                id: adminRef.id,
                username: 'admin',
                password: 'keyatech@'
            }
        };
        
    } catch (error) {
        console.error('❌ خطأ في إعادة تعيين قاعدة البيانات:', error);
        return {
            success: false,
            message: 'حدث خطأ في إعادة تعيين قاعدة البيانات',
            error: error.message
        };
    }
}

// =====================================================================
// دوال تسجيل الدخول
// =====================================================================
async function loginUser(username, password) {
    try {
        console.log('🔍 محاولة تسجيل الدخول للمستخدم:', username);
        
        // البحث عن المستخدم
        const snapshot = await db.collection('Users')
            .where('username', '==', username)
            .where('isActive', '==', true)
            .get();
        
        if (snapshot.empty) {
            console.log('❌ المستخدم غير موجود أو غير نشط:', username);
            return {
                success: false,
                message: 'اسم المستخدم غير صحيح أو الحساب غير نشط'
            };
        }
        
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        
        // التحقق من كلمة المرور
        const isValid = await comparePassword(password, userData.password);
        
        if (!isValid) {
            console.log('❌ كلمة مرور غير صحيحة لـ:', username);
            return {
                success: false,
                message: 'كلمة المرور غير صحيحة'
            };
        }
        
        console.log('✅ تم تسجيل الدخول بنجاح:', username);
        
        // تحديث آخر دخول
        const now = new Date();
        const lastLoginStr = now.toLocaleString('ar-EG');
        
        await db.collection('Users').doc(userDoc.id).update({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            lastLoginString: lastLoginStr
        });
        
        // حفظ بيانات الجلسة
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userDoc.id);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userData.username);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ROLE, userData.role);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_LAST_LOGIN, lastLoginStr);
        
        return {
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            user: {
                id: userDoc.id,
                username: userData.username,
                name: userData.name,
                role: userData.role,
                permissions: userData.permissions
            }
        };
        
    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول:', error);
        return {
            success: false,
            message: 'حدث خطأ في تسجيل الدخول',
            error: error.message
        };
    }
}

// =====================================================================
// تهيئة النظام عند التحميل
// =====================================================================
async function initializeSystem() {
    console.log('🔄 جاري تهيئة النظام...');
    
    // التحقق من قاعدة البيانات
    const dbStatus = await checkDatabase();
    
    // تحميل اللوجو من Firebase
    await loadLogoFromFirebase();
    
    // تحديث اللوجوهات في الصفحة إذا كانت موجودة
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(updateAllLogos, 500);
    } else {
        document.addEventListener('DOMContentLoaded', updateAllLogos);
    }
    
    return dbStatus;
}

// =====================================================================
// دوال التصدير
// =====================================================================
window.db = db;
window.STORAGE_KEYS = STORAGE_KEYS;
window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
window.USER_ROLES = USER_ROLES;
window.getSetting = getSetting;
window.setSetting = setSetting;
window.getCurrentArabicDate = getCurrentArabicDate;
window.getCurrentArabicTime = getCurrentArabicTime;
window.validateNationalID = validateNationalID;
window.validatePhone = validatePhone;
window.hashPassword = hashPassword;
window.comparePassword = comparePassword;
window.resetDatabase = resetDatabase;
window.checkDatabase = checkDatabase;
window.loginUser = loginUser;
window.loadLogoFromFirebase = loadLogoFromFirebase;
window.saveLogoToFirebase = saveLogoToFirebase;
window.getLogo = getLogo;
window.updateAllLogos = updateAllLogos;
window.changeLogo = changeLogo;
window.initializeSystem = initializeSystem;

console.log('✅ Firebase configuration loaded successfully');

// تهيئة النظام تلقائياً
initializeSystem().then(result => {
    if (result.success) {
        console.log('ℹ️ معلومات تسجيل الدخول:');
        console.log(`   👤 اسم المستخدم: admin`);
        console.log(`   🔑 كلمة المرور: keyatech@`);
        console.log(`   📞 رقم الهاتف: 01234567890`);
    }
});
