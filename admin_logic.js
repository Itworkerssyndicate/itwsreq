let currentFilter = 'all';
let allRequests = [];
let unsubscribe;

function setActiveNav(buttonId) {
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(buttonId)?.classList.add('active');
}

function loadData(filter) {
    currentFilter = filter;
    
    if(filter === 'all') setActiveNav('nav-all');
    else if(filter === 'شكوى') setActiveNav('nav-complaint');
    else if(filter === 'اقتراح') setActiveNav('nav-suggestion');

    if (unsubscribe) unsubscribe();

    unsubscribe = db.collection("Requests")
        .orderBy("createdAt", "desc")
        .onSnapshot(snap => {
            allRequests = [];
            snap.forEach(doc => {
                const d = doc.data();
                if (d.createdAt && d.createdAt.toDate) {
                    d.createdAtDate = d.createdAt.toDate();
                }
                allRequests.push(d);
            });
            performSearch();
        });
}

function performSearch() {
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

    let filteredRequests = allRequests.filter(req => {
        if (currentFilter !== 'all' && req.type !== currentFilter) return false;
        if (searchType !== 'all' && req.type !== searchType) return false;
        if (searchStatus !== 'all' && req.status !== searchStatus) return false;
        
        if (searchMemberType !== 'all') {
            if (searchMemberType === 'عضو نقابة') {
                if (req.memberType !== 'عضو نقابة') return false;
                if (searchSpecificMember && !req.memberId?.includes(searchSpecificMember)) return false;
            } else if (searchMemberType === 'غير عضو' && req.memberType !== 'غير عضو') return false;
        }

        if (searchRef && !req.refId?.toLowerCase().includes(searchRef)) return false;
        if (searchName && !req.name?.toLowerCase().includes(searchName)) return false;
        if (searchNid && !req.nid?.includes(searchNid)) return false;
        if (searchMember && !req.memberId?.includes(searchMember)) return false;

        if (searchDateFrom || searchDateTo) {
            const reqDate = req.createdAtDate || (req.createdAt ? new Date(req.createdAt) : null);
            if (reqDate) {
                const reqDateStr = reqDate.toISOString().split('T')[0];
                if (searchDateFrom && reqDateStr < searchDateFrom) return false;
                if (searchDateTo && reqDateStr > searchDateTo) return false;
            }
        }

        return true;
    });

    document.getElementById('results-count').textContent = `${filteredRequests.length} نتيجة`;
    renderRequests(filteredRequests);
}

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

function toggleMemberSearch() {
    const memberType = document.getElementById('search-member-type').value;
    const memberField = document.getElementById('member-id-search-field');
    memberField.style.display = memberType === 'عضو نقابة' ? 'block' : 'none';
    if (memberType !== 'عضو نقابة') document.getElementById('search-specific-member').value = '';
    performSearch();
}

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

function formatText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
}

function renderRequests(requests) {
    let html = "";
    
    requests.forEach(d => {
        const createdDate = d.createdAtDate ? 
            d.createdAtDate.toLocaleDateString('ar-EG') : 
            (d.createdAt ? new Date(d.createdAt).toLocaleDateString('ar-EG') : 'غير محدد');
        
        const createdTime = d.createdAtDate ? 
            d.createdAtDate.toLocaleTimeString('ar-EG') : 
            (d.createdAt ? new Date(d.createdAt).toLocaleTimeString('ar-EG') : '');
        
        const membershipHtml = d.memberType === 'عضو نقابة' 
            ? `<span class="membership-badge member">عضو</span> ${d.memberId}`
            : `<span class="membership-badge non-member">غير عضو</span>`;
        
        html += `
        <tr>
            <td><div>${createdDate}</div><small style="color:var(--text-muted);">${createdTime}</small></td>
            <td><span style="color:var(--primary); direction:ltr; display:inline-block; letter-spacing:1px;">${d.refId}</span></td>
            <td><div><strong>${formatText(d.name)}</strong><br><small>${formatText(d.job)}</small><br><small style="color:var(--primary);">${d.phone}</small></div></td>
            <td>${membershipHtml}</td>
            <td>${d.gov}</td>
            <td><span class="type-badge ${d.type === 'شكوى' ? 'complaint' : 'suggestion'}">${d.type}</span></td>
            <td><span class="status-badge status-${d.status.replace(/ /g, '\\ ')}">${d.status}</span></td>
            <td><button class="action-btn" onclick="manageReq('${d.refId}')"><i class="fas fa-cog"></i></button></td>
        </tr>`;
    });
    
    if(html === '') {
        html = '<tr><td colspan="8" style="text-align:center; padding:30px;">لا توجد بيانات</td></tr>';
    }
    
    document.getElementById('admin-tbody').innerHTML = html;
}

