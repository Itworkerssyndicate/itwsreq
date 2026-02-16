const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function loadData(type) {
    document.getElementById('v-title').innerText = "سجل " + (type === 'شكوى' ? 'الشكاوى' : 'المقترحات');
    db.collection("Requests").where("type","==",type).onSnapshot(snap => {
        let h = "";
        snap.forEach(doc => {
            const d = doc.data();
            h += `<tr>
                <td>${d.refId}</td><td>${d.name}</td><td>${d.status}</td>
                <td>
                    <button class="main-btn" style="padding:5px; margin:0;" onclick="openAdminCard('${doc.id}')">فتح</button>
                    <button class="main-btn btn-red" style="padding:5px; margin:5px 0 0 0;" onclick="deleteReq('${doc.id}')">حذف</button>
                </td></tr>`;
        });
        document.getElementById('tbody').innerHTML = h || "<tr><td colspan='4'>لا توجد بيانات حالياً</td></tr>";
    });
}

async function openAdminCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    Swal.fire({
        title: 'معالجة الطلب',
        background: '#0a1120', color: '#fff', width: '95%',
        html: `<div style="text-align:right; font-size:13px;">
            <p><b>الاسم:</b> ${d.name}</p>
            <p><b>القومي:</b> ${d.nationalId} | <b>المهنة:</b> ${d.job || '-'}</p>
            <p><b>العنوان:</b> ${d.address || 'غير محدد'}</p>
            <p><b>التفاصيل:</b> ${d.details}</p>
            <hr style="opacity:0.1; margin:10px 0;">
            <input id="n-stage" class="swal2-input" placeholder="اسم المرحلة الحالية">
            <textarea id="n-comm" class="swal2-textarea" placeholder="الرد الإداري"></textarea>
        </div>`,
        confirmButtonText: 'تحديث'
    }).then(r => {
        if(r.isConfirmed && document.getElementById('n-stage').value) {
            db.collection("Requests").doc(id).update({
                status: document.getElementById('n-stage').value,
                tracking: firebase.firestore.FieldValue.arrayUnion({
                    stage: document.getElementById('n-stage').value,
                    comment: document.getElementById('n-comm').value || "تم تحديث حالة الطلب",
                    date: new Date().toLocaleString('ar-EG')
                })
            });
        }
    });
}

async function deleteReq(id) {
    const { value: pass } = await Swal.fire({ title: 'باسورد الحذف', input: 'password' });
    if(pass === '11111@') {
        await db.collection("Requests").doc(id).delete();
        Swal.fire("تم", "حُذف بنجاح", "success");
    } else if(pass) {
        Swal.fire("خطأ", "الباسورد غير صحيح", "error");
    }
}

loadData('شكوى');
