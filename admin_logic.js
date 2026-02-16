const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function loadData(type) {
    document.getElementById('v-title').innerText = "سجل " + type + "ات";
    db.collection("Requests").where("type","==",type).orderBy("createdAt","desc").onSnapshot(snap => {
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
        document.getElementById('tbody').innerHTML = h || "<tr><td colspan='4'>لا توجد بيانات</td></tr>";
    }, err => {
        // إذا حدث خطأ في الترتيب بسبب عدم وجود Index في فايربيز
        console.log("Fallback to normal load");
        db.collection("Requests").where("type","==",type).onSnapshot(snap => { /* نفس الكود بدون ترتيب */ });
    });
}

async function openAdminCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    Swal.fire({
        title: 'تحديث حالة الطلب',
        background: '#0a1120', color: '#fff',
        html: `<div style="text-align:right; font-size:13px;">
            <p>الاسم: ${d.name}</p><p>المهنة: ${d.job || '-'}</p><p>القومي: ${d.nationalId}</p>
            <hr style="opacity:0.2; margin:10px 0;">
            <input id="n-stage" class="swal2-input" placeholder="اسم المرحلة (مثال: جاري التنفيذ)">
            <textarea id="n-comm" class="swal2-textarea" placeholder="رد الإدارة على المواطن"></textarea>
        </div>`,
        confirmButtonText: 'تحديث'
    }).then(r => {
        if(r.isConfirmed) {
            db.collection("Requests").doc(id).update({
                status: document.getElementById('n-stage').value,
                tracking: firebase.firestore.FieldValue.arrayUnion({
                    stage: document.getElementById('n-stage').value,
                    comment: document.getElementById('n-comm').value,
                    date: new Date().toLocaleString('ar-EG')
                })
            });
        }
    });
}

async function deleteReq(id) {
    const { value: pass } = await Swal.fire({ title: 'باسورد الحذف', input: 'password', inputPlaceholder: 'أدخل الباسورد' });
    if(pass === '11111@') {
        await db.collection("Requests").doc(id).delete();
        Swal.fire("تم", "حُذف الطلب بنجاح", "success");
    } else if(pass) {
        Swal.fire("خطأ", "الباسورد غلط", "error");
    }
}
loadData('شكوى');
