// التبديل بين الشاشات
function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.querySelectorAll('.btn-nav').forEach(b => b.classList.remove('active'));
    
    const viewElement = document.getElementById('view-' + view);
    if(viewElement) viewElement.style.display = 'block';
    
    const buttons = document.querySelectorAll('.btn-nav');
    if(view === 'submit') buttons[0].classList.add('active');
    else if(view === 'track') buttons[1].classList.add('active');
    else if(view === 'admin-login') buttons[2].classList.add('active');
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
    const name = document.getElementById('u-name').value.trim();
    const nid = document.getElementById('u-nid').value.trim();
    const phone = document.getElementById('u-phone').value.trim();
    const gov = document.getElementById('u-gov').value;
    const address = document.getElementById('u-address').value.trim();
    const job = document.getElementById('u-job').value.trim();
    const type = document.getElementById('u-req-type').value;
    const details = document.getElementById('u-details').value.trim();
    const memberType = document.getElementById('u-member-type').value;
    const memberId = document.getElementById('u-member-id').value.trim() || "غير عضو";

    if(!name || !nid || !phone || !gov || !address || !job || !details) {
        return Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'برجاء ملء جميع البيانات المطلوبة',
            background: '#161f32',
            color: '#fff'
        });
    }

    if(nid.length !== 14) {
        return Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'الرقم القومي يجب أن يكون 14 رقم',
            background: '#161f32',
            color: '#fff'
        });
    }

    if (memberType === 'عضو نقابة' && !memberId) {
        return Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'برجاء إدخال رقم العضوية',
            background: '#161f32',
            color: '#fff'
        });
    }

    try {
        const refId = await generateRequestNumber(type);
        
        // تحديد الحالة الابتدائية حسب نوع الطلب
        let initialStatus = "تم الاستلام";
        if (type === 'اقتراح') {
            initialStatus = "لم يقرأ";
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
            memberType,
            memberId,
            status: initialStatus,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            tracking: [{
                status: initialStatus,
                comment: type === 'شكوى' ? "تم استلام شكواك بنجاح" : "تم استلام اقتراحك بنجاح",
                time: new Date().toLocaleString('ar-EG'),
                isFinal: false
            }]
        };

        await db.collection("Requests").doc(refId).set(data);
        
        await generateRequestCard(data);
        
        // مسح الحقول
        document.getElementById('u-name').value = '';
        document.getElementById('u-nid').value = '';
        document.getElementById('u-phone').value = '';
        document.getElementById('u-address').value = '';
        document.getElementById('u-job').value = '';
        document.getElementById('u-details').value = '';
        document.getElementById('u-member-id').value = '';
        
    } catch(error) {
        console.error("Error submitting request:", error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ في حفظ الطلب',
            background: '#161f32',
            color: '#fff'
        });
    }
}

// تنسيق النص مع مسافات
function formatText(text) {
    if (!text) return '';
    // إضافة مسافات بين الكلمات وتنظيف النص
    return text.replace(/\s+/g, ' ').trim();
}

