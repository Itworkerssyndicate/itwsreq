let currentFilter = 'all';
let allRequests = [];
let unsubscribe;
let currentDeleteId = null;

// التحقق من تسجيل الدخول عند تحميل الصفحة
(function checkAuth() {
    const isLoggedIn = localStorage.getItem('admin');
    if (!isLoggedIn || isLoggedIn !== 'true') {
        window.location.href = 'index.html';
    }
})();

function setActiveNav(id) {
    document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
}

function loadData(filter) {
    currentFilter = filter;
    setActiveNav(filter === 'all' ? 'nav-all' : filter === 'شكوى' ? 'nav-complaint' : 'nav-suggestion');
    
    if (unsubscribe) unsubscribe();
    
    unsubscribe = db.collection("Requests").orderBy("createdAt", "desc").onSnapshot(snap => {
        allRequests = [];
        snap.forEach(doc => {
            const d = doc.data();
            if (d.createdAt?.toDate) d.createdAtDate = d.createdAt.toDate();
            allRequests.push(d);
        });
        performSearch();
    });
}

function performSearch() {
    const fields = {
        ref: document.getElementById('search-ref')?.value.toLowerCase().trim() || '',
        name: document.getElementById('search-name')?.value.toLowerCase().trim() || '',
        nid: document.getElementById('search-nid')?.value.trim() || '',
        member: document.getElementById('search-member')?.value.trim() || '',
        specificMember: document.getElementById('search-specific-member')?.value.trim() || '',
        dateFrom: document.getElementById('search-date-from')?.value || '',
        dateTo: document.getElementById('search-date-to')?.value || '',
        type: document.getElementById('search-type')?.value || 'all',
        status: document.getElementById('search-status')?.value || 'all',
        memberType: document.getElementById('search-member-type')?.value || 'all'
    };
    
    const filtered = allRequests.filter(req => {
        if (currentFilter !== 'all' && req.type !== currentFilter) return false;
        if (fields.type !== 'all' && req.type !== fields.type) return false;
        if (fields.status !== 'all' && req.status !== fields.status) return false;
        
        if (fields.memberType !== 'all') {
            if (fields.memberType === 'عضو نقابة') {
                if (req.memberType !== 'عضو نقابة') return false;
                if (fields.specificMember && !req.memberId?.includes(fields.specificMember)) return false;
            } else if (req.memberType !== 'غير عضو') return false;
        }
        
        if (fields.ref && !req.refId?.toLowerCase().includes(fields.ref)) return false;
        if (fields.name && !req.name?.toLowerCase().includes(fields.name)) return false;
        if (fields.nid && !req.nid?.includes(fields.nid)) return false;
        if (fields.member && !req.memberId?.includes(fields.member)) return false;
        
        if (fields.dateFrom || fields.dateTo) {
            const d = req.createdAtDate || (req.createdAt ? new Date(req.createdAt) : null);
            if (d) {
                const ds = d.toISOString().split('T')[0];
                if (fields.dateFrom && ds < fields.dateFrom) return false;
                if (fields.dateTo && ds > fields.dateTo) return false;
            }
        }
        
        return true;
    });
    
    document.getElementById('results-count').textContent = `${filtered.length} نتيجة`;
    renderRequests(filtered);
}

function resetSearch() {
    ['ref', 'name', 'nid', 'member', 'specific-member', 'date-from', 'date-to'].forEach(id => 
        document.getElementById(`search-${id}`).value = '');
    ['type', 'status', 'member-type'].forEach(id => 
        document.getElementById(`search-${id}`).value = 'all');
    document.getElementById('member-id-search-field').style.display = 'none';
    performSearch();
}

function toggleMemberSearch() {
    const mt = document.getElementById('search-member-type').value;
    const f = document.getElementById('member-id-search-field');
    f.style.display = mt === 'عضو نقابة' ? 'block' : 'none';
    if (mt !== 'عضو نقابة') document.getElementById('search-specific-member').value = '';
    performSearch();
}

