const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const role = sessionStorage.getItem("role");

if(!role) window.location.href = "index.html";

function loadData(type, btn) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('content-box').style.display='block';
    document.getElementById('settings-box').style.display='none';

    db.collection("Requests").where("type","==",type).onSnapshot(snap => {
        let h = "";
        snap.forEach(doc => {
            const d = doc.data();
            h += `<tr>
                <td>${d.refId}</td>
                <td>${d.name}</td>
                <td>${d.gov}</td>
                <td><b style="color:var(--primary)">${d.status}</b></td>
                <td>
                    <button class="btn-view" onclick="openCard('${doc.id}')">إدارة</button>
                    ${role==='super' ? `<button class="btn-del" onclick="deleteDoc('${doc.id}')">حذف</button>` : ''}
                </td>
            </tr>`;
        });
        document.getElementById('tbody').innerHTML = h;
    });
}

async function openCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();

    const { value: form } = await Swal.fire({
        title: 'إدارة الطلب والطباعة',
        width: '750px',
        background: '#0f172a',
        color: '#fff',
        html: `
            <div id="p-card" style="text-align:right; border:1px solid #334155; padding:20px; border-radius:10px;">
                <h3 style="color:var(--primary); text-align:center;">بيانات الطلب الرقمي</h3>
                <p><b>الرقم المرجعي:</b> ${d.refId}</p>
                <p><b>اسم العضو:</b> ${d.name}</p>
                <p><b>الرقم القومي:</b> ${d.nationalId} | <b>التليفون:</b> ${d.phone}</p>
                <p><b>المحافظة:</b> ${d.gov} | <b>المهنة:</b> ${d.job}</p>
                <p><b>العنوان:</b> ${d.address}</p>
                <hr style="border-color:#334155">
                <p><b>الموضوع:</b><br>${d.details}</p>
            </div>
            <button class="main-btn" style="margin-top:10px; background:#10b981;" onclick="printDiv('p-card')">طباعة هذا الكارت</button>
            <input id="sw-stage" class="swal2-input" style="color:#000" placeholder="اسم المرحلة (مثلاً: جاري المراجعة)">
            <textarea id="sw-comm" class="swal2-textarea" style="color:#000" placeholder="اكتب تعليقك هنا"></textarea>
        `,
        showCancelButton: true,
        confirmButtonText: 'تحديث الحالة',
        cancelButtonText: 'إغلاق (تم المعالجة)'
    });

    if(form) {
        const s = document.getElementById('sw-stage').value;
        const c = document.getElementById('sw-comm').value;
        if(!s) return;
        await db.collection("Requests").doc(id).update({
            status: s,
            tracking: firebase.firestore.FieldValue.arrayUnion({stage: s, comment: c, date: new Date().toLocaleString('ar-EG')})
        });
    } else if (Swal.dismissReason === 'cancel') {
        await db.collection("Requests").doc(id).update({
            status: "تم",
            tracking: firebase.firestore.FieldValue.arrayUnion({stage: "تم", comment: "تمت معالجة الطلب بالكامل", date: new Date().toLocaleString('ar-EG')})
        });
    }
}

async function deleteDoc(id) {
    const { value: p } = await Swal.fire({ title: 'كلمة سر الحذف', input: 'password' });
    if(p === '11111@') {
        await db.collection("Requests").doc(id).delete();
        Swal.fire("تم الحذف بنجاح");
    } else if(p) {
        Swal.fire("خطأ", "كلمة السر غير صحيحة", "error");
    }
}

function printDiv(divId) {
    const content = document.getElementById(divId).innerHTML;
    const win = window.open('', '', 'height=600,width=800');
    win.document.write(`<html><head><title>طباعة</title><style>body{direction:rtl; font-family:Cairo; padding:20px;}</style></head><body>${content}</body></html>`);
    win.print();
    win.close();
}

function showSettings(btn) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('content-box').style.display='none';
    document.getElementById('settings-box').style.display='block';
}

// تحميل افتراضي
loadData('complaint', document.querySelector('.nav-link'));
