// التبديل بين الشاشات
function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.querySelectorAll('.btn-nav').forEach(b => b.classList.remove('active'));
    document.getElementById('view-' + view).style.display = 'block';
    
    const buttons = document.querySelectorAll('.btn-nav');
    const activeBtn = view === 'submit' ? buttons[0] : (view === 'track' ? buttons[1] : buttons[2]);
    if(activeBtn) activeBtn.classList.add('active');
    
    // تطبيق الشعار عند التبديل
    const savedLogo = getSavedLogo();
    const headerLogo = document.querySelector('.header-logo');
    if(headerLogo) headerLogo.src = savedLogo;
}

// التحكم في حقول العضوية
function toggleMemberField() {
    const type = document.getElementById('u-member-type').value;
    const mBox = document.getElementById('member-id-box');
    const typeSelect = document.getElementById('u-req-type');
    
    if(type === 'عضو نقابة') {
        mBox.style.display = 'block';
        typeSelect.innerHTML = '<option value="شكوى">شكوى</option><option value="اقتراح">اقتراح</option>';
    } else {
        mBox.style.display = 'none';
        typeSelect.innerHTML = '<option value="اقتراح">اقتراح فقط</option>';
    }
}

// تقديم الطلب
async function handleSubmit() {
    const refId = "REQ-" + Date.now().toString().slice(-10);
    
    // التحقق من الحقول المطلوبة
    const name = document.getElementById('u-name').value.trim();
    const nid = document.getElementById('u-nid').value.trim();
    const phone = document.getElementById('u-phone').value.trim();
    const gov = document.getElementById('u-gov').value;
    const address = document.getElementById('u-address').value.trim();
    const job = document.getElementById('u-job').value.trim();
    const type = document.getElementById('u-req-type').value;
    const details = document.getElementById('u-details').value.trim();
    const memberId = document.getElementById('u-member-id').value.trim() || "غير عضو";

    // التحقق من الحقول الأساسية
    if(!name || !nid || !phone || !gov || !address || !job || !details) {
        return Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'برجاء ملء جميع البيانات المطلوبة',
            confirmButtonText: 'حسناً'
        });
    }

    // التحقق من الرقم القومي
    if(nid.length !== 14) {
        return Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'الرقم القومي يجب أن يكون 14 رقم',
            confirmButtonText: 'حسناً'
        });
    }

    const data = {
        refId,
        name,
        nid,
        phone,
        gov,
        address,
        job,
        type,
        details,
        memberId,
        status: "تم الاستلام",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        tracking: [{
            status: "تم الاستلام",
            comment: "تم استلام طلبك بنجاح وجاري العرض على الإدارة",
            time: new Date().toLocaleString('ar-EG'),
            isFinal: false
        }]
    };

    try {
        await db.collection("Requests").doc(refId).set(data);
        
        Swal.fire({
            icon: 'success',
            title: 'تم بنجاح',
            html: `تم حفظ طلبك بنجاح<br><strong>كود المتابعة: ${refId}</strong>`,
            confirmButtonText: 'حسناً'
        });
        
        // مسح الحقول
        document.getElementById('u-name').value = '';
        document.getElementById('u-nid').value = '';
        document.getElementById('u-phone').value = '';
        document.getElementById('u-address').value = '';
        document.getElementById('u-job').value = '';
        document.getElementById('u-details').value = '';
        document.getElementById('u-member-id').value = '';
        
    } catch(error) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ في حفظ الطلب. برجاء المحاولة مرة أخرى',
            confirmButtonText: 'حسناً'
        });
    }
}

// الاستعلام عن طلب
async function handleTrack() {
    const nid = document.getElementById('q-nid').value.trim();
    const ref = document.getElementById('q-ref').value.trim();
    const type = document.getElementById('q-type').value;

    if(!nid || !ref) {
        return Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'برجاء إدخال جميع البيانات',
            confirmButtonText: 'حسناً'
        });
    }

    try {
        const snap = await db.collection("Requests")
            .where("nid", "==", nid)
            .where("refId", "==", ref)
            .where("type", "==", type)
            .get();

        if(snap.empty) {
            return Swal.fire({
                icon: 'error',
                title: 'عذراً',
                text: 'لا يوجد طلب بهذه البيانات',
                confirmButtonText: 'حسناً'
            });
        }
        
        renderTrack(snap.docs[0].data());
    } catch(error) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ في الاستعلام',
            confirmButtonText: 'حسناً'
        });
    }
}

// عرض مسار الطلب
function renderTrack(d) {
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل"];
    const currentIdx = stages.indexOf(d.status);
    const pct = (currentIdx / (stages.length - 1)) * 100;

    let html = `
        <div class="card" style="margin-top:20px;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
                <div style="background:var(--primary); width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                    <i class="fas fa-qrcode" style="color:white;"></i>
                </div>
                <div>
                    <h4 style="color:var(--primary);">${d.refId}</h4>
                    <small style="color:#94a3b8;">${d.name}</small>
                </div>
            </div>

            <!-- التراك المائي المتحرك -->
            <div class="track-container">
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

            <!-- المسار الزمني -->
            <div style="margin-top:30px;">
                <h4 style="margin-bottom:15px;"><i class="fas fa-history"></i> المسار الزمني</h4>
                ${d.tracking.slice().reverse().map(t => `
                    <div class="timeline-card ${t.isFinal ? 'final' : ''}">
                        <div class="timeline-header">
                            <h4>${t.status}</h4>
                            <span>${t.time}</span>
                        </div>
                        <p style="font-size:13px; margin-top:5px;">${t.comment}</p>
                    </div>
                `).join('')}
            </div>
        </div>`;
    
    document.getElementById('track-result-box').innerHTML = html;
    document.getElementById('track-result-box').style.display = 'block';
    
    // تشغيل أنيميشن الماء
    setTimeout(() => {
        document.querySelector('.water-fill').style.transition = 'height 1s ease';
    }, 100);
}

// دخول الادمن
function adminLogin() {
    const username = document.getElementById('adm-user').value;
    const password = document.getElementById('adm-pass').value;
    
    if(username === 'admin' && password === 'itws@2026') {
        localStorage.setItem('admin', 'true');
        window.location.href = 'admin.html';
    } else {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'بيانات الدخول خاطئة',
            confirmButtonText: 'حسناً'
        });
    }
}

// تطبيق الشعار عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const savedLogo = getSavedLogo();
    const headerLogo = document.querySelector('.header-logo');
    if(headerLogo) headerLogo.src = savedLogo;
});
