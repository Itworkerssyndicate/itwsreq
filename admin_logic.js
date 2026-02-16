const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const role = sessionStorage.getItem("role");

function loadData(type) {
    document.getElementById('v-title').innerText = "سجل " + (type=='شكوى'?'الشكاوى':'المقترحات');
    db.collection("Requests").where("type","==",type).onSnapshot(snap => {
        let h = "";
        snap.forEach(doc => {
            const d = doc.data();
            h += `<tr>
                <td>${d.refId}</td>
                <td>${d.name}</td>
                <td>${d.nationalId}</td>
                <td>${d.gov}</td>
                <td><b>${d.status}</b></td>
                <td>
                    <button onclick="openCard('${doc.id}')" style="background:#10b981; border:none; padding:5px 10px; color:#fff; border-radius:5px; cursor:pointer;">عرض</button>
                    ${role=='super' ? `<button onclick="deleteDoc('${doc.id}')" style="background:#ef4444; border:none; padding:5px 10px; color:#fff; border-radius:5px; margin-right:5px;">حذف</button>` : ''}
                </td>
            </tr>`;
        });
        document.getElementById('tbody').innerHTML = h || "<tr><td colspan='6'>لا يوجد بيانات</td></tr>";
    });
}

async function openCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    Swal.fire({
        title: 'إدارة الطلب',
        background: '#0a1120', color: '#fff',
        width: '90%',
        html: `
            <div style="text-align:right; font-size:14px; border:1px solid #334155; padding:10px; border-radius:8px;">
                <p><b>مقدم الطلب:</b> ${d.name}</p>
                <p><b>الرقم القومي:</b> ${d.nationalId}</p>
                <p><b>المحافظة:</b> ${d.gov} | <b>الهاتف:</b> ${d.phone}</p>
                <p><b>المهنة:</b> ${d.job}</p>
                <p><b>التفاصيل:</b> ${d.details}</p>
                <hr style="margin:10px 0; border-color:#334155;">
                <label>تحديث الحالة:</label>
                <select id="sw-status" class="swal2-input" style="color:#000; width:100%; height:40px;">
                    <option value="قيد المراجعة">قيد المراجعة</option>
                    <option value="جاري التنفيذ">جاري التنفيذ</option>
                    <option value="تم">تم بنجاح (إغلاق)</option>
                </select>
                <textarea id="sw-comm" class="swal2-textarea" placeholder="رد الإدارة" style="color:#000; height:70px;"></textarea>
            </div>`,
        confirmButtonText: 'تحديث البيانات'
    }).then(r => {
        if(r.isConfirmed) updateStage(id, document.getElementById('sw-status').value, document.getElementById('sw-comm').value);
    });
}

async function updateStage(id, status, comment) {
    await db.collection("Requests").doc(id).update({
        status: status,
        tracking: firebase.firestore.FieldValue.arrayUnion({
            stage: status, comment: comment || "تم التحديث", date: new Date().toLocaleString('ar-EG')
        })
    });
    Swal.fire("تم التحديث");
}

async function deleteDoc(id) {
    const { value: p } = await Swal.fire({ title: 'كلمة سر الحذف', input: 'password' });
    if(p === '11111@') { 
        await db.collection("Requests").doc(id).delete(); 
        Swal.fire("تم الحذف"); 
    } else {
        Swal.fire("خطأ","كلمة السر غير صحيحة","error");
    }
}

loadData('شكوى');
