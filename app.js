const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

window.onload = async () => {
    const doc = await db.collection("SystemSettings").doc("mainConfig").get();
    if(doc.exists) document.getElementById("pres-display").innerText = doc.data().presidentName;
};

async function submitRequest() {
    const now = new Date();
    // كود منظم: 2026/0216/785
    const refId = `${now.getFullYear()}/${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}/${Math.floor(100 + Math.random() * 899)}`;
    
    const d = { 
        name: document.getElementById('u-name').value, 
        nationalId: document.getElementById('u-nid').value,
        phone: document.getElementById('u-phone').value,
        gov: document.getElementById('u-gov').value,
        address: document.getElementById('u-address').value,
        details: document.getElementById('u-details').value,
        type: document.getElementById('u-type').value,
        timestamp: now.toLocaleString('ar-EG'),
        createdAt: firebase.firestore.Timestamp.now()
    };
    
    if(!d.name || !d.nationalId || !d.address || !d.details) return Swal.fire("تنبيه","برجاء إكمال كافة الحقول","warning");
    if(d.nationalId.length !== 14) return Swal.fire("تنبيه","الرقم القومي غير صحيح","warning");

    await db.collection("Requests").add({ 
        ...d, refId: refId, status: "تم الاستلام", 
        tracking: [{stage: "تم الاستلام", comment: "تم فتح الطلب بنجاح في النظام الرقمي", date: d.timestamp}]
    });

    document.getElementById('card-ref').innerText = refId;
    document.getElementById('card-name').innerText = d.name;
    document.getElementById('card-date').innerText = d.timestamp;

    Swal.fire({
        title: "تم التسجيل بنجاح",
        html: `كود الطلب: <b class="allow-copy">${refId}</b>`,
        icon: "success",
        confirmButtonText: "تحميل كارت الطلب (صورة)"
    }).then(() => downloadCard(refId));
}

function downloadCard(refId) {
    html2canvas(document.getElementById('download-card'), { scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Union-${refId.replace(/\//g,'-')}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
}

async function searchRequest() {
    const ref = document.getElementById('s-ref').value;
    const nid = document.getElementById('s-nid').value;
    const type = document.getElementById('s-type').value;

    const snap = await db.collection("Requests")
        .where("refId","==",ref)
        .where("nationalId","==",nid)
        .where("type","==",type).get();

    if(snap.empty) return Swal.fire("خطأ","البيانات غير متطابقة، تأكد من الكود والرقم القومي","error");
    
    const d = snap.docs[0].data();
    let logsHtml = d.tracking.map(t => `
        <div class="track-log-item">
            <b>${t.stage}</b>
            <p>${t.comment}</p>
            <small>${t.date}</small>
        </div>`).reverse().join('');

    document.getElementById('track-res').innerHTML = `<h4>حالة الطلب:</h4>` + logsHtml;
}

function loginAdmin() {
    const u = document.getElementById('adm-u').value, p = document.getElementById('adm-p').value;
    if(u=="مدير" && p=="itws@manager@2026@") { sessionStorage.setItem("role","manager"); window.location.href="admin.html"; }
    else if(u=="الادمن_الرئيسي" && p=="itws@super@2026@") { sessionStorage.setItem("role","super"); window.location.href="admin.html"; }
    else Swal.fire("فشل","بيانات الدخول خاطئة","error");
}
