const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

db.collection("SystemSettings").doc("mainConfig").onSnapshot(doc => {
    if(doc.exists) document.getElementById("pres-display").innerText = doc.data().presidentName;
});

async function submitRequest() {
    const btn = document.getElementById('submitBtn');
    const n = document.getElementById('u-name').value;
    const nid = document.getElementById('u-nid').value;
    if(!n || nid.length !== 14) return Swal.fire("خطأ", "بيانات غير مكتملة", "error");

    btn.disabled = true;
    const now = new Date();
    const refId = `${now.getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    
    const data = {
        name: n, nationalId: nid, job: document.getElementById('u-job').value,
        phone: document.getElementById('u-phone').value, gov: document.getElementById('u-gov').value,
        address: document.getElementById('u-address').value,
        type: document.getElementById('u-type').value, details: document.getElementById('u-details').value,
        status: "تم الاستلام", refId: refId, createdAt: firebase.firestore.Timestamp.now(),
        tracking: [{stage: "تم الاستلام", comment: "تم تقديم الطلب عبر البوابة الرقمية", date: now.toLocaleString('ar-EG')}]
    };

    try {
        await db.collection("Requests").add(data);
        document.getElementById('card-ref').innerText = refId;
        document.getElementById('card-name').innerText = n;
        document.getElementById('card-date').innerText = now.toLocaleString('ar-EG');
        Swal.fire("نجاح", `كود الطلب: ${refId}`, "success").then(() => {
            html2canvas(document.getElementById('download-card')).then(canvas => {
                const a = document.createElement('a'); a.download = 'Receipt.png'; a.href = canvas.toDataURL(); a.click();
            });
        });
    } catch(e) { Swal.fire("خطأ", "فشل الإرسال", "error"); }
    btn.disabled = false;
}

async function searchRequest() {
    const type = document.getElementById('s-type').value;
    const nid = document.getElementById('s-nid').value;
    const ref = document.getElementById('s-ref').value;

    const snap = await db.collection("Requests")
        .where("type","==",type).where("nationalId","==",nid).where("refId","==",ref).get();

    if(snap.empty) return Swal.fire("عذراً", "لم يتم العثور على بيانات"، "error");
    
    const d = snap.docs[0].data();
    document.getElementById('track-res').innerHTML = generateTrackingUI(d);
}

function generateTrackingUI(d) {
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل"];
    let idx = stages.indexOf(d.status); if(idx === -1) idx = 1;
    let h = `<div class="progress-box"><div class="line"></div><div class="fill" style="width:${(idx/3)*100}%"></div><div class="steps">
        ${stages.map((s,i)=>`<div class="dot ${i<=idx?'active':''}">✓<span>${s}</span></div>`).join('')}</div></div>`;
    h += d.tracking.map(t=>`<div class="log-card"><b>${t.stage}</b><br><small>${t.comment}</small><br><small style="opacity:0.6">${t.date}</small></div>`).reverse().join('');
    return h;
}

function loginAdmin() {
    const u = document.getElementById('adm-u').value.trim();
    const p = document.getElementById('adm-p').value.trim();
    if((u === "admin" && p === "itws@manager@2026@") || (u === "super" && p === "itws@super@2026@")) {
        localStorage.setItem("role", u); window.location.replace("admin.html");
    } else Swal.fire("خطأ", "بيانات الدخول غير صحيحة", "error");
}
