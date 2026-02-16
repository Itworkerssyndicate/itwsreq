const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
let allData = [];

function loadView(viewType, btn) {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    
    db.collection("Requests").onSnapshot(snap => {
        allData = [];
        snap.forEach(doc => {
            const d = doc.data();
            if(viewType === 'all' || d.type === viewType) allData.push({id: doc.id, ...d});
        });
        filterTable();
    });
}

function filterTable() {
    const name = document.getElementById('f-name').value.toLowerCase();
    const nid = document.getElementById('f-nid').value;
    const type = document.getElementById('f-type').value;
    const status = document.getElementById('f-status').value;

    const filtered = allData.filter(d => 
        (d.name.toLowerCase().includes(name)) &&
        (d.nationalId.includes(nid)) &&
        (type === "" || d.type === type) &&
        (status === "" || d.status === status)
    );
    renderTable(filtered);
}

function renderTable(data) {
    let h = "";
    data.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()).forEach(d => {
        h += `<tr>
            <td>${d.createdAt.toDate().toLocaleDateString('ar-EG')}</td>
            <td>${d.refId}</td><td>${d.name}</td><td>${d.type}</td>
            <td><span class="badge">${d.status}</span></td>
            <td><button class="action-btn view" onclick="openFullCard('${d.id}')">إدارة</button></td></tr>`;
    });
    document.getElementById('tbody').innerHTML = h || "<tr><td colspan='6'>لا يوجد نتائج</td></tr>";
}

async function openFullCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل والإغلاق"];
    let idx = stages.indexOf(d.status);

    let trackH = d.tracking.map(t => `<div class="log-card"><b>${t.stage}</b> (${t.date})<br>${t.comment}</div>`).reverse().join('');

    Swal.fire({
        title: 'إدارة الطلب والمسار الزمني',
        width: '850px', background: '#0f172a', color: '#fff',
        html: `
            <div style="text-align:right; display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:13px; border-bottom:1px solid #334155; padding-bottom:10px;">
                <p>👤 ${d.name}</p> <p>📞 ${d.phone}</p>
                <p>🏗️ ${d.job}</p> <p>📍 ${d.gov}</p>
                <p>⏰ تاريخ الإرسال: ${d.createdAt.toDate().toLocaleString('ar-EG')}</p>
            </div>
            <div class="progress-box">
                <div class="line"></div><div class="fill" style="width:${(idx/3)*100}%"></div>
                <div class="steps">${stages.map((s,i)=>`<div class="dot ${i<=idx?'active pulse':''}"></div>`).join('')}</div>
            </div>
            <div style="text-align:right; max-height:200px; overflow-y:auto; background:rgba(0,0,0,0.2); padding:10px; border-radius:10px;">
                ${trackH}
            </div>
            <hr style="opacity:0.1; margin:15px 0;">
            <div style="text-align:right;">
                <input id="n-stage" class="swal2-input" placeholder="المرحلة الجديدة">
                <textarea id="n-comm" class="swal2-textarea" placeholder="تعليق الإدارة"></textarea>
                <button class="logout-btn" style="width:100%;" onclick="updateStat('${id}', 'تم الحل والإغلاق', 'تم الإغلاق النهائي')">🔒 إغلاق نهائي</button>
            </div>`,
        confirmButtonText: 'تحديث المسار'
    }).then(r => {
        if(r.isConfirmed) updateStat(id, document.getElementById('n-stage').value, document.getElementById('n-comm').value);
    });
}

async function updateStat(id, stage, comm) {
    if(!stage) return;
    await db.collection("Requests").doc(id).update({
        status: stage,
        tracking: firebase.firestore.FieldValue.arrayUnion({
            stage: stage, comment: comm || "تحديث إداري", date: new Date().toLocaleString('ar-EG')
        })
    });
}

function printTableData() {
    let win = window.open('', '', 'height=700,width=1000');
    win.document.write(`<html><head><style>body{direction:rtl; font-family:Arial;} table{width:100%; border-collapse:collapse;} th,td{border:1px solid #333; padding:10px; text-align:center;}</style></head><body>`);
    win.document.write(`<h2>تقرير البيانات المفلترة - ${new Date().toLocaleDateString('ar-EG')}</h2>`);
    win.document.write(document.getElementById('mainTable').outerHTML);
    win.document.close();
    win.print();
}

loadView('all');