function exportToPDF() {
    const element = document.getElementById('main-table');
    html2pdf().from(element).save('تقرير_الطلبات.pdf');
}

async function manageReq(id) {
    try {
        const snap = await db.collection("Requests").doc(id).get();
        if(!snap.exists) return;
        showRequestModal(snap.data());
    } catch(error) {
        console.error(error);
    }
}

function showRequestModal(d) {
    const stages = d.tracking.map(t => t.status);
    const finalStage = "تم الإغلاق النهائي";
    const allStages = [...stages, finalStage];
    const currentIdx = allStages.indexOf(d.status);
    // من اليمين للشمال: نبدأ من 0% عند أول مرحلة وصولاً لـ 100% عند آخر مرحلة
    const progressPercent = allStages.length > 0 ? (currentIdx / (allStages.length - 1)) * 100 : 0;

    // تحديد حقل إدخال الحالة حسب نوع الطلب
    let statusInput = '';
    if (d.type === 'شكوى') {
        // للشكوى: حقل نصي مفتوح
        statusInput = `
            <div class="input-group">
                <label><i class="fas fa-tag"></i> اسم المرحلة الجديدة</label>
                <input type="text" id="new-stage-name" class="neon-border" placeholder="اكتب اسم المرحلة..." style="margin-bottom:10px;">
            </div>
        `;
    } else {
        // للاقتراح: اختيار من قائمة
        statusInput = `
            <div class="input-group">
                <label><i class="fas fa-tag"></i> الحالة الجديدة</label>
                <select id="new-stage-name" class="neon-border" style="margin-bottom:10px;">
                    <option value="">-- اختر الحالة --</option>
                    <option value="تمت القراءة">تمت القراءة</option>
                    <option value="لم يقرأ">لم يقرأ</option>
                    <option value="تم الإغلاق النهائي">تم الإغلاق النهائي</option>
                </select>
            </div>
        `;
    }

    const modalHtml = `
        <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="color:var(--primary); font-size:18px;">إدارة الطلب</h3>
                <button class="action-btn delete" onclick="deleteReqFromModal('${d.refId}')"><i class="fas fa-trash"></i></button>
            </div>
            
            <div style="background:rgba(0,0,0,0.2); padding:15px; border-radius:10px; margin-bottom:15px;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:13px;">
                    <div><span style="color:#94a3b8;">الاسم :</span> ${formatText(d.name)}</div>
                    <div><span style="color:#94a3b8;">الرقم القومي :</span> ${d.nid}</div>
                    <div><span style="color:#94a3b8;">الهاتف :</span> ${d.phone}</div>
                    <div><span style="color:#94a3b8;">المحافظة :</span> ${d.gov}</div>
                    <div><span style="color:#94a3b8;">نوع المقدم :</span> ${d.memberType}</div>
                    <div><span style="color:#94a3b8;">رقم العضوية :</span> ${d.memberId}</div>
                    <div><span style="color:#94a3b8;">المهنة :</span> ${formatText(d.job)}</div>
                    <div><span style="color:#94a3b8;">نوع الطلب :</span> <span class="type-badge ${d.type === 'شكوى' ? 'complaint' : 'suggestion'}">${d.type}</span></div>
                </div>
                <div style="margin-top:10px;"><span style="color:#94a3b8;">العنوان :</span> ${formatText(d.address)}</div>
                <div style="margin-top:10px;"><span style="color:#94a3b8;">التفاصيل :</span> ${formatText(d.details)}</div>
            </div>

            <!-- التراك المائي الأفقي من اليمين للشمال -->
            <div class="track-container" style="margin:20px 0;">
                <div class="track-water">
                    <div class="water-fill-horizontal" style="width: ${progressPercent}%;"></div>
                </div>
                <div class="track-bar-horizontal">
                    ${allStages.map((stage, index) => {
                        const isActive = index <= currentIdx;
                        return `
                            <div class="track-point">
                                <div class="dot ${isActive ? 'active' : 'inactive'}">
                                    ${isActive ? '<i class="fas fa-check"></i>' : ''}
                                </div>
                                <span class="dot-label">${stage}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div style="margin:15px 0;">
                <h4 style="font-size:14px; margin-bottom:10px;">المسار الزمني</h4>
                ${d.tracking.slice().reverse().map(t => `
                    <div class="timeline-card ${t.isFinal ? 'final' : ''}">
                        <div class="timeline-header"><h4>${t.status}</h4><span>${t.time}</span></div>
                        <p>${t.comment}</p>
                    </div>
                `).join('')}
            </div>

            <div style="border-top:1px solid var(--border); padding-top:15px;">
                <h4 style="font-size:14px; margin-bottom:10px;">تحديث جديد</h4>
                ${statusInput}
                <div class="input-group">
                    <label><i class="fas fa-comment"></i> تعليق المرحلة السابقة</label>
                    <textarea id="status-comment" class="neon-border" placeholder="اكتب تعليقك هنا..." rows="2" style="margin-bottom:10px;"></textarea>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="btn-main" onclick="updateRequestStatus('${d.refId}')" style="flex:2;">تحديث</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-content-area').innerHTML = modalHtml;
    document.getElementById('request-modal').style.display = 'flex';
    document.getElementById('request-modal').classList.add('show');
}

