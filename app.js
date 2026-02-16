const firebaseConfig = {
    apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE",
    authDomain: "itwsreq.firebaseapp.com",
    projectId: "itwsreq",
    storageBucket: "itwsreq.firebasestorage.app",
    messagingSenderId: "417900842360",
    appId: "1:417900842360:web:83d9310f36fef5bbbe4c8d"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// تحميل الإعدادات
window.onload = async () => {
    const doc = await db.collection("SystemSettings").doc("mainConfig").get();
    if(doc.exists) {
        const d = doc.data();
        document.getElementById("union-name").innerText = d.unionName;
        document.getElementById("president-name").innerText = d.presidentName;
        document.getElementById("union-logo").src = d.logoURL;
        document.getElementById("services-btn").href = d.servicesURL || "#";
    }
};

async function submitRequest() {
    const data = {
        name: document.getElementById('u-name').value,
        nid: document.getElementById('u-nid').value,
        phone: document.getElementById('u-phone').value,
        gov: document.getElementById('u-gov').value,
        job: document.getElementById('u-job').value,
        address: document.getElementById('u-address').value,
        type: document.getElementById('u-type').value,
        details: document.getElementById('u-details').value
    };

    if(Object.values(data).some(v => v === "")) return Swal.fire("تنبيه", "يرجى ملء كافة الحقول", "warning");
    if(data.nid.length !== 14) return Swal.fire("خطأ", "الرقم القومي يجب أن يكون 14 رقم", "error");

    const ref = (data.type === 'complaint' ? 'ITW' : 'SUG') + "-" + Math.floor(1000 + Math.random() * 9000) + "-2026";

    await db.collection("Requests").add({
        ...data, refId: ref, status: "تم الاستلام", date: new Date().toLocaleString('ar-EG'),
        tracking: [{ stage: "تم الاستلام", comment: "تم استلام الطلب بنجاح", date: new Date().toLocaleString('ar-EG') }]
    });

    Swal.fire("تم بنجاح", `رقم طلبك هو: ${ref}`, "success");
    setTimeout(() => location.reload(), 3000);
}

async function searchRequest() {
    const type = document.getElementById('s-type').value;
    const nid = document.getElementById('s-nid').value;
    const ref = document.getElementById('s-ref').value;

    const snap = await db.collection("Requests").where("type", "==", type).where("nationalId", "==", nid).where("refId", "==", ref).get();
    
    if(snap.empty) return Swal.fire("خطأ", "لا توجد بيانات", "error");

    const d = snap.docs[0].data();
    const steps = ["تم الاستلام", "جاري الفحص", "المراجعة الفنية", "تم"];
    const currentIdx = steps.indexOf(d.status) === -1 ? 1 : steps.indexOf(d.status);
    const progress = (currentIdx / (steps.length - 1)) * 100;

    let html = `<div class="timeline">
        <div class="timeline-progress" style="width: ${progress}%"></div>
        ${steps.map((s, i) => `
            <div class="step ${i <= currentIdx ? 'active' : ''}">
                <i class="fas ${i < currentIdx ? 'fa-check' : (i == currentIdx ? 'fa-spinner fa-spin' : 'fa-clock')}"></i>
                <div class="step-label">${s}</div>
            </div>
        `).join('')}
    </div>
    <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:15px; margin-top:50px;">
        ${d.tracking.map(t => `<p style="font-size:0.85rem">🔹 <b>${t.stage}</b>: ${t.comment} <br><small>${t.date}</small></p>`).join('')}
    </div>`;
    
    document.getElementById('track-res').innerHTML = html;
}

function loginAdmin() {
    const u = document.getElementById("adm-u").value;
    const p = document.getElementById("adm-p").value;
    if (u === "مدير" && p === "itws@manager@2026@") { sessionStorage.setItem("role", "manager"); window.location.href = "admin.html"; }
    else if (u === "الادمن_الرئيسي" && p === "itws@super@2026@") { sessionStorage.setItem("role", "super"); window.location.href = "admin.html"; }
    else { Swal.fire("خطأ", "بيانات خاطئة", "error"); }
}
