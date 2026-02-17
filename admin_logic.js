// ... Firebase Config (نفسه) ...
const db = firebase.firestore();

function adminSec(s, btn) {
    document.getElementById('admin-list-sec').style.display = s==='list'?'block':'none';
    document.getElementById('admin-config-sec').style.display = s==='config'?'block':'none';
    document.querySelectorAll('aside .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function loadData() {
    db.collection("Requests").orderBy("createdAt", "desc").onSnapshot(snap => {
        let h = "";
        snap.forEach(doc => {
            const d = doc.data();
            h += `<tr style="border-bottom:1px solid var(--border)">
                <td style="padding:15px"><b>${d.name}</b></td>
                <td>${d.refId}</td>
                <td><span style="color:var(--primary)">${d.status}</span></td>
                <td>
                    <button onclick="updateReq('${d.refId}')" style="background:none; border:1px solid var(--primary); color:#fff; cursor:pointer; padding:5px 10px; border-radius:5px;">⚙️</button>
                    <button onclick="deleteReq('${d.refId}')" style="background:none; border:1px solid #ff4757; color:#fff; cursor:pointer; padding:5px 10px; border-radius:5px; margin-right:5px;">🗑️</button>
                </td>
            </tr>`;
        });
        document.getElementById('admin-table-body').innerHTML = h;
    });
}

async function updateReq(id) {
    const { value: status } = await Swal.fire({
        title: 'تحديث الحالة',
        input: 'select',
        inputOptions: { 'قيد المراجعة': 'قيد المراجعة', 'جاري التنفيذ': 'جاري التنفيذ', 'تم الحل': 'تم الحل (إغلاق)' }
    });
    if(status) {
        const { value: comm } = await Swal.fire({ title: 'أضف تعليق', input: 'textarea' });
        await db.collection("Requests").doc(id).update({
            status: status,
            tracking: firebase.firestore.FieldValue.arrayUnion({
                status: status, comment: comm, time: new Date().toLocaleString('ar-EG')
            })
        });
    }
}

async function deleteReq(id) {
    const { value: pass } = await Swal.fire({ title: 'باسورد الحذف', input: 'password' });
    if(pass === '11111@') {
        await db.collection("Requests").doc(id).delete();
    }
}

loadData();
