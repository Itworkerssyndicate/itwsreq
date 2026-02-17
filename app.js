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

// منع تصوير الشاشة
document.addEventListener('keyup', (e) => {
    if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p')) {
        navigator.clipboard.writeText('ممنوع النسخ');
        Swal.fire("تنبيه", "غير مسموح بتصوير الشاشة", "warning");
    }
});

function switchView(view, btn) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.querySelectorAll('.btn-nav').forEach(b => b.classList.remove('active'));
    document.getElementById('view-' + view).style.display = 'block';
    if(btn) btn.classList.add('active');
}

function toggleMemberField() {
    const type = document.getElementById('u-member-type').value;
    document.getElementById('member-id-box').style.display = (type === 'عضو نقابة') ? 'block' : 'none';
}

async function handleSubmit() {
    const refId = "REQ-" + Math.floor(100000 + Math.random() * 900000);
    const name = document.getElementById('u-name').value;
    const nid = document.getElementById('u-nid').value;

    if(!name || nid.length < 14) return Swal.fire("خطأ", "برجاء التأكد من الاسم والرقم القومي", "error");

    const data = {
        refId, name, nid,
        phone: document.getElementById('u-phone').value,
        gov: document.getElementById('u-gov').value,
        type: document.getElementById('u-req-type').value,
        status: "تم الاستلام",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        tracking: [{ status: "تم الاستلام", comment: "تم استلام طلبك", time: new Date().toLocaleString('ar-EG') }]
    };

    await db.collection("Requests").doc(refId).set(data);

    // تحميل التذكرة
    document.getElementById('t-name').innerText = name;
    document.getElementById('t-nid').innerText = nid;
    document.getElementById('t-ref').innerText = refId;
    
    html2canvas(document.querySelector("#ticket-template")).then(canvas => {
        let a = document.createElement('a');
        a.download = `Ticket-${refId}.png`;
        a.href = canvas.toDataURL();
        a.click();
    });

    Swal.fire("تم بنجاح", "تم حفظ التذكرة في جهازك", "success");
}

async function handleTrack() {
    const nid = document.getElementById('q-nid').value;
    const ref = document.getElementById('q-ref').value;

    db.collection("Requests").where("nid", "==", nid).where("refId", "==", ref).onSnapshot(snap => {
        if(snap.empty) return Swal.fire("خطأ", "بيانات غير صحيحة", "error");
        renderTrack(snap.docs[0].data());
    });
}

function renderTrack(d) {
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل"];
    const idx = stages.indexOf(d.status);
    let html = `
        <div class="card">
            <div class="track-bar">
                <div class="track-line"><div class="track-line-fill" style="width:${(idx/3)*100}%"></div></div>
                ${stages.map((s, i) => `
                    <div class="dot ${i <= idx ? 'active' : ''}">✓<div class="dot-label">${s}</div></div>
                `).join('')}
            </div>
            <div style="margin-top:40px">
                ${d.tracking.reverse().map(t => `<div style="padding:10px; border-right:2px solid var(--primary); margin-bottom:5px; background:rgba(255,255,255,0.05)">
                    <b>${t.status}</b><br><small>${t.comment}</small>
                </div>`).join('')}
            </div>
        </div>`;
    document.getElementById('track-result-box').innerHTML = html;
}

function adminLogin() {
    if(document.getElementById('adm-pass').value === 'itws@2026') {
        localStorage.setItem('admin', 'true');
        window.location.href = 'admin.html';
    }
}
