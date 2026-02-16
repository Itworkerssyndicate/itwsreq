const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const role = sessionStorage.getItem("role");

function loadData(type) {
    document.getElementById('v-title').innerText = "سجل " + type + "ات (الأحدث أولاً)";
    db.collection("Requests").where("type","==",type).orderBy("createdAt", "desc").onSnapshot(snap => {
        let h = "";
        snap.forEach(doc => {
            const d = doc.data();
            h += `<tr>
                <td>${d.refId}</td><td>${d.name}</td><td>${d.nationalId}</td><td>${d.timestamp}</td>
                <td><b style="color:#00d2ff">${d.status}</b></td>
                <td><button class="main-btn" onclick="openCard('${doc.id}')" style="padding:5px 10px; font-size:12px;">إدارة</button></td></tr>`;
        });
        document.getElementById('tbody').innerHTML = h;
    });
}

async function openCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    let history = d.tracking.map(t => `<div class="log-card"><b>${t.stage}</b>${t.comment}<br><small>${t.date}</small></div>`).reverse().join('');

    Swal.fire({
        title: 'تحديث مسار الطلب',
        background: '#0a1120', color: '#fff', width: '95%',
        html: `
            <div style="text-align:right; font-size:13px;">
                <p><b>مقدم الطلب:</b> ${d.name} | <b>العنوان:</b> ${d.address}</p>
                <p><b>التفاصيل:</b> ${d.details}</p>
                <hr style="margin:10px 0; opacity:0.2;">
                
                <label>اسم المرحلة الحالية (مثال: قيد المراجعة):</label>
                <input id="new-stage-name" class="swal2-input" style="color:#000;" placeholder="أدخل اسم المرحلة">
                
                <label>الرد الإداري على هذه المرحلة:</label>
                <textarea id="admin-reply" class="swal2-textarea" style="color:#000; height:70px;" placeholder="اكتب الرد الموجه للمواطن"></textarea>
                
                <button onclick="updateFinal('${id}')" style="background:#e11d48; color:#fff; border:none; padding:10px; width:100%; border-radius:5px; margin-top:5px; cursor:pointer;">
                    <i class="fas fa-lock"></i> تم الحل (إغلاق الشكوى نهائياً)
                </button>

                <p style="color:#00d2ff; margin-top:15px;"><i class="fas fa-stream"></i> سجل المراحل السابقة بالوقت:</p>
                <div style="max-height:150px; overflow-y:auto; background:rgba(0,0,0,0.4); padding:10px; border-radius:10px;">${history}</div>
            </div>`,
        showConfirmButton: true,
        confirmButtonText: 'حفظ وتحديث المرحلة',
        preConfirm: () => {
            return {
                stage: document.getElementById('new-stage-name').value,
                reply: document.getElementById('admin-reply').value
            }
        }
    }).then(r => { if(r.isConfirmed && r.value.stage) pushUpdate(id, r.value.stage, r.value.reply); });
}

async function updateFinal(id) {
    Swal.close();
    pushUpdate(id, "تم الحل", "تمت معالجة طلبكم وإغلاق الشكوى نهائياً.");
}

async function pushUpdate(id, stage, comment) {
    await db.collection("Requests").doc(id).update({
        status: stage,
        tracking: firebase.firestore.FieldValue.arrayUnion({
            stage: stage, comment: comment || "تحديث إداري", date: new Date().toLocaleString('ar-EG')
        })
    });
    Swal.fire("تم التحديث","تم إضافة المرحلة لسجل التتبع بنجاح","success");
}

loadData('شكوى');
