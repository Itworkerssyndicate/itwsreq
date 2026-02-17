// ... Firebase Config (نفسه) ...
const db = firebase.firestore();

function loadAdminData() {
    db.collection("Requests").orderBy("createdAt", "desc").onSnapshot(snap => {
        let html = "";
        snap.forEach(doc => {
            const d = doc.data();
            html += `<tr>
                <td>${d.createdAt?.toDate().toLocaleString('ar-EG') || '--'}</td>
                <td>${d.name}</td>
                <td>${d.gov}</td>
                <td>${d.job}</td>
                <td>${d.type}</td>
                <td style="color:var(--primary)">${d.status}</td>
                <td>
                    <button onclick="manage('${doc.id}')">⚙️ إدارة</button>
                    <button onclick="del('${doc.id}')" style="color:red">🗑️</button>
                </td>
            </tr>`;
        });
        document.getElementById('admin-tbody').innerHTML = html;
    });
}

async function manage(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    document.getElementById('admin-modal').style.display = 'block';
    
    let trackHtml = `<div class="card">
        <h3>تفاصيل الطلب: ${d.refId}</h3>
        <p>الاسم: ${d.name} | عضو: ${d.member} (${d.mid})</p>
        <p>الهاتف: ${d.phone} | الرقم القومي: ${d.nid}</p>
        <p>العنوان: ${d.address}</p>
        <hr>
        <h4>تحديث الحالة:</h4>
        <select id="new-status">
            <option>قيد المراجعة</option>
            <option>جاري التنفيذ</option>
            <option>تم الحل</option>
        </select>
        <textarea id="new-comm" placeholder="اكتب التعليق أو القرار النهائي..."></textarea>
        <label><input type="checkbox" id="is-final"> قرار إغلاق نهائي مميز؟</label>
        <button class="btn-main" onclick="updateStatus('${id}')">تحديث الحالة</button>
    </div>`;
    document.getElementById('modal-content').innerHTML = trackHtml;
}

async function updateStatus(id) {
    const status = document.getElementById('new-status').value;
    const comm = document.getElementById('new-comm').value;
    const final = document.getElementById('is-final').checked;

    await db.collection("Requests").doc(id).update({
        status: status,
        tracking: firebase.firestore.FieldValue.arrayUnion({
            s: status, c: comm, t: new Date().toLocaleString('ar-EG'), final: final
        })
    });
    Swal.fire("تم التحديث");
}

async function del(id) {
    const { value: pass } = await Swal.fire({ title: 'باسورد الحذف', input: 'password' });
    if(pass === '11111@') {
        await db.collection("Requests").doc(id).delete();
        Swal.fire("تم الحذف");
    } else {
        Swal.fire("باسورد خطأ");
    }
}

loadAdminData();
