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

function switchSection(id, btn) {
    document.querySelectorAll('.app-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('sec-' + id).style.display = 'block';
    btn.classList.add('active');
}

function toggleMemberID() {
    const isMember = document.getElementById('u-member').value === 'عضو';
    document.getElementById('u-mid').style.display = isMember ? 'block' : 'none';
}

async function submitNewRequest() {
    const refID = "REQ-" + Math.floor(100000 + Math.random() * 900000);
    const name = document.getElementById('u-name').value;
    const nid = document.getElementById('u-nid').value;

    if(!name || nid.length < 14) return Swal.fire("خطأ", "برجاء استكمال البيانات بدقة", "error");

    const reqData = {
        refId: refID, name, nid,
        status: "تم الاستلام",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        tracking: [{ s: "تم الاستلام", c: "تم استلام طلبك بنجاح", t: new Date().toLocaleString('ar-EG') }]
    };

    await db.collection("Requests").doc(refID).set(reqData);

    // تذكرة الصورة
    document.getElementById('t-name').innerText = name;
    document.getElementById('t-nid').innerText = nid;
    document.getElementById('t-ref').innerText = refID;

    html2canvas(document.getElementById('ticket-box')).then(canvas => {
        let a = document.createElement('a');
        a.download = refID + ".png";
        a.href = canvas.toDataURL();
        a.click();
    });

    Swal.fire("تم الإرسال", "تم حفظ تذكرة المراجعة في معرض الصور", "success");
}

function trackExistingRequest() {
    const nid = document.getElementById('q-nid').value;
    const rid = document.getElementById('q-ref').value;

    db.collection("Requests").where("nid", "==", nid).where("refId", "==", rid).onSnapshot(snap => {
        if(snap.empty) return Swal.fire("خطأ", "لا توجد بيانات مطابقة", "error");
        renderTrackResult(snap.docs[0].data());
    });
}

function renderTrackResult(d) {
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل"];
    const current = stages.indexOf(d.status);
    
    let html = `
        <div class="content-card">
            <h3 style="text-align:center; color:var(--primary); margin-bottom:15px;">${d.refId}</h3>
            <div class="timeline-container">
                <div class="timeline-line"><div class="timeline-fill" style="width:${(current/3)*100}%"></div></div>
                ${stages.map((s, i) => `
                    <div class="step-circle ${i <= current ? 'active' : ''}">
                        ${i <= current ? '✓' : ''}
                        <div class="step-name">${s}</div>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top:55px;">
                ${d.tracking.reverse().map(item => `
                    <div style="border-right:3px solid var(--accent); padding:10px; background:rgba(255,255,255,0.03); margin-bottom:10px; border-radius:0 8px 8px 0;">
                        <div style="display:flex; justify-content:space-between; font-size:13px;">
                            <b>${item.s}</b> <small style="color:#94a3b8">${item.t}</small>
                        </div>
                        <p style="font-size:12px; color:#94a3b8; margin-top:5px;">${item.c}</p>
                    </div>
                `).join('')}
            </div>
        </div>`;
    document.getElementById('track-display-area').innerHTML = html;
}

function loginToAdmin() {
    if(document.getElementById('adm-pass').value === 'itws@2026') window.location.href = 'admin.html';
}
