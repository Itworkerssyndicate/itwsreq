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

// 1. تحميل إعدادات الهوية فور فتح الصفحة
window.onload = async () => {
    const doc = await db.collection("SystemSettings").doc("mainConfig").get();
    if(doc.exists) {
        const d = doc.data();
        document.getElementById("union-name").innerText = d.unionName || "نقابة تكنولوجيا المعلومات";
        document.getElementById("president-name").innerText = d.presidentName || "";
        if(d.logoURL) document.getElementById("union-logo").src = d.logoURL;
        document.getElementById("services-link").href = d.servicesURL || "#";
    }
};

// 2. إرسال الطلب مع التحقق من جميع الحقول
async function submitRequest() {
    const fields = {
        name: document.getElementById('u-name').value,
        nationalId: document.getElementById('u-nid').value,
        phone: document.getElementById('u-phone').value,
        gov: document.getElementById('u-gov').value,
        job: document.getElementById('u-job').value,
        address: document.getElementById('u-address').value,
        type: document.getElementById('u-type').value,
        details: document.getElementById('u-details').value
    };

    if(Object.values(fields).some(v => v.trim() === "")) {
        return Swal.fire("بيانات ناقصة", "برجاء ملء جميع الحقول الإلزامية (*)", "warning");
    }

    if(fields.nationalId.length !== 14) {
        return Swal.fire("خطأ", "يجب أن يتكون الرقم القومي من 14 رقم", "error");
    }

    const ref = (fields.type === 'complaint' ? 'ITW' : 'SUG') + "-" + Math.floor(1000 + Math.random() * 9000) + "-2026";

    try {
        await db.collection("Requests").add({
            ...fields,
            refId: ref,
            status: "تم الاستلام",
            date: new Date().toLocaleString('ar-EG'),
            tracking: [{ stage: "تم الاستلام", comment: "تم استلام الطلب وبدء دورة العمل الرقمية", date: new Date().toLocaleString('ar-EG') }]
        });
        Swal.fire("تم الإرسال بنجاح", `رقم الطلب الخاص بك: ${ref}`, "success");
        setTimeout(() => location.reload(), 3000);
    } catch(e) { Swal.fire("فشل الاتصال", "يرجى المحاولة لاحقاً", "error"); }
}

// 3. محرك البحث الذكي مع التايم لاين
async function searchRequest() {
    const type = document.getElementById('s-type').value;
    const nid = document.getElementById('s-nid').value;
    const ref = document.getElementById('s-ref').value;

    if(!nid || !ref) return Swal.fire("تنبيه", "يجب إدخال الرقم القومي ورقم الطلب للبحث", "info");

    const snap = await db.collection("Requests")
        .where("type", "==", (type.includes('complaint') ? 'complaint' : 'suggestion'))
        .where("nationalId", "==", nid)
        .where("refId", "==", ref).get();
    
    if(snap.empty) return Swal.fire("لا توجد نتائج", "تأكد من البيانات المدخلة ونوع الطلب", "error");

    const d = snap.docs[0].data();
    const stages = ["تم الاستلام", "جاري الفحص", "المراجعة الفنية", "تم"];
    let currentIdx = stages.indexOf(d.status);
    if(currentIdx === -1) currentIdx = 1; // حالة مخصصة من الأدمن

    const progressWidth = (currentIdx / (stages.length - 1)) * 100;

    let html = `
    <div class="timeline">
        <div class="timeline-progress" style="width: ${progressWidth}%"></div>
        ${stages.map((s, i) => `
            <div class="step ${i <= currentIdx ? 'active' : ''}">
                <i class="fas ${i < currentIdx ? 'fa-check' : (i == currentIdx ? 'fa-spinner fa-spin' : 'fa-clock')}"></i>
                <div class="step-label">${s}</div>
            </div>
        `).join('')}
    </div>
    <div style="background:rgba(255,255,255,0.05); padding:20px; border-radius:15px; margin-top:50px; text-align:right; border: 1px solid rgba(0, 210, 255, 0.2);">
        <h4 style="color:var(--primary); margin:0 0 15px 0;"><i class="fas fa-history"></i> سجل التحديثات:</h4>
        ${d.tracking.reverse().map(t => `
            <div style="border-right: 2px solid var(--primary); padding-right:15px; margin-bottom:15px;">
                <b style="font-size:0.9rem">${t.stage}</b> <br>
                <small style="color:#94a3b8">${t.date}</small> <br>
                <span style="font-size:0.85rem; color:#cbd5e1;">${t.comment}</span>
            </div>
        `).join('')}
    </div>`;
    
    document.getElementById('track-res').innerHTML = html;
}

// 4. تسجيل دخول الإدارة
function loginAdmin() {
    const u = document.getElementById("adm-u").value;
    const p = document.getElementById("adm-p").value;
    if (u === "مدير" && p === "itws@manager@2026@") {
        sessionStorage.setItem("role", "manager");
        window.location.href = "admin.html";
    } else if (u === "الادمن_الرئيسي" && p === "itws@super@2026@") {
        sessionStorage.setItem("role", "super");
        window.location.href = "admin.html";
    } else {
        Swal.fire("فشل المصادقة", "اسم المستخدم أو كلمة السر غير صحيحة", "error");
    }
}
