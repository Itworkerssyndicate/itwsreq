const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function loadView(type, btn) {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('table-view').style.display = 'block';
    document.getElementById('settings-view').style.display = 'none';
    document.getElementById('view-title').innerText = "سجل " + type + "ات";
    
    db.collection("Requests").where("type","==",type).onSnapshot(snap => {
        let docs = [];
        snap.forEach(doc => docs.push({id: doc.id, ...doc.data()}));
        docs.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());

        let h = "";
        docs.forEach(d => {
            h += `<tr>
                <td class="time-cell">${d.createdAt.toDate().toLocaleString('ar-EG')}</td>
                <td>${d.refId}</td><td>${d.name}</td>
                <td>
                    <button class="action-btn view" onclick="openCard('${d.id}')">إدارة</button>
                    <button class="action-btn del" onclick="deleteReq('${d.id}')">حذف</button>
                </td>
            </tr>`;
        });
        document.getElementById('tbody').innerHTML = h || "<tr><td colspan='4'>لا يوجد بيانات</td></tr>";
    });
}

function loadSettings(btn) {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('table-view').style.display = 'none';
    document.getElementById('settings-view').style.display = 'block';
    document.getElementById('view-title').innerText = "إعدادات البرنامج";

    db.collection("SystemSettings").doc("mainConfig").get().then(doc => {
        if(doc.exists) {
            const d = doc.data();
            document.getElementById('set-pres').value = d.presidentName;
            document.getElementById('set-logo').value = d.logoUrl;
            document.getElementById('set-link').value = d.servicesLink;
        }
    });
}

async function saveSettings() {
    await db.collection("SystemSettings").doc("mainConfig").update({
        presidentName: document.getElementById('set-pres').value,
        logoUrl: document.getElementById('set-logo').value,
        servicesLink: document.getElementById('set-link').value
    });
    Swal.fire("تم", "تم تحديث الإعدادات بنجاح", "success");
}

async function openCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    Swal.fire({
        title: 'إدارة الطلب',
        background: '#0f172a', color: '#fff', width: '600px',
        html: `<div style="text-align:right; font-size:13px;">
            <p><b>👤 الاسم:</b> ${d.name}</p>
            <p><b>🆔 القومي:</b> ${d.nationalId} | <b>📞 الهاتف:</b> ${d.phone}</p>
            <p><b>📝 التفاصيل:</b> ${d.details}</p>
            <hr style="opacity:0.1; margin:10px 0;">
            <input id="n-stage" class="swal2-input" placeholder="اسم المرحلة">
            <textarea id="n-comm" class="swal2-textarea" placeholder="الرد"></textarea>
            <button class="logout-btn" style="width:100%;" onclick="closeReq('${id}')">🔒 إغلاق الشكوى نهائياً</button>
        </div>`,
        confirmButtonText: 'تحديث'
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

async function closeReq(id) {
    await updateStatus(id, "تم الحل والإغلاق", "تم الحل والإغلاق النهائي");
    Swal.fire("تم", "أغلقت الشكوى", "success");
}

async function deleteReq(id) {
    const { value: pass } = await Swal.fire({ title: 'كلمة مرور الحذف', input: 'password' });
    if(pass === '11111@') await db.collection("Requests").doc(id).delete();
}

loadView('شكوى', document.querySelector('.nav-item'));
