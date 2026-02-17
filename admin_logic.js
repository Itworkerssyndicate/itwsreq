let currentFilter = 'all';
let allRequests = []; // تخزين جميع الطلبات للبحث المباشر
let unsubscribe; // دالة إلغاء الاستماع للتحديثات المباشرة
let systemResetDone = false; // للتأكد من أن زر التهيئة يستخدم مرة واحدة فقط

// تبديل حالة الأزرار النشطة
function setActiveNav(buttonId) {
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(buttonId);
    if(activeBtn) {
        activeBtn.classList.add('active');
        
        // إضافة تأثير نبض للزر النشط
        activeBtn.style.animation = 'none';
        activeBtn.offsetHeight;
        activeBtn.style.animation = 'active-pulse 2s infinite';
    }
}

// تحميل البيانات مع تحديث مباشر
function loadData(filter) {
    currentFilter = filter;
    
    // تحديث الزر النشط
    if(filter === 'all') setActiveNav('nav-all');
    else if(filter === 'شكوى') setActiveNav('nav-complaint');
    else if(filter === 'اقتراح') setActiveNav('nav-suggestion');

    // إلغاء الاستماع السابق إذا وجد
    if (unsubscribe) {
        unsubscribe();
    }

    // استماع مباشر للتحديثات
    unsubscribe = db.collection("Requests")
        .orderBy("createdAt", "desc")
        .onSnapshot(snap => {
            allRequests = [];
            snap.forEach(doc => {
                const d = doc.data();
                // تحويل التاريخ إذا كان موجوداً
                if (d.createdAt && d.createdAt.toDate) {
                    d.createdAtDate = d.createdAt.toDate();
                }
                allRequests.push(d);
            });
            
            // تطبيق الفلترة والبحث الحالي
            performSearch();
            
        }, error => {
            console.error("Error loading data:", error);
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'حدث خطأ في تحميل البيانات',
                confirmButtonText: 'حسناً',
                background: '#161f32',
                color: '#fff'
            });
        });
}

// تنفيذ البحث المتقدم
function performSearch() {
    // الحصول على قيم البحث
    const searchRef = document.getElementById('search-ref')?.value.toLowerCase().trim() || '';
    const searchName = document.getElementById('search-name')?.value.toLowerCase().trim() || '';
    const searchNid = document.getElementById('search-nid')?.value.trim() || '';
    const searchMember = document.getElementById('search-member')?.value.trim() || '';
    const searchSpecificMember = document.getElementById('search-specific-member')?.value.trim() || '';
    const searchDateFrom = document.getElementById('search-date-from')?.value || '';
    const searchDateTo = document.getElementById('search-date-to')?.value || '';
    const searchType = document.getElementById('search-type')?.value || 'all';
    const searchStatus = document.getElementById('search-status')?.value || 'all';
    const searchMemberType = document.getElementById('search-member-type')?.value || 'all';

    // تصفية الطلبات
    let filteredRequests = allRequests.filter(req => {
        // فلترة حسب النوع (شكوى/اقتراح) من الأزرار الجانبية
        if (currentFilter !== 'all' && req.type !== currentFilter) {
            return false;
        }

        // فلترة حسب نوع الطلب من البحث
        if (searchType !== 'all' && req.type !== searchType) {
            return false;
        }

        // فلترة حسب الحالة
        if (searchStatus !== 'all' && req.status !== searchStatus) {
            return false;
        }

        // فلترة حسب نوع المقدم
        if (searchMemberType !== 'all') {
            if (searchMemberType === 'عضو نقابة') {
                if (req.memberType !== 'عضو نقابة') return false;
                // إذا كان فيه بحث برقم عضوية محدد
                if (searchSpecificMember && !req.memberId?.includes(searchSpecificMember)) {
                    return false;
                }
            } else if (searchMemberType === 'غير عضو' && req.memberType !== 'غير عضو') {
                return false;
            }
        }

        // فلترة حسب رقم الطلب
        if (searchRef && !req.refId?.toLowerCase().includes(searchRef)) {
            return false;
        }

        // فلترة حسب الاسم
        if (searchName && !req.name?.toLowerCase().includes(searchName)) {
            return false;
        }

        // فلترة حسب الرقم القومي
        if (searchNid && !req.nid?.includes(searchNid)) {
            return false;
        }

        // فلترة حسب رقم العضوية العام
        if (searchMember && !req.memberId?.includes(searchMember)) {
            return false;
        }

        // فلترة حسب التاريخ
        if (searchDateFrom || searchDateTo) {
            const reqDate = req.createdAtDate || (req.createdAt ? new Date(req.createdAt) : null);
            if (reqDate) {
                const reqDateStr = reqDate.toISOString().split('T')[0];
                
                if (searchDateFrom && reqDateStr < searchDateFrom) {
                    return false;
                }
                if (searchDateTo && reqDateStr > searchDateTo) {
                    return false;
                }
            }
        }

        return true;
    });

    // تحديث عدد النتائج
    document.getElementById('results-count').textContent = `${filteredRequests.length} نتيجة`;

    // عرض النتائج
    renderRequests(filteredRequests);
}

