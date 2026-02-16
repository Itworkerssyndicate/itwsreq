const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ... دوال التنقل (showTab, toggleMember) ...

async function submitRequest() {
    const refId = `${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    const data = {
        name: document.getElementById('u-name').value,
        nationalId: document.getElementById('u-nid').value,
        type: document.getElementById('u-type').value,
        status: "تم الاستلام",
        refId,
        createdAt: firebase.firestore.Timestamp.now(),
        tracking: [{ stage: "تم الاستلام", comment: "تم استلام الطلب وبدء الدورة المستندية", date: new Date().toLocaleString('ar-EG'), isFinal: false }]
    };
    await db.collection("Requests").add(data);
    Swal.fire("نجاح", `كود الطلب: ${refId}`, "success");
}

async function searchRequest() {
    const snap = await db.collection("Requests")
        .where("nationalId", "==", document.getElementById('s-nid').value)
        .where("refId", "==", document.getElementById('s-ref').value)
        .where("type", "==", document.getElementById('s-type').value).get();

    if(snap.empty) return Swal.fire("تنبيه", "لا توجد بيانات مطابقة", "warning");
    const d = snap.docs[0].data();
    
    // حساب مراحل التراك
    const stages = ["تم الاستلام", ...d.tracking.filter(t=>t.stage !== "تم الاستلام" && t.stage !== "إغلاق الطلب").map(t=>t.stage), "إغلاق الطلب"];
    const currentIdx = d.status === "تم الحل والإغلاق" ? stages.length - 1 : stages.indexOf(d.status);
    const progress = (currentIdx / (stages.length - 1)) * 100;

    document.getElementById('track-res').innerHTML = `
        <div class="water-container">
            <div class="water-fill" style="width: ${progress}%"></div>
            ${stages.map((s, i) => `
                <div class="track-node ${i <= currentIdx ? 'active' : ''}" style="right: ${(i/(stages.length-1))*100}%">
                    <span>${s}</span>
                </div>
            `).join('')}
        </div>
        <div class="timeline-list">
            <h4 style="margin-bottom:15px; color:var(--primary);">الحالة الحالية: ${d.status}</h4>
            ${d.tracking.slice().reverse().map(t => `
                <div class="timeline-item ${t.isFinal ? 'final' : ''}">
                    ${t.isFinal ? '<span class="final-badge">القرار النهائي</span>' : ''}
                    <small style="color:#64748b">${t.date}</small>
                    <p style="margin-top:5px;"><b>${t.stage}:</b> ${t.comment}</p>
                </div>
            `).join('')}
        </div>`;
}

function loginAdmin() {
    if(document.getElementById('adm-u').value === "admin" && document.getElementById('adm-p').value === "itws@manager@2026@") {
        sessionStorage.setItem("isAdmin", "true");
        window.location.replace("admin.html");
    }
}
