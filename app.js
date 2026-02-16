const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

window.onload = async () => {
    const doc = await db.collection("SystemSettings").doc("mainConfig").get();
    if(doc.exists){
        const d = doc.data();
        document.getElementById("union-name").innerText = d.unionName;
        document.getElementById("president-name").innerText = d.presidentName;
        document.getElementById("union-logo").src = d.logoURL;
    }
};

async function submitRequest() {
    const d = { 
        name: document.getElementById('u-name').value, 
        nationalId: document.getElementById('u-nid').value,
        phone: document.getElementById('u-phone').value,
        gov: document.getElementById('u-gov').value,
        address: document.getElementById('u-address').value,
        details: document.getElementById('u-details').value,
        type: 'complaint' 
    };
    if(Object.values(d).some(v=>!v)) return Swal.fire("خطأ","أكمل الحقول","error");
    
    const ref = "ITW-" + Math.floor(1000+Math.random()*9000) + "-2026";
    await db.collection("Requests").add({
        ...d, refId: ref, status: "تم الاستلام",
        tracking: [{stage: "تم الاستلام", comment: "بدء المعالجة", date: new Date().toLocaleString('ar-EG')}]
    });
    Swal.fire("تم", "رقم طلبك: " + ref, "success");
}

async function searchRequest() {
    const nid = document.getElementById('s-nid').value;
    const ref = document.getElementById('s-ref').value;
    const snap = await db.collection("Requests").where("nationalId","==",nid).where("refId","==",ref).get();
    if(snap.empty) return Swal.fire("عذراً","لا يوجد طلب بهذه البيانات","error");
    
    const d = snap.docs[0].data();
    let h = `<div class="timeline">`;
    d.tracking.forEach(t => h += `<div class="step active"><i class="fas fa-check"></i><div class="step-label">${t.stage}</div></div>`);
    h += `</div><div style="background:rgba(255,255,255,0.1); padding:15px; border-radius:10px;">
          ${d.tracking.reverse().map(t=> `<p><b>${t.stage}:</b> ${t.comment} <small>(${t.date})</small></p>`).join('')}</div>`;
    document.getElementById('track-res').innerHTML = h;
}

function loginAdmin() {
    const u = document.getElementById('adm-u').value, p = document.getElementById('adm-p').value;
    if(u=="مدير" && p=="itws@manager@2026@") { sessionStorage.setItem("role","manager"); window.location.href="admin.html"; }
    else if(u=="الادمن_الرئيسي" && p=="itws@super@2026@") { sessionStorage.setItem("role","super"); window.location.href="admin.html"; }
    else Swal.fire("خطأ","بيانات خاطئة","error");
}
