// التبديل بين الشاشات
function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.querySelectorAll('.btn-nav').forEach(b => b.classList.remove('active'));
    
    const viewElement = document.getElementById('view-' + view);
    if(viewElement) viewElement.style.display = 'block';
    
    // تحديث الزر النشط
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
    // التحقق من الحقول المطلوبة
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

    // التحقق من الحقول الأساسية
    if(!name || !nid || !phone || !gov || !address || !job || !details) {
        return Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'برجاء ملء جميع البيانات المطلوبة',
            confirmButtonText: 'حسناً',
            background: '#161f32',
            color: '#fff'
        });
    }

    // التحقق من الرقم القومي
    if(nid.length !== 14) {
        return Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'الرقم القومي يجب أن يكون 14 رقم',
            confirmButtonText: 'حسناً',
            background: '#161f32',
            color: '#fff'
        });
    }

    // التحقق من رقم العضوية إذا كان عضو نقابة
    if (memberType === 'عضو نقابة' && !memberId) {
        return Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'برجاء إدخال رقم العضوية',
            confirmButtonText: 'حسناً',
            background: '#161f32',
            color: '#fff'
        });
    }

    try {
        // إنشاء رقم الطلب المتسلسل
        const refId = await generateRequestNumber(type);
        
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
            status: "تم الاستلام",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            tracking: [{
                status: "تم الاستلام",
                comment: "تم استلام طلبك بنجاح وجاري العرض على الإدارة",
                time: new Date().toLocaleString('ar-EG'),
                isFinal: false
            }]
        };

        await db.collection("Requests").doc(refId).set(data);
        
        // إنشاء كارت الطلب
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
            text: 'حدث خطأ في حفظ الطلب. برجاء المحاولة مرة أخرى',
            confirmButtonText: 'حسناً',
            background: '#161f32',
            color: '#fff'
        });
    }
}

