const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const role = sessionStorage.getItem("role");

function loadData(type, btn) {
    if(btn) { document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active')); btn.classList.add('active'); }
    document.getElementById('view-data').style.display = 'block';
    document.getElementById('view-settings').style.display = 'none';
    document.getElementById('view-title').innerText = type==='complaint'?'سجل الشكاوى':'سجل المقترحات';

    db.collection("Requests").where("type","==",type).orderBy("createdAt", "desc").onSnapshot(snap => {
        let h = "";
        snap.forEach(doc => {
            const d = doc.data();
            h += `<tr>
                <td>${d.refId}</td>
                <td>${d.name}</td>
                <td>${d.timestamp || 'قديم'}</td>
                <td>${d.gov}</td>
                <td><b style="color:#00d2ff">${d.status}</b></td>
                <td class="no-print">
                    <button onclick="openCard('${doc.id}')" style="background:#10b981; border:none; padding:5px 10px; border-radius:5px; color:#fff; cursor:pointer;">عرض كامل</button>
                    ${role=='super' ? `<button onclick="deleteDoc('${doc.id}')" style="background:#ef4444; border:none; padding:5px 10px; margin-right:5px; color:#fff; cursor:pointer;"><i class="fas fa-trash"></i></button>` : ''}
                </td>
            </tr>`;
        });
        document.getElementById('tbody').innerHTML = h;
    });
}

async function openCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    
    // بناء التراك سيستم الملون
    let steps = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم"];
    let currentIdx = steps.indexOf(d.status);
    let trackHtml = `<div class="timeline">`;
    steps.forEach((s, i) => {
        let cls = i <= currentIdx ? "completed" : "";
        trackHtml += `<div class="step ${cls}"><i class="fas fa-check"></i><div class="step-label">${s}</div></div>`;
    });
    trackHtml += `</div>`;

    Swal.fire({
        title: 'تفاصيل الطلب: ' + d.refId,
        width: '850px',
        background: '#0a1120', color: '#fff',
        html: `
            <div id="card-print" style="text-align:right; border:1px solid #334155; padding:20px; border-radius:10px;">
                <h4 style="color:#00d2ff">بيانات مقدم الطلب:</h4>
                <p><b>الاسم:</b> ${d.name}</p>
                <p><b>الرقم القومي:</b> ${d.nationalId} | <b>الهاتف:</b> ${d.phone}</p>
                <p><b>المحافظة:</b> ${d.gov} | <b>المهنة:</b> ${d.job}</p>
                <p><b>العنوان:</b> ${d.address}</p>
                <p><b>تاريخ التقديم:</b> ${d.timestamp}</p>
                <hr style="margin:15px 0; border-color:#334155;">
                <p><b>موضوع الطلب:</b><br>${d.details}</p>
                ${trackHtml}
            </div>
            <div class="no-print" style="margin-top:20px;">
                <select id="sw-status" class="swal2-input" style="color:#000">
                    <option value="قيد المراجعة">نقل لـ: قيد المراجعة</option>
                    <option value="جاري التنفيذ">نقل لـ: جاري التنفيذ</option>
                    <option value="تم">إغلاق الطلب (تم)</option>
                </select>
                <textarea id="sw-comm" class="swal2-textarea" placeholder="أضف تعليق إداري" style="color:#000"></textarea>
                <button class="main-btn" onclick="printCard()" style="background:#10b981; margin-top:10px;">طباعة الكارت</button>
            </div>
        `,
        confirmButtonText: 'تحديث الحالة',
        showCancelButton: true
    }).then(r => {
        if(r.isConfirmed) updateStage(id, document.getElementById('sw-status').value, document.getElementById('sw-comm').value);
    });
}

function printCard() { window.print(); }

async function deleteDoc(id) {
    const { value: p } = await Swal.fire({ title: 'كلمة سر الحذف النهائية', input: 'password', background:'#0a1120', color:'#fff' });
    if(p === '11111@') { await db.collection("Requests").doc(id).delete(); Swal.fire("تم الحذف بنجاح"); }
}

async function updateStage(id, status, comment) {
    await db.collection("Requests").doc(id).update({
        status: status,
        tracking: firebase.firestore.FieldValue.arrayUnion({
            stage: status,
            comment: comment || "تم تحديث الحالة من الإدارة",
            date: new Date().toLocaleString('ar-EG')
        })
    });
    Swal.fire("تم التحديث");
}

async function showSettings() {
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
    Swal.fire("تم حفظ الإعدادات بنجاح");
}

loadData('complaint');
