// Firebase Config
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

// 1. نظام الرسائل الفخم (Custom Modal)
function showMsg(title, text, icon) {
    Swal.fire({
        title: title,
        text: text,
        icon: icon,
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#0ea5e9',
        confirmButtonText: 'حسناً فهمت',
        showClass: { popup: 'animate__animated animate__zoomIn' },
        hideClass: { popup: 'animate__animated animate__zoomOut' }
    });
}

// 2. إرسال الطلبات
async function submitRequest() {
    const name = document.getElementById('user-fullname').value;
    const nid = document.getElementById('user-nationalid').value;
    const type = document.getElementById('req-type').value;
    const details = document.getElementById('req-details').value;

    if(!name || nid.length !== 14) {
        showMsg("بيانات ناقصة", "يرجى إدخال الاسم الرباعي والرقم القومي الصحيح", "warning");
        return;
    }

    const ref = (type === 'complaint' ? 'ITW' : 'SUG') + "-" + Math.floor(1000 + Math.random() * 9000) + "-2026";

    try {
        await db.collection("Requests").add({
            fullName: name, nationalId: nid, type: type, details: details,
            refId: ref, status: "تم الاستلام", date: new Date().toLocaleString('ar-EG'),
            tracking: [{ stage: "تم الاستلام", comment: "تم فتح الملف في النظام", date: new Date().toLocaleString('ar-EG') }]
        });
        showMsg("تم الإرسال بنجاح", `رقمك المرجعي هو: ${ref}\nاحتفظ به للمتابعة.`, "success");
        setTimeout(() => location.reload(), 4000);
    } catch(e) { showMsg("خطأ فني", "فشل الاتصال بالقاعدة", "error"); }
}

// 3. دخول الإدارة
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
        showMsg("فشل الدخول", "اسم المستخدم أو كلمة السر غير صحيحة", "error");
    }
}

// 4. استعلام الزائر (تتبع شيك)
async function searchRequest() {
    const nid = document.getElementById('search-nid').value;
    const ref = document.getElementById('search-ref').value;

    const snap = await db.collection("Requests").where("nationalId", "==", nid).where("refId", "==", ref).get();
    
    if(snap.empty) {
        showMsg("لا توجد سجلات", "تأكد من الرقم القومي والرقم المرجعي", "info");
        return;
    }

    const d = snap.docs[0].data();
    let trackHtml = `<div class="tracking-card"><h4>المسار الزمني للطلب:</h4>`;
    d.tracking.forEach(s => {
        trackHtml += `<p>✅ <b>${s.stage}</b> <br><small>${s.comment} - ${s.date}</small></p>`;
    });
    trackHtml += `</div>`;
    document.getElementById('search-result').innerHTML = trackHtml;
}
