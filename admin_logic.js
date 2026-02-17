const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function loadView(type, btn) {
    document.querySelectorAll('.side-item').forEach(i => i.classList.remove('active'));
    if(btn) btn.classList.add('active');

    db.collection("Requests").orderBy("createdAt", "desc").onSnapshot(snap => {
        let h = "";
        snap.forEach(doc => {
            const d = doc.data();
            if(type === 'all' || d.type === type) {
                h += `<tr>
                    <td>${d.createdAt?.toDate().toLocaleDateString('ar-EG') || '---'}</td>
                    <td>${d.refId}</td>
                    <td>${d.name}<br><small>${d.isMember}: ${d.memberId}</small></td>
                    <td>${d.type}</td>
                    <td><span class="badge">${d.status}</span></td>
                    <td>
                        <button class="svc-btn" style="padding:4px 10px" onclick="openCard('${doc.id}')">إدارة</button>
                        <button class="del-btn" onclick="deleteReq('${doc.id}')">حذف</button>
                    </td>
                </tr>`;
            }
        });
        document.getElementById('tbody').innerHTML = h;
    });
}

async function openCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    Swal.fire({
        title: 'تفاصيل الطلب',
        width: '800px', background: '#0f172a', color: '#fff',
        html: `<div style="text-align:right; font-size:14px;">
            <p>👤 الاسم: ${d.name} | 🆔 القومي: ${d.nationalId}</p>
            <p>📞 الهاتف: ${d.phone} | 🏗️ المهنة: ${d.job}</p>
            <p>📍 العنوان: ${d.address} (${d.gov})</p>
            <hr><p>📝 التفاصيل: ${d.details}</p><hr>
            <input id="n-stg" class="swal2-input" placeholder="المرحلة الجديدة">
            <textarea id="n-cmm" class="swal2-textarea" placeholder="التعليق..."></textarea>
        </div>`,
        confirmButtonText: 'تحديث الحالة'
    }).then(r => {
        if(r.isConfirmed) {
            const stg = document.getElementById('n-stg').value;
            if(!stg) return;
            db.collection("Requests").doc(id).update({
                status: stg,
                tracking: firebase.firestore.FieldValue.arrayUnion({ stage: stg, comment: document.getElementById('n-cmm').value, date: new Date().toLocaleString('ar-EG') })
            });
        }
    });
}

async function deleteReq(id) {
    const r = await Swal.fire({ title: 'هل أنت متأكد؟', icon: 'warning', showCancelButton: true });
    if(r.isConfirmed) db.collection("Requests").doc(id).delete();
}

function showSettings() {
    Swal.fire({
        title: 'الإعدادات العامة',
        html: `<input id="set-p" class="swal2-input" placeholder="اسم النقيب"><input id="set-l" class="swal2-input" placeholder="رابط اللوجو">`,
    }).then(r => { if(r.isConfirmed) db.collection("SystemSettings").doc("mainConfig").update({ presidentName: document.getElementById('set-p').value, logoUrl: document.getElementById('set-l').value }); });
}

loadView('all');
