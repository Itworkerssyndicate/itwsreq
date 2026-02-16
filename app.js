const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// تحميل بيانات الواجهة
db.collection("SystemSettings").doc("mainConfig").onSnapshot(doc => {
    if(doc.exists) {
        document.getElementById("pres-display").innerText = doc.data().presidentName || "غير محدد";
        document.getElementById("main-logo").src = doc.data().logoUrl || "";
        document.getElementById("svc-link").onclick = () => window.open(doc.data().servicesLink, '_blank');
    }
});

function toggleMember() {
    const isMember = document.getElementById('u-member-type').value === "عضو";
    document.getElementById('u-m-id').style.display = isMember ? 'block' : 'none';
    const typeBox = document.getElementById('u-type');
    if(!isMember) { typeBox.value = "اقتراح"; typeBox.disabled = true; } 
    else { typeBox.disabled = false; }
}

function showTab(t) {
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-'+t).style.display = 'block';
    if(t !== 'login') document.getElementById('t-'+t).classList.add('active');
}

async function submitRequest() {
    const d = {
        name: document.getElementById('u-name').value,
        nationalId: document.getElementById('u-nid').value,
        memberId: document.getElementById('u-m-id').value || "غير عضو",
        isMember: document.getElementById('u-member-type').value,
        phone: document.getElementById('u-phone').value,
        job: document.getElementById('u-job').value,
        gov: document.getElementById('u-gov').value,
        address: document.getElementById('u-address').value,
        type: document.getElementById('u-type').value,
        details: document.getElementById('u-details').value,
        status: "تم الاستلام",
        refId: `${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: firebase.firestore.Timestamp.now(),
        tracking: [{ stage: "تم الاستلام", comment: "تم استلام الطلب آلياً", date: new Date().toLocaleString('ar-EG') }]
    };

    if(!d.name || d.nationalId.length < 14) return Swal.fire("خطأ", "برجاء ملء البيانات بشكل صحيح", "error");
    
    await db.collection("Requests").add(d);
    Swal.fire("تم الإرسال", `كود الطلب: ${d.refId}`, "success");
}

async function searchRequest() {
    const snap = await db.collection("Requests")
        .where("nationalId", "==", document.getElementById('s-nid').value)
        .where("refId", "==", document.getElementById('s-ref').value).get();

    if(snap.empty) return Swal.fire("عذراً", "الطلب غير موجود", "warning");
    const data = snap.docs[0].data();
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل والإغلاق"];
    const idx = stages.indexOf(data.status);

    document.getElementById('track-res').innerHTML = `
        <div class="water-track">
            <div class="track-line"><div class="track-fill" style="width:${(idx/3)*100}%"></div></div>
            ${stages.map((s,i) => `<div class="node ${i<=idx?'active':''}" style="right:${(i/3)*100}%"><span>${s}</span></div>`).join('')}
        </div>
        <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:10px;">
            ${data.tracking.reverse().map(t => `<p><b>${t.stage}</b> - ${t.date}<br><small>${t.comment}</small></p><hr style="opacity:0.1">`).join('')}
        </div>`;
}

function loginAdmin() {
    if(document.getElementById('adm-u').value === "admin" && document.getElementById('adm-p').value === "itws@manager@2026@") {
        sessionStorage.setItem("isAdmin", "true");
        window.location.href = "admin.html";
    } else Swal.fire("خطأ", "بيانات الدخول خاطئة", "error");
}
