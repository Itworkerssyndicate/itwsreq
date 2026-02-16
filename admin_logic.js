const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function loadView(type, btn) {
    document.querySelectorAll('.side-link').forEach(l => l.classList.remove('active'));
    if(btn) btn.classList.add('active');

    db.collection("Requests").orderBy("createdAt", "desc").onSnapshot(snap => {
        let h = "";
        snap.forEach(doc => {
            const d = doc.data();
            if(type === 'all' || d.type === type) {
                h += `<tr>
                    <td>${d.createdAt?.toDate().toLocaleDateString('ar-EG')}</td>
                    <td><b>${d.refId}</b></td>
                    <td>${d.name || '---'}<br><small>${d.memberId}</small></td>
                    <td>${d.type}</td>
                    <td><span class="badge">${d.status}</span></td>
                    <td>
                        <button class="badge" style="cursor:pointer; border:none;" onclick="openAdminCard('${doc.id}')">إدارة</button>
                        <button class="badge" style="background:#ff4757; cursor:pointer; border:none;" onclick="deleteReq('${doc.id}')">حذف</button>
                    </td>
                </tr>`;
            }
        });
        document.getElementById('tbody').innerHTML = h;
    });
}

async function openAdminCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    Swal.fire({
        title: 'تحديث حالة الطلب',
        width: '800px', background: '#0f172a', color: '#fff',
        html: `<div style="text-align:right;">
            <p>صاحب الطلب: ${d.name} | الرقم القومي: ${d.nationalId}</p>
            <p>رقم الهاتف: ${d.phone} | المهنة: ${d.job || '---'}</p>
            <hr><p>تفاصيل: ${d.details}</p><hr>
            <input id="n-stg" class="swal2-input" placeholder="اسم المرحلة (مثل: جاري التنفيذ)">
            <textarea id="n-cmm" class="swal2-textarea" placeholder="الرد أو التعليق"></textarea>
        </div>`,
        confirmButtonText: 'تحديث المسار'
    }).then(r => {
        if(r.isConfirmed) {
            const stg = document.getElementById('n-stg').value;
            if(!stg) return;
            db.collection("Requests").doc(id).update({
                status: stg,
                tracking: firebase.firestore.FieldValue.arrayUnion({stage: stg, comment: document.getElementById('n-cmm').value, date: new Date().toLocaleString('ar-EG')})
            });
        }
    });
}

function deleteReq(id) {
    Swal.fire({title:'حذف؟', icon:'warning', showCancelButton:true}).then(r=>{ if(r.isConfirmed) db.collection("Requests").doc(id).delete(); });
}

function showSettings() {
    Swal.fire({
        title: 'إعدادات المنظومة',
        html: `<input id="s-p" class="swal2-input" placeholder="اسم النقيب"><input id="s-l" class="swal2-input" placeholder="رابط اللوجو"><input id="s-link" class="swal2-input" placeholder="رابط الخدمات">`,
    }).then(r => {
        if(r.isConfirmed) {
            db.collection("SystemSettings").doc("mainConfig").update({
                presidentName: document.getElementById('s-p').value,
                logoUrl: document.getElementById('s-l').value,
                servicesLink: document.getElementById('s-link').value
            });
        }
    });
}

loadView('all');
