const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// حماية الاختصارات
document.addEventListener('keydown', e => { if (e.ctrlKey && (e.key === 'p' || e.key === 's' || e.key === 'u')) e.preventDefault(); });

window.onload = async () => {
    const doc = await db.collection("SystemSettings").doc("mainConfig").get();
    if(doc.exists) document.getElementById("president-name").innerText = "النقيب العام: " + doc.data().presidentName;
};

async function submitRequest() {
    const now = new Date();
    const timeCode = now.getFullYear().toString().slice(-2) + (now.getMonth()+1).toString().padStart(2,'0') + now.getDate().toString().padStart(2,'0') + now.getHours().toString().padStart(2,'0') + now.getMinutes().toString().padStart(2,'0');
    
    const d = { 
        name: document.getElementById('u-name').value, 
        nationalId: document.getElementById('u-nid').value,
        phone: document.getElementById('u-phone').value,
        gov: document.getElementById('u-gov').value,
        job: document.getElementById('u-job').value,
        details: document.getElementById('u-details').value,
        type: document.getElementById('u-type').value,
        timestamp: now.toLocaleString('ar-EG'),
        createdAt: firebase.firestore.Timestamp.now()
    };
    
    if(!d.name || !d.nationalId || !d.details) return Swal.fire("تنبيه","أكمل كافة البيانات","warning");
    
    const refId = (d.type=='شكوى'?'REQ-':'SUG-') + timeCode;
    await db.collection("Requests").add({ ...d, refId: refId, status: "تم الاستلام", tracking: [{stage: "تم الاستلام", comment: "تم استلام طلبك", date: d.timestamp}]});

    // تجهيز كارت الصورة
    document.getElementById('card-ref').innerText = refId;
    document.getElementById('card-name').innerText = d.name;
    document.getElementById('card-date').innerText = d.timestamp;

    Swal.fire({
        title: "تم التسجيل بنجاح",
        html: `كود الطلب: <b class="allow-copy">${refId}</b><br>يرجى تحميل الكارت للضرورة`,
        icon: "success",
        confirmButtonText: "تحميل كارت الطلب (صورة)",
        allowOutsideClick: false
    }).then(() => downloadCard(refId));
}

function downloadCard(refId) {
    const card = document.getElementById('download-card');
    html2canvas(card, { scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Ticket-${refId}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
}

async function searchRequest() {
    const ref = document.getElementById('s-ref').value;
    const snap = await db.collection("Requests").where("refId","==",ref).get();
    if(snap.empty) return Swal.fire("خطأ","الكود غير صحيح","error");
    
    const d = snap.docs[0].data();
    document.getElementById('track-res').innerHTML = `
        <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:10px; text-align:right; font-size:0.9rem;">
            <p><b>مقدم الطلب:</b> ${d.name}</p>
            <p><b>نوع الطلب:</b> ${d.type}</p>
            <p><b>الحالة:</b> <span style="color:#00d2ff">${d.status}</span></p>
            <hr style="margin:10px 0; border-color:#334155;">
            ${d.tracking.reverse().map(t=> `<p>• ${t.stage}: ${t.comment}</p>`).join('')}
        </div>`;
}

function loginAdmin() {
    const u = document.getElementById('adm-u').value, p = document.getElementById('adm-p').value;
    if((u=="مدير" && p=="itws@manager@2026@") || (u=="الادمن_الرئيسي" && p=="itws@super@2026@")) {
        sessionStorage.setItem("role", u=="مدير"?"manager":"super");
        window.location.href="admin.html";
    } else Swal.fire("فشل","البيانات خاطئة","error");
}
