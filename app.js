// إعدادات الفايربيز الخاصة بك
const firebaseConfig = {
  apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE",
  authDomain: "itwsreq.firebaseapp.com",
  projectId: "itwsreq",
  storageBucket: "itwsreq.firebasestorage.app",
  messagingSenderId: "417900842360",
  appId: "1:417900842360:web:83d9310f36fef5bbbe4c8d",
  measurementId: "G-P3YQFRSBMM"
};

// تشغيل الفايربيز
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 1. سحب إعدادات النقابة فور تحميل الصفحة
window.onload = function() {
    db.collection("SystemSettings").doc("mainConfig").get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            document.getElementById("union-name").innerText = data.unionName || "نقابة تكنولوجيا المعلومات";
            if(document.getElementById("president-name")) {
                document.getElementById("president-name").innerText = "النقيب العام: " + (data.presidentName || "");
            }
        }
    });
};

// 2. دالة تسجيل دخول الإدارة
function loginAdmin() {
    const user = document.getElementById("admin-username").value;
    const pass = document.getElementById("admin-password").value;

    if (user === "مدير" && pass === "itws@manager@2026@") {
        sessionStorage.setItem("adminType", "manager");
        window.location.href = "admin.html";
    } 
    else if (user === "الادمن_الرئيسي" && pass === "itws@super@2026@") {
        sessionStorage.setItem("adminType", "super");
        window.location.href = "admin.html";
    } 
    else {
        alert("بيانات الدخول غير صحيحة!");
    }
}

// 3. دالة إرسال الطلب (شكوى أو اقتراح)
async function submitRequest() {
    const name = document.getElementById("user-fullname").value;
    const nId = document.getElementById("user-nationalid").value;
    const type = document.getElementById("request-type").value;
    const details = document.getElementById("request-details").value;
    const isMember = document.getElementById("is-member").value;
    const memberId = document.getElementById("membership-id").value;
    const gov = document.getElementById("user-gov").value;
    const job = document.getElementById("user-job").value;

    if (!name || nId.length !== 14 || !details) {
        alert("برجاء إدخال الاسم والاسم الرباعي والرقم القومي (14 رقم) وتفاصيل الطلب.");
        return;
    }

    const year = 2026; // السنة كما طلبت
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = (type === "complaint") ? "ITW" : "SUG"; // 3 حروف مختلفة لكل نوع
    const refId = `${prefix}-${randomNum}-${year}`;

    try {
        await db.collection("Requests").add({
            fullName: name,
            nationalId: nId,
            type: type,
            details: details,
            isMember: isMember,
            membershipId: (isMember === "yes") ? memberId : "",
            governorate: gov,
            job: job,
            refId: refId,
            status: "تم الاستلام",
            tracking: [{
                stage: "تم الاستلام",
                comment: "تم استلام طلبكم بنجاح وجاري المراجعة من قبل المختصين.",
                date: new Date().toLocaleString('ar-EG')
            }],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        if(type === "complaint") {
            alert(`تم تسجيل الشكوى بنجاح.\nرقم الشكوى: ${refId}\nسيتم دراسة الشكوى وشكراً لتواصلك.`);
        } else {
            alert(`شكراً لاقتراحك.\nرقم الاقتراح: ${refId}\nسيتم دراسة الاقتراح المقدم.`);
        }
        location.reload();
    } catch (error) {
        alert("حدث خطأ أثناء الإرسال: " + error.message);
    }
}
