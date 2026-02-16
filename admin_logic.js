const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function loadData(type) {
    document.getElementById('v-title').innerText = "سجل " + type + "ات";
    db.collection("Requests").where("type","==",type).onSnapshot(snap => {
        let h = "";
        snap.forEach(doc => {
            const d = doc.data();
            h += `<tr>
                <td>${d.refId}</td><td>${d.name}</td><td>${d.status}</td>
                <td>
                    <button class="main-btn" style="padding:5px;" onclick="openCard('${doc.id}')">فتح</button>
                    <button class="main-btn" style="padding:5px; background:#ef4444;" onclick="deleteReq('${doc.id}')">حذف</button>
                </td></tr>`;
        });
        document.getElementById('tbody').innerHTML = h || "<tr><td colspan='4'>لا توجد بيانات</td></tr>";
    });
}

async function openCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    Swal.fire({
        title: 'تفاصيل الطلب',
        background: '#0a1120', color: '#fff',
        html: `<div style="text-align:right;">
            <p>الاسم: ${d.name}</p>
            <p>المهنة: ${d.job || '-'}</p>
            <p>الرقم القومي: ${d.nationalId}</p>
            <hr>
            <input id="n-stage" class="swal2-input" placeholder="المرحلة">
            <textarea id="n-comm" class="swal2-textarea" placeholder="الرد"></textarea>
        </div>`,
        confirmButtonText: 'تحديث'
    }).then(r => {
        if(r.isConfirmed) updateStep(id, document.getElementById('n-stage').value, document.getElementById('n-comm').value);
    });
}

async function updateStep(id, stage, comm) {
    if(!stage) return;
    await db.collection("Requests").doc(id).update({
        status: stage,
        tracking: firebase.firestore.FieldValue.arrayUnion({
            stage: stage, comment: comm || "تحديث إداري", date: new Date().toLocaleString('ar-EG')
        })
    });
}

async function deleteReq(id) {
    const { value: pass } = await Swal.fire({ title: 'باسورد الحذف', input: 'password' });
    if(pass === '11111@') {
        await db.collection("Requests").doc(id).delete();
    }
}
loadData('شكوى');
