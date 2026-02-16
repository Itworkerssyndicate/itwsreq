const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// حماية متقدمة: منع الاختصارات
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && (e.key === 'p' || e.key === 's' || e.key === 'u' || e.key === 'c')) {
        e.preventDefault();
        alert("النسخ والطباعة غير مسموح بهما لدواعي الأمان");
    }
});

async function submitRequest() {
    const now = new Date();
    const timeCode = now.getFullYear().toString().slice(-2) + (now.getMonth()+1).toString().padStart(2,'0') + now.getDate().toString().padStart(2,'0') + now.getHours().toString().padStart(2,'0') + now.getMinutes().toString().padStart(2,'0');
    
    const d = { 
        name: document.getElementById('u-name').value, 
        nationalId: document.getElementById('u-nid').value,
        phone: document.getElementById('u-phone').value,
        gov: document.getElementById('u-gov').value,
        details: document.getElementById('u-details').value,
        type: 'complaint',
        timestamp: now.toLocaleString('ar-EG'),
        createdAt: firebase.firestore.Timestamp.now()
    };
    
    if(!d.name || !d.nationalId) return Swal.fire("تنبيه","أكمل الحقول","warning");
    
    const refId = "REQ-" + timeCode;
    await db.collection("Requests").add({ ...d, refId: refId, status: "تم الاستلام", tracking: [{stage: "تم الاستلام", comment: "تم استلام الطلب", date: d.timestamp}]});

    // تجهيز الكارت للتحميل
    document.getElementById('card-ref').innerText = refId;
    document.getElementById('card-date').innerText = d.timestamp;

    Swal.fire({
        title: "تم التسجيل بنجاح",
        html: `كود الطلب الخاص بك: <br><b class="allow-copy" style="font-size:24px;">${refId}</b><br><br>يُرجى حفظ الكود أو تحميله كصورة الآن`,
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "تحميل كارت الطلب (صورة)",
        cancelButtonText: "موافق"
    }).then((result) => {
        if (result.isConfirmed) {
            downloadCardAsImage(refId);
        }
    });
}

function downloadCardAsImage(refId) {
    const card = document.getElementById('download-card');
    html2canvas(card, { scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Union-Ticket-${refId}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
}

async function searchRequest() {
    const ref = document.getElementById('s-ref').value;
    const snap = await db.collection("Requests").where("refId","==",ref).get();
    if(snap.empty) return Swal.fire("خطأ","الكود غير صحيح","error");
    
    const data = snap.docs[0].data();
    let h = `<div style="padding:15px; background:rgba(255,255,255,0.05); border-radius:10px;">
                <p>الحالة الحالية: <b>${data.status}</b></p>
                <small>الكود المرجعي: <span class="allow-copy">${data.refId}</span></small>
             </div>`;
    document.getElementById('track-res').innerHTML = h;
}

function loginAdmin() {
    const u = document.getElementById('adm-u').value, p = document.getElementById('adm-p').value;
    if(u=="مدير" && p=="itws@manager@2026@") { sessionStorage.setItem("role","manager"); window.location.href="admin.html"; }
    else if(u=="الادمن_الرئيسي" && p=="itws@super@2026@") { sessionStorage.setItem("role","super"); window.location.href="admin.html"; }
    else Swal.fire("فشل","بيانات خاطئة","error");
}