async function updateRequestStatus(refId) {
    const newStage = document.getElementById('new-stage-name').value.trim();
    const comment = document.getElementById('status-comment').value.trim();
    
    if(!newStage || !comment) {
        return Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'املأ جميع الحقول',
            background: '#161f32',
            color: '#fff'
        });
    }

    try {
        await db.collection("Requests").doc(refId).update({
            status: newStage,
            tracking: firebase.firestore.FieldValue.arrayUnion({
                status: newStage,
                comment: comment,
                time: new Date().toLocaleString('ar-EG'),
                isFinal: newStage === 'تم الإغلاق النهائي'
            })
        });

        Swal.fire({
            icon: 'success',
            title: 'تم',
            text: 'تم تحديث الحالة',
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

async function deleteReqFromModal(id) {
    const { value: pass } = await Swal.fire({
        title: 'حذف الطلب',
        input: 'password',
        inputPlaceholder: 'كلمة السر',
        showCancelButton: true,
        background: '#161f32',
        color: '#fff',
        inputAttributes: { 
            style: 'direction:ltr;',
            autocomplete: 'off'
        },
        allowOutsideClick: false,
        allowEscapeKey: false
    });

    if (pass === '11111@') {
        try {
            await db.collection("Requests").doc(id).delete();
            Swal.fire({
                icon: 'success',
                title: 'تم',
                text: 'تم الحذف',
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
    } else if(pass) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'كلمة السر خطأ',
            background: '#161f32',
            color: '#fff'
        });
    }
}

async function resetSystem() {
    const { value: pass } = await Swal.fire({
        title: '⚠️ تحذير',
        html: 'حذف جميع البيانات نهائياً',
        input: 'password',
        inputPlaceholder: 'كلمة السر',
        showCancelButton: true,
        confirmButtonColor: '#ff4757',
        background: '#161f32',
        color: '#fff',
        inputAttributes: { 
            style: 'direction:ltr;',
            autocomplete: 'off'
        },
        allowOutsideClick: false,
        allowEscapeKey: false
    });

    if (pass === '11111@') {
        try {
            const snapshot = await db.collection("Requests").get();
            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            localStorage.setItem('system_reset_done', 'true');
            Swal.fire({
                icon: 'success',
                title: 'تم',
                text: 'تمت تهيئة النظام',
                background: '#161f32',
                color: '#fff'
            });
            document.getElementById('reset-system-section').style.display = 'none';
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

function logout() {
    localStorage.removeItem('admin');
    window.location.href = 'index.html';
}

function closeModal() {
    document.getElementById('request-modal').style.display = 'none';
    document.getElementById('request-modal').classList.remove('show');
}

document.addEventListener('DOMContentLoaded', () => {
    loadData('all');
    const savedLogo = getSavedLogo();
    const adminLogo = document.getElementById('admin-logo');
    if(adminLogo) adminLogo.src = savedLogo;
    document.getElementById('search-body').style.display = 'none';
    
    // التحقق من ظهور زر التهيئة
    const resetDone = localStorage.getItem('system_reset_done');
    if (resetDone === 'true') {
        document.getElementById('reset-system-section').style.display = 'none';
    }
});

window.addEventListener('beforeunload', () => {
    if (unsubscribe) unsubscribe();
});
