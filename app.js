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
        document.getElementById("services-link").href = d.servicesURL;
    }
};

async function submitRequest() {
    const d = { name: document.getElementById('u-name').value, nationalId: document.getElementById('u-nid').value, phone: document.getElementById('u-phone').value, gov: document.getElementById('u-gov').value, job: document.getElementById('u-job').value, address: document.getElementById('u-address').value, type: document.getElementById('u-type').value, details: document.getElementById('u-details').value };
    if(Object.values(d).some(v=>v=="")) return Swal.fire("تنبيه","أكمل البيانات","warning");
    const ref = (d.type=='complaint'?'ITW':'SUG') + "-" + Math.floor(1000+Math.random()*9000) + "-2026";
    await db.collection("Requests").add({...d, refId: ref, status: "تم الاستلام", date: new Date().toLocaleString('ar-EG'), tracking: [{stage: "تم الاستلام", comment: "تم استلام الطلب بنجاح", date: new Date().toLocaleString('ar-EG')}]});
    Swal.fire("تم", `رقم طلبك: ${ref}`, "success");
}

async function searchRequest() {
    const type = document.getElementById('s-type').value, nid = document.getElementById('s-nid').value, ref = document.getElementById('s-ref').value;
    const snap = await db.collection("Requests").where("type","==",type).where("nationalId","==",nid).where("refId","==",ref).get();
    if(snap.empty) return Swal.fire("خطأ","لا توجد بيانات","error");
    const data = snap.docs[0].data();
    renderTimeline(data, 'track-res');
}

function renderTimeline(data, targetId) {
    const allStages = data.tracking.map(t => t.stage);
    const currentStatus = data.status;
    const html = `
    <div class="timeline">
        <div class="timeline-progress" style="width: ${currentStatus=='تم'?'100':'50'}%"></div>
        ${allStages.map((s, i) => `
            <div class="step active">
                <i class="fas ${s=='تم'?'fa-check-double':'fa-check'}"></i>
                <div class="step-label">${s}</div>
            </div>
        `).join('')}
        ${currentStatus !== 'تم' ? `<div class="step"><i class="fas fa-spinner fa-spin"></i><div class="step-label">جاري المعالجة</div></div>` : ''}
    </div>
    <div style="background:rgba(255,255,255,0.1); padding:15px; border-radius:10px;">
        ${data.tracking.reverse().map(t => `<p><b>${t.stage}:</b> ${t.comment} <br><small>${t.date}</small></p>`).join('')}
    </div>`;
    document.getElementById(targetId).innerHTML = html;
}

function loginAdmin() {
    const u = document.getElementById("adm-u").value, p = document.getElementById("adm-p").value;
    if(u=="مدير" && p=="itws@manager@2026@"){ sessionStorage.setItem("role","manager"); window.location.href="admin.html"; }
    else if(u=="الادمن_الرئيسي" && p=="itws@super@2026@"){ sessionStorage.setItem("role","super"); window.location.href="admin.html"; }
    else Swal.fire("خطأ","بيانات خاطئة","error");
}