function toggleSearch() {
    const body = document.getElementById('search-body');
    const arrow = document.getElementById('search-arrow');
    const header = document.querySelector('.search-header');
    
    if (body.style.display !== 'block') {
        body.style.display = 'block';
        arrow.style.transform = 'rotate(180deg)';
        header.classList.add('active');
    } else {
        body.style.display = 'none';
        arrow.style.transform = 'rotate(0)';
        header.classList.remove('active');
    }
}

function renderRequests(requests) {
    let html = '';
    
    requests.forEach(r => {
        const date = r.createdAtDate ? r.createdAtDate.toLocaleDateString('ar-EG') : 'غير محدد';
        const time = r.createdAtDate ? r.createdAtDate.toLocaleTimeString('ar-EG') : '';
        const member = r.memberType === 'عضو نقابة' 
            ? `<span class="membership-badge" style="background:rgba(0,210,255,0.2); color:var(--primary); padding:3px 8px; border-radius:12px; font-size:11px;">عضو</span> ${r.memberId}`
            : `<span class="membership-badge" style="background:rgba(148,163,184,0.2); color:var(--text-muted); padding:3px 8px; border-radius:12px; font-size:11px;">غير عضو</span>`;
        
        html += `
        <tr>
            <td>
                <div style="font-weight:600; margin-bottom:4px;">${date}</div>
                <div style="color:var(--text-muted); font-size:11px;">${time}</div>
            </td>
            <td style="color:var(--primary); font-weight:600; direction:ltr;">${r.refId}</td>
            <td>
                <div style="font-weight:600; margin-bottom:4px;">${r.name}</div>
                <div style="color:var(--text-muted); font-size:11px; margin-bottom:2px;">${r.job}</div>
                <div style="color:var(--primary); font-size:11px;">${r.phone}</div>
            </td>
            <td>${member}</td>
            <td>${r.gov}</td>
            <td>
                <span class="type-badge" style="background:${r.type === 'شكوى' ? 'rgba(255,71,87,0.2)' : 'rgba(0,255,136,0.2)'}; color:${r.type === 'شكوى' ? 'var(--danger)' : 'var(--success)'}; padding:4px 10px; border-radius:20px; font-size:11px; font-weight:600;">${r.type}</span>
            </td>
            <td>
                <span class="status-badge" style="background:${getStatusColor(r.status)}; padding:4px 10px; border-radius:20px; font-size:11px; font-weight:600;">${r.status}</span>
            </td>
            <td>
                <button class="action-btn" onclick="manageReq('${r.refId}')" style="width:32px; height:32px; border-radius:8px; background:transparent; border:1px solid var(--border); color:var(--text); cursor:pointer; margin:0 2px;">
                    <i class="fas fa-cog"></i>
                </button>
                <button class="action-btn delete" onclick="openDeleteModal('${r.refId}')" style="width:32px; height:32px; border-radius:8px; background:transparent; border:1px solid var(--border); color:var(--text); cursor:pointer; margin:0 2px;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`;
    });
    
    document.getElementById('admin-tbody').innerHTML = html || '<tr><td colspan="8" style="text-align:center; padding:40px; color:var(--text-muted);">لا توجد بيانات</td></tr>';
}

function getStatusColor(status) {
    const colors = {
        'تم الاستلام': 'rgba(255,165,2,0.2)',
        'قيد المراجعة': 'rgba(0,210,255,0.2)',
        'جاري التنفيذ': 'rgba(58,123,213,0.2)',
        'تم الحل': 'rgba(0,255,136,0.2)',
        'تم الإغلاق النهائي': 'rgba(255,71,87,0.2)',
        'تمت القراءة': 'rgba(0,210,255,0.2)',
        'لم يقرأ': 'rgba(255,165,2,0.2)'
    };
    return colors[status] || 'rgba(148,163,184,0.2)';
}

function exportToPDF() {
    html2pdf().from(document.getElementById('main-table')).save('تقرير_الطلبات.pdf');
}

async function manageReq(id) {
    const snap = await db.collection("Requests").doc(id).get();
    if (snap.exists) showRequestModal(snap.data());
}

