// ... Firebase Config (نفسه) ...
const db = firebase.firestore();

function loadAdmin() {
    db.collection("Requests").orderBy("createdAt", "desc").onSnapshot(snap => {
        let h = "";
        snap.forEach(doc => {
            const d = doc.data();
            h += `<tr>
                <td>${d.createdAt?.toDate().toLocaleString('ar-EG') || '--'}</td>
                <td>${d.name}</td><td>${d.gov}</td><td>${d.job}</td><td>${d.type}</td>
                <td style="color:var(--cyan)">${d.status}</td>
                <td>
                    <button onclick="manageID('${doc.id}')">⚙️</button>
                    <button onclick="delID('${doc.id}')" style="color:var(--danger)">🗑️</button>
                </td>
            </tr>`;
        });
        document.getElementById('adm-body').innerHTML = h;
    });
}

async function manageID(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    document.getElementById('adm-modal').style.display = 'block';
    
    document.getElementById('modal-data').innerHTML = `
        <h3>إدارة طلب: ${d.refId}</h3>
        <p><b>الاسم:</b> ${d.name} (${d.member})</p>
        <p><b>التفاصيل:</b> ${d.details}</p>
        <hr style="margin:15px 0; opacity:0.1">
        <select id="m-status">
            <option>قيد المراجعة</option><option>جاري التنفيذ</option><option>تم الحل</option>
        </select>
        <textarea id="m-comm" placeholder="اكتب الرد هنا..."></textarea>
        <label><input type="checkbox" id="m-final"> قرار نهائي؟</label>
        <button class="btn-submit" onclick="saveStatus('${id}')">تحديث الحالة</button>
    `;
}

async function saveStatus(id) {
    const s = document.getElementById('m-status').value;
    const c = document.getElementById('m-comm').value;
    const f = document.getElementById('m-final').checked;
    await db.collection("Requests").doc(id).update({
        status: s,
        tracking: firebase.firestore.FieldValue.arrayUnion({ s, c, t: new Date().toLocaleString('ar-EG'), isFinal: f })
    });
    Swal.fire("تم التحديث");
}

async function delID(id) {
    const { value: p } = await Swal.fire({ title: 'باسورد الحذف', input: 'password' });
    if(p === '11111@') {
        await db.collection("Requests").doc(id).delete();
        Swal.fire("تم الحذف");
    }
}

loadAdmin();
