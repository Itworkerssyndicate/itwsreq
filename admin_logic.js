const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
let allData = [];

function loadView(type, btn) {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    document.getElementById('view-title').innerText = "سجل " + type + "ات";
    
    db.collection("Requests").where("type","==",type).onSnapshot(snap => {
        allData = [];
        snap.forEach(doc => allData.push({id: doc.id, ...doc.data()}));
        renderTable(allData);
    });
}

function renderTable(data) {
    let h = "";
    data.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()).forEach(d => {
        h += `<tr>
            <td>${d.createdAt.toDate().toLocaleString('ar-EG')}</td>
            <td>${d.refId}</td><td>${d.name}</td><td>${d.gov}</td>
            <td><span class="badge">${d.status}</span></td>
            <td>
                <button class="action-btn view" onclick="openFullCard('${d.id}')">إدارة</button>
                <button class="action-btn del" onclick="deleteReq('${d.id}')">حذف</button>
            </td></tr>`;
    });
    document.getElementById('tbody').innerHTML = h;
}

function filterTable() {
    const name = document.getElementById('f-name').value.toLowerCase();
    const nid = document.getElementById('f-nid').value;
    const gov = document.getElementById('f-gov').value;
    const status = document.getElementById('f-status').value;

    const filtered = allData.filter(d => 
        d.name.toLowerCase().includes(name) &&
        d.nationalId.includes(nid) &&
        (gov === "" || d.gov === gov) &&
        (status === "" || d.status === status)
    );
    renderTable(filtered);
}

async function openFullCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    
    let trackH = d.tracking.map(t => `<div class="log-card"><b>${t.stage}</b> (${t.date})<br>${t.comment}</div>`).reverse().join('');

    Swal.fire({
        title: 'كارت البيانات والتتبع',
        width: '800px', background: '#0f172a', color: '#fff',
        html: `
            <div style="text-align:right; display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:13px; border-bottom:1px solid #334155; padding-bottom:10px;">
                <p><b>👤 الاسم:</b> ${d.name}</p> <p><b>📞 الهاتف:</b> ${d.phone}</p>
                <p><b>🆔 القومي:</b> ${d.nationalId}</p> <p><b>🏗️ المهنة:</b> ${d.job}</p>
                <p><b>📍 العنوان:</b> ${d.gov} - ${d.address}</p> <p><b>⏰ الإرسال:</b> ${d.createdAt.toDate().toLocaleString('ar-EG')}</p>
            </div>
            <div style="text-align:right; margin-top:10px;">
                <p><b>📝 نص الطلب:</b> ${d.details}</p>
                <h4 style="color:#00d2ff; margin:10px 0;">المسار الزمني (Tracking):</h4>
                <div style="max-height:200px; overflow-y:auto;">${trackH}</div>
                <hr>
                <input id="n-stage" class="swal2-input" placeholder="المرحلة الجديدة">
                <textarea id="n-comm" class="swal2-textarea" placeholder="التعليق الإداري"></textarea>
                <button class="logout-btn" style="width:100%" onclick="updateStat('${id}', 'تم الحل والإغلاق', 'إغلاق نهائي')">🔒 إغلاق نهائي</button>
            </div>`,
        showCancelButton: true, confirmButtonText: 'تحديث الحالة'
    }).then(r => {
        if(r.isConfirmed) updateStat(id, document.getElementById('n-stage').value, document.getElementById('n-comm').value);
    });
}

async function updateStat(id, stage, comm) {
    if(!stage) return;
    await db.collection("Requests").doc(id).update({
        status: stage,
        tracking: firebase.firestore.FieldValue.arrayUnion({
            stage: stage, comment: comm || "تحديث", date: new Date().toLocaleString('ar-EG')
        })
    });
    Swal.fire("تم", "تم تحديث الطلب", "success");
}

function printReport() {
    let win = window.open('', '', 'height=700,width=900');
    let table = document.getElementById('mainTable').outerHTML;
    win.document.write(`<html><head><title>تقرير عام</title><style>body{direction:rtl; font-family:Arial;} table{width:100%; border-collapse:collapse;} th,td{border:1px solid #000; padding:8px; text-align:center;}</style></head><body>`);
    win.document.write(`<h2>تقرير سجل البيانات - بتاريخ ${new Date().toLocaleDateString()}</h2>`);
    win.document.write(table);
    win.document.write(`</body></html>`);
    win.print();
}

async function deleteReq(id) {
    const { value: pass } = await Swal.fire({ title: 'باسورد الحذف', input: 'password' });
    if(pass === '11111@') await db.collection("Requests").doc(id).delete();
}

function showSettings() {
    Swal.fire({
        title: 'إعدادات النظام',
        html: `<input id="s-pres" class="swal2-input" placeholder="اسم النقيب">
               <input id="s-logo" class="swal2-input" placeholder="رابط الشعار">
               <input id="s-link" class="swal2-input" placeholder="رابط الخدمات">`,
        confirmButtonText: 'حفظ'
    }).then(r => {
        if(r.isConfirmed) {
            db.collection("SystemSettings").doc("mainConfig").update({
                presidentName: document.getElementById('s-pres').value,
                logoUrl: document.getElementById('s-logo').value,
                servicesLink: document.getElementById('s-link').value
            });
        }
    });
}

loadView('شكوى');
