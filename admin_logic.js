const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function loadData(type) {
    document.getElementById('v-title').innerText = "سجل " + (type === 'شكوى' ? 'الشكاوى' : 'المقترحات');
    db.collection("Requests").where("type","==",type).onSnapshot(snap => {
        let h = "";
        snap.forEach(doc => {
            const d = doc.data();
            h += `<tr>
                <td>${d.refId}</td><td>${d.name}</td><td>${d.status}</td>
                <td style="display:flex; gap:5px; justify-content:center;">
                    <button class="main-btn" style="padding:5px;" onclick="openCard('${doc.id}')">فتح</button>
                    <button class="main-btn btn-red" style="padding:5px;" onclick="deleteReq('${doc.id}')">حذف</button>
                </td></tr>`;
        });
        document.getElementById('tbody').innerHTML = h || "<tr><td colspan='4'>لا توجد بيانات</td></tr>";
    });
}

async function openCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل"];
    let idx = stages.indexOf(d.status); if(idx === -1) idx = 1;
    let trackH = `<div class="progress-container"><div class="progress-line"></div><div class="progress-fill" style="width:${(idx/3)*100}%"></div>
        ${stages.map((s,i)=>`<div class="step-node ${i<=idx?'active':''}"><i class="fas fa-check"></i><span>${s}</span></div>`).join('')}</div>`;

    Swal.fire({
        title: 'تفاصيل الطلب',
        background: '#0a1120', color: '#fff', width: '95%',
        html: `
            <div style="text-align:right; font-size:13px; background:rgba(255,255,255,0.05); padding:15px; border-radius:10px;">
                <p><b>مقدم الطلب:</b> ${d.name}</p>
                <p><b>المهنة:</b> ${d.job || '-'}</p>
                <p><b>الرقم القومي:</b> ${d.nationalId}</p>
                <p><b>الهاتف:</b> ${d.phone} | <b>المحافظة:</b> ${d.gov}</p>
                <p><b>التفاصيل:</b> ${d.details}</p>
            </div>
            ${trackH}
            <input id="n-stage" class="swal2-input" placeholder="المرحلة التالية">
            <textarea id="n-comm" class="swal2-textarea" placeholder="الرد الإداري"></textarea>`,
        confirmButtonText: 'تحديث'
    }).then(r => {
        if(r.isConfirmed) updateStep(id, document.getElementById('n-stage').value, document.getElementById('n-comm').value);
    });
}

async function updateStep(id, stage, comm) {
    if(!stage) return;
    await db.collection("Requests").doc(id).update({
        status: stage,
        tracking: firebase.firestore.FieldValue.arrayUnion({
            stage: stage, comment: comm || "تحديث إداري", date: new Date().toLocaleString('ar-EG')
        })
    });
}

async function deleteReq(id) {
    const { value: pass } = await Swal.fire({ title: 'كلمة سر الحذف', input: 'password' });
    if(pass === '11111@') {
        await db.collection("Requests").doc(id).delete();
        Swal.fire("تم الحذف","","success");
    } else if(pass) Swal.fire("خطأ","الباسورد غلط","error");
}

loadData('شكوى');
