// ... (Firebase Initialize) ...

function loadAdminView(filter) {
    db.collection("Requests").orderBy("createdAt", "desc").onSnapshot(snap => {
        let h = "";
        snap.forEach(doc => {
            const d = doc.data();
            if(filter === 'all' || d.type === filter) {
                h += `<tr style="border-bottom:1px solid var(--border);">
                    <td style="padding:15px;">${d.name}</td>
                    <td>${d.refId}</td>
                    <td><span style="color:var(--primary)">${d.status}</span></td>
                    <td><button class="btn-glam" style="padding:5px 10px;" onclick="updateReq('${doc.id}')">تحديث</button></td>
                </tr>`;
            }
        });
        document.getElementById('admin-table-body').innerHTML = h;
    });
}

async function updateReq(id) {
    const { value: form } = await Swal.fire({
        title: 'تحديث الطلب',
        html: `
            <input id="sw-stg" class="swal2-input" placeholder="اسم المرحلة">
            <textarea id="sw-cm" class="swal2-textarea" placeholder="التعليق"></textarea>
            <label><input type="checkbox" id="sw-fin"> قرار نهائي وإغلاق؟</label>`,
        confirmButtonText: 'حفظ'
    });
    if(form) {
        const isFin = document.getElementById('sw-fin').checked;
        await db.collection("Requests").doc(id).update({
            status: isFin ? "اغلاق الطلب" : document.getElementById('sw-stg').value,
            tracking: firebase.firestore.FieldValue.arrayUnion({
                stage: document.getElementById('sw-stg').value,
                comment: document.getElementById('sw-cm').value,
                date: new Date().toLocaleString('ar-EG'),
                isFinal: isFin
            })
        });
    }
}
loadAdminView('all');