// إعادة ضبط البحث
function resetSearch() {
    document.getElementById('search-ref').value = '';
    document.getElementById('search-name').value = '';
    document.getElementById('search-nid').value = '';
    document.getElementById('search-member').value = '';
    document.getElementById('search-specific-member').value = '';
    document.getElementById('search-date-from').value = '';
    document.getElementById('search-date-to').value = '';
    document.getElementById('search-type').value = 'all';
    document.getElementById('search-status').value = 'all';
    document.getElementById('search-member-type').value = 'all';
    
    document.getElementById('member-id-search-field').style.display = 'none';
    
    performSearch();
}

// تبديل ظهور حقل بحث العضوية المحدد
function toggleMemberSearch() {
    const memberType = document.getElementById('search-member-type').value;
    const memberField = document.getElementById('member-id-search-field');
    
    if (memberType === 'عضو نقابة') {
        memberField.style.display = 'block';
    } else {
        memberField.style.display = 'none';
        document.getElementById('search-specific-member').value = '';
    }
    
    performSearch();
}

// تبديل ظهور شريط البحث
function toggleSearch() {
    const searchBody = document.getElementById('search-body');
    const searchArrow = document.getElementById('search-arrow');
    const searchHeader = document.querySelector('.search-header');
    
    if (searchBody.style.display === 'none' || !searchBody.style.display) {
        searchBody.style.display = 'block';
        searchArrow.style.transform = 'rotate(180deg)';
        searchHeader.classList.add('active');
    } else {
        searchBody.style.display = 'none';
        searchArrow.style.transform = 'rotate(0)';
        searchHeader.classList.remove('active');
    }
}

