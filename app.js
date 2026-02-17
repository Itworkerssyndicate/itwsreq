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

// حماية الشاشة
document.addEventListener('keyup', (e) => { if (e.key === 'PrintScreen') { Swal.fire("تنبيه", "ممنوع تصوير الشاشة", "warning"); } });

function changeTab(tab, btn) {
    document.querySelectorAll('section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById('view-' + tab).style.display = 'block';
    btn.classList.add('active');
}

function checkMemberType() {
    const isM = document.getElementById('u-member').value === 'عضو';
    document.getElementById('u-mid').style.display = isM ? 'block' : 'none';
}

async function processSubmit() {
    const rid = "REQ-" + Math.floor(100000 + Math.random() * 900000);
    const name = document.getElementById('u-name').value;
    const nid = document.getElementById('u-nid').value;

    if(!name || nid.length < 14) return Swal.fire("عذراً", "تأكد من الاسم والرقم القومي", "error");

    const data = {
        refId: rid, name, nid,
        phone: document.getElementById('u-phone').value,
        status: "تم الاستلام",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        tracking: [{ s: "تم الاستلام", c: "تم استلام طلبك بنجاح", t: new Date().toLocaleString('ar-EG') }]
    };

    await db.collection("Requests").doc(rid).set(data);

    // تصدير التذكرة كصورة
    document.getElementById('t-name').innerText = name;
    document.getElementById('t-nid').innerText = nid;
    document.getElementById('t-ref').innerText = rid;

    html2canvas(document.getElementById('ticket-capture')).then(canvas => {
        let link = document.createElement('a');
        link.download = rid + ".png";
        link.href = canvas.toDataURL();
        link.click();
    });

    Swal.fire("نجاح", "تم إرسال الطلب وحفظ التذكرة بجهازك", "success");
}

function processTrack() {
    const nid = document.getElementById('q-nid').value;
    const rid = document.getElementById('q-ref').value;

    db.collection("Requests").where("nid", "==", nid).where("refId", "==", rid).onSnapshot(snap => {
        if(snap.empty) return Swal.fire("خطأ", "البيانات غير صحيحة", "error");
        renderTrack(snap.docs[0].data());
    });
}

function renderTrack(d) {
    const steps = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل"];
    const curr = steps.indexOf(d.status);
    
    let html = `
        <div class="card">
            <h3 style="text-align:center; color:var(--accent); margin-bottom:20px;">${d.refId}</h3>
            <div class="stepper">
                <div class="step-line"><div class="step-fill" style="width:${(curr/3)*100}%"></div></div>
                ${steps.map((s, i) => `
                    <div class="step-dot ${i <= curr ? 'completed' : ''}">
                        ${i <= curr ? '✓' : ''}
                        <div class="step-label">${s}</div>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top:60px;">
                ${d.tracking.reverse().map(item => `
                    <div style="border-right:3px solid var(--accent); padding:12px; background:rgba(255,255,255,0.03); margin-bottom:12px; border-radius:0 10px 10px 0;">
                        <div style="display:flex; justify-content:space-between">
                            <b>${item.s}</b>
                            <small style="color:var(--text-muted)">${item.t}</small>
                        </div>
                        <p style="font-size:13px; color:var(--text-muted); margin-top:5px;">${item.c}</p>
                    </div>
                `).join('')}
            </div>
        </div>`;
    document.getElementById('track-result').innerHTML = html;
}

function tryAdmin() {
    if(document.getElementById('adm-pass').value === 'itws@2026') window.location.href = 'admin.html';
}
