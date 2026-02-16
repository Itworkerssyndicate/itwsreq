const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

window.onload = async () => {
    const doc = await db.collection("SystemSettings").doc("mainConfig").get();
    document.getElementById("pres-display").innerText = doc.exists ? doc.data().presidentName : "نقابة تكنولوجيا المعلومات";
};

async function submitRequest() {
    const n = document.getElementById('u-name').value, nid = document.getElementById('u-nid').value;
    if(!n || nid.length != 14) return Swal.fire("خطأ","يرجى إدخال البيانات كاملة","error");

    const now = new Date();
    const refId = `${now.getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    const d = {
        name: n, nationalId: nid, phone: document.getElementById('u-phone').value,
        gov: document.getElementById('u-gov').value, address: document.getElementById('u-address').value,
        details: document.getElementById('u-details').value, type: document.getElementById('u-type').value,
        status: "تم الاستلام", refId: refId,
        createdAt: firebase.firestore.Timestamp.now(),
        dateStr: now.toLocaleString('ar-EG'),
        tracking: [{stage: "تم الاستلام", comment: "تم استلام الطلب بنجاح", date: now.toLocaleString('ar-EG')}]
    };

    await db.collection("Requests").add(d);
    document.getElementById('card-ref').innerText = refId;
    document.getElementById('card-name').innerText = n;
    document.getElementById('card-date').innerText = d.dateStr;
    Swal.fire("تم التسجيل",`كودك هو: ${refId}`,"success").then(() => downloadCard());
}

function downloadCard() {
    html2canvas(document.getElementById('download-card')).then(canvas => {
        const a = document.createElement('a'); a.download = 'Receipt.png'; a.href = canvas.toDataURL(); a.click();
    });
}

async function searchRequest() {
    const ref = document.getElementById('s-ref').value, nid = document.getElementById('s-nid').value;
    const snap = await db.collection("Requests").where("refId","==",ref).where("nationalId","==",nid).get();
    if(snap.empty) return Swal.fire("عذراً","لم يتم العثور على الطلب","error");
    renderTracking(snap.docs[0].data(), 'track-res');
}

function renderTracking(data, targetId) {
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل"];
    let idx = stages.indexOf(data.status);
    if(idx == -1) idx = 1; if(data.status == "تم الحل") idx = 3;

    let h = `<div class="progress-container"><div class="progress-line"></div><div class="progress-fill" style="width:${(idx/3)*100}%"></div>
        ${stages.map((s,i)=>`<div class="step-node ${i<=idx?'active':''}"><i class="fas fa-check"></i><span>${s}</span></div>`).join('')}</div>`;
    h += data.tracking.map(t=>`<div class="log-card"><b>${t.stage}</b><br>${t.comment}<br><small>${t.date}</small></div>`).reverse().join('');
    document.getElementById(targetId).innerHTML = h;
}

function loginAdmin() {
    const p = document.getElementById('adm-p').value;
    if(p === "itws@manager@2026@" || p === "itws@super@2026@") {
        sessionStorage.setItem("isAdmin", "true"); window.location.href="admin.html";
    } else Swal.fire("خطأ","الباسورد غير صحيح","error");
}
