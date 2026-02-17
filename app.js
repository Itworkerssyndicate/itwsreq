function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.querySelectorAll('.btn-nav').forEach(b => b.classList.remove('active'));
    document.getElementById('view-' + view).style.display = 'block';
    document.querySelectorAll('.btn-nav')[view === 'submit' ? 0 : view === 'track' ? 1 : 2].classList.add('active');
}

function toggleMemberField() {
    const type = document.getElementById('u-member-type').value;
    document.getElementById('member-id-box').style.display = type === 'عضو نقابة' ? 'block' : 'none';
    document.getElementById('u-req-type').innerHTML = type === 'عضو نقابة' 
        ? '<option value="شكوى">شكوى</option><option value="اقتراح">اقتراح</option>'
        : '<option value="اقتراح">اقتراح فقط</option>';
}

async function handleSubmit() {
    const fields = ['name', 'nid', 'phone', 'gov', 'address', 'job', 'details'];
    const data = {};
    fields.forEach(f => data[f] = document.getElementById(`u-${f}`).value.trim());
    
    if (fields.some(f => !data[f])) {
        return Swal.fire({ icon: 'error', title: 'خطأ', text: 'املأ جميع البيانات', background: '#161f32', color: '#fff' });
    }
    
    if (data.nid.length !== 14) {
        return Swal.fire({ icon: 'error', title: 'خطأ', text: 'الرقم القومي 14 رقم', background: '#161f32', color: '#fff' });
    }
    
    const memberType = document.getElementById('u-member-type').value;
    const memberId = document.getElementById('u-member-id').value.trim() || "غير عضو";
    
    if (memberType === 'عضو نقابة' && !memberId) {
        return Swal.fire({ icon: 'error', title: 'خطأ', text: 'أدخل رقم العضوية', background: '#161f32', color: '#fff' });
    }
    
    const type = document.getElementById('u-req-type').value;
    const refId = await generateRequestNumber(type);
    
    const requestData = {
        refId, ...data, type, memberType, memberId,
        status: type === 'شكوى' ? 'تم الاستلام' : 'لم يقرأ',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        tracking: [{
            status: type === 'شكوى' ? 'تم الاستلام' : 'لم يقرأ',
            comment: type === 'شكوى' ? 'تم استلام شكواك' : 'تم استلام اقتراحك',
            time: new Date().toLocaleString('ar-EG'),
            isFinal: false
        }]
    };
    
    await db.collection("Requests").doc(refId).set(requestData);
    await generateRequestCard(requestData);
    
    fields.forEach(f => document.getElementById(`u-${f}`).value = '');
    document.getElementById('u-member-id').value = '';
}

