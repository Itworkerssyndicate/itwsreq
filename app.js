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
            document.getElementById("union-name").innerText = data.unionName;
            // لو في رابط لوجو في الداتا بيز نغيره هنا
            if(data.logoURL) document.getElementById("union-logo").src = data.logoURL;
        }
    }).catch((error) => {
        console.log("Error getting document:", error);
    });
};

// 2. وظيفة تسجيل دخول الأدمن
function login() {
    const user = document.getElementById("admin-user").value;
    const pass = document.getElementById("admin-pass").value;
    const errorMsg = document.getElementById("login-error");

    // البيانات اللي انت حددتها
    const adminUsername = "مدير";
    const adminPassword = "itws@manager@2026@";

    if (user === adminUsername && pass === adminPassword) {
        alert("أهلاً بك يا سيادة المدير");
        // هنا هننقل الأدمن لصفحة التحكم (هنعملها الخطوة الجاية)
        // window.location.href = "admin_dashboard.html"; 
    } else {
        errorMsg.innerText = "اسم المستخدم أو كلمة السر خطأ!";
    }
}
