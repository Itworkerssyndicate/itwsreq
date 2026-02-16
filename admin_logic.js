const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function loadData(type) {
    document.getElementById('v-title').innerText = "سجل " + type + "ات";
    db.collection("Requests").where("type","==",type).onSnapshot(snap => {
        let docs = [];
        snap.forEach(doc => docs.push({id: doc.id, ...doc.data()}));
        docs.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());

        let h = "";
        docs.forEach(d => {
            const timeStr = d.createdAt.toDate().toLocaleString('ar-EG');
            h += `<tr>
                <td style="font-size:9px;">${timeStr}</td>
                <td>${d.refId}</td><td>${d.name}</td>
                <td><button class="main-btn" style="padding:5px;" onclick="openCard('${d.id}')">فتح</button></td>
            </tr>`;
        });
        document.getElementById('tbody').innerHTML = h || "<tr><td colspan='4'>لا يوجد بيانات</td></tr>";
    });
}

async function openCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    
    // تراك مائي مصغر للكارت
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل والإغلاق"];
    let idx = (d.status === "تم الحل والإغلاق") ? 3 : stages.indexOf(d.status);
    let track = `<div class="progress-box"><div class="line"></div><div class="fill" style="width:${(idx/3)*100}%"></div><div class="steps">
        ${stages.map((s,i)=>`<div class="dot ${i<=idx?'active':''}"></div>`).join('')}</div></div>`;

    Swal.fire({
        title: 'تفاصيل مقدم الطلب',
        background: '#0a1120', color: '#fff', width: '95%',
        html: `<div style="text-align:right; font-size:12px;">
            <p><b>👤 الاسم:</b> ${d.name} | <b>📞 الهاتف:</b> ${d.phone}</p>
            <p><b>🆔 القومي:</b> ${d.nationalId} | <b>🏠 العنوان:</b> ${d.address || '-'}</p>
            <p><b>📝 التفاصيل:</b> ${d.details}</p>
            ${track}
            <input id="n-stage" class="swal2-input" placeholder="اسم المرحلة">
            <textarea id="n-comm" class="swal2-textarea" placeholder="الرد"></textarea>
            <button class="main-btn btn-red" onclick="closeRequest('${id}')">🔒 إغلاق الشكوى نهائياً</button>
        </div>`,
        confirmButtonText: 'تحديث الحالة'
    }).then(r => {
        if(r.isConfirmed && document.getElementById('n-stage').value) {
            updateStatus(id, document.getElementById('n-stage').value, document.getElementById('n-comm').value);
        }
    });
}

async function updateStatus(id, stage, comm) {
    await db.collection("Requests").doc(id).update({
        status: stage,
        tracking: firebase.firestore.FieldValue.arrayUnion({
            stage: stage, comment: comm || "تحديث إداري", date: new Date().toLocaleString('ar-EG')
        })
    });
}

async function closeRequest(id) {
    const { value: pass } = await Swal.fire({ title: 'باسورد الإغلاق', input: 'password' });
    if(pass === '11111@') {
        await updateStatus(id, "تم الحل والإغلاق", "تم حل الشكوى وإغلاق الملف نهائياً.");
        Swal.fire("تم", "تم إغلاق الشكوى", "success");
    }
}
