// ... Firebase Config (نفسه الموجود في app.js) ...

function loadData(filter) {
    db.collection("Requests").orderBy("createdAt", "desc").onSnapshot(snap => {
        let html = "";
        snap.forEach(doc => {
            const d = doc.data();
            if(filter === 'all' || d.type === filter) {
                html += `
                <tr>
                    <td>${d.createdAt.toDate().toLocaleDateString('ar-EG')}</td>
                    <td>${d.refId}</td>
                    <td><b>${d.name}</b><br><small>${d.job}</small></td>
                    <td>${d.gov}</td>
                    <td>${d.type}</td>
                    <td><span class="status-badge">${d.status}</span></td>
                    <td>
                        <button class="btn-nav" onclick="manageReq('${d.refId}')">⚙️</button>
                        <button class="btn-nav" style="background:#ff4757" onclick="deleteReq('${d.refId}')">🗑️</button>
                    </td>
                </tr>`;
            }
        });
        document.getElementById('admin-tbody').innerHTML = html;
    });
}

async function manageReq(id) {
    const snap = await db.collection("Requests").doc(id).get();
    const d = snap.data();

    const { value: form } = await Swal.fire({
        title: `إدارة طلب: ${d.name}`,
        html: `
            <select id="sw-status" class="swal2-input">
                <option value="قيد المراجعة">قيد المراجعة</option>
                <option value="جاري التنفيذ">جاري التنفيذ</option>
                <option value="تم الحل">تم الحل (إغلاق)</option>
            </select>
            <textarea id="sw-comm" class="swal2-textarea" placeholder="القرار النهائي أو الكومنت"></textarea>
        `,
        confirmButtonText: 'تحديث الحالة'
    });

    if(form) {
        const newStatus = document.getElementById('sw-status').value;
        const comment = document.getElementById('sw-comm').value;
        const isFinal = newStatus === "تم الحل";

        await db.collection("Requests").doc(id).update({
            status: newStatus,
            tracking: firebase.firestore.FieldValue.arrayUnion({
                status: newStatus,
                comment: comment,
                time: new Date().toLocaleString('ar-EG'),
                isFinal: isFinal
            })
        });
    }
}

async function deleteReq(id) {
    const { value: pass } = await Swal.fire({
        title: 'كلمة سر الحذف',
        input: 'password',
        inputPlaceholder: 'ادخل 11111@'
    });
    if(pass === '11111@') {
        await db.collection("Requests").doc(id).delete();
        Swal.fire("تم الحذف", "", "success");
    } else {
        Swal.fire("خطأ", "كلمة السر غلط", "error");
    }
}
loadData('all');
