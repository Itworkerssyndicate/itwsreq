const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function loadData(type, btn) {
    document.querySelectorAll('.nav-link').forEach(l => l.style.background = 'transparent');
    if(btn) btn.style.background = '#0ea5e9';
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
                <td style="color:#00d2ff; font-weight:bold;">${d.status}</td>
                <td>
                    <button class="btn-view" onclick="openCard('${doc.id}')"><i class="fas fa-edit"></i> إدارة</button>
                    <button class="btn-del" onclick="deleteDoc('${doc.id}')" style="background:#ef4444; border:none; padding:5px; border-radius:5px; color:white; cursor:pointer;"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        });
        document.getElementById('tbody').innerHTML = h;
    });
}

async function openCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();

    // بناء سجل التتبع للطباعة التفصيلية
    let historyHtml = d.tracking.map(t => `<div style="border-bottom:1px dotted #ccc; padding:5px;"><b>${t.stage}:</b> ${t.comment} <small>(${t.date})</small></div>`).join('');

    Swal.fire({
        title: 'تفاصيل الطلب الكاملة',
        width: '800px',
        background: '#111827',
        color: '#fff',
        html: `
            <div id="full-card-print" style="text-align:right; border:2px solid #334155; padding:20px; border-radius:10px; font-family:Cairo;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid var(--primary); padding-bottom:10px;">
                    <h3 style="margin:0;">تقرير طلب رقم: ${d.refId}</h3>
                    <span style="background:var(--primary); color:black; padding:5px 10px; border-radius:5px;">حالة الطلب: ${d.status}</span>
                </div>
                <div class="input-grid" style="margin-top:20px; color:#ddd;">
                    <p><b>الاسم:</b> ${d.name}</p>
                    <p><b>الرقم القومي:</b> ${d.nationalId}</p>
                    <p><b>التليفون:</b> ${d.phone} | <b>المحافظة:</b> ${d.gov}</p>
                    <p><b>المهنة:</b> ${d.job} | <b>العنوان:</b> ${d.address}</p>
                </div>
                <hr>
                <p><b>موضوع الطلب:</b><br>${d.details}</p>
                <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:10px;">
                    <h4>سجل التتبع والمراحل:</h4>
                    ${historyHtml}
                </div>
            </div>
            <button class="btn-print-card" onclick="printDetailedCard()" style="margin-top:15px; width:100%; padding:15px;"><i class="fas fa-print"></i> طباعة هذا الكارت تفصيلياً</button>
            <div style="margin-top:20px;">
                <input id="next-stage" class="swal2-input" placeholder="اسم المرحلة القادمة" style="color:black">
                <textarea id="next-comm" class="swal2-textarea" placeholder="اكتب ملاحظاتك.." style="color:black"></textarea>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'تحديث المرحلة',
        cancelButtonText: 'إغلاق',
        preConfirm: () => {
            const stage = document.getElementById('next-stage').value;
            const comm = document.getElementById('next-comm').value;
            if(!stage) return false;
            return { stage, comm };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            updateStatus(id, result.value.stage, result.value.comm);
        }
    });
}

async function updateStatus(id, stage, comm) {
    await db.collection("Requests").doc(id).update({
        status: stage,
        tracking: firebase.firestore.FieldValue.arrayUnion({
            stage: stage,
            comment: comm || "تحديث إداري",
            date: new Date().toLocaleString('ar-EG')
        })
    });
    Swal.fire("تم التحديث", "", "success");
}

function printDetailedCard() {
    const content = document.getElementById('full-card-print').innerHTML;
    const win = window.open('', '', 'height=800,width=1000');
    win.document.write(`
        <html>
        <head><title>طباعة طلب</title>
        <style>
            body { direction: rtl; font-family: 'Cairo', sans-serif; padding: 40px; }
            hr { border: 1px solid #eee; }
            h3 { color: #0088cc; border-bottom: 2px solid #0088cc; padding-bottom: 10px; }
            .input-grid { display: block; line-height: 1.8; }
        </style>
        </head>
        <body>${content}</body>
        </html>
    `);
    win.document.close();
    win.print();
}

async function deleteDoc(id) {
    const { value: p } = await Swal.fire({ title: 'كلمة سر الحذف', input: 'password', inputPlaceholder: '11111@' });
    if(p === '11111@') {
        await db.collection("Requests").doc(id).delete();
        Swal.fire("تم الحذف");
    } else if(p) {
        Swal.fire("خطأ", "كلمة السر خاطئة", "error");
    }
}

// تحميل افتراضي
loadData('complaint');
