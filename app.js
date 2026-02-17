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

function showTab(t, btn) {
    document.querySelectorAll('section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + t).style.display = 'block';
    btn.classList.add('active');
}

function toggleForm() {
    const isMember = document.getElementById('u-member').value === 'عضو';
    document.getElementById('u-mid').style.display = isMember ? 'block' : 'none';
    document.getElementById('opt-complaint').style.display = isMember ? 'block' : 'none';
    if(!isMember) document.getElementById('u-type').value = 'اقتراح';
}

async function handleSubmit() {
    const rid = "REQ-" + Math.floor(100000 + Math.random() * 900000);
    const name = document.getElementById('u-name').value;
    const nid = document.getElementById('u-nid').value;
    
    if(!name || nid.length < 14) return Swal.fire("خطأ", "برجاء استكمال البيانات", "error");

    const data = {
        refId: rid, name: name, nid: nid,
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
        tracking: [{ s: "تم الاستلام", c: "تم استلام طلبك بنجاح", t: new Date().toLocaleString('ar-EG'), final: false }]
    };

    await db.collection("Requests").doc(rid).set(data);

    // تحميل التذكرة
    document.getElementById('t-name').innerText = name;
    document.getElementById('t-nid').innerText = nid;
    document.getElementById('t-ref').innerText = rid;
    html2canvas(document.querySelector("#ticket-template")).then(canvas => {
        let a = document.createElement('a'); a.download = rid+".png"; a.href = canvas.toDataURL(); a.click();
    });

    Swal.fire("تم بنجاح", "تم حفظ تذكرة المراجعة في جهازك", "success");
}

function handleTrack() {
    const nid = document.getElementById('q-nid').value;
    const rid = document.getElementById('q-ref').value;
    db.collection("Requests").where("nid","==",nid).where("refId","==",rid).onSnapshot(snap => {
        if(snap.empty) return Swal.fire("خطأ", "بيانات غير مطابقة", "error");
        renderTrack(snap.docs[0].data());
    });
}

function renderTrack(d) {
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل"];
    const idx = stages.indexOf(d.status);
    let html = `
        <div class="card">
            <h3 style="text-align:center; color:var(--primary)">${d.refId}</h3>
            <div class="water-track">
                <div class="track-line"><div class="track-fill" style="width:${(idx/3)*100}%"></div></div>
                ${stages.map((s, i) => `<div class="dot ${i<=idx?'active':''}">✓<div class="dot-label">${s}</div></div>`).join('')}
            </div>
            <div style="margin-top:50px">
                ${d.tracking.reverse().map(t => `
                    <div class="${t.final ? 'final-decision' : ''}" style="border-right:3px solid var(--primary); padding:10px; margin-bottom:10px; background:rgba(255,255,255,0.02)">
                        ${t.final ? '⭐ <b>قرار نهائي:</b>' : ''} <b>${t.s}</b>
                        <p style="font-size:12px; color:var(--muted)">${t.c}</p>
                        <small style="font-size:10px">${t.t}</small>
                    </div>
                `).join('')}
            </div>
        </div>`;
    document.getElementById('track-result').innerHTML = html;
}

function adminLogin() {
    if(document.getElementById('adm-user').value === 'admin' && document.getElementById('adm-pass').value === 'itws@2026') {
        localStorage.setItem('isAdm', 'true');
        window.location.href = 'admin.html';
    }
}
