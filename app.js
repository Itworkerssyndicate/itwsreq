const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

db.collection("SystemSettings").doc("mainConfig").onSnapshot(doc => {
    if(doc.exists) {
        document.getElementById("pres-display").innerText = doc.data().presidentName;
        document.getElementById("main-logo").src = doc.data().logoUrl;
        document.getElementById("svc-link").onclick = () => window.open(doc.data().servicesLink, '_blank');
    }
});

async function submitRequest() {
    const n = document.getElementById('u-name').value;
    const nid = document.getElementById('u-nid').value;
    if(!n || nid.length !== 14) return Swal.fire("خطأ", "برجاء استكمال البيانات (14 رقم قومي)", "error");

    const now = new Date();
    const refId = `${now.getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    const data = {
        name: n, nationalId: nid, job: document.getElementById('u-job').value,
        phone: document.getElementById('u-phone').value, gov: document.getElementById('u-gov').value,
        address: document.getElementById('u-address').value, type: document.getElementById('u-type').value,
        details: document.getElementById('u-details').value, status: "تم الاستلام", refId: refId,
        createdAt: firebase.firestore.Timestamp.now(),
        tracking: [{stage: "تم الاستلام", comment: "تم استلام الطلب بنجاح عبر المنظومة الرقمية", date: now.toLocaleString('ar-EG')}]
    };

    await db.collection("Requests").add(data);
    Swal.fire("تم الإرسال", `كود طلبك: ${refId}`, "success");
}

async function searchRequest() {
    const snap = await db.collection("Requests")
        .where("nationalId","==",document.getElementById('s-nid').value)
        .where("refId","==",document.getElementById('s-ref').value).get();

    if(snap.empty) return Swal.fire("خطأ", "لم يتم العثور على الطلب", "error");
    const d = snap.docs[0].data();
    
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل والإغلاق"];
    let idx = stages.indexOf(d.status); if(idx === -1) idx = 1;

    let h = `
        <div class="progress-box">
            <div class="line"></div><div class="fill" style="width:${(idx/3)*100}%"></div>
            <div class="steps">${stages.map((s,i)=>`<div class="dot ${i<=idx?'active pulse':''}"><span>${s}</span></div>`).join('')}</div>
        </div>
        <div class="timeline-view">
            ${d.tracking.map(t => `<div class="log-card"><b>${t.stage}</b><br><small>${t.date}</small><p>${t.comment}</p></div>`).reverse().join('')}
        </div>`;
    document.getElementById('track-res').innerHTML = h;
}

function loginAdmin() {
    if(document.getElementById('adm-u').value === "admin" && document.getElementById('adm-p').value === "itws@manager@2026@") {
        sessionStorage.setItem("isAdmin", "true");
        window.location.href = "admin.html";
    } else Swal.fire("خطأ", "بيانات الدخول غير صحيحة", "error");
}
