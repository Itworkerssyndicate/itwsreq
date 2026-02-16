// ... (بيانات Firebase Config الخاصة بك هنا) ...

function openTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

async function createNewRequest() {
    const refId = `2026/${Math.floor(1000 + Math.random() * 9000)}`;
    const data = {
        name: document.getElementById('u-name').value,
        nationalId: document.getElementById('u-nid').value,
        phone: document.getElementById('u-phone').value,
        address: document.getElementById('u-address').value,
        type: document.getElementById('u-type').value,
        status: "استلام الطلب",
        refId: refId,
        createdAt: firebase.firestore.Timestamp.now(),
        tracking: [{ stage: "استلام الطلب", comment: "تم استلام الطلب بنجاح", date: new Date().toLocaleString('ar-EG'), isFinal: false }]
    };
    if(!data.name || !data.nationalId) return Swal.fire("خطأ", "برجاء ملء البيانات الأساسية", "error");
    await db.collection("Requests").add(data);
    Swal.fire("تم الإرسال", `رقم طلبك هو: ${refId}`, "success");
}

async function startTracking() {
    const res = await db.collection("Requests")
        .where("nationalId", "==", document.getElementById('s-nid').value)
        .where("refId", "==", document.getElementById('s-ref').value)
        .where("type", "==", document.getElementById('s-type').value).get();

    if(res.empty) return Swal.fire("لا يوجد", "تأكد من البيانات والنوع", "warning");
    const d = res.docs[0].data();
    showVisualTrack(d);
}

function showVisualTrack(d) {
    const stages = ["استلام الطلب", "ارسال الطلب", "اغلاق الطلب"];
    const current = d.status === "اغلاق الطلب" ? 2 : (d.status === "استلام الطلب" ? 0 : 1);
    const progress = (current / 2) * 100;

    document.getElementById('result-area').innerHTML = `
        <div class="water-container">
            <div class="water-fill" style="width: ${progress}%"></div>
            ${stages.map((s,i) => `<div class="node ${i<=current?'active':''}" style="right:${(i/2)*100}%"><span class="node-text">${s}</span></div>`).join('')}
        </div>
        <div class="history-list">
            ${d.tracking.slice().reverse().map(t => `
                <div class="history-item ${t.isFinal ? 'final' : ''}">
                    ${t.isFinal ? '<b style="color:#00ff88">🏁 قرار نهائي:</b>' : ''}
                    <small>${t.date}</small>
                    <p><b>${t.stage}:</b> ${t.comment}</p>
                </div>
            `).join('')}
        </div>`;
}

function handleLogin() {
    if(document.getElementById('adm-u').value === "admin" && document.getElementById('adm-p').value === "itws@manager@2026@") {
        sessionStorage.setItem("isAdmin", "true");
        window.location.href = "admin.html";
    } else {
        Swal.fire("خطأ", "بيانات الدخول خاطئة", "error");
    }
}
