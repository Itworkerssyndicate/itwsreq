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

// جلب إعدادات النقابة (اسم النقيب)
window.onload = async () => {
    const doc = await db.collection("SystemSettings").doc("mainConfig").get();
    if(doc.exists) {
        document.getElementById("union-name").innerText = doc.data().unionName;
        document.getElementById("president-name").innerText = "النقيب العام: " + doc.data().presidentName;
        document.getElementById("union-logo").src = doc.data().logoURL;
    }
};

function showMsg(title, text, icon) {
    Swal.fire({ title, text, icon, background: '#1e293b', color: '#fff', confirmButtonColor: '#0ea5e9' });
}

async function submitRequest() {
    const name = document.getElementById('user-fullname').value;
    const nid = document.getElementById('user-nationalid').value;
    const gov = document.getElementById('user-gov').value;
    const job = document.getElementById('user-job').value;
    const type = document.getElementById('req-type').value;
    const details = document.getElementById('req-details').value;

    if(!name || nid.length !== 14 || !gov) return showMsg("تنبيه", "برجاء استكمال كافة الحقول بدقة", "warning");

    const ref = (type === 'complaint' ? 'ITW' : 'SUG') + "-" + Math.floor(1000 + Math.random() * 9000) + "-2026";

    await db.collection("Requests").add({
        fullName: name, nationalId: nid, governorate: gov, job: job,
        type: type, details: details, refId: ref, status: "تم الاستلام",
        date: new Date().toLocaleString('ar-EG'),
        tracking: [{ stage: "تم الاستلام", comment: "تم تسجيل طلبكم بنجاح في النظام", date: new Date().toLocaleString('ar-EG') }]
    });

    showMsg("تم الإرسال", `رقم طلبك: ${ref}`, "success");
    setTimeout(() => location.reload(), 3000);
}

function loginAdmin() {
    const u = document.getElementById("adm-user").value;
    const p = document.getElementById("adm-pass").value;

    if (u === "مدير" && p === "itws@manager@2026@") {
        sessionStorage.setItem("role", "manager");
        window.location.href = "admin.html";
    } else if (u === "الادمن_الرئيسي" && p === "itws@super@2026@") {
        sessionStorage.setItem("role", "super");
        window.location.href = "admin.html";
    } else {
        showMsg("خطأ", "بيانات الدخول غير صحيحة", "error");
    }
}

async function searchRequest() {
    const type = document.getElementById('search-type').value;
    const nid = document.getElementById('search-nid').value;
    const ref = document.getElementById('search-ref').value;

    const snap = await db.collection("Requests")
        .where("type", "==", type)
        .where("nationalId", "==", nid)
        .where("refId", "==", ref).get();
    
    if(snap.empty) return showMsg("نعتذر", "لا توجد بيانات تطابق بحثك", "info");

    const d = snap.docs[0].data();
    let trackHtml = `<div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:15px; text-align:right;">
        <h4 style="color:var(--primary)">حالة الطلب: ${d.status}</h4>`;
    d.tracking.forEach(s => {
        trackHtml += `<p>🔹 ${s.stage} <br><small>${s.date} - ${s.comment}</small></p>`;
    });
    trackHtml += `</div>`;
    document.getElementById('search-result').innerHTML = trackHtml;
}
