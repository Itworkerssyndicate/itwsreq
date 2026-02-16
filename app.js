const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

window.onload = async () => {
    const doc = await db.collection("SystemSettings").doc("mainConfig").get();
    if(doc.exists) document.getElementById("pres-display").innerText = doc.data().presidentName;
};

async function submitRequest() {
    const now = new Date();
    const refId = `${now.getFullYear()}/${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}/${Math.floor(100+Math.random()*899)}`;
    const d = { 
        name: document.getElementById('u-name').value, nationalId: document.getElementById('u-nid').value,
        phone: document.getElementById('u-phone').value, gov: document.getElementById('u-gov').value,
        address: document.getElementById('u-address').value, job: document.getElementById('u-job').value,
        details: document.getElementById('u-details').value, type: document.getElementById('u-type').value,
        timestamp: now.toLocaleString('ar-EG'), createdAt: firebase.firestore.Timestamp.now()
    };
    if(!d.name || d.nationalId.length != 14) return Swal.fire("خطأ","أكمل البيانات","error");
    await db.collection("Requests").add({ ...d, refId: refId, status: "تم الاستلام", tracking: [{stage: "تم الاستلام", comment: "تم استلام الطلب", date: d.timestamp}]});
    document.getElementById('card-ref').innerText = refId;
    document.getElementById('card-name').innerText = d.name;
    document.getElementById('card-date').innerText = d.timestamp;
    Swal.fire("تم التسجيل",`كودك: ${refId}`,"success").then(() => downloadCard());
}

function downloadCard() {
    html2canvas(document.getElementById('download-card')).then(canvas => {
        const link = document.createElement('a'); link.download = 'Ticket.png'; link.href = canvas.toDataURL(); link.click();
    });
}

async function searchRequest() {
    const ref = document.getElementById('s-ref').value, nid = document.getElementById('s-nid').value, type = document.getElementById('s-type').value;
    const snap = await db.collection("Requests").where("refId","==",ref).where("nationalId","==",nid).get();
    if(snap.empty) return Swal.fire("خطأ","البيانات غير صحيحة","error");
    const data = snap.docs[0].data();
    
    // التتبع المائي
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل"];
    let currentIdx = stages.indexOf(data.status);
    if(currentIdx == -1) currentIdx = 1; // إذا كانت المرحلة مسمية يدوياً نعتبرها "قيد التنفيذ"
    if(data.status == "تم الحل") currentIdx = 3;

    let h = `<div class="progress-container">
        <div class="progress-line"></div>
        <div class="progress-fill" style="width:${(currentIdx/3)*100}%"></div>
        ${stages.map((s,i)=>`<div class="step-node ${i<=currentIdx?'active':''}"><i class="fas fa-check"></i><span>${s}</span></div>`).join('')}
    </div>`;
    h += data.tracking.map(t=>`<div class="log-card"><b>${t.stage}</b>${t.comment}<br><small>${t.date}</small></div>`).reverse().join('');
    document.getElementById('track-res').innerHTML = h;
}

function loginAdmin() {
    const u = document.getElementById('adm-u').value, p = document.getElementById('adm-p').value;
    if((u=="مدير" && p=="itws@manager@2026@") || (u=="الادمن_الرئيسي" && p=="itws@super@2026@")) {
        sessionStorage.setItem("role", u=="مدير"?"manager":"super"); window.location.href="admin.html";
    } else Swal.fire("خطأ","بيانات خاطئة","error");
}
