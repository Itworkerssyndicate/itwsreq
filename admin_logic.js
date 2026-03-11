// =====================================================================
// VR 2.05.2026 - دوال لوحة التحكم المتقدمة
// الإصدار الماسي - النسخة الإدارية المتطورة
// جميع الحقوق محفوظة لنقابة تكنولوجيا المعلومات والبرمجيات © 2026
// =====================================================================

// ------------------------------ متغيرات عامة متقدمة ------------------------------
let currentUser = null; // المستخدم الحالي
let userPermissions = {}; // صلاحيات المستخدم
let systemLogs = []; // سجل النظام
let backupData = null; // بيانات النسخ الاحتياطي
let charts = {}; // كائن لتخزين الرسوم البيانية

// ------------------------------ نظام المستخدمين المتقدم ------------------------------

/**
 * تهيئة نظام المستخدمين
 * هذا نظام متقدم لإدارة المستخدمين بصلاحيات متعددة
 */
async function initUserSystem() {
    try {
        // التحقق من وجود Collection المستخدمين
        const usersRef = db.collection('Users');
        const snapshot = await usersRef.get();
        
        if (snapshot.empty) {
            // إنشاء مستخدم افتراضي إذا لم يكن موجوداً
            await createDefaultUsers();
        }
        
        // تحميل المستخدم الحالي
        await loadCurrentUser();
        
        console.log('✅ تم تهيئة نظام المستخدمين');
    } catch (error) {
        console.error('خطأ في تهيئة نظام المستخدمين:', error);
    }
}

/**
 * إنشاء مستخدمين افتراضيين
 */
async function createDefaultUsers() {
    const usersRef = db.collection('Users');
    
    const defaultUsers = [
        {
            username: 'admin',
            password: hashPassword('itws@2026'),
            name: 'المشرف العام',
            role: 'super_admin',
            email: 'admin@itws.org',
            phone: '01234567890',
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
            isActive: true,
            avatar: null
        },
        {
            username: 'reviewer',
            password: hashPassword('review@2026'),
            name: 'مراجع الطلبات',
            role: 'reviewer',
            email: 'reviewer@itws.org',
            phone: '01234567891',
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
            isActive: true,
            avatar: null
        },
        {
            username: 'viewer',
            password: hashPassword('view@2026'),
            name: 'مشاهد فقط',
            role: 'viewer',
            email: 'viewer@itws.org',
            phone: '01234567892',
            permissions: {
                all: false,
                users: { view: false, create: false, edit: false, delete: false },
                requests: { view: true, create: false, edit: false, delete: false },
                settings: { view: false, edit: false },
                reports: { view: true, export: false },
                system: { backup: false, restore: false, reset: false }
            },
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: null,
            isActive: true,
            avatar: null
        }
    ];
    
    for (const user of defaultUsers) {
        await usersRef.add(user);
    }
    
    console.log('✅ تم إنشاء المستخدمين الافتراضيين');
}

/**
 * تشفير كلمة المرور (للاستخدام المستقبلي مع نظام المصادقة الحقيقي)
 * @param {string} password - كلمة المرور
 * @returns {string} كلمة المرور المشفرة
 */
function hashPassword(password) {
    // هذا تشفير بسيط مؤقت - سيتم استبداله بتشفير حقيقي
    return btoa(password);
}

/**
 * تحميل المستخدم الحالي من localStorage
 */
async function loadCurrentUser() {
    const userId = localStorage.getItem('current_user_id');
    if (userId) {
        try {
            const userDoc = await db.collection('Users').doc(userId).get();
            if (userDoc.exists) {
                currentUser = { id: userDoc.id, ...userDoc.data() };
                userPermissions = currentUser.permissions || {};
                updateUIBasedOnPermissions();
            }
        } catch (error) {
            console.error('خطأ في تحميل المستخدم:', error);
        }
    }
}

/**
 * تحديث واجهة المستخدم بناءً على الصلاحيات
 */
function updateUIBasedOnPermissions() {
    // إخفاء/إظهار العناصر حسب الصلاحيات
    if (!hasPermission('users.view')) {
        document.getElementById('nav-users')?.style.display = 'none';
    }
    
    if (!hasPermission('settings.view')) {
        document.querySelector('.settings-panel')?.style.display = 'none';
    }
    
    if (!hasPermission('reports.export')) {
        document.querySelector('[onclick="exportToPDF()"]')?.style.display = 'none';
    }
}

