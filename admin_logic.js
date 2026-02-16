const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const role = sessionStorage.getItem("role");

function loadData(type) {
    document.getElementById('v-title').innerText = "سجل " + type + "ات الأحدث";
    db.collection("Requests")
      .where("type","==",type)
      .orderBy("createdAt", "desc")
      .onSnapshot(snap => {
        let h = "";
        snap.forEach(doc => {
            const d = doc.data();
            h += `<tr>
                <td>${d.refId}</td><td>${d.name}</td><td>${d.nationalId}</td><td>${d.gov}</td>
                <td><b style="color:#00d2ff">${d.status}</b></td>
                <td>
                    <button onclick="openCard('${doc.id}')" style="background:#10b981; border:none; padding:5px 10px; color:#fff; border-radius:5px; cursor:pointer;">فتح</button>
                    ${role=='super' ? `<button onclick="deleteDoc('${doc.id}')" style="background:#ef4444; border:none; padding:5px 10px; color:#fff; border-radius:5px; margin-right:5px;">حذف</button>` : ''}
                </td></tr>`;
        });
        document.getElementById('tbody').innerHTML = h || "<tr><td colspan='6'>لا يوجد طلبات</td></tr>";
    });
}

async function openCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    
    let historyHtml = d.tracking.map(t => `
        <div style="border-bottom:1px solid #334155; padding:5px; font-size:12px;">
            <b>${t.stage}</b>: ${t.comment} <br> <small style="color:#94a3b8">${t.date}</small>
        </div>`).reverse().join('');

    Swal.fire({
        title: 'إدارة الطلب والرد',
        background: '#0a1120', color: '#fff', width: '90%',
        html: `
            <div style="text-align:right; font-size:13px;">
                <p><b>مقدم الطلب:</b> ${d.name} | <b>العنوان:</b> ${d.address}</p>
                <p><b>التليفون:</b> ${d.phone} | <b>المهنة:</b> ${d.job}</p>
                <p><b>التفاصيل:</b> ${d.details}</p>
                <hr style="margin:10px 0;">
                <label>تغيير الحالة إلى:</label>
                <select id="new-status" class="swal2-input" style="color:#000; height:35px; margin:5px 0;">
                    <option value="قيد المراجعة">قيد المراجعة</option>
                    <option value="جاري التنفيذ">جاري التنفيذ</option>
                    <option value="تم الحل والإغلاق">تم الحل والإغلاق</option>
                    <option value="مرفوض">رفض الطلب</option>
                </select>
                <label>الرد الإداري (سيظهر للمواطن):</label>
                <textarea id="admin-comment" class="swal2-textarea" placeholder="اكتب الرد هنا..." style="color:#000; height:60px;"></textarea>
                <p style="color:#00d2ff; margin-top:10px;">سجل الإجراءات السابقة:</p>
                <div style="max-height:120px; overflow-y:auto; background:rgba(0,0,0,0.3); padding:10px; border-radius:5px;">${historyHtml}</div>
            </div>`,
        confirmButtonText: 'حفظ التحديث'
    }).then(r => {
        if(r.isConfirmed) updateTrack(id, document.getElementById('new-status').value, document.getElementById('admin-comment').value);
    });
}

async function updateTrack(id, newStatus, comment) {
    await db.collection("Requests").doc(id).update({
        status: newStatus,
        tracking: firebase.firestore.FieldValue.arrayUnion({
            stage: newStatus, comment: comment || "تم تحديث الحالة", date: new Date().toLocaleString('ar-EG')
        })
    });
    Swal.fire("تم الحفظ","تم إضافة الإجراء لسجل التتبع","success");
}

async function deleteDoc(id) {
    const { value: p } = await Swal.fire({ title: 'كلمة سر الحذف', input: 'password' });
    if(p === '11111@') { await db.collection("Requests").doc(id).delete(); Swal.fire("تم الحذف"); }
}

loadData('شكوى');
