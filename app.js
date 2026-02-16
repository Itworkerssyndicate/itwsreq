const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// تحميل بيانات النقيب
db.collection("SystemSettings").doc("mainConfig").onSnapshot(doc => {
    if(doc.exists) {
        document.getElementById("pres-display").innerText = doc.data().presidentName;
        document.getElementById("main-logo").src = doc.data().logoUrl;
        document.getElementById("svc-link").onclick = () => window.open(doc.data().servicesLink, '_blank');
    }
});

function toggleMemberFields() {
    const isMember = document.getElementById('u-member-type').value === "عضو";
    const mIdInput = document.getElementById('u-m-id');
    const typeSelect = document.getElementById('u-type');
    
    mIdInput.style.display = isMember ? "block" : "none";
    if(!isMember) {
        typeSelect.value = "اقتراح";
        typeSelect.disabled = true;
    } else {
        typeSelect.disabled = false;
    }
}

function showTab(t){
    ['submit','track','login'].forEach(id => document.getElementById('tab-'+id).style.display = (id===t?'block':'none'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if(t!=='login') document.getElementById('t-'+t).classList.add('active');
}

async function submitRequest() {
    const data = {
        isMember: document.getElementById('u-member-type').value,
        memberId: document.getElementById('u-m-id').value || "غير متوفر",
        name: document.getElementById('u-name').value,
        nationalId: document.getElementById('u-nid').value,
        type: document.getElementById('u-type').value,
        details: document.getElementById('u-details').value,
        status: "تم الاستلام",
        createdAt: firebase.firestore.Timestamp.now(),
        refId: `${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
        tracking: [{
            stage: "تم الاستلام", 
            comment: "تم استلام الطلب آلياً وبانتظار المراجعة", 
            date: new Date().toLocaleString('ar-EG')
        }]
    };

    if(!data.name || data.nationalId.length !== 14) return Swal.fire("خطأ", "برجاء التأكد من البيانات", "error");
    
    await db.collection("Requests").add(data);
    Swal.fire("تم بنجاح", `كود الطلب: ${data.refId}`, "success");
}

async function searchRequest() {
    const resDiv = document.getElementById('track-res');
    const snap = await db.collection("Requests")
        .where("nationalId","==",document.getElementById('s-nid').value)
        .where("refId","==",document.getElementById('s-ref').value).get();

    if(snap.empty) return Swal.fire("عذراً", "لم يتم العثور على الطلب", "warning");
    
    const d = snap.docs[0].data();
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل والإغلاق"];
    const currentIdx = stages.indexOf(d.status);

    resDiv.innerHTML = `
        <div class="track-card">
            <div class="stepper">
                ${stages.map((s, i) => `<div class="step ${i <= currentIdx ? 'active' : ''}"><span>${s}</span></div>`).join('')}
            </div>
            <div class="timeline">
                ${d.tracking.map(t => `<div class="log-item"><b>${t.stage}</b><br><small>${t.date}</small><p>${t.comment}</p></div>`).reverse().join('')}
            </div>
        </div>`;
}

function loginAdmin() {
    if(document.getElementById('adm-u').value === "admin" && document.getElementById('adm-p').value === "itws@manager@2026@") {
        sessionStorage.setItem("isAdmin", "true");
        window.location.href = "admin.html";
    } else Swal.fire("خطأ", "بيانات خاطئة", "error");
}
