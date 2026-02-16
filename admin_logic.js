const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const role = sessionStorage.getItem("role");

function loadData(type) {
    document.getElementById('content-box').style.display='block';
    document.getElementById('settings-box').style.display='none';
    db.collection("Requests").where("type","==",type).onSnapshot(snap => {
        let h = "";
        snap.forEach(doc => {
            const d = doc.data();
            h += `<tr><td>${d.refId}</td><td>${d.name}</td><td>${d.gov}</td><td>${d.status}</td>
            <td>
                <button class="btn-view" onclick="openCard('${doc.id}','${type}')">إدارة</button>
                <button class="btn-del" onclick="deleteDoc('${doc.id}')">حذف</button>
            </td></tr>`;
        });
        document.getElementById('tbody').innerHTML = h;
    });
}

async function openCard(id, type) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    
    // إنشاء قسم التتبع للظهور في الكارت
    let trackingHtml = `<div id="admin-timeline"></div>`;

    const { value: form } = await Swal.fire({
        title: 'تفاصيل الطلب',
        width: '700px',
        html: `
            <div id="print-area" style="text-align:right; font-size:0.9rem; border:1px solid #ccc; padding:15px; color:#fff;">
                <p><b>الاسم:</b> ${d.name} | <b>التليفون:</b> ${d.phone}</p>
                <p><b>المحافظة:</b> ${d.gov} | <b>المهنة:</b> ${d.job}</p>
                <p><b>العنوان:</b> ${d.address}</p>
                <hr>
                <p><b>الموضوع:</b> ${d.details}</p>
                ${trackingHtml}
            </div>
            <button onclick="printCard()" class="main-btn" style="background:#10b981; padding:5px; font-size:0.8rem;">طباعة الكارت</button>
            <input id="sw-stage" class="swal2-input" placeholder="اسم المرحلة الحالية">
            <textarea id="sw-comm" class="swal2-textarea" placeholder="تعليق الإغلاق"></textarea>
        `,
        didOpen: () => { renderTimeline(d, 'admin-timeline'); }, // استدعاء التتبع من app.js
        showCancelButton: true, confirmButtonText: 'تحديث', cancelButtonText: 'تم (إغلاق)'
    });

    if(form) {
        const s = document.getElementById('sw-stage').value;
        const c = document.getElementById('sw-comm').value;
        await db.collection("Requests").doc(id).update({ status: s, tracking: firebase.firestore.FieldValue.arrayUnion({stage: s, comment: c, date: new Date().toLocaleString('ar-EG')}) });
    } else if (Swal.dismissReason === 'cancel') {
        await db.collection("Requests").doc(id).update({ status: "تم", tracking: firebase.firestore.FieldValue.arrayUnion({stage: "تم", comment: "تمت المعالجة", date: new Date().toLocaleString('ar-EG')}) });
    }
}

async function deleteDoc(id) {
    const { value: p } = await Swal.fire({ title: 'كلمة سر الحذف', input: 'password' });
    if(p === '11111@') {
        await db.collection("Requests").doc(id).delete();
        Swal.fire("تم الحذف","","success");
    } else Swal.fire("خطأ","كلمة السر خاطئة","error");
}

function printCard() {
    const content = document.getElementById('print-area').innerHTML;
    const win = window.open('', '', 'height=700,width=900');
    win.document.write(`<html><body style="font-family:Cairo; direction:rtl;">${content}</body></html>`);
    win.print();
    win.close();
}

function showSettings() { /* نفس كود الإعدادات السابق */ }
async function saveSettings() { /* نفس كود الحفظ السابق */ }

// ربط دالة renderTimeline لتعمل في الإدارة
function renderTimeline(data, targetId) {
    const allStages = data.tracking.map(t => t.stage);
    const html = `<div class="timeline" style="margin:20px 0;">
        ${allStages.map(s => `<div class="step active" style="width:25px; height:25px;"><div class="step-label" style="top:30px; font-size:0.6rem;">${s}</div></div>`).join('')}
    </div>`;
    document.getElementById(targetId).innerHTML = html;
}

loadData('complaint');