/**
 * التحقق من صلاحية معينة
 * @param {string} permission - الصلاحية المطلوبة
 * @returns {boolean} هل لديه الصلاحية
 */
function hasPermission(permission) {
    if (!currentUser) return false;
    if (currentUser.permissions?.all) return true;
    
    const parts = permission.split('.');
    if (parts.length === 2) {
        return currentUser.permissions?.[parts[0]]?.[parts[1]] || false;
    }
    
    return false;
}

// ------------------------------ شاشة إدارة المستخدمين ------------------------------

/**
 * عرض شاشة إدارة المستخدمين
 */
async function showUsers() {
    if (!hasPermission('users.view')) {
        Swal.fire({
            icon: 'error',
            title: 'غير مصرح',
            text: 'ليس لديك صلاحية لعرض هذه الصفحة',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
        return;
    }
    
    try {
        // إخفاء المحتوى الحالي
        document.querySelector('.stats-grid').style.display = 'none';
        document.querySelector('.search-card').style.display = 'none';
        document.querySelector('.table-card').style.display = 'none';
        
        // إنشاء واجهة إدارة المستخدمين
        const usersUI = createUsersUI();
        
        // إضافة الواجهة
        const mainElement = document.querySelector('.admin-main');
        const existingUI = document.getElementById('users-management');
        if (existingUI) existingUI.remove();
        
        mainElement.insertAdjacentHTML('afterbegin', usersUI);
        
        // تحميل قائمة المستخدمين
        await loadUsersList();
        
    } catch (error) {
        console.error('خطأ في عرض المستخدمين:', error);
    }
}

/**
 * إنشاء واجهة إدارة المستخدمين
 * @returns {string} HTML الواجهة
 */
function createUsersUI() {
    return `
        <div id="users-management" class="luxury-card" style="margin-bottom: 30px;">
            <div class="card-glow"></div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: var(--neon-cyan); display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-users-cog"></i>
                    إدارة المستخدمين
                </h2>
                ${hasPermission('users.create') ? `
                    <button class="action-btn" onclick="showAddUserModal()">
                        <i class="fas fa-plus"></i> مستخدم جديد
                    </button>
                ` : ''}
            </div>
            
            <div class="table-responsive">
                <table class="users-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>اسم المستخدم</th>
                            <th>الاسم الكامل</th>
                            <th>الدور</th>
                            <th>البريد الإلكتروني</th>
                            <th>الحالة</th>
                            <th>آخر دخول</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="users-tbody">
                        <tr>
                            <td colspan="8" style="text-align: center; padding: 50px;">
                                <i class="fas fa-spinner fa-spin" style="font-size: 40px; color: var(--neon-cyan);"></i>
                                <p>جاري تحميل المستخدمين...</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                <button class="action-btn" onclick="hideUsers()">
                    <i class="fas fa-arrow-right"></i> العودة للوحة الرئيسية
                </button>
            </div>
        </div>
    `;
}

/**
 * إخفاء شاشة إدارة المستخدمين والعودة للوحة الرئيسية
 */
function hideUsers() {
    document.getElementById('users-management')?.remove();
    document.querySelector('.stats-grid').style.display = 'grid';
    document.querySelector('.search-card').style.display = 'block';
    document.querySelector('.table-card').style.display = 'block';
}

/**
 * تحميل قائمة المستخدمين
 */
async function loadUsersList() {
    try {
        const snapshot = await db.collection('Users')
            .orderBy('createdAt', 'desc')
            .get();
        
        let html = '';
        let index = 1;
        
        for (const doc of snapshot.docs) {
            const user = { id: doc.id, ...doc.data() };
            
            html += `
                <tr>
                    <td>${index++}</td>
                    <td>${user.username}</td>
                    <td>${user.name || '-'}</td>
                    <td>${formatRole(user.role)}</td>
                    <td>${user.email || '-'}</td>
                    <td>
                        <span style="background: ${user.isActive ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}; color: ${user.isActive ? '#10b981' : '#ef4444'}; padding: 4px 8px; border-radius: 12px;">
                            ${user.isActive ? 'نشط' : 'غير نشط'}
                        </span>
                    </td>
                    <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleString('ar-EG') : '-'}</td>
                    <td>
                        ${hasPermission('users.edit') ? `
                            <button class="action-btn-small" onclick="editUser('${user.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        ${hasPermission('users.delete') ? `
                            <button class="action-btn-small delete" onclick="deleteUser('${user.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }
        
        document.getElementById('users-tbody').innerHTML = html || `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <i class="fas fa-users-slash" style="font-size: 40px; color: rgba(255,255,255,0.3);"></i>
                    <p>لا يوجد مستخدمين</p>
                </td>
            </tr>
        `;
        
    } catch (error) {
        console.error('خطأ في تحميل المستخدمين:', error);
        document.getElementById('users-tbody').innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: var(--neon-red);">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>حدث خطأ في تحميل المستخدمين</p>
                </td>
            </tr>
        `;
    }
}

/**
 * تنسيق الدور
 * @param {string} role - الدور
 * @returns {string} الدور المنسق
 */
function formatRole(role) {
    const roles = {
        'super_admin': 'مشرف عام',
        'admin': 'مدير',
        'reviewer': 'مراجع',
        'viewer': 'مشاهد',
        'data_entry': 'مدخل بيانات'
    };
    return roles[role] || role;
}

// ------------------------------ نظام التقارير المتقدمة ------------------------------

/**
 * إنشاء تقرير متقدم
 */
async function generateAdvancedReport() {
    if (!hasPermission('reports.view')) {
        Swal.fire({
            icon: 'error',
            title: 'غير مصرح',
            text: 'ليس لديك صلاحية لعرض التقارير',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
        return;
    }
    
    const { value: reportType } = await Swal.fire({
        title: 'نوع التقرير',
        input: 'select',
        inputOptions: {
            'summary': 'تقرير ملخص',
            'detailed': 'تقرير مفصل',
            'statistical': 'تقرير إحصائي',
            'monthly': 'تقرير شهري',
            'yearly': 'تقرير سنوي'
        },
        inputPlaceholder: 'اختر نوع التقرير',
        showCancelButton: true,
        background: '#030514',
        color: '#fff',
        confirmButtonColor: '#00ffff'
    });
    
    if (!reportType) return;
    
    const { value: dateRange } = await Swal.fire({
        title: 'الفترة الزمنية',
        html: `
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <input type="date" id="report-from" class="luxury-input" placeholder="من">
                <input type="date" id="report-to" class="luxury-input" placeholder="إلى">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'إنشاء التقرير',
        background: '#030514',
        color: '#fff',
        confirmButtonColor: '#00ffff',
        preConfirm: () => {
            return {
                from: document.getElementById('report-from').value,
                to: document.getElementById('report-to').value
            };
        }
    });
    
    if (!dateRange) return;
    
    await generateReport(reportType, dateRange);
}

/**
 * إنشاء تقرير
 * @param {string} type - نوع التقرير
 * @param {Object} dateRange - نطاق التاريخ
 */
async function generateReport(type, dateRange) {
    try {
        Swal.fire({
            title: 'جاري إنشاء التقرير',
            text: 'الرجاء الانتظار...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            background: '#030514',
            color: '#fff'
        });
        
        // جلب البيانات
        let query = db.collection('Requests');
        
        if (dateRange.from) {
            const fromDate = new Date(dateRange.from);
            fromDate.setHours(0, 0, 0, 0);
            query = query.where('createdAt', '>=', fromDate);
        }
        
        if (dateRange.to) {
            const toDate = new Date(dateRange.to);
            toDate.setHours(23, 59, 59, 999);
            query = query.where('createdAt', '<=', toDate);
        }
        
        const snapshot = await query.get();
        const requests = [];
        snapshot.forEach(doc => requests.push({ id: doc.id, ...doc.data() }));
        
        Swal.close();
        
        // عرض التقرير
        showReportResults(type, requests, dateRange);
        
    } catch (error) {
        console.error('خطأ في إنشاء التقرير:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ في إنشاء التقرير',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
    }
}

/**
 * عرض نتائج التقرير
 * @param {string} type - نوع التقرير
 * @param {Array} requests - قائمة الطلبات
 * @param {Object} dateRange - نطاق التاريخ
 */
function showReportResults(type, requests, dateRange) {
    // حساب الإحصائيات
    const total = requests.length;
    const complaints = requests.filter(r => r.type === 'شكوى').length;
    const suggestions = requests.filter(r => r.type === 'اقتراح').length;
    
    const statusCounts = {};
    requests.forEach(r => {
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });
    
    const govCounts = {};
    requests.forEach(r => {
        govCounts[r.gov] = (govCounts[r.gov] || 0) + 1;
    });
    
    // إنشاء HTML التقرير
    const html = `
        <div class="luxury-card" style="margin-bottom: 20px;">
            <div class="card-glow"></div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: var(--neon-cyan);">
                    <i class="fas fa-chart-bar"></i> تقرير ${getReportTypeName(type)}
                </h2>
                <div>
                    <button class="action-btn" onclick="exportReportToPDF()">
                        <i class="fas fa-file-pdf"></i> PDF
                    </button>
                    <button class="action-btn" onclick="exportReportToExcel()">
                        <i class="fas fa-file-excel"></i> Excel
                    </button>
                </div>
            </div>
            
            <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 15px; margin-bottom: 20px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div>
                        <div style="color: rgba(255,255,255,0.5);">الفترة</div>
                        <div style="font-size: 18px; font-weight: 600;">
                            ${dateRange.from || 'الكل'} إلى ${dateRange.to || 'الكل'}
                        </div>
                    </div>
                    <div>
                        <div style="color: rgba(255,255,255,0.5);">إجمالي الطلبات</div>
                        <div style="font-size: 24px; font-weight: 900; color: var(--neon-cyan);">${total}</div>
                    </div>
                    <div>
                        <div style="color: rgba(255,255,255,0.5);">الشكاوى</div>
                        <div style="font-size: 24px; font-weight: 900; color: #ef4444;">${complaints}</div>
                    </div>
                    <div>
                        <div style="color: rgba(255,255,255,0.5);">المقترحات</div>
                        <div style="font-size: 24px; font-weight: 900; color: #10b981;">${suggestions}</div>
                    </div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 15px;">
                    <h3 style="color: var(--neon-cyan); margin-bottom: 10px;">حسب الحالة</h3>
                    ${Object.entries(statusCounts).map(([status, count]) => `
                        <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                            <span>${status}</span>
                            <span style="font-weight: 600;">${count}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 15px;">
                    <h3 style="color: var(--neon-cyan); margin-bottom: 10px;">حسب المحافظة</h3>
                    ${Object.entries(govCounts).slice(0, 10).map(([gov, count]) => `
                        <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                            <span>${gov}</span>
                            <span style="font-weight: 600;">${count}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button class="action-btn" onclick="hideReport()">
                    <i class="fas fa-times"></i> إغلاق التقرير
                </button>
            </div>
        </div>
    `;
    
    // عرض التقرير
    const reportDiv = document.createElement('div');
    reportDiv.id = 'report-viewer';
    reportDiv.innerHTML = html;
    
    document.querySelector('.admin-main').insertAdjacentElement('afterbegin', reportDiv);
}

/**
 * الحصول على اسم نوع التقرير
 * @param {string} type - نوع التقرير
 * @returns {string} الاسم المنسق
 */
function getReportTypeName(type) {
    const names = {
        'summary': 'ملخص',
        'detailed': 'مفصل',
        'statistical': 'إحصائي',
        'monthly': 'شهري',
        'yearly': 'سنوي'
    };
    return names[type] || type;
}

/**
 * إخفاء التقرير
 */
function hideReport() {
    document.getElementById('report-viewer')?.remove();
}

// ------------------------------ نظام النسخ الاحتياطي ------------------------------

/**
 * إنشاء نسخة احتياطية
 */
async function createBackup() {
    if (!hasPermission('system.backup')) {
        Swal.fire({
            icon: 'error',
            title: 'غير مصرح',
            text: 'ليس لديك صلاحية لإنشاء نسخ احتياطية',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
        return;
    }
    
    const { value: includeUsers } = await Swal.fire({
        title: 'إنشاء نسخة احتياطية',
        text: 'هل تريد تضمين بيانات المستخدمين؟',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'نعم',
        cancelButtonText: 'لا',
        background: '#030514',
        confirmButtonColor: '#00ffff'
    });
    
    if (includeUsers === undefined) return;
    
    try {
        Swal.fire({
            title: 'جاري إنشاء النسخة الاحتياطية',
            text: 'الرجاء الانتظار...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            background: '#030514'
        });
        
        // جمع البيانات
        const backup = {
            version: DEFAULT_SETTINGS.SYSTEM_VERSION,
            timestamp: new Date().toISOString(),
            requests: []
        };
        
        // جلب الطلبات
        const requestsSnapshot = await db.collection('Requests').get();
        requestsSnapshot.forEach(doc => {
            backup.requests.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // جلب المستخدمين إذا طلب
        if (includeUsers) {
            backup.users = [];
            const usersSnapshot = await db.collection('Users').get();
            usersSnapshot.forEach(doc => {
                backup.users.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
        }
        
        // تحويل إلى JSON
        const backupJson = JSON.stringify(backup, null, 2);
        
        // إنشاء ملف للتحميل
        const blob = new Blob([backupJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        Swal.fire({
            icon: 'success',
            title: 'تم إنشاء النسخة الاحتياطية',
            text: 'تم تحميل الملف بنجاح',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
        
        // تسجيل العملية
        await logSystemAction('create_backup', { size: backup.requests.length });
        
    } catch (error) {
        console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ في إنشاء النسخة الاحتياطية',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
    }
}

/**
 * استعادة نسخة احتياطية
 */
async function restoreBackup() {
    if (!hasPermission('system.restore')) {
        Swal.fire({
            icon: 'error',
            title: 'غير مصرح',
            text: 'ليس لديك صلاحية لاستعادة النسخ الاحتياطية',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
        return;
    }
    
    const { value: file } = await Swal.fire({
        title: 'اختر ملف النسخة الاحتياطية',
        input: 'file',
        inputAttributes: {
            'accept': '.json',
            'aria-label': 'اختر ملف JSON'
        },
        showCancelButton: true,
        background: '#030514',
        confirmButtonColor: '#00ffff'
    });
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const backup = JSON.parse(e.target.result);
            
            // التحقق من صحة الملف
            if (!backup.version || !backup.requests) {
                throw new Error('ملف غير صالح');
            }
            
            const { value: confirm } = await Swal.fire({
                title: '⚠️ تحذير شديد الخطورة',
                html: `
                    <p style="color: #ef4444;">أنت على وشك استبدال البيانات الحالية بنسخة احتياطية</p>
                    <p style="color: #ef4444;">عدد الطلبات في النسخة: ${backup.requests.length}</p>
                    <p style="color: #ef4444;">هذا الإجراء لا يمكن التراجع عنه</p>
                `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'نعم، استعادة',
                cancelButtonText: 'إلغاء',
                confirmButtonColor: '#ef4444',
                background: '#030514'
            });
            
            if (!confirm) return;
            
            Swal.fire({
                title: 'جاري استعادة البيانات',
                text: 'الرجاء الانتظار...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
                background: '#030514'
            });
            
            // حذف البيانات الحالية
            const currentSnapshot = await db.collection('Requests').get();
            const batch = db.batch();
            currentSnapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            
            // إضافة البيانات الجديدة
            const newBatch = db.batch();
            for (const request of backup.requests) {
                const { id, ...data } = request;
                const docRef = db.collection('Requests').doc(id || data.refId);
                newBatch.set(docRef, data);
            }
            await newBatch.commit();
            
            Swal.fire({
                icon: 'success',
                title: 'تم الاستعادة بنجاح',
                text: 'تم استعادة البيانات من النسخة الاحتياطية',
                background: '#030514',
                confirmButtonColor: '#00ffff'
            });
            
            // إعادة تحميل البيانات
            loadData(currentFilter);
            
            // تسجيل العملية
            await logSystemAction('restore_backup', { count: backup.requests.length });
            
        } catch (error) {
            console.error('خطأ في استعادة النسخة الاحتياطية:', error);
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'ملف النسخة الاحتياطية غير صالح',
                background: '#030514',
                confirmButtonColor: '#00ffff'
            });
        }
    };
    
    reader.readAsText(file);
}

// ------------------------------ سجل النظام (Logs) ------------------------------

/**
 * تسجيل إجراء في النظام
 * @param {string} action - الإجراء
 * @param {Object} details - التفاصيل
 */
async function logSystemAction(action, details = {}) {
    try {
        await db.collection('SystemLogs').add({
            action,
            details,
            userId: currentUser?.id || 'unknown',
            username: currentUser?.username || 'unknown',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            ip: 'client-side', // سيتم استبداله بـ IP حقيقي
            userAgent: navigator.userAgent
        });
    } catch (error) {
        console.error('خطأ في تسجيل الإجراء:', error);
    }
}

/**
 * عرض سجل النظام
 */
async function viewSystemLogs() {
    if (!hasPermission('system.view')) {
        Swal.fire({
            icon: 'error',
            title: 'غير مصرح',
            text: 'ليس لديك صلاحية لعرض سجل النظام',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
        return;
    }
    
    try {
        const snapshot = await db.collection('SystemLogs')
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();
        
        let logs = [];
        snapshot.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
        
        // عرض السجل في نافذة منبثقة
        let html = '<div style="max-height: 400px; overflow-y: auto;">';
        logs.forEach(log => {
            const time = log.timestamp?.toDate?.()?.toLocaleString('ar-EG') || 'غير محدد';
            html += `
                <div style="background: rgba(0,0,0,0.2); padding: 10px; margin-bottom: 5px; border-radius: 5px; border-right: 3px solid var(--neon-cyan);">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--neon-cyan);">${log.action}</span>
                        <span style="color: rgba(255,255,255,0.4); font-size: 11px;">${time}</span>
                    </div>
                    <div style="font-size: 12px; margin-top: 5px;">
                        <span style="color: rgba(255,255,255,0.5);">المستخدم:</span> ${log.username}
                    </div>
                    <div style="font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 5px;">
                        ${JSON.stringify(log.details)}
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        Swal.fire({
            title: 'سجل النظام',
            html,
            width: '800px',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
        
    } catch (error) {
        console.error('خطأ في عرض سجل النظام:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ في تحميل سجل النظام',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
    }
}

// ------------------------------ إحصائيات متقدمة ورسوم بيانية ------------------------------

/**
 * إنشاء لوحة إحصائيات متقدمة
 */
async function createAdvancedDashboard() {
    if (!hasPermission('reports.view')) return;
    
    try {
        const snapshot = await db.collection('Requests').get();
        const requests = [];
        snapshot.forEach(doc => requests.push(doc.data()));
        
        // حساب الإحصائيات
        const stats = calculateAdvancedStats(requests);
        
        // إنشاء لوحة الإحصائيات
        const dashboardHtml = `
            <div class="stats-grid" style="margin-bottom: 20px;">
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
                    <div class="stat-info">
                        <h3>معدل يومي</h3>
                        <p>${stats.dailyAverage}</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-clock"></i></div>
                    <div class="stat-info">
                        <h3>متوسط وقت الحل</h3>
                        <p>${stats.avgResolutionTime} يوم</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-percent"></i></div>
                    <div class="stat-info">
                        <h3>نسبة الإنجاز</h3>
                        <p>${stats.completionRate}%</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div class="stat-info">
                        <h3>أكثر محافظة</h3>
                        <p>${stats.topGov}</p>
                    </div>
                </div>
            </div>
        `;
        
        // إضافة اللوحة للصفحة
        const existingDashboard = document.getElementById('advanced-dashboard');
        if (existingDashboard) existingDashboard.remove();
        
        const dashboardDiv = document.createElement('div');
        dashboardDiv.id = 'advanced-dashboard';
        dashboardDiv.innerHTML = dashboardHtml;
        
        document.querySelector('.stats-grid').after(dashboardDiv);
        
    } catch (error) {
        console.error('خطأ في إنشاء لوحة الإحصائيات:', error);
    }
}

/**
 * حساب إحصائيات متقدمة
 * @param {Array} requests - قائمة الطلبات
 * @returns {Object} الإحصائيات
 */
function calculateAdvancedStats(requests) {
    const stats = {
        dailyAverage: 0,
        avgResolutionTime: 0,
        completionRate: 0,
        topGov: '-'
    };
    
    if (requests.length === 0) return stats;
    
    // حساب المعدل اليومي
    const dates = requests.map(r => {
        if (r.createdAt?.toDate) return r.createdAt.toDate();
        if (r.createdAt) return new Date(r.createdAt);
        return null;
    }).filter(d => d);
    
    if (dates.length > 0) {
        const oldest = Math.min(...dates.map(d => d.getTime()));
        const newest = Math.max(...dates.map(d => d.getTime()));
        const daysDiff = Math.ceil((newest - oldest) / (1000 * 60 * 60 * 24)) || 1;
        stats.dailyAverage = (requests.length / daysDiff).toFixed(1);
    }
    
    // حساب متوسط وقت الحل
    const resolvedRequests = requests.filter(r => r.status === 'تم الحل' || r.status === 'تم الإغلاق النهائي');
    if (resolvedRequests.length > 0) {
        let totalDays = 0;
        resolvedRequests.forEach(r => {
            if (r.tracking && r.tracking.length >= 2) {
                const first = new Date(r.tracking[0].time);
                const last = new Date(r.tracking[r.tracking.length - 1].time);
                if (!isNaN(first) && !isNaN(last)) {
                    totalDays += (last - first) / (1000 * 60 * 60 * 24);
                }
            }
        });
        stats.avgResolutionTime = (totalDays / resolvedRequests.length).toFixed(1);
    }
    
    // حساب نسبة الإنجاز
    const completed = requests.filter(r => r.status === 'تم الحل' || r.status === 'تم الإغلاق النهائي').length;
    stats.completionRate = ((completed / requests.length) * 100).toFixed(1);
    
    // أكثر محافظة
    const govCounts = {};
    requests.forEach(r => {
        if (r.gov) {
            govCounts[r.gov] = (govCounts[r.gov] || 0) + 1;
        }
    });
    
    let maxCount = 0;
    Object.entries(govCounts).forEach(([gov, count]) => {
        if (count > maxCount) {
            maxCount = count;
            stats.topGov = gov;
        }
    });
    
    return stats;
}

// ------------------------------ تصدير التقارير المتقدم ------------------------------

/**
 * تصدير التقرير إلى Excel
 */
async function exportReportToExcel() {
    if (!hasPermission('reports.export')) {
        Swal.fire({
            icon: 'error',
            title: 'غير مصرح',
            text: 'ليس لديك صلاحية للتصدير',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
        return;
    }
    
    Swal.fire({
        icon: 'info',
        title: 'قريباً',
        text: 'خاصية تصدير Excel قيد التطوير',
        background: '#030514',
        confirmButtonColor: '#00ffff'
    });
}

/**
 * تصدير التقرير إلى PDF
 */
async function exportReportToPDF() {
    if (!hasPermission('reports.export')) {
        Swal.fire({
            icon: 'error',
            title: 'غير مصرح',
            text: 'ليس لديك صلاحية للتصدير',
            background: '#030514',
            confirmButtonColor: '#00ffff'
        });
        return;
    }
    
    Swal.fire({
        icon: 'info',
        title: 'قريباً',
        text: 'خاصية تصدير PDF قيد التطوير',
        background: '#030514',
        confirmButtonColor: '#00ffff'
    });
}

// ------------------------------ إضافة أزرار جديدة للوحة التحكم ------------------------------

/**
 * إضافة أزرار الإجراءات المتقدمة للوحة التحكم
 */
function addAdvancedButtons() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;
    
    const advancedButtons = `
        ${hasPermission('reports.view') ? `
            <button class="action-btn" onclick="generateAdvancedReport()">
                <i class="fas fa-chart-pie"></i> تقارير
            </button>
        ` : ''}
        ${hasPermission('system.backup') ? `
            <button class="action-btn" onclick="createBackup()">
                <i class="fas fa-database"></i> نسخة احتياطية
            </button>
        ` : ''}
        ${hasPermission('system.view') ? `
            <button class="action-btn" onclick="viewSystemLogs()">
                <i class="fas fa-history"></i> سجل النظام
            </button>
        ` : ''}
    `;
    
    headerActions.insertAdjacentHTML('beforeend', advancedButtons);
}

// ------------------------------ تهيئة الملف ------------------------------

/**
 * تهيئة الملف عند التحميل
 */
async function initAdminLogic() {
    // تهيئة نظام المستخدمين
    await initUserSystem();
    
    // إضافة الأزرار المتقدمة
    addAdvancedButtons();
    
    // إنشاء لوحة الإحصائيات المتقدمة
    await createAdvancedDashboard();
    
    console.log('✅ تم تهيئة المنطق المتقدم للوحة التحكم');
}

// تنفيذ التهيئة بعد تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminLogic);
} else {
    initAdminLogic();
}

// ------------------------------ نهاية الملف ------------------------------