function openDeleteModal(id) {
    currentDeleteId = id;
    document.getElementById('delete-modal').style.display = 'flex';
    document.getElementById('delete-password').focus();
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    currentDeleteId = null;
}

async function confirmDelete() {
    const pass = document.getElementById('delete-password').value;
    if (pass === '11111@') {
        await db.collection("Requests").doc(currentDeleteId).delete();
        Swal.fire({ icon: 'success', title: 'تم', text: 'تم الحذف', background: '#161f32', color: '#fff' });
        closeDeleteModal();
        closeModal();
    } else {
        Swal.fire({ icon: 'error', title: 'خطأ', text: 'كلمة السر خطأ', background: '#161f32', color: '#fff' });
    }
}

function showRequestModal(d) {
    const stages = [...d.tracking.map(t => t.status), "تم الإغلاق النهائي"];
    const currentIdx = stages.indexOf(d.status);
    const progress = stages.length > 0 ? (currentIdx / (stages.length - 1)) * 100 : 0;
    
    let statusInput = '';
    if (d.type === 'شكوى') {
        statusInput = `
            <div class="input-group">
                <label><i class="fas fa-tag"></i> اسم المرحلة الجديدة</label>
                <input type="text" id="new-stage-name" class="neon-border" placeholder="اكتب اسم المرحلة..." style="margin-bottom:10px;">
            </div>
        `;
    } else {
        statusInput = `
            <div class="input-group">
                <label><i class="fas fa-tag"></i> الحالة الجديدة</label>
                <select id="new-stage-name" class="neon-border" style="margin-bottom:10px;">
                    <option value="">-- اختر الحالة --</option>
                    <option value="تمت القراءة">تمت القراءة</option>
                    <option value="لم يقرأ">لم يقرأ</option>
                </select>
            </div>
        `;
    }
    
    const html = `
        <div>
            <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                <h3 style="color:var(--primary);">إدارة الطلب</h3>
                <button class="action-btn delete" onclick="openDeleteModal('${d.refId}')"><i class="fas fa-trash"></i></button>
            </div>
            
            <div style="background:rgba(0,0,0,0.2); padding:15px; border-radius:10px; margin-bottom:15px;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div><span style="color:#94a3b8;">الاسم :</span> ${d.name}</div>
                    <div><span style="color:#94a3b8;">الرقم القومي :</span> ${d.nid}</div>
                    <div><span style="color:#94a3b8;">الهاتف :</span> ${d.phone}</div>
                    <div><span style="color:#94a3b8;">المحافظة :</span> ${d.gov}</div>
                    <div><span style="color:#94a3b8;">نوع المقدم :</span> ${d.memberType}</div>
                    <div><span style="color:#94a3b8;">رقم العضوية :</span> ${d.memberId}</div>
                </div>
                <div style="margin-top:10px;"><span style="color:#94a3b8;">العنوان :</span> ${d.address}</div>
                <div style="margin-top:10px;"><span style="color:#94a3b8;">التفاصيل :</span> ${d.details}</div>
            </div>
            
            <div class="track-container" style="margin:20px 0;">
                <div class="track-line-bg"></div>
                <div class="track-line-fill" style="width: ${progress}%;"></div>
                <div class="track-points">
                    ${stages.map((s, i) => `
                        <div class="track-point">
                            <div class="track-dot ${i <= currentIdx ? 'active' : ''}">
                                ${i <= currentIdx ? '<i class="fas fa-check"></i>' : ''}
                            </div>
                            <span class="track-label">${s}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="margin:15px 0;">
                <h4>المسار الزمني</h4>
                ${d.tracking.slice().reverse().map(t => `
                    <div class="timeline-card">
                        <div class="timeline-header"><h4>${t.status}</h4><span>${t.time}</span></div>
                        <p>${t.comment}</p>
                    </div>
                `).join('')}
            </div>
            
            <div style="border-top:1px solid var(--border); padding-top:15px;">
                <h4 style="margin-bottom:10px;">تحديث جديد</h4>
                ${statusInput}
                <textarea id="status-comment" class="neon-border" placeholder="تعليق" rows="2" style="margin-bottom:10px;"></textarea>
                
                <div style="display:flex; gap:10px; margin-top:15px; flex-wrap:wrap;">
                    <!-- زر التحديث العادي -->
                    <button class="btn-main" onclick="updateRequestStatus('${d.refId}')" style="flex:2; min-width:150px;">
                        <i class="fas fa-save"></i> تحديث
                    </button>
                    
                    <!-- أزرار إضافية حسب نوع الطلب -->
                    ${d.type === 'شكوى' 
                        ? `<button class="btn-main" onclick="closeRequestWithComment('${d.refId}')" style="flex:1; background:var(--danger); min-width:120px;">
                                <i class="fas fa-lock"></i> إغلاق الشكوى
                           </button>` 
                        : `<button class="btn-main" onclick="markAsReadWithComment('${d.refId}')" style="flex:1; background:var(--success); min-width:120px;">
                                <i class="fas fa-check-circle"></i> تم القراءة
                           </button>`
                    }
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modal-content-area').innerHTML = html;
    document.getElementById('request-modal').style.display = 'flex';
}

