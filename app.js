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

// سحب الإعدادات عند الفتح
window.onload = () => {
    db.collection("SystemSettings").doc("mainConfig").get().then(doc => {
        if(doc.exists) {
            const d = doc.data();
            document.getElementById("union-name").innerText = d.unionName || "نقابة تكنولوجيا المعلومات";
            document.getElementById("president-display").innerText = "النقيب العام: " + (d.presidentName || "");
        }
    });
};

// تسجيل الدخول
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
        alert("خطأ في البيانات!");
    }
}

// إرسال الطلب
async function submitRequest() {
    const name = document.getElementById("user-fullname").value;
    const nid = document.getElementById("user-nationalid").value;
    const type = document.getElementById("req-type").value;
    const details = document.getElementById("req-details").value;

    if(!name || nid.length != 14) return alert("اكمل البيانات بدقة");

    const ref = (type == 'complaint' ? 'ITW' : 'SUG') + "-" + Math.floor(1000+Math.random()*9000) + "-2026";

    await db.collection("Requests").add({
        fullName: name, nationalId: nid, type: type, details: details,
        refId: ref, status: "تم الاستلام", date: new Date().toLocaleString('ar-EG')
    });

    alert("تم الإرسال بنجاح! رقمك هو: " + ref);
    location.reload();
}
