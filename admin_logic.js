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
    const nid = document.getElementById('f-nid').value;
    const type = document.getElementById('f-type').value;

    const filtered = allData.filter(d => 
        (d.name.toLowerCase().includes(name)) &&
        (d.nationalId.includes(nid)) &&
        (type === "" || d.type === type)
    );
    renderTable(filtered);
}

function renderTable(data) {
    let h = "";
    data.forEach(d => {
        h += `<tr>
            <td>${d.createdAt.toDate().toLocaleString('ar-EG')}</td>
            <td>${d.refId}</td>
            <td>${d.name}<br><small>${d.isMember}: ${d.memberId}</small></td>
            <td>${d.type}</td>
            <td><span class="badge">${d.status}</span></td>
            <td><button class="act-btn" onclick="openAdminCard('${d.id}')">إدارة</button></td>
        </tr>`;
    });
    document.getElementById('tbody').innerHTML = h || "<tr><td colspan='6'>لا توجد نتائج</td></tr>";
}

async function openAdminCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    
    Swal.fire({
        title: 'إدارة الطلب',
        width: '800px', background: '#0f172a', color: '#fff',
        html: `
            <div class="admin-modal-info">
                <p>👤 ${d.name} (${d.isMember})</p>
                <p>🆔 رقم القومي: ${d.nationalId} | 🎖️ عضوية: ${d.memberId}</p>
                <hr>
                <div class="timeline-admin">
                    ${d.tracking.map(t => `<div><b>${t.stage}</b> - ${t.date}<br>${t.comment}</div>`).reverse().join('<br>')}
                </div>
                <hr>
                <input id="n-stage" class="swal2-input" placeholder="المرحلة">
                <textarea id="n-comm" class="swal2-textarea" placeholder="التعليق"></textarea>
            </div>`,
        showCancelButton: true,
        confirmButtonText: 'تحديث المسار',
        preConfirm: () => {
            const stage = document.getElementById('n-stage').value;
            if(!stage) return Swal.showValidationMessage('يجب إدخال اسم المرحلة');
            return { stage, comm: document.getElementById('n-comm').value };
        }
    }).then(r => { if(r.isConfirmed) updateRequest(id, r.value.stage, r.value.comm); });
}

async function updateRequest(id, stage, comm) {
    await db.collection("Requests").doc(id).update({
        status: stage,
        tracking: firebase.firestore.FieldValue.arrayUnion({
            stage: stage, comment: comm, date: new Date().toLocaleString('ar-EG')
        })
    });
}

// دالة الإعدادات
function showSettings() {
    Swal.fire({
        title: 'إعدادات المنظومة',
        html: `
            <input id="set-pres" class="swal2-input" placeholder="اسم النقيب">
            <input id="set-link" class="swal2-input" placeholder="رابط الخدمات">
            <input id="set-logo" class="swal2-input" placeholder="رابط اللوجو">`,
        confirmButtonText: 'حفظ'
    }).then(r => {
        if(r.isConfirmed) {
            db.collection("SystemSettings").doc("mainConfig").update({
                presidentName: document.getElementById('set-pres').value,
                servicesLink: document.getElementById('set-link').value,
                logoUrl: document.getElementById('set-logo').value
            });
        }
    });
}

function printTableData() {
    const printContent = document.getElementById("mainTable").outerHTML;
    const win = window.open('', '', 'width=900,height=700');
    win.document.write(`<html><body dir="rtl"><h2>تقرير الطلبات</h2>${printContent}</body></html>`);
    win.document.close();
    win.print();
}

loadView('all');
