const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const role = sessionStorage.getItem("role");

function loadData(type, btn) {
    if(btn) { document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active')); btn.classList.add('active'); }
    document.getElementById('view-data').style.display = 'block';
    document.getElementById('view-settings').style.display = 'none';
    document.getElementById('view-title').innerText = type === 'complaint' ? "الشكاوى" : "المقترحات";

    db.collection("Requests").where("type","==",type).onSnapshot(snap => {
        let h = "";
        snap.forEach(doc => {
            const d = doc.data();
            h += `<tr><td>${d.refId}</td><td>${d.name}</td><td>${d.gov}</td><td><b>${d.status}</b></td>
            <td>
                <button onclick="openCard('${doc.id}')" style="background:#10b981; border:none; padding:6px 10px; border-radius:5px; color:#fff; cursor:pointer;"><i class="fas fa-tasks"></i> إدارة</button>
                ${role=='super' ? `<button onclick="deleteDoc('${doc.id}')" style="background:#ef4444; border:none; padding:6px 10px; margin-right:5px; color:#fff; cursor:pointer;"><i class="fas fa-trash"></i></button>` : ''}
            </td></tr>`;
        });
        document.getElementById('tbody').innerHTML = h;
    });
}

async function openCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    
    // بناء التراك سيستم ليعمل داخل الـ Modal
    let trackHtml = `<div class="timeline" style="margin:25px 0;">`;
    d.tracking.forEach(t => trackHtml += `<div class="step active"><i class="fas fa-check"></i><div class="step-label" style="font-size:10px">${t.stage}</div></div>`);
    trackHtml += `</div>`;

    Swal.fire({
        title: 'تفاصيل الطلب: ' + d.refId,
        width: '800px',
        background: '#0f172a', color: '#fff',
        html: `
            <div id="print-area" style="text-align:right; border:1px solid #334155; padding:15px; border-radius:10px; font-family:Cairo;">
                <p><b>الاسم:</b> ${d.name} | <b>الرقم القومي:</b> ${d.nationalId}</p>
                <p><b>الموضوع:</b> ${d.details}</p>
                <hr style="border-color:#334155; margin:10px 0;">
                ${trackHtml}
            </div>
            <div style="margin-top:20px;">
                <input id="sw-stage" class="swal2-input" placeholder="المرحلة القادمة" style="color:#000">
                <textarea id="sw-comm" class="swal2-textarea" placeholder="ملاحظات" style="color:#000"></textarea>
            </div>
            <button class="main-btn" style="background:#10b981; margin-top:10px;" onclick="printDiv('print-area')">طباعة الكارت</button>
        `,
        confirmButtonText: 'تحديث المرحلة',
        showCancelButton: true
    }).then(r => {
        if(r.isConfirmed) updateStage(id, document.getElementById('sw-stage').value, document.getElementById('sw-comm').value);
    });
}

function printDiv(id) {
    const content = document.getElementById(id).innerHTML;
    const win = window.open('', '', 'height=600,width=800');
    win.document.write(`<html><head><style>body{direction:rtl; font-family:Cairo; padding:20px; color:#000;} .timeline{display:flex; justify-content:space-between; margin:40px 0;} .step{width:30px; height:30px; border:1px solid #000; border-radius:50%; text-align:center;}</style></head><body>${content}</body></html>`);
    win.document.close(); win.print();
}

async function showSettings(btn) {
    if(btn) { document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active')); btn.classList.add('active'); }
    document.getElementById('view-data').style.display = 'none';
    document.getElementById('view-settings').style.display = 'block';
    const doc = await db.collection("SystemSettings").doc("mainConfig").get();
    if(doc.exists) {
        const d = doc.data();
        document.getElementById('set-name').value = d.unionName;
        document.getElementById('set-pres').value = d.presidentName;
        document.getElementById('set-logo').value = d.logoURL;
    }
}

async function saveSettings() {
    await db.collection("SystemSettings").doc("mainConfig").set({
        unionName: document.getElementById('set-name').value,
        presidentName: document.getElementById('set-pres').value,
        logoURL: document.getElementById('set-logo').value
    });
    Swal.fire("تم الحفظ","","success");
}

async function deleteDoc(id) {
    const { value: p } = await Swal.fire({ title: 'باسورد الحذف', input: 'password' });
    if(p === '11111@') { await db.collection("Requests").doc(id).delete(); Swal.fire("تم"); }
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
