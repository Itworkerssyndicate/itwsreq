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

// تفعيل التخزين المؤقت والتسامح مع الأخطاء
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

const REQUEST_STATUS = {
    RECEIVED: 'تم الاستلام',
    UNDER_REVIEW: 'قيد المراجعة',
    IN_PROGRESS: 'جاري التنفيذ',
    SOLVED: 'تم الحل',
    FINAL_CLOSED: 'تم الإغلاق النهائي',
    READ: 'تمت القراءة',
    UNREAD: 'لم يقرأ'
};

const REQUEST_TYPES = {
    COMPLAINT: 'شكوى',
    SUGGESTION: 'اقتراح'
};

const MEMBERSHIP_TYPES = {
    MEMBER: 'عضو نقابة',
    NON_MEMBER: 'غير عضو'
};

// ------------------------------ دوال مساعدة ------------------------------
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

function getSavedLogo() {
    return getSetting(STORAGE_KEYS.LOGO_URL, DEFAULT_SETTINGS.LOGO_URL);
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

// ------------------------------ تشفير كلمة المرور باستخدام bcryptjs ------------------------------
async function hashPassword(password) {
    // استخدام bcryptjs إذا كان متاحاً
    if (typeof bcrypt !== 'undefined') {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }
    // fallback للتشفير البسيط (للاختبار فقط)
    console.warn('⚠️ bcryptjs غير متاح، استخدام تشفير بسيط');
    return btoa(password);
}

async function comparePassword(password, hash) {
    if (typeof bcrypt !== 'undefined') {
        return await bcrypt.compare(password, hash);
    }
    // fallback للمقارنة البسيطة
    return btoa(password) === hash;
}

// ------------------------------ إنشاء قاعدة البيانات من الصفر ------------------------------
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
                console.log(`⚠️ مجموعة ${collectionName} غير موجودة أو لا يمكن حذفها`);
            }
        }
        
        // إنشاء المجموعات من جديد
        console.log('🔄 جاري إنشاء المجموعات الجديدة...');
        
        // 1. إنشاء مستخدم سوبر أدمن
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
        
        // 2. إنشاء مستخدمين إضافيين للاختبار
        const testUsers = [
            {
                username: 'reviewer',
                password: await hashPassword('review@2026'),
                name: 'مراجع الطلبات',
                email: 'reviewer@itws.org',
                phone: '01234567891',
                role: USER_ROLES.REVIEWER,
                isActive: true,
                permissions: {
                    all: false,
                    users: { view: false, create: false, edit: false, delete: false },
                    requests: { view: true, create: false, edit: true, delete: false },
                    settings: { view: false, edit: false },
                    reports: { view: true, export: false },
                    system: { backup: false, restore: false, reset: false }
                },
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: null,
                lastLoginString: null,
                createdBy: 'system'
            },
            {
                username: 'data_entry',
                password: await hashPassword('data@2026'),
                name: 'مدخل بيانات',
                email: 'data@itws.org',
                phone: '01234567892',
                role: USER_ROLES.DATA_ENTRY,
                isActive: true,
                permissions: {
                    all: false,
                    users: { view: false, create: false, edit: false, delete: false },
                    requests: { view: true, create: true, edit: false, delete: false },
                    settings: { view: false, edit: false },
                    reports: { view: false, export: false },
                    system: { backup: false, restore: false, reset: false }
                },
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: null,
                lastLoginString: null,
                createdBy: 'system'
            }
        ];
        
        for (const user of testUsers) {
            const userRef = await db.collection('Users').add(user);
            console.log(`✅ تم إنشاء مستخدم ${user.username}:`, userRef.id);
        }
        
        // 3. إنشاء عدادات للطلبات
        const counters = [
            { id: 'complaints', year: new Date().getFullYear(), count: 0, lastUpdated: firebase.firestore.FieldValue.serverTimestamp() },
            { id: 'suggestions', year: new Date().getFullYear(), count: 0, lastUpdated: firebase.firestore.FieldValue.serverTimestamp() }
        ];
        
        for (const counter of counters) {
            await db.collection('Counters').doc(counter.id).set(counter);
            console.log(`✅ تم إنشاء عداد ${counter.id}`);
        }
        
        // 4. إنشاء إعدادات النظام
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
        
        // 5. إنشاء سجل النظام
        const systemLog = {
            action: 'system_reset',
            details: { message: 'تم إعادة تعيين قاعدة البيانات وإنشاء مستخدم سوبر أدمن' },
            userId: adminRef.id,
            username: 'admin',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userAgent: navigator.userAgent
        };
        
        await db.collection('SystemLogs').add(systemLog);
        console.log('✅ تم إنشاء سجل النظام');
        
        // 6. إنشاء بعض الطلبات التجريبية
        const sampleRequests = [
            {
                refId: 'REQ-0001-2026',
                name: 'أحمد محمد علي',
                nid: '12345678901234',
                phone: '01234567890',
                gov: 'القاهرة',
                address: '15 شارع النيل - مصر الجديدة',
                job: 'مهندس برمجيات',
                type: REQUEST_TYPES.COMPLAINT,
                details: 'تأخر في صرف مستحقات مالية عن دورة تدريبية',
                memberType: MEMBERSHIP_TYPES.MEMBER,
                memberId: 'MEM12345',
                status: REQUEST_STATUS.RECEIVED,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                tracking: [{
                    status: REQUEST_STATUS.RECEIVED,
                    comment: 'تم استلام الشكوى بنجاح',
                    time: new Date().toLocaleString('ar-EG'),
                    isFinal: false
                }]
            },
            {
                refId: 'REP-0001-2026',
                name: 'سارة أحمد محمود',
                nid: '22345678901234',
                phone: '01234567891',
                gov: 'الجيزة',
                address: '23 شارع الهرم - فيصل',
                job: 'محللة نظم',
                type: REQUEST_TYPES.SUGGESTION,
                details: 'اقتراح بإضافة دورات في مجال الذكاء الاصطناعي',
                memberType: MEMBERSHIP_TYPES.MEMBER,
                memberId: 'MEM67890',
                status: REQUEST_STATUS.UNREAD,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                tracking: [{
                    status: REQUEST_STATUS.UNREAD,
                    comment: 'تم استلام الاقتراح',
                    time: new Date().toLocaleString('ar-EG'),
                    isFinal: false
                }]
            }
        ];
        
        for (const request of sampleRequests) {
            await db.collection('Requests').doc(request.refId).set(request);
            console.log(`✅ تم إنشاء طلب تجريبي: ${request.refId}`);
        }
        
        // حفظ علامة أن النظام تمت إعادة تعيينه
        localStorage.setItem(STORAGE_KEYS.SYSTEM_RESET_DONE, 'true');
        
        console.log('🎉 تم إعادة تعيين قاعدة البيانات بنجاح!');
        
        return {
            success: true,
            message: 'تم إعادة تعيين قاعدة البيانات بنجاح',
            adminId: adminRef.id,
            adminUsername: 'admin',
            adminPassword: 'keyatech@'
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

// ------------------------------ التحقق من وجود قاعدة البيانات ------------------------------
async function checkDatabase() {
    console.log('🔄 جاري التحقق من قاعدة البيانات...');
    
    try {
        // التحقق من وجود مستخدم سوبر أدمن
        const usersSnapshot = await db.collection('Users')
            .where('role', '==', USER_ROLES.SUPER_ADMIN)
            .limit(1)
            .get();
        
        if (usersSnapshot.empty) {
            console.log('⚠️ لا يوجد مستخدم سوبر أدمن، جاري إنشاء قاعدة البيانات...');
            return await resetDatabase();
        }
        
        // التحقق من وجود العدادات
        const countersSnapshot = await db.collection('Counters').get();
        if (countersSnapshot.empty) {
            console.log('⚠️ لا توجد عدادات، جاري إنشائها...');
            const counters = [
                { id: 'complaints', year: new Date().getFullYear(), count: 0, lastUpdated: firebase.firestore.FieldValue.serverTimestamp() },
                { id: 'suggestions', year: new Date().getFullYear(), count: 0, lastUpdated: firebase.firestore.FieldValue.serverTimestamp() }
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
        }
        
        console.log('✅ قاعدة البيانات موجودة وجاهزة للعمل');
        
        // جلب بيانات مستخدم سوبر أدمن للعرض
        const adminDoc = usersSnapshot.docs[0];
        const adminData = adminDoc.data();
        
        return {
            success: true,
            message: 'قاعدة البيانات جاهزة',
            admin: {
                id: adminDoc.id,
                username: adminData.username,
                password: 'keyatech@' // كلمة المرور الأصلية
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

// ------------------------------ دالة تسجيل الدخول المحسنة ------------------------------
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

// ------------------------------ دوال التصدير ------------------------------
window.db = db;
window.STORAGE_KEYS = STORAGE_KEYS;
window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
window.USER_ROLES = USER_ROLES;
window.REQUEST_STATUS = REQUEST_STATUS;
window.REQUEST_TYPES = REQUEST_TYPES;
window.MEMBERSHIP_TYPES = MEMBERSHIP_TYPES;
window.getSetting = getSetting;
window.setSetting = setSetting;
window.getSavedLogo = getSavedLogo;
window.getCurrentArabicDate = getCurrentArabicDate;
window.getCurrentArabicTime = getCurrentArabicTime;
window.validateNationalID = validateNationalID;
window.validatePhone = validatePhone;
window.hashPassword = hashPassword;
window.comparePassword = comparePassword;
window.resetDatabase = resetDatabase;
window.checkDatabase = checkDatabase;
window.loginUser = loginUser;

console.log('✅ Firebase configuration loaded successfully');

// التحقق التلقائي عند تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        const result = await checkDatabase();
        if (result.success) {
            console.log('ℹ️ معلومات تسجيل الدخول:');
            console.log(`   👤 المستخدم: ${result.admin?.username || 'admin'}`);
            console.log(`   🔑 كلمة المرور: keyatech@`);
        }
    });
} else {
    checkDatabase().then(result => {
        if (result.success) {
            console.log('ℹ️ معلومات تسجيل الدخول:');
            console.log(`   👤 المستخدم: ${result.admin?.username || 'admin'}`);
            console.log(`   🔑 كلمة المرور: keyatech@`);
        }
    });
}
