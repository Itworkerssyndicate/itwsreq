const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// جلب البيانات الأساسية
db.collection("SystemSettings").doc("mainConfig").onSnapshot(doc => {
    if(doc.exists) {
        document.getElementById("pres-display").innerText = doc.data().presidentName || "غير محدد";
        document.getElementById("main-logo").src = doc.data().logoUrl || "";
        document.getElementById("svc-link-hidden").value = doc.data().servicesLink || "#";
    }
});

function showTab(t) {
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-'+t).style.display = 'block';
    if(t !== 'login') document.getElementById('btn-'+t).classList.add('active');
}

function toggleMember() {
    const isMember = document.getElementById('u-member-type').value === "عضو";
    document.getElementById('u-m-id').style.display = isMember ? 'block' : 'none';
}

async function submitRequest() {
    const d = {
        name: document.getElementById('u-name').value,
        nationalId: document.getElementById('u-nid').value,
        memberId: document.getElementById('u-m-id').value || "غير عضو",
        type: document.getElementById('u-type').value,
        phone: document.getElementById('u-phone').value,
        status: "تم الاستلام",
        refId: `${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: firebase.firestore.Timestamp.now(),
        tracking: [{stage: "تم الاستلام", comment: "تم استلام الطلب بنجاح", date: new Date().toLocaleString('ar-EG')}]
    };
    if(!d.name || d.nationalId.length < 14) return Swal.fire("خطأ", "برجاء استكمال البيانات", "error");
    await db.collection("Requests").add(d);
    Swal.fire("نجاح", `كود الطلب: ${d.refId}`, "success");
}

async function searchRequest() {
    const nid = document.getElementById('s-nid').value;
    const ref = document.getElementById('s-ref').value;
    const type = document.getElementById('s-type').value;

    const snap = await db.collection("Requests")
        .where("nationalId", "==", nid)
        .where("refId", "==", ref)
        .where("type", "==", type).get();

    if(snap.empty) return Swal.fire("عذراً", "لم يتم العثور على نتائج تطابق هذا النوع والرقم", "warning");
    
    const data = snap.docs[0].data();
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل والإغلاق"];
    const idx = stages.indexOf(data.status);

    document.getElementById('track-res').innerHTML = `
        <div class="water-track">
            <div class="track-line" style="position:absolute; width:100%; height:100%;"><div class="track-fill" style="width:${(idx/3)*100}%"></div></div>
            ${stages.map((s,i) => `<div class="node ${i<=idx?'active':''}" style="right:${(i/3)*100}%"><span>${s}</span></div>`).join('')}
        </div>
        <div style="background:rgba(255,255,255,0.05); padding:20px; border-radius:15px; margin-top:30px;">
            ${data.tracking.reverse().map(t => `<p><b>${t.stage}</b> - ${t.date}<br>${t.comment}</p><hr style="opacity:0.1; margin:10px 0;">`).join('')}
        </div>`;
}

function loginAdmin() {
    const u = document.getElementById('adm-u').value;
    const p = document.getElementById('adm-p').value;
    if(u === "admin" && p === "itws@manager@2026@") {
        sessionStorage.setItem("isAdmin", "true");
        window.location.replace("admin.html"); // تم التغيير من href لضمان عدم العودة للخلف
    } else {
        Swal.fire("خطأ", "بيانات الدخول غير صحيحة", "error");
    }
}
