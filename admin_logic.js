const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
let allData = [];

function loadView(viewType, btn) {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    db.collection("Requests").orderBy("createdAt", "desc").onSnapshot(snap => {
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
    const status = document.getElementById('f-status').value;
    const filtered = allData.filter(d => (d.name||"").toLowerCase().includes(name) && (status==="" || d.status===status));
    renderTable(filtered);
}

function renderTable(data) {
    let h = "";
    data.forEach(d => {
        h += `<tr>
            <td>${d.createdAt?.toDate().toLocaleDateString('ar-EG') || '---'}</td>
            <td>${d.refId || '---'}</td>
            <td>${d.name || 'مجهول'}<br><small>${d.memberId || 'مواطن'}</small></td>
            <td>${d.type || '---'}</td>
            <td><span class="badge">${d.status || 'معلق'}</span></td>
            <td>
                <button class="btn-sm" onclick="openAdminCard('${d.id}')">إدارة</button>
                <button class="btn-sm del" onclick="deleteReq('${d.id}')">حذف</button>
            </td>
        </tr>`;
    });
    document.getElementById('tbody').innerHTML = h;
}

async function openAdminCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    Swal.fire({
        title: 'كارت الطلب الكامل',
        width: '800px', background: '#0f172a', color: '#fff',
        html: `
            <div class="card-info" style="text-align:right; display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <p>👤 الاسم: ${d.name}</p> <p>🆔 القومي: ${d.nationalId}</p>
                <p>📞 الهاتف: ${d.phone}</p> <p>📍 المحافظة: ${d.gov}</p>
                <p>🏗️ المهنة: ${d.job}</p> <p>🎖️ العضوية: ${d.memberId}</p>
            </div>
            <hr><div class="logs-admin">${d.tracking.map(t=>`<div>${t.stage} (${t.date})<br>${t.comment}</div>`).join('')}</div>
            <input id="n-stage" class="swal2-input" placeholder="المرحلة الجديدة">
            <textarea id="n-comm" class="swal2-textarea" placeholder="التعليق"></textarea>`,
        confirmButtonText: 'تحديث'
    }).then(r => { if(r.isConfirmed) updateStat(id, document.getElementById('n-stage').value, document.getElementById('n-comm').value); });
}

async function updateStat(id, stage, comm) {
    if(!stage) return;
    await db.collection("Requests").doc(id).update({
        status: stage,
        tracking: firebase.firestore.FieldValue.arrayUnion({stage, comment: comm, date: new Date().toLocaleString('ar-EG')})
    });
}

async function deleteReq(id) {
    if(confirm("هل أنت متأكد من الحذف؟")) await db.collection("Requests").doc(id).delete();
}

function showSettings() {
    Swal.fire({
        title: 'الإعدادات',
        html: `<input id="s-p" class="swal2-input" placeholder="اسم النقيب"><input id="s-l" class="swal2-input" placeholder="رابط اللوجو">`,
    }).then(r => { if(r.isConfirmed) db.collection("SystemSettings").doc("mainConfig").update({presidentName: document.getElementById('s-p').value, logoUrl: document.getElementById('s-l').value}); });
}
