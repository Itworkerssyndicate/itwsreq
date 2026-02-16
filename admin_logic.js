const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function loadData(type) {
    document.getElementById('btn-comp').classList.toggle('active', type=='شكوى');
    document.getElementById('btn-sug').classList.toggle('active', type=='اقتراح');
    document.getElementById('v-title').innerText = "سجل " + (type=='شكوى'?'الشكاوى':'المقترحات');

    db.collection("Requests").onSnapshot(snap => {
        let docs = [];
        snap.forEach(d => { docs.push({id: d.id, ...d.data()}) });
        // فرز يدوي لضمان الأحدث دوماً بدون الحاجة لفهرس (Indexes)
        docs.sort((a,b) => b.createdAt.seconds - a.createdAt.seconds);

        let h = "";
        docs.forEach(d => {
            h += `<tr>
                <td>${d.refId}</td><td>${d.name}</td><td>${d.nationalId}</td>
                <td><b style="color:#00d2ff">${d.status}</b></td>
                <td style="display:flex; gap:5px; justify-content:center;">
                    <button class="main-btn" onclick="openCard('${d.id}')" style="padding:6px; width:auto; font-size:10px;">فتح</button>
                    <button class="main-btn" onclick="deleteReq('${d.id}')" style="padding:6px; width:auto; font-size:10px; background:#ef4444;"><i class="fas fa-trash"></i></button>
                </td></tr>`;
        });
        document.getElementById('tbody').innerHTML = h || "<tr><td colspan='5'>لا توجد بيانات</td></tr>";
    });
}

async function openCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    
    // إنشاء التراك المائي داخل الكارت
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل"];
    let idx = stages.indexOf(d.status);
    if(idx == -1) idx = 1; if(d.status == "تم الحل") idx = 3;
    let trackLine = `<div class="progress-container"><div class="progress-line"></div><div class="progress-fill" style="width:${(idx/3)*100}%"></div>
        ${stages.map((s,i)=>`<div class="step-node ${i<=idx?'active':''}"><i class="fas fa-check"></i><span>${s}</span></div>`).join('')}</div>`;

    let logs = d.tracking.map(t => `<div class="log-card"><b>${t.stage}</b>${t.comment}<br><small>${t.date}</small></div>`).reverse().join('');

    Swal.fire({
        title: 'تفاصيل الطلب والتتبع',
        background: '#0a1120', color: '#fff', width: '95%',
        html: `
            <div style="text-align:right; font-size:12px;">
                <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:10px; margin-bottom:10px;">
                    <p><b>مقدم الطلب:</b> ${d.name}</p>
                    <p><b>الرقم القومي:</b> ${d.nationalId}</p>
                    <p><b>رقم الهاتف:</b> ${d.phone}</p>
                    <p><b>المحافظة:</b> ${d.gov} | <b>العنوان:</b> ${d.address}</p>
                    <p><b>الموضوع:</b> ${d.details}</p>
                </div>
                ${trackLine}
                <hr style="opacity:0.1; margin:15px 0;">
                <input id="new-stage" class="swal2-input" style="color:#000;" placeholder="المرحلة التالية (مثلاً: جاري الفحص)">
                <textarea id="admin-rep" class="swal2-textarea" style="color:#000; height:60px;" placeholder="رد الإدارة"></textarea>
                <button onclick="updateStep('${id}','تم الحل','تمت المعالجة بنجاح')" style="background:#10b981; color:#fff; border:none; padding:10px; width:100%; border-radius:5px; margin-bottom:15px; cursor:pointer;">إغلاق الطلب نهائياً</button>
                <div style="max-height:120px; overflow-y:auto;">${logs}</div>
            </div>`,
        confirmButtonText: 'تحديث المسار'
    }).then(r => {
        const stage = document.getElementById('new-stage').value;
        const comment = document.getElementById('admin-rep').value;
        if(r.isConfirmed && stage) updateStep(id, stage, comment);
    });
}

async function updateStep(id, stage, comment) {
    await db.collection("Requests").doc(id).update({
        status: stage,
        tracking: firebase.firestore.FieldValue.arrayUnion({
            stage: stage, comment: comment || "تحديث إداري", date: new Date().toLocaleString('ar-EG')
        })
    });
    Swal.fire("تم التحديث","","success");
}

async function deleteReq(id) {
    const { value: pass } = await Swal.fire({ title: 'كلمة سر الحذف', input: 'password', inputPlaceholder: 'الباسورد' });
    if(pass === '11111@') {
        await db.collection("Requests").doc(id).delete();
        Swal.fire("تم الحذف","تم مسح الطلب نهائياً","success");
    } else if(pass) {
        Swal.fire("خطأ","كلمة السر غير صحيحة","error");
    }
}

loadData('شكوى');
