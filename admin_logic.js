const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
let allData = [];

function loadView(viewType, btn) {
    document.querySelectorAll('.side-item').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    
    db.collection("Requests").orderBy("createdAt", "desc").onSnapshot(snap => {
        allData = [];
        snap.forEach(doc => {
            const d = doc.data();
            if(viewType === 'all' || d.type === viewType) allData.push({id: doc.id, ...d});
        });
        filterTable();
    });
}

function renderTable(data) {
    let h = "";
    data.forEach(d => {
        h += `<tr>
            <td><small>${d.createdAt?.toDate().toLocaleDateString('ar-EG') || '---'}</small></td>
            <td><b>${d.refId || '---'}</b></td>
            <td>${d.name || 'مجهول'}<br><small>${d.isMember || 'غير عضو'} | ${d.memberId || 'لا يوجد'}</small></td>
            <td>${d.type || '---'}</td>
            <td><span class="badge-status">${d.status || 'معلق'}</span></td>
            <td>
                <button class="act-btn" onclick="openAdminCard('${d.id}')">إدارة</button>
                <button class="del-btn" onclick="deleteReq('${d.id}')">حذف</button>
            </td>
        </tr>`;
    });
    document.getElementById('tbody').innerHTML = h || "<tr><td colspan='6'>لا توجد بيانات متاحة</td></tr>";
}

async function openAdminCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل والإغلاق"];
    const idx = stages.indexOf(d.status);

    Swal.fire({
        title: 'إدارة الطلب والمسار الزمني',
        width: '900px', background: '#0f172a', color: '#fff',
        html: `
            <div class="admin-modal">
                <div class="info-grid">
                    <p>👤 <b>الاسم:</b> ${d.name}</p> <p>📞 <b>الهاتف:</b> ${d.phone}</p>
                    <p>🆔 <b>القومي:</b> ${d.nationalId}</p> <p>📍 <b>المحافظة:</b> ${d.gov}</p>
                    <p>🏗️ <b>المهنة:</b> ${d.job}</p> <p>🎖️ <b>العضوية:</b> ${d.memberId}</p>
                </div>
                <div class="water-track">
                    <div class="track-line"><div class="track-fill" style="width: ${(idx/3)*100}%"></div></div>
                    ${stages.map((s,i) => `<div class="track-node ${i<=idx?'done':''}" style="right:${(i/3)*100}%"><span>${s}</span></div>`).join('')}
                </div>
                <div class="logs-container">
                    ${d.tracking?.map(t => `<div class="log-box"><b>${t.stage}</b> - ${t.date}<br><small>${t.comment}</small></div>`).reverse().join('') || 'لا توجد سجلات'}
                </div>
                <div class="update-form">
                    <input id="n-stage" class="swal2-input" placeholder="اسم المرحلة الجديدة">
                    <textarea id="n-comm" class="swal2-textarea" placeholder="الرد أو التعليق الإداري..."></textarea>
                    <button class="exit-btn" style="width:100%; margin-top:10px;" onclick="updateStat('${id}', 'تم الحل والإغلاق', 'تم إنهاء الطلب بنجاح')">🔒 إغلاق الطلب نهائياً</button>
                </div>
            </div>`,
        showConfirmButton: true, confirmButtonText: 'تحديث الحالة الآن'
    }).then(r => {
        if(r.isConfirmed) updateStat(id, document.getElementById('n-stage').value, document.getElementById('n-comm').value);
    });
}

async function updateStat(id, stage, comm) {
    if(!stage) return;
    await db.collection("Requests").doc(id).update({
        status: stage,
        tracking: firebase.firestore.FieldValue.arrayUnion({
            stage: stage, comment: comm || "تحديث إداري", date: new Date().toLocaleString('ar-EG')
        })
    });
    Swal.fire("نجاح", "تم تحديث مسار الطلب", "success");
}

async function deleteReq(id) {
    const r = await Swal.fire({ title: 'هل أنت متأكد؟', text: "لن تتمكن من استعادة البيانات!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ff0055' });
    if(r.isConfirmed) {
        await db.collection("Requests").doc(id).delete();
        Swal.fire("حذف", "تم مسح الطلب من السجل", "success");
    }
}

function showSettings() {
    Swal.fire({
        title: 'إعدادات المنظومة',
        html: `<input id="s-p" class="swal2-input" placeholder="اسم النقيب"><input id="s-l" class="swal2-input" placeholder="رابط الخدمات">`,
        confirmButtonText: 'حفظ التغييرات'
    }).then(r => {
        if(r.isConfirmed) {
            db.collection("SystemSettings").doc("mainConfig").update({
                presidentName: document.getElementById('s-p').value,
                servicesLink: document.getElementById('s-l').value
            });
        }
    });
}

loadView('all');
