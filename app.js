const firebaseConfig = {
    apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE",
    authDomain: "itwsreq.firebaseapp.com",
    projectId: "itwsreq",
    storageBucket: "itwsreq.firebasestorage.app",
    messagingSenderId: "417900842360",
    appId: "1:417900842360:web:83d9310f36fef5bbbe4c8d"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// التنقل بين الشاشات
function showView(v, btn) {
    document.querySelectorAll('.view-content').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('view-' + v).style.display = 'block';
    if(btn) btn.classList.add('active');
}

function toggleMember() {
    const isMember = document.getElementById('u-member').value === 'عضو';
    document.getElementById('u-mid').style.display = isMember ? 'block' : 'none';
}

// إرسال الطلب وحفظ التذكرة
async function submitRequest() {
    const refId = "REQ-" + Math.floor(100000 + Math.random() * 900000);
    const name = document.getElementById('u-name').value;
    const nid = document.getElementById('u-nid').value;

    if(!name || nid.length < 14) return Swal.fire("خطأ", "برجاء كتابة الاسم والرقم القومي بدقة", "error");

    const data = {
        refId, name, nid,
        phone: document.getElementById('u-phone').value,
        gov: document.getElementById('u-gov').value,
        status: "تم الاستلام",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        tracking: [{ status: "تم الاستلام", comment: "تم استلام الطلب بنجاح", time: new Date().toLocaleString('ar-EG') }]
    };

    await db.collection("Requests").doc(refId).set(data);

    // توليد الصورة
    document.getElementById('t-name').innerText = name;
    document.getElementById('t-nid').innerText = nid;
    document.getElementById('t-ref').innerText = refId;

    html2canvas(document.querySelector("#ticket-wrap")).then(canvas => {
        let a = document.createElement('a');
        a.download = `Ticket-${refId}.png`;
        a.href = canvas.toDataURL();
        a.click();
    });

    Swal.fire("تم الإرسال", "تم حفظ تذكرة المراجعة في جهازك بنجاح", "success");
}

// الاستعلام عن الطلب (مع ظهور الداتا فوراً)
async function trackRequest() {
    const nid = document.getElementById('q-nid').value;
    const ref = document.getElementById('q-ref').value;

    db.collection("Requests").where("nid", "==", nid).where("refId", "==", ref).onSnapshot(snap => {
        if(snap.empty) return Swal.fire("عذراً", "لا توجد بيانات مطابقة", "error");
        renderTrackUI(snap.docs[0].data());
    });
}

function renderTrackUI(d) {
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل"];
    const idx = stages.indexOf(d.status);
    
    let html = `
        <div class="glass-card">
            <h4 style="text-align:center; color:var(--primary)">${d.refId}</h4>
            <div class="water-track">
                <div class="track-line"><div class="track-fill" style="width:${(idx/3)*100}%"></div></div>
                ${stages.map((s, i) => `
                    <div class="step-dot ${i <= idx ? 'active' : ''}">
                        ${i <= idx ? '✓' : ''}
                        <div class="step-label">${s}</div>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top:50px;">
                ${d.tracking.slice().reverse().map(t => `
                    <div style="border-right:3px solid var(--primary); padding:10px; background:rgba(255,255,255,0.05); margin-bottom:10px;">
                        <b>${t.status}</b> <small style="float:left">${t.time}</small>
                        <p style="font-size:13px; color:#94a3b8">${t.comment}</p>
                    </div>
                `).join('')}
            </div>
        </div>`;
    document.getElementById('result-display').innerHTML = html;
}

function loginAdmin() {
    if(document.getElementById('adm-pass').value === 'itws@2026') {
        localStorage.setItem('isAdm', 'true');
        window.location.href = 'admin.html';
    }
}
