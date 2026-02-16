const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function loadData(type) {
    document.getElementById('v-title').innerText = "سجل " + type + "ات";
    db.collection("Requests").where("type","==",type).onSnapshot(snap => {
        let docs = [];
        snap.forEach(doc => docs.push({id: doc.id, ...doc.data()}));
        docs.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()); // الأحدث فوق

        let h = "";
        docs.forEach(d => {
            h += `<tr>
                <td>${d.createdAt.toDate().toLocaleDateString('ar-EG')}</td>
                <td>${d.refId}</td><td>${d.name}</td><td>${d.status}</td>
                <td>
                    <button class="main-btn" style="padding:5px;" onclick="openCard('${d.id}')">فتح</button>
                    <button class="main-btn btn-red" style="padding:5px;" onclick="deleteReq('${d.id}')">حذف</button>
                </td></tr>`;
        });
        document.getElementById('tbody').innerHTML = h || "<tr><td colspan='5'>لا يوجد بيانات</td></tr>";
    });
}

async function openCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل"];
    let idx = stages.indexOf(d.status); if(idx === -1) idx = 1;
    let trackH = `<div class="progress-box"><div class="line"></div><div class="fill" style="width:${(idx/3)*100}%"></div><div class="steps">
        ${stages.map((s,i)=>`<div class="dot ${i<=idx?'active':''}">✓</div>`).join('')}</div></div>`;

    Swal.fire({
        title: 'كارت بيانات مقدم الطلب',
        background: '#0a1120', color: '#fff', width: '95%',
        html: `
            <div style="text-align:right; font-size:12px; background:rgba(255,255,255,0.05); padding:15px; border-radius:10px;">
                <p><b>📅 التاريخ:</b> ${d.createdAt.toDate().toLocaleString('ar-EG')}</p>
                <p><b>👤 الاسم:</b> ${d.name} | <b>👷 المهنة:</b> ${d.job}</p>
                <p><b>🆔 القومي:</b> ${d.nationalId} | <b>📞 الهاتف:</b> ${d.phone}</p>
                <p><b>📍 المحافظة:</b> ${d.gov} | <b>🏠 العنوان:</b> ${d.address || '-'}</p>
                <p><b>📝 التفاصيل:</b> ${d.details}</p>
            </div>
            ${trackH}
            <div style="max-height:100px; overflow-y:auto; margin:10px 0; text-align:right;">
                ${d.tracking.map(t=>`<div class="log-card"><b>${t.stage}</b> - ${t.date}</div>`).reverse().join('')}
            </div>
            <input id="n-stage" class="swal2-input" placeholder="المرحلة القادمة">
            <textarea id="n-comm" class="swal2-textarea" placeholder="رد الإدارة"></textarea>`,
        confirmButtonText: 'تحديث'
    }).then(r => {
        if(r.isConfirmed && document.getElementById('n-stage').value) {
            db.collection("Requests").doc(id).update({
                status: document.getElementById('n-stage').value,
                tracking: firebase.firestore.FieldValue.arrayUnion({
                    stage: document.getElementById('n-stage').value,
                    comment: document.getElementById('n-comm').value || "تحديث",
                    date: new Date().toLocaleString('ar-EG')
                })
            });
        }
    });
}

async function deleteReq(id) {
    const { value: pass } = await Swal.fire({ title: 'باسورد الحذف', input: 'password' });
    if(pass === '11111@') await db.collection("Requests").doc(id).delete();
}
