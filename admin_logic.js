const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const role = sessionStorage.getItem("role");

function loadData(type) {
    document.getElementById('box-data').style.display = 'block';
    document.getElementById('box-settings').style.display = 'none';
    db.collection("Requests").where("type","==",type).onSnapshot(snap => {
        let h = "";
        snap.forEach(doc => {
            const d = doc.data();
            h += `<tr><td>${d.refId}</td><td>${d.name}</td><td>${d.gov}</td><td>${d.status}</td>
            <td>
                <button onclick="openCard('${doc.id}')" style="background:#10b981; border:none; padding:5px 10px; border-radius:5px; color:#fff; cursor:pointer;">إدارة</button>
                ${role=='super' ? `<button onclick="deleteDoc('${doc.id}')" style="background:#ef4444; border:none; padding:5px; margin-right:5px; color:#fff; cursor:pointer;"><i class="fas fa-trash"></i></button>` : ''}
            </td></tr>`;
        });
        document.getElementById('tbody').innerHTML = h;
    });
}

async function openCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    Swal.fire({
        title: 'تفاصيل الطلب',
        width: '800px',
        background: '#111827', color: '#fff',
        html: `
            <div id="print-area" style="text-align:right; border:1px solid #334155; padding:20px; border-radius:10px;">
                <p><b>رقم الطلب:</b> ${d.refId}</p>
                <p><b>الاسم:</b> ${d.name} | <b>الرقم القومي:</b> ${d.nationalId}</p>
                <p><b>الموضوع:</b><br>${d.details}</p>
                <hr><div id="admin-timeline"></div>
            </div>
            <button class="main-btn" style="background:#10b981; margin-top:10px;" onclick="printDiv('print-area')">طباعة الكارت التفصيلي</button>
            <input id="sw-stage" class="swal2-input" placeholder="المرحلة القادمة">
            <textarea id="sw-comm" class="swal2-textarea" placeholder="تعليق"></textarea>
        `,
        confirmButtonText: 'تحديث',
        showCancelButton: true
    }).then(r => {
        if(r.isConfirmed) updateStage(id, document.getElementById('sw-stage').value, document.getElementById('sw-comm').value);
    });
}

function printDiv(id) {
    const content = document.getElementById(id).innerHTML;
    const win = window.open('', '', 'height=600,width=800');
    win.document.write(`<html><head><style>body{direction:rtl; font-family:Cairo; padding:20px;}</style></head><body>${content}</body></html>`);
    win.document.close(); win.print();
}

async function showSettings() {
    document.getElementById('box-data').style.display = 'none';
    document.getElementById('box-settings').style.display = 'block';
    const doc = await db.collection("SystemSettings").doc("mainConfig").get();
    if(doc.exists) {
        const d = doc.data();
        document.getElementById('set-name').value = d.unionName;
        document.getElementById('set-pres').value = d.presidentName;
        document.getElementById('set-logo').value = d.logoURL;
    }
}

async function saveSettings() {
    await db.collection("SystemSettings").doc("mainConfig").update({
        unionName: document.getElementById('set-name').value,
        presidentName: document.getElementById('set-pres').value,
        logoURL: document.getElementById('set-logo').value
    });
    Swal.fire("تم","تم حفظ الإعدادات","success");
}

async function deleteDoc(id) {
    const { value: p } = await Swal.fire({ title: 'باسورد الحذف', input: 'password' });
    if(p === '11111@') { await db.collection("Requests").doc(id).delete(); Swal.fire("تم الحذف"); }
}

async function updateStage(id, s, c) {
    if(!s) return;
    await db.collection("Requests").doc(id).update({
        status: s,
        tracking: firebase.firestore.FieldValue.arrayUnion({ stage: s, comment: c || "تحديث إداري", date: new Date().toLocaleString('ar-EG') })
    });
    Swal.fire("تم التحديث");
}

loadData('complaint');