// إنشاء كارت الطلب (بدون حالة)
async function generateRequestCard(data) {
    const now = new Date();
    const date = now.toLocaleDateString('ar-EG');
    const time = now.toLocaleTimeString('ar-EG');
    const logo = getSavedLogo();

    const cardHTML = `
        <div id="request-card" style="
            background: linear-gradient(135deg, #161f32, #0b1120);
            padding: 30px 25px;
            border-radius: 20px;
            color: white;
            font-family: 'Tajawal', 'Cairo', sans-serif;
            max-width: 400px;
            margin: 0 auto;
            border: 2px solid #00d2ff;
            direction: rtl;
            box-shadow: 0 10px 30px rgba(0,210,255,0.3);
        ">
            <div style="text-align: center; margin-bottom: 25px;">
                <img src="${logo}" style="width: 110px; height: 110px; border-radius: 50%; border: 3px solid #00d2ff; margin-bottom: 15px; box-shadow: 0 0 30px #00d2ff;">
                <h2 style="font-size: 24px; color: #00d2ff; margin-bottom: 8px; font-weight: 900; letter-spacing: 1.5px; word-spacing: 6px;">نقابة تكنولوجيا المعلومات والبرمجيات</h2>
                <h3 style="font-size: 20px; color: white; margin-bottom: 5px; font-weight: 700; letter-spacing: 0.5px; word-spacing: 4px;">المهندس / محمود جميل</h3>
                <p style="color: #94a3b8; font-size: 16px; word-spacing: 3px;">النقيب العام</p>
            </div>

            <div style="background: rgba(0,210,255,0.1); padding: 20px; border-radius: 15px; margin: 20px 0; border: 1px solid rgba(0,210,255,0.3);">
                <div style="font-size: 16px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span style="color: #94a3b8; font-weight: 600;">رقم الطلب :</span> 
                    <span style="color: #00d2ff; font-weight: 700; direction: ltr; letter-spacing: 2px;">${data.refId}</span>
                </div>
                <div style="font-size: 16px; margin-bottom: 15px; display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span style="color: #94a3b8; font-weight: 600;">نوع الطلب :</span> 
                    <span style="color: ${data.type === 'شكوى' ? '#ff4757' : '#00ff88'}; font-weight: 700; word-spacing: 3px;">${data.type}</span>
                </div>
                <div style="font-size: 16px; margin-bottom: 15px; display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span style="color: #94a3b8; font-weight: 600;">صاحب الطلب :</span> 
                    <span style="color: white; font-weight: 600; word-spacing: 4px;">${formatText(data.name)}</span>
                </div>
                <div style="font-size: 16px; margin-bottom: 15px; display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span style="color: #94a3b8; font-weight: 600;">رقم العضوية :</span> 
                    <span style="color: white; font-weight: 600; word-spacing: 3px;">${data.memberId !== 'غير عضو' ? data.memberId : 'غير عضو'}</span>
                </div>
                <div style="font-size: 16px; display: flex; justify-content: space-between; padding: 5px 0;">
                    <span style="color: #94a3b8; font-weight: 600;">تاريخ التقديم :</span> 
                    <span style="color: white; font-weight: 600; word-spacing: 3px;">${date} - ${time}</span>
                </div>
            </div>

            <div style="text-align: center; font-size: 14px; color: #94a3b8; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 15px; word-spacing: 3px;">
                هذا الكارت معتمد من نقابة تكنولوجيا المعلومات والبرمجيات
            </div>
        </div>
    `;

    const result = await Swal.fire({
        title: 'تم حفظ الطلب بنجاح',
        html: `<div style="color:#00d2ff; margin-bottom:20px; font-size:20px; direction:ltr; font-weight:700; letter-spacing:2px;">${data.refId}</div>${cardHTML}`,
        showCancelButton: true,
        confirmButtonText: 'تحميل الكارت',
        cancelButtonText: 'إغلاق',
        background: '#161f32',
        color: '#fff',
        width: '480px',
        allowOutsideClick: false,
        allowEscapeKey: false
    });

    if(result.isConfirmed) {
        const element = document.getElementById('request-card');
        if(element) {
            try {
                const canvas = await html2canvas(element, {
                    scale: 2,
                    backgroundColor: '#161f32',
                    logging: false,
                    allowTaint: true,
                    useCORS: true
                });
                const link = document.createElement('a');
                link.download = `طلب_${data.refId}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch(error) {
                console.error('Error generating image:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'خطأ',
                    text: 'حدث خطأ في تحميل الكارت',
                    background: '#161f32',
                    color: '#fff'
                });
            }
        }
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
            background: '#161f32',
            color: '#fff'
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
                background: '#161f32',
                color: '#fff'
            });
        }
        
        renderTrack(snap.docs[0].data());
    } catch(error) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ في الاستعلام',
            background: '#161f32',
            color: '#fff'
        });
    }
}

// عرض مسار الطلب
function renderTrack(d) {
    const stages = d.tracking.map(t => t.status);
    const finalStage = "تم الإغلاق النهائي";
    const allStages = [...stages, finalStage];
    const currentStatus = d.status;
    const currentIdx = allStages.indexOf(currentStatus);
    // من اليمين للشمال: نبدأ من 0% عند أول مرحلة وصولاً لـ 100% عند آخر مرحلة
    const progressPercent = allStages.length > 0 ? (currentIdx / (allStages.length - 1)) * 100 : 0;

    let html = `
        <div class="card glass-effect" style="margin-top:15px;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                <div style="width:40px; height:40px; background:linear-gradient(135deg, var(--primary), var(--secondary)); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                    <i class="fas fa-qrcode" style="color:white; font-size:18px;"></i>
                </div>
                <div>
                    <h4 style="color:var(--primary); font-size:14px; direction:ltr; letter-spacing:1px;">${d.refId}</h4>
                    <p style="color:var(--text-muted); font-size:11px; word-spacing:2px;">${formatText(d.name)}</p>
                </div>
            </div>

            <!-- التراك المائي الأفقي من اليمين للشمال -->
            <div class="track-container">
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

            <div style="margin-top:30px;">
                <h4 style="font-size:13px; margin-bottom:10px;"><i class="fas fa-history"></i> المسار الزمني</h4>
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
        </div>`;
    
    document.getElementById('track-result-box').innerHTML = html;
    document.getElementById('track-result-box').style.display = 'block';
}

// دخول الادمن
function adminLogin() {
    const username = document.getElementById('adm-user').value;
    const password = document.getElementById('adm-pass').value;
    
    if(username === 'admin' && password === 'itws@2026') {
        localStorage.setItem('admin', 'true');
        Swal.fire({
            icon: 'success',
            title: 'مرحباً بك',
            timer: 1500,
            showConfirmButton: false,
            background: '#161f32',
            color: '#fff'
        }).then(() => {
            window.location.href = 'admin.html';
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'بيانات الدخول خاطئة',
            background: '#161f32',
            color: '#fff'
        });
    }
}

// تطبيق الشعار عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    const savedLogo = getSavedLogo();
    updateAllLogos(savedLogo);
    updateServicesButton();
});
