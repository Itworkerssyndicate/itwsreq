const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// عرض اسم النقيب
db.collection("SystemSettings").doc("mainConfig").onSnapshot(doc => {
    if(doc.exists) document.getElementById("pres-display").innerText = doc.data().presidentName;
});

// إرسال الطلب
async function submitRequest() {
    const btn = document.getElementById('submitBtn');
    const n = document.getElementById('u-name').value;
    const nid = document.getElementById('u-nid').value;
    if(!n || nid.length !== 14) return Swal.fire("خطأ","يرجى إدخال البيانات كاملة","error");

    btn.disabled = true;
    const now = new Date();
    const refId = `${now.getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    const d = {
        name: n, nationalId: nid, job: document.getElementById('u-job').value,
        type: document.getElementById('u-type').value, status: "تم الاستلام", refId: refId,
        createdAt: firebase.firestore.Timestamp.now(),
        tracking: [{stage: "تم الاستلام", comment: "تم استلام الطلب", date: now.toLocaleString('ar-EG')}]
    };

    await db.collection("Requests").add(d);
    document.getElementById('card-ref').innerText = refId;
    document.getElementById('card-name').innerText = n;
    document.getElementById('card-date').innerText = now.toLocaleString('ar-EG');
    Swal.fire("تم الإرسال",`كود الطلب: ${refId}`,"success").then(() => {
        html2canvas(document.getElementById('download-card')).then(canvas => {
            const a = document.createElement('a'); a.download = 'Receipt.png'; a.href = canvas.toDataURL(); a.click();
        });
    });
    btn.disabled = false;
}

// الاستعلام الثلاثي
async function searchRequest() {
    const type = document.getElementById('s-type').value;
    const nid = document.getElementById('s-nid').value;
    const ref = document.getElementById('s-ref').value;

    const snap = await db.collection("Requests")
        .where("type","==",type).where("nationalId","==",nid).where("refId","==",ref).get();

    if(snap.empty) return Swal.fire("خطأ","البيانات غير صحيحة","error");
    
    const d = snap.docs[0].data();
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل"];
    let idx = stages.indexOf(d.status); if(idx === -1) idx = 1;
    
    let h = `<div class="progress-container"><div class="progress-line"></div><div class="progress-fill" style="width:${(idx/3)*100}%"></div>
        ${stages.map((s,i)=>`<div class="step-node ${i<=idx?'active':''}"><i class="fas fa-check"></i><span>${s}</span></div>`).join('')}</div>`;
    h += d.tracking.map(t=>`<div class="log-card"><b>${t.stage}</b><br>${t.comment}</div>`).reverse().join('');
    document.getElementById('track-res').innerHTML = h;
}

// دخول الإدارة (مصلح)
function loginAdmin() {
    const u = document.getElementById('adm-u').value.trim();
    const p = document.getElementById('adm-p').value.trim();
    
    if((u === "admin" && p === "itws@manager@2026@") || (u === "super" && p === "itws@super@2026@")) {
        localStorage.setItem("adminRole", u);
        window.location.replace("admin.html"); // استخدام replace أفضل في التوجيه
    } else {
        Swal.fire("خطأ","اسم المستخدم أو الباسورد غير صحيح","error");
    }
}
