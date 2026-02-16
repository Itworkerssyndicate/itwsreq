const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// جلب الإعدادات العامة
db.collection("SystemSettings").doc("mainConfig").onSnapshot(doc => {
    if(doc.exists) {
        const d = doc.data();
        document.getElementById("pres-display").innerText = d.presidentName;
        document.getElementById("main-logo").src = d.logoUrl;
        document.getElementById("print-logo").src = d.logoUrl;
        document.getElementById("svc-link").onclick = () => window.open(d.servicesLink, '_blank');
    }
});

async function submitRequest() {
    const btn = document.getElementById('submitBtn');
    const n = document.getElementById('u-name').value;
    const nid = document.getElementById('u-nid').value;
    if(!n || nid.length !== 14) return Swal.fire("خطأ", "برجاء استكمال البيانات", "error");

    btn.disabled = true;
    const now = new Date();
    const refId = `${now.getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    const data = {
        name: n, nationalId: nid, job: document.getElementById('u-job').value,
        phone: document.getElementById('u-phone').value, gov: document.getElementById('u-gov').value,
        address: document.getElementById('u-address').value, type: document.getElementById('u-type').value,
        details: document.getElementById('u-details').value, status: "تم الاستلام", refId: refId,
        createdAt: firebase.firestore.Timestamp.now(),
        tracking: [{stage: "تم الاستلام", comment: "تم استلام الطلب آلياً", date: now.toLocaleString('ar-EG')}]
    };

    await db.collection("Requests").add(data);
    document.getElementById('card-ref').innerText = refId;
    document.getElementById('card-name').innerText = n;
    document.getElementById('card-date').innerText = now.toLocaleString('ar-EG');
    
    Swal.fire("تم بنجاح", `كود الطلب: ${refId}`, "success").then(() => {
        html2canvas(document.getElementById('download-card')).then(c => {
            const a = document.createElement('a'); a.download = 'Receipt.png'; a.href = c.toDataURL(); a.click();
        });
    });
    btn.disabled = false;
}

async function searchRequest() {
    const snap = await db.collection("Requests")
        .where("type","==",document.getElementById('s-type').value)
        .where("nationalId","==",document.getElementById('s-nid').value)
        .where("refId","==",document.getElementById('s-ref').value).get();

    if(snap.empty) return Swal.fire("خطأ", "لم يتم العثور على بيانات", "error");
    
    const d = snap.docs[0].data();
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل والإغلاق"];
    let idx = (d.status === "تم الحل والإغلاق") ? 3 : stages.indexOf(d.status);
    if(idx === -1) idx = 1;

    let h = `<div class="progress-box"><div class="line"></div><div class="fill" style="width:${(idx/3)*100}%"></div><div class="steps">
        ${stages.map((s,i)=>`<div class="dot ${i<=idx?'active':''}">✓<span>${s}</span></div>`).join('')}</div></div>`;
    h += d.tracking.map(t=>`<div class="log-card"><b>${t.stage}</b><br><small>${t.date}</small><br>${t.comment}</div>`).reverse().join('');
    document.getElementById('track-res').innerHTML = h;
}

function loginAdmin() {
    const u = document.getElementById('adm-u').value.trim();
    const p = document.getElementById('adm-p').value.trim();
    if((u === "admin" && p === "itws@manager@2026@") || (u === "super" && p === "itws@super@2026@")) {
        sessionStorage.setItem("isAdmin", "true");
        window.location.href = "admin.html";
    } else Swal.fire("خطأ", "بيانات الدخول غير صحيحة", "error");
}
