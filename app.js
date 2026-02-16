const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

window.onload = async () => {
    const doc = await db.collection("SystemSettings").doc("mainConfig").get();
    if(doc.exists){
        const d = doc.data();
        document.getElementById("union-name").innerText = d.unionName;
        document.getElementById("president-name").innerText = "النقيب العام: " + d.presidentName;
        document.getElementById("union-logo").src = d.logoURL;
    }
};

async function submitRequest() {
    const now = new Date();
    // توليد كود منظم: سنة-شهر-يوم-دقيقة-ثانية
    const timeRef = now.getFullYear().toString().slice(-2) + (now.getMonth()+1) + now.getDate() + now.getHours() + now.getMinutes();
    
    const d = { 
        name: document.getElementById('u-name').value, 
        nationalId: document.getElementById('u-nid').value,
        phone: document.getElementById('u-phone').value,
        gov: document.getElementById('u-gov').value,
        job: document.getElementById('u-job').value,
        address: document.getElementById('u-address').value,
        details: document.getElementById('u-details').value,
        type: document.getElementById('u-type').value,
        timestamp: now.toLocaleString('ar-EG'),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if(Object.values(d).some(v=>!v && v !== d.createdAt)) return Swal.fire("تنبيه","أكمل الحقول","warning");
    
    const refId = (d.type=='complaint'?'REQ-':'SUG-') + timeRef;
    
    await db.collection("Requests").add({
        ...d, refId: refId, status: "تم الاستلام",
        tracking: [{stage: "تم الاستلام", comment: "تم استلام طلبك بنجاح", date: now.toLocaleString('ar-EG')}]
    });
    Swal.fire("نجاح", "كود الطلب المنظم: " + refId, "success");
}

async function searchRequest() {
    const ref = document.getElementById('s-ref').value;
    const snap = await db.collection("Requests").where("refId","==",ref).get();
    if(snap.empty) return Swal.fire("خطأ","الكود غير صحيح","error");
    renderTimeline(snap.docs[0].data(), 'track-res');
}

function renderTimeline(data, targetId) {
    let steps = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم"];
    let currentIdx = steps.indexOf(data.status);
    
    let h = `<div class="timeline">`;
    steps.forEach((s, i) => {
        let cls = i <= currentIdx ? "completed" : "";
        h += `<div class="step ${cls}"><i class="fas fa-${i <= currentIdx?'check':'clock'}"></i><div class="step-label">${s}</div></div>`;
    });
    h += `</div><div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:10px;">
          ${data.tracking.slice().reverse().map(t=> `<p style="border-bottom:1px solid #334155; padding:8px;"><b>${t.stage}:</b> ${t.comment} <br><small>${t.date}</small></p>`).join('')}</div>`;
    document.getElementById(targetId).innerHTML = h;
}

function loginAdmin() {
    const u = document.getElementById('adm-u').value, p = document.getElementById('adm-p').value;
    if(u=="مدير" && p=="itws@manager@2026@") { sessionStorage.setItem("role","manager"); window.location.href="admin.html"; }
    else if(u=="الادمن_الرئيسي" && p=="itws@super@2026@") { sessionStorage.setItem("role","super"); window.location.href="admin.html"; }
    else Swal.fire("فشل","بيانات خاطئة","error");
}
