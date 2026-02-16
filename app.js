const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// جلب اسم النقيب
db.collection("SystemSettings").doc("mainConfig").onSnapshot(doc => {
    if(doc.exists) document.getElementById("pres-display").innerText = doc.data().presidentName;
});

async function submitRequest() {
    const btn = document.getElementById('submitBtn');
    const n = document.getElementById('u-name').value;
    const nid = document.getElementById('u-nid').value;
    if(!n || nid.length !== 14) return Swal.fire("خطأ","يرجى إكمال البيانات بدقة","error");

    btn.disabled = true;
    const now = new Date();
    const refId = `${now.getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    const d = {
        name: n, nationalId: nid, job: document.getElementById('u-job').value,
        phone: document.getElementById('u-phone').value, gov: document.getElementById('u-gov').value,
        address: document.getElementById('u-address').value, details: document.getElementById('u-details').value,
        type: document.getElementById('u-type').value, status: "تم الاستلام", refId: refId,
        createdAt: firebase.firestore.Timestamp.now(),
        tracking: [{stage: "تم الاستلام", comment: "تم استلام طلبكم", date: now.toLocaleString('ar-EG')}]
    };

    await db.collection("Requests").add(d);
    document.getElementById('card-ref').innerText = refId;
    document.getElementById('card-name').innerText = n;
    document.getElementById('card-date').innerText = now.toLocaleString('ar-EG');
    Swal.fire("تم الإرسال",`كود الطلب: ${refId}`,"success").then(() => downloadCard());
    btn.disabled = false;
}

function downloadCard() {
    html2canvas(document.getElementById('download-card')).then(canvas => {
        const a = document.createElement('a'); a.download = 'Receipt.png'; a.href = canvas.toDataURL(); a.click();
    });
}

async function searchRequest() {
    const type = document.getElementById('s-type').value;
    const nid = document.getElementById('s-nid').value;
    const ref = document.getElementById('s-ref').value;

    const snap = await db.collection("Requests")
        .where("type","==",type).where("nationalId","==",nid).where("refId","==",ref).get();

    if(snap.empty) return Swal.fire("خطأ","لا توجد بيانات تطابق مدخلاتك","error");
    
    const d = snap.docs[0].data();
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل"];
    let idx = stages.indexOf(d.status); if(idx === -1) idx = 1;
    
    let h = `<div class="progress-container"><div class="progress-line"></div><div class="progress-fill" style="width:${(idx/3)*100}%"></div>
        ${stages.map((s,i)=>`<div class="step-node ${i<=idx?'active':''}"><i class="fas fa-check"></i><span>${s}</span></div>`).join('')}</div>`;
    h += d.tracking.map(t=>`<div class="log-card"><b>${t.stage}</b><br>${t.comment}<br><small>${t.date}</small></div>`).reverse().join('');
    document.getElementById('track-res').innerHTML = h;
}

function loginAdmin() {
    const u = document.getElementById('adm-u').value;
    const p = document.getElementById('adm-p').value;
    if((u === "admin" && p === "itws@manager@2026@") || (u === "super" && p === "itws@super@2026@")) {
        sessionStorage.setItem("adminUser", u); window.location.href="admin.html";
    } else Swal.fire("خطأ","البيانات غير صحيحة","error");
}
