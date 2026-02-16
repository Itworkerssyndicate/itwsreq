const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
let allData = [];
let currentType = 'شكوى';

function loadView(type, btn) {
    currentType = type;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    document.getElementById('view-title').innerText = "سجل " + type + "ات";
    
    db.collection("Requests").where("type","==",type).onSnapshot(snap => {
        allData = [];
        snap.forEach(doc => allData.push({id: doc.id, ...doc.data()}));
        filterTable();
    });
}

function filterTable() {
    const name = document.getElementById('f-name').value.toLowerCase();
    const nid = document.getElementById('f-nid').value;
    const gov = document.getElementById('f-gov').value;
    const status = document.getElementById('f-status').value;

    const filtered = allData.filter(d => 
        (d.name.toLowerCase().includes(name) || name === "") &&
        (d.nationalId.includes(nid) || nid === "") &&
        (gov === "" || d.gov === gov) &&
        (status === "" || d.status === status)
    );
    renderTable(filtered);
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
    document.getElementById('tbody').innerHTML = h || "<tr><td colspan='6'>لا توجد نتائج</td></tr>";
}

async function openFullCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل والإغلاق"];
    let idx = stages.indexOf(d.status);

    let trackH = `
        <div class="progress-box">
            <div class="line"></div><div class="fill" style="width:${(idx/3)*100}%"></div>
            <div class="steps">${stages.map((s,i)=>`<div class="dot ${i<=idx?'active pulse':''}"></div>`).join('')}</div>
        </div>`;

    Swal.fire({
        title: 'كارت البيانات المطور',
        width: '800px', background: '#0f172a', color: '#fff',
        html: `
            <div style="text-align:right; display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:13px; border-bottom:1px solid #334155; padding-bottom:10px;">
                <p>👤 ${d.name}</p> <p>📞 ${d.phone}</p>
                <p>🆔 ${d.nationalId}</p> <p>🏗️ ${d.job}</p>
                <p>📍 ${d.gov} - ${d.address}</p> <p>⏰ ${d.createdAt.toDate().toLocaleString('ar-EG')}</p>
            </div>
            <div style="text-align:right; margin-top:10px;">
                <p>📝 <b>الطلب:</b> ${d.details}</p>
                ${trackH}
                <hr style="opacity:0.1">
                <input id="n-stage" class="swal2-input" placeholder="المرحلة الجديدة">
                <textarea id="n-comm" class="swal2-textarea" placeholder="التعليق"></textarea>
                <button class="logout-btn" style="width:100%; margin-top:10px;" onclick="updateStat('${id}', 'تم الحل والإغلاق', 'إغلاق نهائي')">🔒 إغلاق نهائي</button>
            </div>`,
        showCancelButton: true, confirmButtonText: 'تحديث'
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
}

function printFilteredReport() {
    let win = window.open('', '', 'height=700,width=1000');
    let tableHtml = document.getElementById('mainTable').innerHTML;
    win.document.write(`<html><head><style>body{direction:rtl; font-family:Tahoma;} table{width:100%; border-collapse:collapse;} th,td{border:1px solid #000; padding:10px; text-align:center;}</style></head><body>`);
    win.document.write(`<h2>تقرير مفصل - المستندات المستخرجة</h2><table>${tableHtml}</table></body></html>`);
    win.document.close();
    win.print();
}

async function deleteReq(id) {
    const { value: pass } = await Swal.fire({ title: 'كلمة مرور الحذف', input: 'password' });
    if(pass === '11111@') await db.collection("Requests").doc(id).delete();
}

loadView('شكوى');
