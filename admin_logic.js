const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function loadData(type) {
    document.getElementById('btn-comp').classList.toggle('active', type=='شكوى');
    document.getElementById('btn-sug').classList.toggle('active', type=='اقتراح');
    document.getElementById('v-title').innerText = "سجل " + (type=='شكوى'?'الشكاوى':'المقترحات');

    db.collection("Requests").onSnapshot(snap => {
        let docs = [];
        snap.forEach(d => { if( (type=='شكوى' && !d.data().refId.includes('SUG')) || (type=='اقتراح' && d.data().refId.includes('SUG')) ) docs.push({id: d.id, ...d.data()})});
        docs.sort((a,b) => b.createdAt.seconds - a.createdAt.seconds);

        let h = "";
        docs.forEach(d => {
            h += `<tr>
                <td>${d.refId}</td><td>${d.name}</td><td>${d.nationalId}</td>
                <td><b style="color:#00d2ff">${d.status}</b></td>
                <td style="display:flex; gap:5px; justify-content:center;">
                    <button class="main-btn" onclick="openCard('${d.id}')" style="padding:5px 10px; font-size:11px; width:auto;">فتح</button>
                    <button class="main-btn" onclick="deleteReq('${d.id}')" style="padding:5px 10px; font-size:11px; width:auto; background:#ef4444;"><i class="fas fa-trash"></i></button>
                </td></tr>`;
        });
        document.getElementById('tbody').innerHTML = h || "<tr><td colspan='5'>لا يوجد بيانات</td></tr>";
    });
}

async function openCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    let history = d.tracking.map(t => `<div class="log-card"><b>${t.stage}</b>${t.comment}<br><small>${t.date}</small></div>`).reverse().join('');

    Swal.fire({
        title: 'إدارة وتتبع الطلب',
        background: '#0a1120', color: '#fff', width: '90%',
        html: `
            <div style="text-align:right; font-size:13px;">
                <p><b>مقدم الطلب:</b> ${d.name}</p>
                <p><b>التفاصيل:</b> ${d.details}</p>
                <hr style="opacity:0.2; margin:10px 0;">
                <input id="new-stage" class="swal2-input" style="color:#000;" placeholder="اسم المرحلة التالية">
                <textarea id="admin-rep" class="swal2-textarea" style="color:#000; height:60px;" placeholder="الرد الإداري"></textarea>
                <button onclick="updateStep('${id}','تم الحل','تمت معالجة الشكوى')" style="background:#10b981; color:#fff; border:none; padding:10px; width:100%; border-radius:5px; margin-bottom:10px;">إغلاق بنجاح (تم الحل)</button>
                <p style="color:#00d2ff;">سجل التتبع (Tracking):</p>
                <div style="max-height:150px; overflow-y:auto;">${history}</div>
            </div>`,
        confirmButtonText: 'تحديث المرحلة'
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
    const { value: pass } = await Swal.fire({ title: 'كلمة سر الحذف', input: 'password', inputPlaceholder: 'أدخل الباسورد' });
    if(pass === '11111@') {
        await db.collection("Requests").doc(id).delete();
        Swal.fire("تم الحذف","","success");
    } else if(pass) {
        Swal.fire("خطأ","الباسورد غير صحيح","error");
    }
}

loadData('شكوى');
