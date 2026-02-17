let currentFilter = 'all';

// تبديل حالة الأزرار النشطة
function setActiveNav(button) {
    document.querySelectorAll('.btn-nav').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
}

// تحميل البيانات
function loadData(filter) {
    currentFilter = filter;
    
    // تحديث الزر النشط
    const buttons = document.querySelectorAll('.btn-nav');
    if(filter === 'all') setActiveNav(buttons[0]);
    else if(filter === 'شكوى') setActiveNav(buttons[1]);
    else if(filter === 'اقتراح') setActiveNav(buttons[2]);

    db.collection("Requests")
        .orderBy("createdAt", "desc")
        .onSnapshot(snap => {
            let html = "";
            snap.forEach(doc => {
                const d = doc.data();
                const createdDate = d.createdAt ? d.createdAt.toDate().toLocaleDateString('ar-EG') : 'غير محدد';
                
                if(filter === 'all' || d.type === filter) {
                    html += `
                    <tr>
                        <td>${createdDate}</td>
                        <td><strong>${d.refId}</strong></td>
                        <td>
                            <strong>${d.name}</strong><br>
                            <small>${d.job}</small><br>
                            <small style="color:#94a3b8;">${d.phone}</small>
                        </td>
                        <td>${d.gov}</td>
                        <td>
                            <span class="type-badge ${d.type === 'شكوى' ? 'complaint' : 'suggestion'}">
                                ${d.type}
                            </span>
                        </td>
                        <td>
                            <span class="status-badge status-${d.status}">
                                ${d.status}
                            </span>
                        </td>
                        <td>
                            <button class="action-btn" onclick="manageReq('${d.refId}')" title="إدارة">
                                <i class="fas fa-cog"></i>
                            </button>
                            <button class="action-btn delete" onclick="deleteReq('${d.refId}')" title="حذف">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>`;
                }
            });
            
            if(html === '') {
                html = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:50px;">
                        <i class="fas fa-folder-open" style="font-size:40px; color:#94a3b8;"></i>
                        <p style="margin-top:10px;">لا توجد بيانات للعرض</p>
                    </td>
                </tr>`;
            }
            
            document.getElementById('admin-tbody').innerHTML = html;
        }, error => {
            console.error("Error loading data:", error);
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'حدث خطأ في تحميل البيانات',
                confirmButtonText: 'حسناً'
            });
        });
}

// إدارة الطلب
async function manageReq(id) {
    try {
        const snap = await db.collection("Requests").doc(id).get();
        if(!snap.exists) {
            Swal.fire('خطأ', 'الطلب غير موجود', 'error');
            return;
        }
        
        const d = snap.data();
        showRequestModal(d);
    } catch(error) {
        Swal.fire('خطأ', 'حدث خطأ في جلب البيانات', 'error');
    }
}

// عرض نافذة إدارة الطلب
function showRequestModal(d) {
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل"];
    const currentIdx = stages.indexOf(d.status);
    const pct = (currentIdx / (stages.length - 1)) * 100;

    const modalHtml = `
        <div style="padding:20px;">
            <!-- بيانات مقدم الطلب -->
            <div style="background:rgba(0,210,255,0.1); padding:15px; border-radius:10px; margin-bottom:20px;">
                <h4 style="color:var(--primary); margin-bottom:10px;">
                    <i class="fas fa-user"></i> بيانات مقدم الطلب
                </h4>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div><strong>الاسم:</strong> ${d.name}</div>
                    <div><strong>الرقم القومي:</strong> ${d.nid}</div>
                    <div><strong>الهاتف:</strong> ${d.phone}</div>
                    <div><strong>المحافظة:</strong> ${d.gov}</div>
                    <div><strong>العنوان:</strong> ${d.address || 'غير محدد'}</div>
                    <div><strong>المهنة:</strong> ${d.job}</div>
                    <div><strong>رقم العضوية:</strong> ${d.memberId}</div>
                    <div><strong>نوع الطلب:</strong> ${d.type}</div>
                </div>
                <div style="margin-top:10px;">
                    <strong>تفاصيل الطلب:</strong><br>
                    <p style="background:#0b1120; padding:10px; border-radius:5px; margin-top:5px;">${d.details}</p>
                </div>
            </div>

            <!-- التراك المائي -->
            <div style="margin-bottom:30px;">
                <h4 style="margin-bottom:10px;">مسار الطلب</h4>
                <div class="track-container" style="height:60px;">
                    <div class="track-water">
                        <div class="water-fill" style="height:${pct}%"></div>
                    </div>
                    <div class="track-bar">
                        ${stages.map((s, i) => `
                            <div class="track-point">
                                <div class="dot ${i <= currentIdx ? 'active' : ''}">
                                    ${i <= currentIdx ? '<i class="fas fa-check"></i>' : ''}
                                </div>
                                <span class="dot-label">${s}</span>
                                ${i < stages.length - 1 ? '<div class="line"></div>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- المسار الزمني -->
            <div style="margin-bottom:20px;">
                <h4 style="margin-bottom:10px;">المسار الزمني</h4>
                ${d.tracking.slice().reverse().map(t => `
                    <div class="timeline-card ${t.isFinal ? 'final' : ''}">
                        <div class="timeline-header">
                            <h4>${t.status}</h4>
                            <span>${t.time}</span>
                        </div>
                        <p>${t.comment}</p>
                    </div>
                `).join('')}
            </div>

            <!-- إضافة حالة جديدة -->
            <div style="border-top:1px solid var(--border); padding-top:20px;">
                <h4 style="margin-bottom:15px;">تحديث الحالة</h4>
                <div class="input-group">
                    <label>الحالة الجديدة</label>
                    <select id="new-status">
                        <option value="قيد المراجعة">قيد المراجعة</option>
                        <option value="جاري التنفيذ">جاري التنفيذ</option>
                        <option value="تم الحل">تم الحل (إغلاق)</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>التعليق / القرار</label>
                    <textarea id="status-comment" rows="3" placeholder="اكتب تعليقك هنا..."></textarea>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="btn-main" onclick="updateRequestStatus('${d.refId}')">
                        <i class="fas fa-save"></i> تحديث الحالة
                    </button>
                    <button class="btn-nav" onclick="printRequest('${d.refId}')">
                        <i class="fas fa-print"></i> طباعة الكارت
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-content-area').innerHTML = modalHtml;
    document.getElementById('request-modal').style.display = 'block';
}

// تحديث حالة الطلب
async function updateRequestStatus(refId) {
    const newStatus = document.getElementById('new-status').value;
    const comment = document.getElementById('status-comment').value.trim();
    
    if(!comment) {
        Swal.fire('خطأ', 'برجاء إدخال التعليق', 'error');
        return;
    }

    const isFinal = newStatus === "تم الحل";

    try {
        await db.collection("Requests").doc(refId).update({
            status: newStatus,
            tracking: firebase.firestore.FieldValue.arrayUnion({
                status: newStatus,
                comment: comment,
                time: new Date().toLocaleString('ar-EG'),
                isFinal: isFinal
            })
        });

        Swal.fire({
            icon: 'success',
            title: 'تم التحديث',
            text: 'تم تحديث حالة الطلب بنجاح',
            confirmButtonText: 'حسناً'
        });

        closeModal();
        loadData(currentFilter);
    } catch(error) {
        Swal.fire('خطأ', 'حدث خطأ في تحديث الحالة', 'error');
    }
}

// حذف الطلب
async function deleteReq(id) {
    const { value: pass } = await Swal.fire({
        title: 'حذف الطلب',
        text: 'ادخل كلمة سر الحذف',
        input: 'password',
        inputPlaceholder: '11111@',
        showCancelButton: true,
        confirmButtonText: 'حذف',
        cancelButtonText: 'إلغاء'
    });

    if(pass === '11111@') {
        try {
            await db.collection("Requests").doc(id).delete();
            Swal.fire({
                icon: 'success',
                title: 'تم الحذف',
                text: 'تم حذف الطلب بنجاح',
                confirmButtonText: 'حسناً'
            });
        } catch(error) {
            Swal.fire('خطأ', 'حدث خطأ في حذف الطلب', 'error');
        }
    } else if(pass) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'كلمة السر غير صحيحة',
            confirmButtonText: 'حسناً'
        });
    }
}

// إغلاق النافذة المنبثقة
function closeModal() {
    document.getElementById('request-modal').style.display = 'none';
}

// طباعة الطلب
function printRequest(refId) {
    const printContent = document.getElementById('modal-content-area').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>طلب رقم ${refId}</title>
            <link rel="stylesheet" href="style.css">
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
            <style>
                body { padding: 20px; background: white; color: black; }
                .card { background: #f5f5f5; color: black; }
            </style>
        </head>
        <body>
            ${printContent}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// إعدادات البرنامج
function toggleSettings() {
    document.getElementById('settings-menu').classList.toggle('show');
}

// تحديث الشعار
function updateLogo() {
    const url = document.getElementById('logo-url').value;
    if(url) {
        updateAllLogos(url);
        Swal.fire({
            icon: 'success',
            title: 'تم التحديث',
            text: 'تم تحديث شعار النقابة بنجاح',
            confirmButtonText: 'حسناً'
        });
        document.getElementById('settings-menu').classList.remove('show');
    }
}

// تحميل البيانات عند بدء التشغيل
document.addEventListener('DOMContentLoaded', () => {
    loadData('all');
    
    // تطبيق الشعار المحفوظ
    const savedLogo = getSavedLogo();
    const adminLogo = document.getElementById('admin-logo');
    if(adminLogo) adminLogo.src = savedLogo;
});