// عرض الطلبات في الجدول
function renderRequests(requests) {
    let html = "";
    
    requests.forEach(d => {
        const createdDate = d.createdAtDate ? 
            d.createdAtDate.toLocaleDateString('ar-EG') : 
            (d.createdAt ? new Date(d.createdAt).toLocaleDateString('ar-EG') : 'غير محدد');
        
        html += `
        <tr style="animation: fadeInRow 0.3s ease;">
            <td style="font-weight:600;">${createdDate}</td>
            <td><strong style="color:var(--primary); direction: ltr; display: inline-block;">${d.refId}</strong></td>
            <td>
                <div style="display:flex; flex-direction:column; gap:3px;">
                    <strong>${d.name}</strong>
                    <small style="color:var(--text-muted);">${d.job}</small>
                    <small style="color:var(--primary);">${d.phone}</small>
                </div>
            </td>
            <td>${d.memberId !== 'غير عضو' ? d.memberId : '-'}</td>
            <td>${d.gov}</td>
            <td>
                <span class="type-badge ${d.type === 'شكوى' ? 'complaint' : 'suggestion'}">
                    <i class="fas ${d.type === 'شكوى' ? 'fa-exclamation-triangle' : 'fa-lightbulb'}"></i>
                    ${d.type}
                </span>
            </td>
            <td>
                <span class="status-badge status-${d.status}">
                    <i class="fas ${getStatusIcon(d.status)}"></i>
                    ${d.status}
                </span>
            </td>
            <td>
                <div style="display:flex; gap:5px; justify-content: center;">
                    <button class="action-btn" onclick="manageReq('${d.refId}')" title="إدارة">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteReq('${d.refId}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="action-btn" onclick="printRequestCard('${d.refId}')" title="طباعة">
                        <i class="fas fa-print"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    });
    
    if(html === '') {
        html = `
        <tr>
            <td colspan="8" style="text-align:center; padding:50px;">
                <i class="fas fa-folder-open" style="font-size:50px; color:var(--primary); margin-bottom:15px;"></i>
                <p style="color:var(--text-muted);">لا توجد بيانات للعرض</p>
            </td>
        </tr>`;
    }
    
    document.getElementById('admin-tbody').innerHTML = html;
}

// الحصول على أيقونة الحالة
function getStatusIcon(status) {
    switch(status) {
        case 'تم الاستلام': return 'fa-inbox';
        case 'قيد المراجعة': return 'fa-search';
        case 'جاري التنفيذ': return 'fa-cogs';
        case 'تم الحل': return 'fa-check-circle';
        default: return 'fa-circle';
    }
}

// تصدير إلى PDF
function exportToPDF() {
    const element = document.getElementById('main-table');
    const opt = {
        margin: 1,
        filename: 'تقرير_الطلبات.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#161f32' },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    
    html2pdf().set(opt).from(element).save();
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
        console.error("Error managing request:", error);
        Swal.fire('خطأ', 'حدث خطأ في جلب البيانات', 'error');
    }
}

// عرض نافذة إدارة الطلب
function showRequestModal(d) {
    const stages = d.tracking.map(t => t.status);
    const currentIdx = stages.indexOf(d.status);
    const pct = stages.length > 1 ? (currentIdx / (stages.length - 1)) * 100 : 100;

    const modalHtml = `
        <div class="request-card">
            <h3 style="color:var(--primary); margin-bottom:20px; display:flex; align-items:center; gap:10px;">
                <i class="fas fa-clipboard-list"></i>
                إدارة الطلب - <span style="direction: ltr;">${d.refId}</span>
            </h3>
            
            <!-- بيانات مقدم الطلب -->
            <div style="background:rgba(0,0,0,0.2); padding:20px; border-radius:15px; margin-bottom:20px;">
                <h4 style="color:var(--primary); margin-bottom:15px;">
                    <i class="fas fa-user"></i> بيانات مقدم الطلب
                </h4>
                <div class="request-info" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                    <div class="info-item">
                        <div class="info-label"><i class="fas fa-user"></i> الاسم</div>
                        <div class="info-value">${d.name}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label"><i class="fas fa-id-card"></i> الرقم القومي</div>
                        <div class="info-value">${d.nid}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label"><i class="fas fa-phone"></i> الهاتف</div>
                        <div class="info-value">${d.phone}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label"><i class="fas fa-map-marker-alt"></i> المحافظة</div>
                        <div class="info-value">${d.gov}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label"><i class="fas fa-id-card"></i> نوع المقدم</div>
                        <div class="info-value">${d.memberType || 'غير محدد'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label"><i class="fas fa-qrcode"></i> رقم العضوية</div>
                        <div class="info-value">${d.memberId || '-'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label"><i class="fas fa-briefcase"></i> المهنة</div>
                        <div class="info-value">${d.job}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label"><i class="fas fa-tag"></i> نوع الطلب</div>
                        <div class="info-value">
                            <span class="type-badge ${d.type === 'شكوى' ? 'complaint' : 'suggestion'}">
                                ${d.type}
                            </span>
                        </div>
                    </div>
                </div>
                <div style="margin-top:15px; padding:15px; background:rgba(0,0,0,0.2); border-radius:10px;">
                    <div class="info-label"><i class="fas fa-map-pin"></i> العنوان</div>
                    <p style="margin-top:5px; color:var(--text);">${d.address || 'غير محدد'}</p>
                </div>
                <div style="margin-top:15px; padding:15px; background:rgba(0,0,0,0.2); border-radius:10px;">
                    <div class="info-label"><i class="fas fa-edit"></i> تفاصيل الطلب</div>
                    <p style="margin-top:10px; color:var(--text); line-height:1.6;">${d.details}</p>
                </div>
            </div>

            <!-- التراك المائي -->
            <div style="margin-bottom:30px;">
                <h4 style="color:var(--primary); margin-bottom:15px;">
                    <i class="fas fa-water"></i> مسار الطلب
                </h4>
                <div class="track-container">
                    <div class="track-water">
                        <div class="water-fill" style="height:${pct}%"></div>
                    </div>
                    <div class="track-bar">
                        ${stages.map((stage, index) => `
                            <div class="track-point">
                                <div class="dot ${index <= currentIdx ? 'active' : ''}">
                                    ${index <= currentIdx ? '<i class="fas fa-check"></i>' : ''}
                                </div>
                                <span class="dot-label">${stage}</span>
                                ${index < stages.length - 1 ? '<div class="line"></div>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- المسار الزمني -->
            <div style="margin-bottom:30px;">
                <h4 style="color:var(--primary); margin-bottom:15px;">
                    <i class="fas fa-history"></i> المسار الزمني
                </h4>
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
            <div style="border-top:2px solid var(--primary); padding-top:20px;">
                <h4 style="color:var(--primary); margin-bottom:20px;">
                    <i class="fas fa-plus-circle"></i> إضافة تحديث جديد
                </h4>
                <div class="input-group">
                    <label><i class="fas fa-tag"></i> اسم المرحلة الجديدة</label>
                    <input type="text" id="new-stage-name" class="neon-border" placeholder="مثال: تم التواصل مع العضو" value="${getNextStage(d.status)}">
                </div>
                <div class="input-group">
                    <label><i class="fas fa-comment"></i> تعليق / قرار</label>
                    <textarea id="status-comment" rows="3" class="neon-border" placeholder="اكتب تفاصيل التحديث..."></textarea>
                </div>
                <div style="display:flex; gap:10px; margin-top:20px; flex-wrap: wrap;">
                    <button class="btn-main" onclick="updateRequestStatus('${d.refId}')" style="flex:2; min-width: 150px;">
                        <i class="fas fa-save"></i> تحديث الحالة
                    </button>
                    <button class="btn-nav" onclick="printRequestCard('${d.refId}')" style="flex:1; min-width: 100px;">
                        <i class="fas fa-print"></i> طباعة
                    </button>
                    <button class="btn-nav" onclick="closeRequest('${d.refId}')" style="flex:1; min-width: 100px; background:var(--danger);">
                        <i class="fas fa-lock"></i> إغلاق
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-content-area').innerHTML = modalHtml;
    document.getElementById('request-modal').style.display = 'flex';
    document.getElementById('request-modal').classList.add('show');
}

// الحصول على المرحلة التالية المقترحة
function getNextStage(currentStatus) {
    const stages = {
        'تم الاستلام': 'قيد المراجعة',
        'قيد المراجعة': 'جاري التنفيذ',
        'جاري التنفيذ': 'تم الحل',
        'تم الحل': 'تم الإغلاق النهائي'
    };
    return stages[currentStatus] || 'تحديث جديد';
}

// تحديث حالة الطلب
async function updateRequestStatus(refId) {
    const newStage = document.getElementById('new-stage-name').value.trim();
    const comment = document.getElementById('status-comment').value.trim();
    
    if(!newStage || !comment) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'برجاء إدخال اسم المرحلة والتعليق',
            confirmButtonText: 'حسناً',
            background: '#161f32',
            color: '#fff'
        });
        return;
    }

    const isFinal = newStage.includes('إغلاق') || newStage.includes('نهائي') || newStage.includes('تم الحل');

    try {
        await db.collection("Requests").doc(refId).update({
            status: newStage,
            tracking: firebase.firestore.FieldValue.arrayUnion({
                status: newStage,
                comment: comment,
                time: new Date().toLocaleString('ar-EG'),
                isFinal: isFinal
            })
        });

        Swal.fire({
            icon: 'success',
            title: 'تم التحديث',
            text: 'تم تحديث حالة الطلب بنجاح',
            confirmButtonText: 'حسناً',
            background: '#161f32',
            color: '#fff'
        });

        closeModal();
        // لا حاجة لإعادة تحميل البيانات بسبب التحديث المباشر
    } catch(error) {
        console.error("Error updating status:", error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ في تحديث الحالة',
            confirmButtonText: 'حسناً',
            background: '#161f32',
            color: '#fff'
        });
    }
}

// إغلاق الطلب (الحل النهائي)
async function closeRequest(refId) {
    const { value: finalComment } = await Swal.fire({
        title: 'إغلاق الطلب نهائياً',
        text: 'اكتب القرار النهائي للطلب',
        input: 'textarea',
        inputPlaceholder: 'اكتب القرار النهائي هنا...',
        showCancelButton: true,
        confirmButtonText: 'إغلاق',
        cancelButtonText: 'إلغاء',
        background: '#161f32',
        color: '#fff',
        inputAttributes: {
            'class': 'neon-border',
            'style': 'width:100%; margin-top:10px;'
        }
    });

    if(finalComment) {
        try {
            await db.collection("Requests").doc(refId).update({
                status: 'تم الإغلاق النهائي',
                tracking: firebase.firestore.FieldValue.arrayUnion({
                    status: 'تم الإغلاق النهائي',
                    comment: finalComment,
                    time: new Date().toLocaleString('ar-EG'),
                    isFinal: true
                })
            });

            Swal.fire({
                icon: 'success',
                title: 'تم الإغلاق',
                text: 'تم إغلاق الطلب نهائياً',
                confirmButtonText: 'حسناً',
                background: '#161f32',
                color: '#fff'
            });

            closeModal();
        } catch(error) {
            console.error("Error closing request:", error);
            Swal.fire('خطأ', 'حدث خطأ في إغلاق الطلب', 'error');
        }
    }
}

// حذف الطلب مع إخفاء الباسورد
async function deleteReq(id) {
    // إنشاء عنصر input من نوع password مباشرة بدون ظهور الباسورد
    const { value: pass } = await Swal.fire({
        title: 'حذف الطلب',
        html: '<input type="password" id="delete-password" class="swal2-input" placeholder="كلمة سر الحذف" style="direction: ltr;">',
        showCancelButton: true,
        confirmButtonText: 'حذف',
        cancelButtonText: 'إلغاء',
        background: '#161f32',
        color: '#fff',
        preConfirm: () => {
            return document.getElementById('delete-password').value;
        }
    });

    if(pass === '11111@') {
        try {
            await db.collection("Requests").doc(id).delete();
            Swal.fire({
                icon: 'success',
                title: 'تم الحذف',
                text: 'تم حذف الطلب بنجاح',
                confirmButtonText: 'حسناً',
                background: '#161f32',
                color: '#fff'
            });
        } catch(error) {
            console.error("Error deleting request:", error);
            Swal.fire('خطأ', 'حدث خطأ في حذف الطلب', 'error');
        }
    } else if(pass) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'كلمة السر غير صحيحة',
            confirmButtonText: 'حسناً',
            background: '#161f32',
            color: '#fff'
        });
    }
}

// تهيئة النظام (حذف كل البيانات)
async function resetSystem() {
    // التحقق من أن الزر لم يستخدم من قبل
    if (systemResetDone) {
        Swal.fire({
            icon: 'info',
            title: 'تم التهيئة مسبقاً',
            text: 'هذا الزر يستخدم لمرة واحدة فقط وتم استخدامه بالفعل',
            confirmButtonText: 'حسناً',
            background: '#161f32',
            color: '#fff'
        });
        document.getElementById('reset-system-section').style.display = 'none';
        return;
    }

    const { value: pass } = await Swal.fire({
        title: '⚠️ تحذير شديد الخطورة ⚠️',
        text: 'أنت على وشك حذف جميع البيانات نهائياً من النظام. هذا الإجراء لا يمكن التراجع عنه.',
        input: 'password',
        inputPlaceholder: 'ادخل كلمة سر التهيئة 11111@',
        showCancelButton: true,
        confirmButtonText: 'نعم، قم بتهيئة النظام',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#ff4757',
        background: '#161f32',
        color: '#fff',
        inputAttributes: {
            'class': 'neon-border',
            'style': 'direction: ltr; width:100%;'
        }
    });

    if (pass === '11111@') {
        try {
            // حذف جميع المستندات في مجموعة Requests
            const snapshot = await db.collection("Requests").get();
            const batch = db.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            
            // إخفاء الزر بشكل دائم
            systemResetDone = true;
            document.getElementById('reset-system-section').style.display = 'none';
            
            Swal.fire({
                icon: 'success',
                title: 'تمت تهيئة النظام',
                text: 'تم حذف جميع البيانات بنجاح. النظام الآن جاهز للاستخدام الجديد.',
                confirmButtonText: 'حسناً',
                background: '#161f32',
                color: '#fff'
            });
            
        } catch(error) {
            console.error("Error resetting system:", error);
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'حدث خطأ في تهيئة النظام',
                confirmButtonText: 'حسناً',
                background: '#161f32',
                color: '#fff'
            });
        }
    } else if(pass) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'كلمة السر غير صحيحة',
            confirmButtonText: 'حسناً',
            background: '#161f32',
            color: '#fff'
        });
    }
}

// طباعة كارت الطلب
async function printRequestCard(refId) {
    try {
        const snap = await db.collection("Requests").doc(refId).get();
        if(!snap.exists) return;
        
        const d = snap.data();
        const logo = getSavedLogo();
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>طلب رقم ${d.refId}</title>
                <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
                <style>
                    body {
                        font-family: 'Cairo', sans-serif;
                        background: #0b1120;
                        color: white;
                        padding: 20px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                    }
                    .print-card {
                        background: linear-gradient(135deg, #161f32, #0b1120);
                        padding: 40px;
                        border-radius: 30px;
                        max-width: 450px;
                        width: 100%;
                        border: 2px solid #00d2ff;
                        box-shadow: 0 0 50px rgba(0,210,255,0.3);
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .logo {
                        width: 120px;
                        height: 120px;
                        border-radius: 50%;
                        border: 3px solid #00d2ff;
                        box-shadow: 0 0 30px #00d2ff;
                        margin-bottom: 15px;
                    }
                    .title {
                        color: #00d2ff;
                        font-size: 24px;
                        font-weight: 900;
                        margin: 5px 0;
                    }
                    .subtitle {
                        color: #94a3b8;
                        font-size: 16px;
                    }
                    .info-box {
                        background: rgba(0,210,255,0.1);
                        padding: 25px;
                        border-radius: 20px;
                        margin: 20px 0;
                        border: 1px solid rgba(0,210,255,0.3);
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 15px;
                        padding: 5px 0;
                        border-bottom: 1px solid rgba(255,255,255,0.1);
                    }
                    .info-label {
                        color: #94a3b8;
                        font-size: 14px;
                    }
                    .info-value {
                        color: white;
                        font-weight: 600;
                        font-size: 14px;
                    }
                    .ref-id {
                        color: #00d2ff;
                        font-size: 20px;
                        font-weight: 900;
                        text-align: center;
                        margin: 20px 0;
                        direction: ltr;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 2px solid #00d2ff;
                    }
                    .footer-text {
                        color: #94a3b8;
                        font-size: 12px;
                    }
                </style>
            </head>
            <body>
                <div class="print-card">
                    <div class="header">
                        <img src="${logo}" class="logo">
                        <h1 class="title">نقابة تكنولوجيا المعلومات والبرمجيات</h1>
                        <p class="subtitle">بوابة الشكاوي والمقترحات</p>
                        <h2 class="title" style="font-size: 20px;">نقيب المعلومات</h2>
                    </div>
                    
                    <div class="ref-id">${d.refId}</div>
                    
                    <div class="info-box">
                        <div class="info-row">
                            <span class="info-label">نوع الطلب:</span>
                            <span class="info-value" style="color: ${d.type === 'شكوى' ? '#ff4757' : '#00ff88'}">${d.type}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">الاسم:</span>
                            <span class="info-value">${d.name}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">الرقم القومي:</span>
                            <span class="info-value">${d.nid}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">رقم العضوية:</span>
                            <span class="info-value">${d.memberId || '-'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">الهاتف:</span>
                            <span class="info-value">${d.phone}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">المحافظة:</span>
                            <span class="info-value">${d.gov}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">العنوان:</span>
                            <span class="info-value">${d.address || '-'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">المهنة:</span>
                            <span class="info-value">${d.job}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">الحالة:</span>
                            <span class="info-value">${d.status}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">تاريخ التقديم:</span>
                            <span class="info-value">${new Date().toLocaleDateString('ar-EG')}</span>
                        </div>
                    </div>

                    <div class="info-box">
                        <div class="info-label" style="margin-bottom: 10px;">تفاصيل الطلب:</div>
                        <p style="color: white; line-height: 1.6;">${d.details}</p>
                    </div>
                    
                    <div class="footer">
                        <p class="footer-text">هذا الكارت معتمد من نقابة تكنولوجيا المعلومات والبرمجيات</p>
                        <p class="footer-text">يمكنك متابعة طلبك عبر رقم الطلب</p>
                    </div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    } catch(error) {
        console.error("Error printing request:", error);
        Swal.fire('خطأ', 'حدث خطأ في طباعة الطلب', 'error');
    }
}

// إغلاق النافذة المنبثقة
function closeModal() {
    document.getElementById('request-modal').style.display = 'none';
    document.getElementById('request-modal').classList.remove('show');
}

// إعدادات البرنامج
function toggleSettings() {
    const menu = document.getElementById('settings-menu');
    menu.classList.toggle('show');
    
    // تعبئة الحقول بالقيم الحالية
    if (menu.classList.contains('show')) {
        document.getElementById('logo-url').value = getSavedLogo();
        document.getElementById('services-url').value = getServicesUrl();
        document.getElementById('services-text').value = getServicesText();
        document.getElementById('show-services-btn').checked = shouldShowServices();
        document.getElementById('complaint-prefix').value = getComplaintPrefix();
        document.getElementById('suggestion-prefix').value = getSuggestionPrefix();
    }
}

// تحديث الإعدادات
function updateSettings() {
    const settings = {
        logoUrl: document.getElementById('logo-url').value,
        servicesUrl: document.getElementById('services-url').value,
        servicesText: document.getElementById('services-text').value,
        showServices: document.getElementById('show-services-btn').checked,
        complaintPrefix: document.getElementById('complaint-prefix').value,
        suggestionPrefix: document.getElementById('suggestion-prefix').value
    };
    
    // حفظ الإعدادات
    saveSettings(settings);
    
    Swal.fire({
        icon: 'success',
        title: 'تم التحديث',
        text: 'تم حفظ الإعدادات بنجاح',
        confirmButtonText: 'حسناً',
        background: '#161f32',
        color: '#fff'
    });
    
    document.getElementById('settings-menu').classList.remove('show');
}

// تسجيل الخروج
function logout() {
    localStorage.removeItem('admin');
    window.location.href = 'index.html';
}

// إضافة أنيميشن للصفوف
const style = document.createElement('style');
style.innerHTML = `
    @keyframes fadeInRow {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

// تحميل البيانات عند بدء التشغيل
document.addEventListener('DOMContentLoaded', () => {
    loadData('all');
    
    // تطبيق الشعار المحفوظ
    const savedLogo = getSavedLogo();
    const adminLogo = document.getElementById('admin-logo');
    if(adminLogo) adminLogo.src = savedLogo;
    
    // إخفاء شريط البحث في البداية
    document.getElementById('search-body').style.display = 'none';
    
    // التحقق من حالة زر التهيئة
    const resetDone = localStorage.getItem('system_reset_done');
    if (resetDone === 'true') {
        systemResetDone = true;
        document.getElementById('reset-system-section').style.display = 'none';
    }
});

// تنظيف الاستماع عند مغادرة الصفحة
window.addEventListener('beforeunload', () => {
    if (unsubscribe) {
        unsubscribe();
    }
});
