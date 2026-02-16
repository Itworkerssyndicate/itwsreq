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
        address: document.getElementById('u-address').value, type: document.getElementById('u-type').value,
        details: document.getElementById('u-details').value, status: "تم الاستلام", refId: refId,
        createdAt: firebase.firestore.Timestamp.now(),
        tracking: [{stage: "تم الاستلام", comment: "تم استلام الطلب آلياً", date: now.toLocaleString('ar-EG')}]
    };

    await db.collection("Requests").add(data);
    Swal.fire("نجاح", `تم الحفظ بنجاح، كودك هو: ${refId}`, "success");
    btn.disabled = false;
}

async function searchRequest() {
    const snap = await db.collection("Requests")
        .where("nationalId","==",document.getElementById('s-nid').value)
        .where("refId","==",document.getElementById('s-ref').value).get();

    if(snap.empty) return Swal.fire("خطأ", "لا توجد بيانات", "error");
    const d = snap.docs[0].data();
    let h = `<div class="log-card"><b>الحالة الحالية: ${d.status}</b></div>`;
    d.tracking.forEach(t => h += `<div class="log-card"><small>${t.date}</small><br><b>${t.stage}</b>: ${t.comment}</div>`);
    document.getElementById('track-res').innerHTML = h;
}

function loginAdmin() {
    if(document.getElementById('adm-u').value === "admin" && document.getElementById('adm-p').value === "itws@manager@2026@") {
        sessionStorage.setItem("isAdmin", "true");
        window.location.href = "admin.html";
    } else Swal.fire("خطأ", "بيانات خاطئة", "error");
}
