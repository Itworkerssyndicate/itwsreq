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

// دالة تنسيق النص
function formatTextForCard(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
}

// دالة إنشاء الكارت مع أحجام خطوط مناسبة لمنع النزول لتحت
async function generateRequestCard(data) {
    const logo = getSavedLogo();
    const now = new Date();
    const date = now.toLocaleDateString('ar-EG');
    const time = now.toLocaleTimeString('ar-EG');
    
    const container = document.getElementById('request-card-container');
    container.innerHTML = '';
    
    // إنشاء الكارت بخطوط مناسبة
    const card = document.createElement('div');
    card.style.cssText = `
        width: 600px;
        padding: 35px;
        background: linear-gradient(135deg, #161f32, #0b1120);
        border-radius: 35px;
        border: 5px solid #00d2ff;
        font-family: 'Tajawal', 'Cairo', sans-serif;
        color: white;
        text-align: center;
        direction: rtl;
        box-shadow: 0 30px 50px rgba(0,210,255,0.5);
    `;
    
    // اللوجو بحجم مناسب
    const logoImg = document.createElement('img');
    logoImg.src = logo;
    logoImg.style.cssText = 'width: 110px; height: 110px; border-radius: 50%; border: 4px solid #00d2ff; margin-bottom: 15px; object-fit: cover; display: block; margin-left: auto; margin-right: auto; box-shadow: 0 0 30px #00d2ff;';
    
    // محتوى الكارت مع أحجام خطوط مناسبة
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = `
        <h2 style="font-size: 24px; color: #00d2ff; margin: 8px 0; font-weight: 900; line-height: 1.3;">نقابة تكنولوجيا المعلومات والبرمجيات</h2>
        <h3 style="font-size: 20px; color: white; margin: 5px 0; font-weight: 700;">المهندس / محمود جميل</h3>
        <p style="color: #94a3b8; font-size: 16px; margin-bottom: 20px;">النقيب العام</p>
        
        <div style="background: rgba(0,210,255,0.15); padding: 18px; border-radius: 20px; margin: 15px 0; border: 2px solid rgba(0,210,255,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="color: #94a3b8; font-weight: 600; font-size: 15px; white-space: nowrap;">رقم الطلب :</span>
                <span style="color: #00d2ff; font-weight: 700; direction: ltr; font-size: 16px; margin-right: 10px; white-space: nowrap;">${data.refId}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="color: #94a3b8; font-weight: 600; font-size: 15px; white-space: nowrap;">نوع الطلب :</span>
                <span style="color: ${data.type === 'شكوى' ? '#ff4757' : '#00ff88'}; font-weight: 700; font-size: 16px; margin-right: 10px; white-space: nowrap;">${data.type}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="color: #94a3b8; font-weight: 600; font-size: 15px; white-space: nowrap;">اسم مقدم الطلب :</span>
                <span style="font-weight: 600; font-size: 16px; margin-right: 10px; white-space: nowrap;">${data.name}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0;">
                <span style="color: #94a3b8; font-weight: 600; font-size: 15px; white-space: nowrap;">تاريخ التقديم :</span>
                <span style="font-weight: 600; font-size: 16px; margin-right: 10px; white-space: nowrap;">${date} - ${time}</span>
            </div>
        </div>
        
        <div style="color: #94a3b8; font-size: 13px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 10px;">
            هذا الكارت معتمد من نقابة تكنولوجيا المعلومات والبرمجيات
        </div>
    `;
    
    card.appendChild(logoImg);
    card.appendChild(contentDiv);
    container.appendChild(card);
    
    // دالة تصوير الكارت باستخدام dom-to-image
    const captureCard = async () => {
        try {
            const dataUrl = await domtoimage.toPng(card, {
                quality: 1,
                bgcolor: '#161f32',
                width: 600,
                height: card.offsetHeight,
                style: {
                    'font-family': 'Tajawal, Cairo, sans-serif'
                }
            });
            
            const result = await Swal.fire({
                title: 'تم حفظ الطلب',
                html: `<div style="color:#00d2ff; font-size:18px; margin-bottom:15px;">${data.refId}</div>`,
                imageUrl: dataUrl,
                imageWidth: 500,
                imageHeight: card.offsetHeight * 500 / 600,
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
                link.href = dataUrl;
                link.click();
            }
        } catch (error) {
            console.error('Error capturing card:', error);
            try {
                const canvas = await html2canvas(card, {
                    scale: 3,
                    backgroundColor: '#161f32',
                    logging: false,
                    allowTaint: true,
                    useCORS: true
                });
                
                const result = await Swal.fire({
                    title: 'تم حفظ الطلب',
                    html: `<div style="color:#00d2ff; font-size:18px; margin-bottom:15px;">${data.refId}</div>`,
                    imageUrl: canvas.toDataURL('image/png'),
                    imageWidth: 500,
                    imageHeight: canvas.height * 500 / canvas.width,
                    showCancelButton: true,
                    confirmButtonText: 'تحميل',
                    cancelButtonText: 'إغلاق',
                    background: '#161f32',
                    color: '#fff'
                });
                
                if (result.isConfirmed) {
                    const link = document.createElement('a');
                    link.download = `طلب_${data.refId}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                }
            } catch (fallbackError) {
                Swal.fire({
                    icon: 'error',
                    title: 'خطأ',
                    text: 'حدث خطأ في إنشاء الكارت',
                    background: '#161f32',
                    color: '#fff'
                });
            }
        }
        container.innerHTML = '';
    };
    
    if (logoImg.complete) {
        captureCard();
    } else {
        logoImg.onload = captureCard;
        logoImg.onerror = () => {
            logoImg.src = 'https://via.placeholder.com/110x110?text=Logo';
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