// دالة لإغلاق الشكوى مع تعليق
async function closeRequestWithComment(refId) {
    const { value: comment } = await Swal.fire({
        title: 'إغلاق الشكوى',
        text: 'اكتب تعليق إغلاق الشكوى',
        input: 'textarea',
        inputPlaceholder: 'اكتب سبب الإغلاق أو القرار النهائي...',
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

    if (comment) {
        try {
            await db.collection("Requests").doc(refId).update({
                status: 'تم الإغلاق النهائي',
                tracking: firebase.firestore.FieldValue.arrayUnion({
                    status: 'تم الإغلاق النهائي',
                    comment: comment,
                    time: new Date().toLocaleString('ar-EG'),
                    isFinal: true
                })
            });

            Swal.fire({
                icon: 'success',
                title: 'تم',
                text: 'تم إغلاق الشكوى بنجاح',
                background: '#161f32',
                color: '#fff'
            });
            closeModal();
        } catch(error) {
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'حدث خطأ',
                background: '#161f32',
                color: '#fff'
            });
        }
    }
}

// دالة لتمييز الاقتراح كمقروء مع تعليق
async function markAsReadWithComment(refId) {
    const { value: comment } = await Swal.fire({
        title: 'تمت القراءة',
        text: 'اكتب تعليق (اختياري)',
        input: 'textarea',
        inputPlaceholder: 'اكتب أي ملاحظات (يمكنك تركها فارغة)...',
        showCancelButton: true,
        confirmButtonText: 'تأكيد',
        cancelButtonText: 'إلغاء',
        background: '#161f32',
        color: '#fff',
        inputAttributes: {
            'class': 'neon-border',
            'style': 'width:100%; margin-top:10px;'
        }
    });

    const finalComment = comment || 'تمت قراءة الاقتراح';

    try {
        await db.collection("Requests").doc(refId).update({
            status: 'تمت القراءة',
            tracking: firebase.firestore.FieldValue.arrayUnion({
                status: 'تمت القراءة',
                comment: finalComment,
                time: new Date().toLocaleString('ar-EG'),
                isFinal: false
            })
        });

        Swal.fire({
            icon: 'success',
            title: 'تم',
            text: 'تم تحديث حالة الاقتراح',
            background: '#161f32',
            color: '#fff'
        });
        closeModal();
    } catch(error) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ',
            background: '#161f32',
            color: '#fff'
        });
    }
}

async function updateRequestStatus(refId) {
    const newStage = document.getElementById('new-stage-name').value.trim();
    const comment = document.getElementById('status-comment').value.trim();
    
    if (!newStage || !comment) {
        return Swal.fire({ icon: 'error', title: 'خطأ', text: 'املأ الحقول', background: '#161f32', color: '#fff' });
    }
    
    await db.collection("Requests").doc(refId).update({
        status: newStage,
        tracking: firebase.firestore.FieldValue.arrayUnion({
            status: newStage,
            comment,
            time: new Date().toLocaleString('ar-EG'),
            isFinal: newStage === 'تم الإغلاق النهائي'
        })
    });
    
    Swal.fire({ icon: 'success', title: 'تم', text: 'تم التحديث', background: '#161f32', color: '#fff' });
    closeModal();
}

