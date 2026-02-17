function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.querySelectorAll('.btn-nav').forEach(b => b.classList.remove('active'));
    document.getElementById('view-' + view).style.display = 'block';
    const buttons = document.querySelectorAll('.btn-nav');
    if (view === 'submit') buttons[0].classList.add('active');
    else if (view === 'track') buttons[1].classList.add('active');
    else if (view === 'admin-login') buttons[2].classList.add('active');
}

function toggleMemberField() {
    const type = document.getElementById('u-member-type').value;
    const mBox = document.getElementById('member-id-box');
    const typeSelect = document.getElementById('u-req-type');
    
    if (type === 'عضو نقابة') {
        mBox.style.display = 'block';
        typeSelect.innerHTML = '<option value="شكوى">شكوى</option><option value="اقتراح">اقتراح</option>';
    } else {
        mBox.style.display = 'none';
        typeSelect.innerHTML = '<option value="اقتراح">اقتراح فقط</option>';
    }
}

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

    if (!name || !nid || !phone || !gov || !address || !job || !details) {
        return Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'برجاء ملء جميع البيانات المطلوبة',
            background: '#161f32',
            color: '#fff'
        });
    }

    if (nid.length !== 14) {
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
        
        document.getElementById('u-name').value = '';
        document.getElementById('u-nid').value = '';
        document.getElementById('u-phone').value = '';
        document.getElementById('u-address').value = '';
        document.getElementById('u-job').value = '';
        document.getElementById('u-details').value = '';
        document.getElementById('u-member-id').value = '';
        
    } catch (error) {
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

// دالة تنسيق النص مع مسافات واضحة
function formatTextForCard(text) {
    if (!text) return '';
    // إضافة مسافات بين الكلمات وتنظيف النص
    return text.replace(/\s+/g, ' ').trim();
}

// دالة إنشاء الكارت مع حل مشكلة الحروف
async function generateRequestCard(data) {
    const logo = getSavedLogo();
    const now = new Date();
    const date = now.toLocaleDateString('ar-EG');
    const time = now.toLocaleTimeString('ar-EG');
    
    const container = document.getElementById('request-card-container');
    container.innerHTML = '';
    
    // إنشاء عنصر الكارت بخصائص محسنة للخطوط
    const card = document.createElement('div');
    card.style.cssText = `
        width: 550px;
        padding: 45px;
        background: linear-gradient(135deg, #161f32, #0b1120);
        border-radius: 35px;
        border: 4px solid #00d2ff;
        font-family: 'Tajawal', 'Cairo', sans-serif;
        color: white;
        text-align: center;
        direction: rtl;
        box-shadow: 0 20px 40px rgba(0,210,255,0.4);
        line-height: 2.2;
        letter-spacing: 0.8px;
        word-spacing: 6px;
    `;
    
    // تحسين عرض الصورة
    const logoImg = document.createElement('img');
    logoImg.src = logo;
    logoImg.style.cssText = 'width: 140px; height: 140px; border-radius: 50%; border: 4px solid #00d2ff; margin-bottom: 20px; object-fit: cover; display: block; margin-left: auto; margin-right: auto; box-shadow: 0 0 30px #00d2ff;';
    
    // محتوى الكارت بخطوط محسنة ومسافات واضحة
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'font-family: \'Tajawal\', sans-serif;';
    contentDiv.innerHTML = `
        <h2 style="font-size: 30px; color: #00d2ff; margin: 10px 0; font-weight: 900; letter-spacing: 1.5px; word-spacing: 8px; line-height: 1.6;">نقابة تكنولوجيا المعلومات والبرمجيات</h2>
        <h3 style="font-size: 24px; color: white; margin: 8px 0; font-weight: 700; letter-spacing: 1px; word-spacing: 6px;">المهندس / محمود جميل</h3>
        <p style="color: #94a3b8; font-size: 20px; margin-bottom: 25px; word-spacing: 5px;">النقيب العام</p>
        
        <div style="background: rgba(0,210,255,0.15); padding: 25px; border-radius: 25px; margin: 25px 0; border: 1px solid rgba(0,210,255,0.3);">
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 2px solid rgba(255,255,255,0.15); font-size: 18px;">
                <span style="color: #94a3b8; font-weight: 600;">رقم الطلب :</span>
                <span style="color: #00d2ff; font-weight: 700; direction: ltr; letter-spacing: 2px;">${data.refId}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 2px solid rgba(255,255,255,0.15); font-size: 18px;">
                <span style="color: #94a3b8; font-weight: 600;">نوع الطلب :</span>
                <span style="color: ${data.type === 'شكوى' ? '#ff4757' : '#00ff88'}; font-weight: 700;">${data.type}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 2px solid rgba(255,255,255,0.15); font-size: 18px;">
                <span style="color: #94a3b8; font-weight: 600;">صاحب الطلب :</span>
                <span style="font-weight: 600;">${formatTextForCard(data.name)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 18px;">
                <span style="color: #94a3b8; font-weight: 600;">تاريخ التقديم :</span>
                <span style="font-weight: 600;">${date} - ${time}</span>
            </div>
        </div>
        
        <div style="color: #94a3b8; font-size: 16px; padding-top: 20px; border-top: 2px solid rgba(255,255,255,0.15); margin-top: 20px; word-spacing: 4px;">
            هذا الكارت معتمد من نقابة تكنولوجيا المعلومات والبرمجيات
        </div>
    `;
    
    card.appendChild(logoImg);
    card.appendChild(contentDiv);
    container.appendChild(card);
    
    // دالة تصوير الكارت بجودة عالية
    const captureCard = async () => {
        try {
            const canvas = await html2canvas(card, {
                scale: 4,
                backgroundColor: '#161f32',
                logging: false,
                windowWidth: 600,
                windowHeight: 800,
                allowTaint: true,
                useCORS: true,
                letterRendering: true,
                foreignObjectRendering: false,
                onclone: (clonedDoc, element) => {
                    // تحسين الخطوط في النسخة المستنسخة
                    const style = clonedDoc.createElement('style');
                    style.innerHTML = `
                        * { 
                            font-family: 'Tajawal', 'Cairo', sans-serif !important;
                            letter-spacing: 0.8px !important;
                            word-spacing: 6px !important;
                            line-height: 2.2 !important;
                        }
                    `;
                    clonedDoc.head.appendChild(style);
                }
            });
            
            const result = await Swal.fire({
                title: 'تم حفظ الطلب',
                html: `<div style="color:#00d2ff; font-size:20px; margin-bottom:15px; letter-spacing:2px;">${data.refId}</div>`,
                imageUrl: canvas.toDataURL('image/png'),
                imageWidth: 450,
                imageHeight: canvas.height * 450 / canvas.width,
                showCancelButton: true,
                confirmButtonText: 'تحميل',
                cancelButtonText: 'إغلاق',
                background: '#161f32',
                color: '#fff',
                allowOutsideClick: false
            });
            
            if (result.isConfirmed) {
                const link = document.createElement('a');
                link.download = `طلب_${data.refId}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
        } catch (error) {
            console.error('Error capturing card:', error);
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'حدث خطأ في إنشاء الكارت',
                background: '#161f32',
                color: '#fff'
            });
        }
        container.innerHTML = '';
    };
    
    // انتظار تحميل الصورة
    if (logoImg.complete) {
        captureCard();
    } else {
        logoImg.onload = captureCard;
        logoImg.onerror = () => {
            logoImg.src = 'https://via.placeholder.com/140x140?text=Logo';
            setTimeout(captureCard, 100);
        };
    }
}

async function handleTrack() {
    const nid = document.getElementById('q-nid').value.trim();
    const ref = document.getElementById('q-ref').value.trim();
    const type = document.getElementById('q-type').value;

    if (!nid || !ref) {
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

        if (snap.empty) {
            return Swal.fire({
                icon: 'error',
                title: 'عذراً',
                text: 'لا يوجد طلب بهذه البيانات',
                background: '#161f32',
                color: '#fff'
            });
        }
        
        renderTrack(snap.docs[0].data());
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ في الاستعلام',
            background: '#161f32',
            color: '#fff'
        });
    }
}

function renderTrack(d) {
    const stages = [...d.tracking.map(t => t.status), "تم الإغلاق النهائي"];
    const currentIdx = stages.indexOf(d.status);
    const progress = stages.length > 0 ? (currentIdx / (stages.length - 1)) * 100 : 0;
    
    let html = `
        <div class="card glass-effect" style="margin-top:15px;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                <div style="width:45px; height:45px; background:linear-gradient(135deg, var(--primary), var(--secondary)); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                    <i class="fas fa-qrcode" style="color:white; font-size:20px;"></i>
                </div>
                <div>
                    <h4 style="color:var(--primary);">${d.refId}</h4>
                    <p style="color:var(--text-muted);">${d.name}</p>
                </div>
            </div>
            
            <div class="track-container">
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
            
            <div style="margin-top:30px;">
                <h4 style="margin-bottom:10px;"><i class="fas fa-history"></i> المسار الزمني</h4>
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
        </div>
    `;
    
    document.getElementById('track-result-box').innerHTML = html;
    document.getElementById('track-result-box').style.display = 'block';
}

function adminLogin() {
    const username = document.getElementById('adm-user').value;
    const password = document.getElementById('adm-pass').value;
    
    if (username === 'admin' && password === 'itws@2026') {
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
