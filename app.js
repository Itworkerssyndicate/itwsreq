const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// تحميل بيانات النقابة
window.onload = async () => {
    const doc = await db.collection("SystemSettings").doc("mainConfig").get();
    if(doc.exists){
        const d = doc.data();
        document.getElementById("union-name").innerText = d.unionName || "نقابة تكنولوجيا المعلومات";
        document.getElementById("president-name").innerText = d.presidentName || "";
        document.getElementById("union-logo").src = d.logoURL || "";
    }
};

async function submitRequest() {
    const d = { 
        name: document.getElementById('u-name').value, 
        nationalId: document.getElementById('u-nid').value, 
        phone: document.getElementById('u-phone').value, 
        gov: document.getElementById('u-gov').value, 
        job: document.getElementById('u-job').value, 
        address: document.getElementById('u-address').value, 
        type: document.getElementById('u-type').value, 
        details: document.getElementById('u-details').value 
    };
    
    if(Object.values(d).some(v => v === "")) return Swal.fire("تنبيه", "برجاء ملء جميع الحقول", "warning");
    
    const ref = (d.type === 'complaint' ? 'ITW' : 'SUG') + "-" + Math.floor(1000 + Math.random() * 9000) + "-2026";
    
    await db.collection("Requests").add({
        ...d, 
        refId: ref, 
        status: "تم الاستلام", 
        date: new Date().toLocaleString('ar-EG'), 
        tracking: [{stage: "تم الاستلام", comment: "تم استلام الطلب وبدء المراجعة", date: new Date().toLocaleString('ar-EG')}]
    });
    
    Swal.fire("نجاح", `تم إرسال طلبك برقم: ${ref}`, "success");
}

async function searchRequest() {
    const type = document.getElementById('s-type').value, nid = document.getElementById('s-nid').value, ref = document.getElementById('s-ref').value;
    const snap = await db.collection("Requests").where("type","==",type).where("nationalId","==",nid).where("refId","==",ref).get();
    
    if(snap.empty) return Swal.fire("عذراً", "لم يتم العثور على طلب بهذه البيانات", "error");
    
    renderTimeline(snap.docs[0].data(), 'track-res');
}

function renderTimeline(data, targetId) {
    const tracks = data.tracking;
    const isDone = data.status === "تم";
    
    let html = `<div class="timeline">
        <div class="timeline-progress" style="width: ${isDone ? '100%' : '50%'}"></div>
        ${tracks.map((t, i) => `
            <div class="step active">
                <i class="fas fa-check"></i>
                <div class="step-label">${t.stage}</div>
            </div>
        `).join('')}
        ${!isDone ? `<div class="step"><i class="fas fa-spinner fa-spin"></i><div class="step-label">جاري العمل</div></div>` : ''}
    </div>
    <div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:15px; border-right:4px solid var(--primary);">
        <h4 style="margin-top:0">سجل التحديثات:</h4>
        ${tracks.reverse().map(t => `<p style="border-bottom:1px solid #334155; padding-bottom:10px;"><b>${t.stage}:</b> ${t.comment}<br><small color="#94a3b8">${t.date}</small></p>`).join('')}
    </div>`;
    
    document.getElementById(targetId).innerHTML = html;
}

function loginAdmin() {
    const u = document.getElementById("adm-u").value, p = document.getElementById("adm-p").value;
    if(u === "مدير" && p === "itws@manager@2026@"){ sessionStorage.setItem("role","manager"); window.location.href="admin.html"; }
    else if(u === "الادمن_الرئيسي" && p === "itws@super@2026@"){ sessionStorage.setItem("role","super"); window.location.href="admin.html"; }
    else Swal.fire("خطأ", "بيانات الدخول غير صحيحة", "error");
}
