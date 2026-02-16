const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function loadData(type) {
    document.getElementById('btn-comp').classList.toggle('active', type==='شكوى');
    document.getElementById('btn-sug').classList.toggle('active', type==='اقتراح');
    document.getElementById('v-title').innerText = "سجل " + (type==='شكوى'?'الشكاوى':'المقترحات');

    db.collection("Requests").onSnapshot(snap => {
        let docs = [];
        snap.forEach(d => {
            if(d.data().type === type) docs.push({id: d.id, ...d.data()});
        });
        
        // ترتيب يدوي لضمان الأحدث دائماً
        docs.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        let h = "";
        docs.forEach(d => {
            h += `<tr>
                <td>${d.refId}</td><td>${d.name}</td>
                <td style="color:#00d2ff">${d.status}</td>
                <td style="display:flex; gap:5px; justify-content:center;">
                    <button class="main-btn" onclick="openCard('${d.id}')" style="padding:5px; width:auto; font-size:11px;">فتح</button>
                    <button class="main-btn btn-red" onclick="deleteReq('${d.id}')" style="padding:5px; width:auto; font-size:11px;"><i class="fas fa-trash"></i></button>
                </td></tr>`;
        });
        document.getElementById('tbody').innerHTML = h || "<tr><td colspan='4'>لا توجد بيانات</td></tr>";
    });
}

async function openCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    
    // بناء التراك المائي داخل الكارت
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل"];
    let idx = stages.indexOf(d.status);
    if(idx == -1) idx = 1; if(d.status == "تم الحل") idx = 3;
    let trackHtml = `<div class="progress-container"><div class="progress-line"></div><div class="progress-fill" style="width:${(idx/3)*100}%"></div>
        ${stages.map((s,i)=>`<div class="step-node ${i<=idx?'active':''}"><i class="fas fa-check"></i><span>${s}</span></div>`).join('')}</div>`;

    Swal.fire({
        title: 'تفاصيل الطلب',
        background: '#0a1120', color: '#fff', width: '95%',
        html: `
            <div style="text-align:right; font-size:13px;">
                <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:10px;">
                    <p><b>مقدم الطلب:</b> ${d.name}</p>
                    <p><b>الرقم القومي:</b> ${d.nationalId}</p>
                    <p><b>الهاتف:</b> ${d.phone} | <b>المحافظة:</b> ${d.gov}</p>
                    <p><b>العنوان:</b> ${d.address}</p>
                    <p><b>التفاصيل:</b> ${d.details}</p>
                </div>
                ${trackHtml}
                <input id="new-stage" class="swal2-input" style="color:#000;" placeholder="اسم المرحلة التالية">
                <textarea id="admin-rep" class="swal2-textarea" style="color:#000; height:60px;" placeholder="رد الإدارة"></textarea>
                <button onclick="updateStep('${id}','تم الحل','تم معالجة الطلب')" style="background:#10b981; color:#fff; border:none; padding:10px; width:100%; border-radius:5px; margin-bottom:10px;">إغلاق الطلب نهائياً</button>
            </div>`,
        confirmButtonText: 'تحديث'
    }).then(r => {
        const s = document.getElementById('new-stage').value;
        const c = document.getElementById('admin-rep').value;
        if(r.isConfirmed && s) updateStep(id, s, c);
    });
}

async function updateStep(id, stage, comment) {
    await db.collection("Requests").doc(id).update({
        status: stage,
        tracking: firebase.firestore.FieldValue.arrayUnion({
            stage: stage, comment: comment || "تحديث إداري", date: new Date().toLocaleString('ar-EG')
        })
    });
    Swal.close();
}

async function deleteReq(id) {
    const { value: pass } = await Swal.fire({ title: 'باسورد الحذف', input: 'password' });
    if(pass === '11111@') {
        await db.collection("Requests").doc(id).delete();
        Swal.fire("تم الحذف","","success");
    } else if(pass) Swal.fire("خطأ","الباسورد غلط","error");
}

loadData('شكوى');