// دالة جديدة لإنشاء الكارت بطريقة مختلفة
async function generateRequestCard(data) {
    const logo = getSavedLogo();
    const now = new Date();
    const date = now.toLocaleDateString('ar-EG');
    const time = now.toLocaleTimeString('ar-EG');
    
    // إنشاء عنصر الكارت في الحاوية المخفية
    const container = document.getElementById('request-card-container');
    container.innerHTML = '';
    
    const card = document.createElement('div');
    card.style.cssText = `
        width: 480px;
        padding: 35px;
        background: linear-gradient(135deg, #161f32, #0b1120);
        border-radius: 30px;
        border: 4px solid #00d2ff;
        font-family: 'Tajawal', sans-serif;
        color: white;
        text-align: center;
        direction: rtl;
        box-shadow: 0 20px 40px rgba(0,210,255,0.4);
    `;
    
    card.innerHTML = `
        <div style="margin-bottom: 25px;">
            <img src="${logo}" style="width: 130px; height: 130px; border-radius: 50%; border: 4px solid #00d2ff; margin-bottom: 15px; object-fit: cover;">
            <h2 style="font-size: 26px; color: #00d2ff; margin: 5px 0; font-weight: 900;">نقابة تكنولوجيا المعلومات</h2>
            <h3 style="font-size: 20px; color: white; margin: 5px 0;">المهندس / محمود جميل</h3>
            <p style="color: #94a3b8; font-size: 16px;">النقيب العام</p>
        </div>
        
        <div style="background: rgba(0,210,255,0.1); padding: 20px; border-radius: 20px; margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="color: #94a3b8;">رقم الطلب :</span>
                <span style="color: #00d2ff; font-weight: 700; direction: ltr;">${data.refId}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="color: #94a3b8;">نوع الطلب :</span>
                <span style="color: ${data.type === 'شكوى' ? '#ff4757' : '#00ff88'};">${data.type}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="color: #94a3b8;">صاحب الطلب :</span>
                <span>${data.name}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="color: #94a3b8;">تاريخ التقديم :</span>
                <span>${date} - ${time}</span>
            </div>
        </div>
        
        <div style="color: #94a3b8; font-size: 14px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
            هذا الكارت معتمد من نقابة تكنولوجيا المعلومات والبرمجيات
        </div>
    `;
    
    container.appendChild(card);
    
    // تصدير الصورة
    const canvas = await html2canvas(card, {
        scale: 3,
        backgroundColor: '#161f32',
        logging: false,
        windowWidth: 500,
        windowHeight: 700
    });
    
    const result = await Swal.fire({
        title: 'تم حفظ الطلب',
        html: `<div style="color:#00d2ff; font-size:20px; margin-bottom:15px;">${data.refId}</div>`,
        imageUrl: canvas.toDataURL(),
        imageWidth: 400,
        imageHeight: canvas.height * 400 / canvas.width,
        showCancelButton: true,
        confirmButtonText: 'تحميل',
        cancelButtonText: 'إغلاق',
        background: '#161f32',
        color: '#fff'
    });
    
    if (result.isConfirmed) {
        const link = document.createElement('a');
        link.download = `طلب_${data.refId}.png`;
        link.href = canvas.toDataURL();
        link.click();
    }
    
    container.innerHTML = '';
}

async function handleTrack() {
    const nid = document.getElementById('q-nid').value.trim();
    const ref = document.getElementById('q-ref').value.trim();
    const type = document.getElementById('q-type').value;
    
    if (!nid || !ref) {
        return Swal.fire({ icon: 'error', title: 'خطأ', text: 'أدخل البيانات', background: '#161f32', color: '#fff' });
    }
    
    const snap = await db.collection("Requests")
        .where("nid", "==", nid)
        .where("refId", "==", ref)
        .where("type", "==", type)
        .get();
    
    if (snap.empty) {
        return Swal.fire({ icon: 'error', title: 'عذراً', text: 'لا يوجد طلب', background: '#161f32', color: '#fff' });
    }
    
    renderTrack(snap.docs[0].data());
}

function renderTrack(d) {
    const stages = [...d.tracking.map(t => t.status), "تم الإغلاق النهائي"];
    const currentIdx = stages.indexOf(d.status);
    const progress = stages.length > 0 ? (currentIdx / (stages.length - 1)) * 100 : 0;
    
    let html = `
        <div class="card" style="margin-top:15px;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                <div style="width:45px; height:45px; background:linear-gradient(135deg, var(--primary), var(--secondary)); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                    <i class="fas fa-qrcode" style="color:white; font-size:20px;"></i>
                </div>
                <div>
                    <h4 style="color:var(--primary);">${d.refId}</h4>
                    <p style="color:var(--text-muted);">${d.name}</p>
                </div>
            </div>
            
            <!-- التراك المائي - خط يتملى -->
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
                <h4 style="margin-bottom:10px;">المسار الزمني</h4>
                ${d.tracking.slice().reverse().map(t => `
                    <div class="timeline-card">
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
    const u = document.getElementById('adm-user').value;
    const p = document.getElementById('adm-pass').value;
    
    if (u === 'admin' && p === 'itws@2026') {
        localStorage.setItem('admin', 'true');
        Swal.fire({ icon: 'success', title: 'مرحباً', timer: 1500, showConfirm: false, background: '#161f32', color: '#fff' })
            .then(() => window.location.href = 'admin.html');
    } else {
        Swal.fire({ icon: 'error', title: 'خطأ', text: 'بيانات خاطئة', background: '#161f32', color: '#fff' });
    }
}
