const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function loadData(type) {
    document.getElementById('v-title').innerText = "سجل " + type + "ات";
    db.collection("Requests").where("type","==",type).onSnapshot(snap => {
        let docs = [];
        snap.forEach(doc => docs.push({id: doc.id, ...doc.data()}));
        
        // الترتيب: الأحدث فوق (بناءً على تاريخ الإنشاء)
        docs.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

        let h = "";
        docs.forEach(d => {
            const dateStr = d.createdAt.toDate().toLocaleDateString('ar-EG');
            h += `<tr>
                <td style="font-size:10px;">${dateStr}</td>
                <td>${d.refId}</td><td>${d.name}</td><td><b>${d.status}</b></td>
                <td>
                    <button class="main-btn" style="padding:4px; margin:0;" onclick="openAdminCard('${d.id}')">فتح</button>
                    <button class="main-btn btn-red" style="padding:4px; margin:4px 0 0 0;" onclick="deleteReq('${d.id}')">حذف</button>
                </td></tr>`;
        });
        document.getElementById('tbody').innerHTML = h || "<tr><td colspan='5'>لا توجد بيانات</td></tr>";
    });
}

async function openAdminCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    
    // توليد تراك مائي داخل الكارت
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل"];
    let idx = stages.indexOf(d.status); if(idx === -1) idx = 1;
    let trackH = `<div class="progress-box"><div class="line"></div><div class="fill" style="width:${(idx/3)*100}%"></div><div class="steps">
        ${stages.map((s,i)=>`<div class="dot ${i<=idx?'active':''}">✓</div>`).join('')}</div></div>`;

    Swal.fire({
        title: 'كارت بيانات الطلب',
        background: '#0a1120', color: '#fff', width: '95%',
        html: `
            <div style="text-align:right; font-size:12px; background:rgba(255,255,255,0.05); padding:15px; border-radius:10px;">
                <p><b>📅 تاريخ التقديم:</b> ${d.createdAt.toDate().toLocaleString('ar-EG')}</p>
                <p><b>👤 مقدم الطلب:</b> ${d.name}</p>
                <p><b>🆔 القومي:</b> ${d.nationalId} | <b>👷 المهنة:</b> ${d.job}</p>
                <p><b>📞 الهاتف:</b> ${d.phone} | <b>📍 المحافظة:</b> ${d.gov}</p>
                <p><b>🏠 العنوان:</b> ${d.address || 'غير مسجل'}</p>
                <p><b>📝 التفاصيل:</b> ${d.details}</p>
            </div>
            ${trackH}
            <div style="max-height:150px; overflow-y:auto; margin-bottom:15px; text-align:right;">
                ${d.tracking.map(t=>`<div class="log-card" style="margin:5px 0;"><b>${t.stage}</b> - <small>${t.date}</small><br><small>${t.comment}</small></div>`).reverse().join('')}
            </div>
            <input id="n-stage" class="swal2-input" placeholder="المرحلة (مثال: تم الحل)">
            <textarea id="n-comm" class="swal2-textarea" placeholder="الرد الإداري"></textarea>`,
        confirmButtonText: 'تحديث الحالة'
    }).then(r => {
        if(r.isConfirmed && document.getElementById('n-stage').value) {
            db.collection("Requests").doc(id).update({
                status: document.getElementById('n-stage').value,
                tracking: firebase.firestore.FieldValue.arrayUnion({
                    stage: document.getElementById('n-stage').value,
                    comment: document.getElementById('n-comm').value || "تحديث إداري",
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
