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

function showTab(t, b) {
    document.querySelectorAll('section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(n => n.classList.remove('active'));
    document.getElementById('view-' + t).style.display = 'block';
    b.classList.add('active');
}

function toggleMemberLogic() {
    const isM = document.getElementById('u-member').value === 'عضو';
    document.getElementById('u-mid').style.display = isM ? 'block' : 'none';
    document.getElementById('opt-complaint').style.display = isM ? 'block' : 'none';
    if(!isM) document.getElementById('u-type').value = 'اقتراح';
}

async function appSubmit() {
    const rid = "REQ-" + Math.floor(100000 + Math.random() * 900000);
    const name = document.getElementById('u-name').value;
    const nid = document.getElementById('u-nid').value;
    
    if(!name || nid.length < 14) return Swal.fire("خطأ", "برجاء كتابة الاسم والرقم القومي بدقة", "error");

    const docData = {
        refId: rid, name, nid,
        phone: document.getElementById('u-phone').value,
        gov: document.getElementById('u-gov').value,
        job: document.getElementById('u-job').value,
        member: document.getElementById('u-member').value,
        mid: document.getElementById('u-mid').value || 'N/A',
        address: document.getElementById('u-address').value,
        type: document.getElementById('u-type').value,
        details: document.getElementById('u-details').value,
        status: "تم الاستلام",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        tracking: [{ s: "تم الاستلام", c: "تم استلام طلبك بنجاح", t: new Date().toLocaleString('ar-EG'), isFinal: false }]
    };

    await db.collection("Requests").doc(rid).set(docData);

    // تذكرة
    document.getElementById('t-name').innerText = name;
    document.getElementById('t-nid').innerText = nid;
    document.getElementById('t-ref').innerText = rid;
    html2canvas(document.getElementById('ticket-wrap')).then(canvas => {
        let a = document.createElement('a'); a.download = rid+".png"; a.href = canvas.toDataURL(); a.click();
    });

    Swal.fire("تم الإرسال", "تم حفظ تذكرة المراجعة بنجاح", "success");
}

function appTrack() {
    const nid = document.getElementById('q-nid').value;
    const rid = document.getElementById('q-ref').value;
    db.collection("Requests").where("nid", "==", nid).where("refId", "==", rid).onSnapshot(snap => {
        if(snap.empty) return Swal.fire("عذراً", "لا توجد بيانات مطابقة", "error");
        renderTrackView(snap.docs[0].data());
    });
}

function renderTrackView(d) {
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل"];
    const idx = stages.indexOf(d.status);
    
    let html = `
        <div class="card">
            <h3 style="text-align:center; color:var(--cyan); margin-bottom:15px;">${d.refId}</h3>
            <div class="timeline">
                <div class="timeline-line"><div class="timeline-progress" style="width:${(idx/3)*100}%"></div></div>
                ${stages.map((s, i) => `<div class="t-dot ${i<=idx?'active':''}">✓<div class="t-label">${s}</div></div>`).join('')}
            </div>
            <div style="margin-top:50px">
                ${d.tracking.reverse().map(t => `
                    <div class="track-card ${t.isFinal ? 'final-badge' : ''}">
                        <div style="display:flex; justify-content:space-between">
                            <b style="${t.isFinal?'color:var(--cyan)':''}">${t.isFinal?'⭐ قرار نهائي: ':''}${t.s}</b>
                            <small style="color:var(--muted)">${t.t}</small>
                        </div>
                        <p style="font-size:13px; margin-top:5px;">${t.c}</p>
                    </div>
                `).join('')}
            </div>
        </div>`;
    document.getElementById('track-render').innerHTML = html;
}

function appLogin() {
    if(document.getElementById('adm-user').value === 'admin' && document.getElementById('adm-pass').value === 'itws@2026') {
        localStorage.setItem('isAdmin', 'true'); window.location.href = 'admin.html';
    }
}