// إنشاء كارت الطلب
async function generateRequestCard(data) {
    const now = new Date();
    const date = now.toLocaleDateString('ar-EG');
    const time = now.toLocaleTimeString('ar-EG');
    const logo = getSavedLogo();

    const cardHTML = `
        <div id="request-card" style="
            background: linear-gradient(135deg, #161f32, #0b1120);
            padding: 30px;
            border-radius: 20px;
            color: white;
            font-family: 'Cairo', sans-serif;
            max-width: 400px;
            margin: 0 auto;
            border: 2px solid #00d2ff;
            box-shadow: 0 0 50px rgba(0,210,255,0.3);
            position: relative;
            overflow: hidden;
        ">
            <div style="
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(0,210,255,0.1) 0%, transparent 70%);
                animation: rotate 20s linear infinite;
            "></div>
            
            <div style="text-align: center; margin-bottom: 20px; position: relative; z-index: 2;">
                <img src="${logo}" style="width: 100px; height: 100px; border-radius: 50%; border: 3px solid #00d2ff; box-shadow: 0 0 30px #00d2ff; margin-bottom: 10px;">
                <h2 style="margin: 5px 0; color: #00d2ff; text-shadow: 0 0 15px #00d2ff;">نقابة تكنولوجيا المعلومات والبرمجيات</h2>
                <p style="color: #94a3b8;">بوابة الشكاوي والمقترحات</p>
                <h3 style="color: white; margin: 5px 0;">النقيب العام</h3>
                <h4 style="color: var(--primary); margin: 5px 0;">المهندس / محمود جميل</h4>
            </div>

            <div style="
                background: rgba(0,210,255,0.1);
                padding: 20px;
                border-radius: 15px;
                margin: 20px 0;
                border: 1px solid rgba(0,210,255,0.3);
                position: relative;
                z-index: 2;
            ">
                <div style="display: grid; gap: 10px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #94a3b8;">رقم الطلب:</span>
                        <span style="color: #00d2ff; font-weight: bold; direction: ltr;">${data.refId}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #94a3b8;">نوع الطلب:</span>
                        <span style="color: ${data.type === 'شكوى' ? '#ff4757' : '#00ff88'}; font-weight: bold;">${data.type}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #94a3b8;">صاحب الطلب:</span>
                        <span style="color: white;">${data.name}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #94a3b8;">التاريخ:</span>
                        <span style="color: white;">${date}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #94a3b8;">الساعة:</span>
                        <span style="color: white;">${time}</span>
                    </div>
                </div>
            </div>

            <div style="text-align: center; position: relative; z-index: 2;">
                <div style="
                    width: 100%;
                    height: 4px;
                    background: linear-gradient(90deg, #00d2ff, #3a7bd5);
                    margin: 20px 0;
                    border-radius: 2px;
                "></div>
                <p style="color: #94a3b8; font-size: 12px;">هذا الكارت معتمد من نقابة تكنولوجيا المعلومات والبرمجيات</p>
                <p style="color: #00d2ff; font-size: 10px;">يمكنك متابعة طلبك عبر رقم الطلب</p>
            </div>
        </div>
    `;

    const { value: accept } = await Swal.fire({
        title: 'تم حفظ الطلب بنجاح',
        html: `
            <div style="margin: 10px 0; color: #00d2ff; font-size: 18px; direction: ltr;">
                <strong>${data.refId}</strong>
            </div>
            ${cardHTML}
        `,
        showCancelButton: true,
        confirmButtonText: 'تحميل الكارت',
        cancelButtonText: 'إغلاق',
        background: '#161f32',
        color: '#fff',
        width: '500px'
    });

    if(accept) {
        // تحميل الكارت كصورة
        const element = document.getElementById('request-card');
        if(element) {
            try {
                const canvas = await html2canvas(element, {
                    scale: 2,
                    backgroundColor: '#161f32'
                });
                const link = document.createElement('a');
                link.download = `طلب_${data.refId}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch(error) {
                console.error('Error generating image:', error);
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
            confirmButtonText: 'حسناً',
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
                confirmButtonText: 'حسناً',
                background: '#161f32',
                color: '#fff'
            });
        }
        
        renderTrack(snap.docs[0].data());
    } catch(error) {
        console.error("Error tracking request:", error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ في الاستعلام',
            confirmButtonText: 'حسناً',
            background: '#161f32',
            color: '#fff'
        });
    }
}

// عرض مسار الطلب
function renderTrack(d) {
    const stages = d.tracking.map(t => t.status);
    const currentStatus = d.status;
    const currentIdx = stages.indexOf(currentStatus);
    const pct = stages.length > 1 ? (currentIdx / (stages.length - 1)) * 100 : 100;

    let html = `
        <div class="card glass-effect" style="margin-top:20px;">
            <div class="card-glow"></div>
            
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
                <div style="
                    width: 50px;
                    height: 50px;
                    background: linear-gradient(135deg, var(--primary), var(--secondary));
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 0 30px var(--primary-glow);
                ">
                    <i class="fas fa-qrcode" style="color:white; font-size:24px;"></i>
                </div>
                <div>
                    <h4 style="color:var(--primary); font-size:18px; margin-bottom:5px; direction: ltr;">${d.refId}</h4>
                    <p style="color:var(--text-muted); font-size:12px;">${d.name}</p>
                </div>
            </div>

            <!-- التراك المائي -->
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

            <!-- المسار الزمني -->
            <div style="margin-top:40px;">
                <h4 style="margin-bottom:15px; display:flex; align-items:center; gap:10px;">
                    <i class="fas fa-history" style="color:var(--primary);"></i>
                    المسار الزمني للطلب
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
        </div>`;
    
    document.getElementById('track-result-box').innerHTML = html;
    document.getElementById('track-result-box').style.display = 'block';
    
    // تشغيل أنيميشن الماء
    setTimeout(() => {
        document.querySelector('.water-fill').style.transition = 'height 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
    }, 100);
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
            text: 'جاري تحويلك إلى لوحة التحكم...',
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
            confirmButtonText: 'حسناً',
            background: '#161f32',
            color: '#fff'
        });
    }
}

// تحديث الشعار عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const savedLogo = getSavedLogo();
    updateAllLogos(savedLogo);
    updateServicesButton();
    
    // تفعيل الوضع الليلي للـ SweetAlert
    const style = document.createElement('style');
    style.innerHTML = `
        .swal2-popup {
            background: #161f32 !important;
            color: white !important;
        }
        .swal2-title {
            color: #00d2ff !important;
        }
        .swal2-content {
            color: white !important;
        }
        .swal2-confirm {
            background: linear-gradient(135deg, #00d2ff, #3a7bd5) !important;
        }
        .swal2-cancel {
            background: #1e293b !important;
        }
    `;
    document.head.appendChild(style);
});