async function resetSystem() {
    const { value: pass } = await Swal.fire({
        title: '⚠️ تحذير',
        text: 'حذف جميع البيانات',
        input: 'password',
        showCancelButton: true,
        background: '#161f32',
        color: '#fff'
    });
    
    if (pass === '11111@') {
        const snap = await db.collection("Requests").get();
        const batch = db.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        localStorage.setItem('system_reset_done', 'true');
        Swal.fire({ icon: 'success', title: 'تم', text: 'تمت التهيئة', background: '#161f32', color: '#fff' });
        document.getElementById('reset-system-section').style.display = 'none';
    }
}

function toggleSettings() {
    const menu = document.getElementById('settings-menu');
    menu.classList.toggle('show');
    
    if (menu.classList.contains('show')) {
        document.getElementById('logo-url').value = getSavedLogo();
        document.getElementById('services-url').value = getServicesUrl();
        document.getElementById('services-text').value = getServicesText();
        document.getElementById('show-services-btn').checked = shouldShowServices();
        document.getElementById('complaint-prefix').value = getComplaintPrefix();
        document.getElementById('suggestion-prefix').value = getSuggestionPrefix();
    }
}

function autoSaveSettings() {
    setTimeout(() => {
        saveSettings({
            logoUrl: document.getElementById('logo-url')?.value,
            servicesUrl: document.getElementById('services-url')?.value,
            servicesText: document.getElementById('services-text')?.value,
            showServices: document.getElementById('show-services-btn')?.checked,
            complaintPrefix: document.getElementById('complaint-prefix')?.value,
            suggestionPrefix: document.getElementById('suggestion-prefix')?.value
        });
    }, 500);
}

function logout() {
    localStorage.removeItem('admin');
    window.location.href = 'index.html';
}

function closeModal() {
    document.getElementById('request-modal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    loadData('all');
    document.getElementById('admin-logo').src = getSavedLogo();
    document.getElementById('search-body').style.display = 'none';
    if (localStorage.getItem('system_reset_done') === 'true') {
        document.getElementById('reset-system-section').style.display = 'none';
    }
});

window.addEventListener('beforeunload', () => unsubscribe?.());

// دالة تهيئة النظام (إعادة الضبط)
async function resetSystem() {
    const { value: pass } = await Swal.fire({
        title: '⚠️ تحذير شديد الخطورة ⚠️',
        html: '<p style="color:#ff4757;">أنت على وشك حذف جميع البيانات نهائياً</p><p style="color:#94a3b8; margin-top:10px;">هذا الإجراء لا يمكن التراجع عنه</p>',
        input: 'password',
        inputPlaceholder: 'كلمة سر التهيئة',
        showCancelButton: true,
        confirmButtonText: 'نعم، قم بالتهيئة',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#ff4757',
        background: '#161f32',
        color: '#fff',
        inputAttributes: {
            'class': 'neon-border',
            'style': 'direction:ltr; width:100%;'
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
            
            // تخزين أن التهيئة تمت
            localStorage.setItem('system_reset_done', 'true');
            
            Swal.fire({
                icon: 'success',
                title: 'تمت التهيئة',
                text: 'تم حذف جميع البيانات بنجاح',
                confirmButtonText: 'حسناً',
                background: '#161f32',
                color: '#fff'
            });
            
            // إخفاء الزر بعد التهيئة
            document.getElementById('reset-system-section').style.display = 'none';
            
        } catch(error) {
            console.error("Error resetting system:", error);
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'حدث خطأ في تهيئة النظام',
                background: '#161f32',
                color: '#fff'
            });
        }
    } else if(pass) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'كلمة السر غير صحيحة',
            background: '#161f32',
            color: '#fff'
        });
    }
}
