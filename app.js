const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

db.collection("SystemSettings").doc("mainConfig").onSnapshot(doc => {
    if(doc.exists) {
        document.getElementById("pres-display").innerText = doc.data().presidentName || "---";
        document.getElementById("main-logo").src = doc.data().logoUrl || "";
        document.getElementById("svc-link").onclick = () => window.open(doc.data().servicesLink, '_blank');
    }
});

function toggleMemberFields() {
    const isMember = document.getElementById('u-member-type').value === "عضو";
    document.getElementById('u-m-id').style.display = isMember ? 'block' : 'none';
    if(!isMember) {
        document.getElementById('u-type').value = "اقتراح";
        document.getElementById('u-type').disabled = true;
    } else { document.getElementById('u-type').disabled = false; }
}

function showTab(t){
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-'+t).style.display = 'block';
    if(t!=='login') document.getElementById('t-'+t).classList.add('active');
}

async function submitRequest() {
    const data = {
        name: document.getElementById('u-name').value,
        nationalId: document.getElementById('u-nid').value,
        memberId: document.getElementById('u-m-id').value || "غير عضو",
        isMember: document.getElementById('u-member-type').value,
        phone: document.getElementById('u-phone').value,
        gov: document.getElementById('u-gov').value,
        job: document.getElementById('u-job').value,
        address: document.getElementById('u-address').value,
        type: document.getElementById('u-type').value,
        details: document.getElementById('u-details').value,
        status: "تم الاستلام",
        refId: `${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: firebase.firestore.Timestamp.now(),
        tracking: [{stage: "تم الاستلام", comment: "تم استلام الطلب بنجاح", date: new Date().toLocaleString('ar-EG')}]
    };
    if(!data.name || data.nationalId.length < 14) return Swal.fire("تنبيه", "برجاء استكمال البيانات", "warning");
    await db.collection("Requests").add(data);
    Swal.fire("نجاح", `كود الطلب: ${data.refId}`, "success");
}

async function searchRequest() {
    const snap = await db.collection("Requests")
        .where("nationalId", "==", document.getElementById('s-nid').value)
        .where("refId", "==", document.getElementById('s-ref').value).get();

    if(snap.empty) return Swal.fire("خطأ", "لا توجد بيانات", "error");
    const d = snap.docs[0].data();
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل والإغلاق"];
    const idx = stages.indexOf(d.status);

    document.getElementById('track-res').innerHTML = `
        <div class="water-track">
            <div class="track-line"><div class="track-fill" style="width:${(idx/3)*100}%"></div></div>
            ${stages.map((s,i)=>`<div class="node ${i<=idx?'active':''}" style="right:${(i/3)*100}%"><span>${s}</span></div>`).join('')}
        </div>
        <div class="logs">
            ${d.tracking.map(t=>`<div class="log-card"><b>${t.stage}</b> - ${t.date}<p>${t.comment}</p></div>`).reverse().join('')}
        </div>`;
}

function loginAdmin() {
    if(document.getElementById('adm-u').value === "admin" && document.getElementById('adm-p').value === "itws@manager@2026@") {
        sessionStorage.setItem("isAdmin", "true");
        window.location.href = "admin.html";
    } else Swal.fire("خطأ", "بيانات خاطئة", "error");
}
