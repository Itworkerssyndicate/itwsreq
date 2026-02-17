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

// التبديل بين الشاشات
function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.querySelectorAll('.btn-nav').forEach(b => b.classList.remove('active'));
    document.getElementById('view-' + view).style.display = 'block';
    const activeBtn = [...document.querySelectorAll('.btn-nav')].find(b => b.innerText.includes(view === 'submit' ? 'تقديم' : 'استعلام'));
    if(activeBtn) activeBtn.classList.add('active');
}

// التحكم في حقول العضوية
function toggleMemberField() {
    const type = document.getElementById('u-member-type').value;
    const mBox = document.getElementById('member-id-box');
    const typeSelect = document.getElementById('u-req-type');
    
    if(type === 'عضو نقابة') {
        mBox.style.display = 'block';
        typeSelect.innerHTML = '<option value="شكوى">شكوى</option><option value="اقتراح">اقتراح</option>';
    } else {
        mBox.style.display = 'none';
        typeSelect.innerHTML = '<option value="اقتراح">اقتراح فقط</option>';
    }
}

// تقديم الطلب
async function handleSubmit() {
    const refId = "REQ-" + Date.now().toString().slice(-10);
    const data = {
        refId,
        name: document.getElementById('u-name').value,
        nid: document.getElementById('u-nid').value,
        phone: document.getElementById('u-phone').value,
        gov: document.getElementById('u-gov').value,
        job: document.getElementById('u-job').value,
        type: document.getElementById('u-req-type').value,
        details: document.getElementById('u-details').value,
        memberId: document.getElementById('u-member-id').value || "غير عضو",
        status: "تم الاستلام",
        createdAt: new Date(),
        tracking: [{
            status: "تم الاستلام",
            comment: "تم استلام طلبك بنجاح وجاري العرض على الإدارة",
            time: new Date().toLocaleString('ar-EG'),
            isFinal: false
        }]
    };

    if(!data.name || !data.nid) return Swal.fire("خطأ", "برجاء ملء البيانات الأساسية", "error");

    await db.collection("Requests").doc(refId).set(data);
    Swal.fire("تم بنجاح", `كود الطلب: ${refId}`, "success");
}

// الاستعلام
async function handleTrack() {
    const nid = document.getElementById('q-nid').value;
    const ref = document.getElementById('q-ref').value;
    const type = document.getElementById('q-type').value;

    const snap = await db.collection("Requests")
        .where("nid", "==", nid)
        .where("refId", "==", ref)
        .where("type", "==", type).get();

    if(snap.empty) return Swal.fire("عذراً", "لا يوجد طلب بهذه البيانات", "error");
    
    renderTrack(snap.docs[0].data());
}

function renderTrack(d) {
    const stages = ["تم الاستلام", "قيد المراجعة", "جاري التنفيذ", "تم الحل"];
    const currentIdx = stages.indexOf(d.status);
    const pct = (currentIdx / (stages.length - 1)) * 100;

    let html = `
        <div class="card">
            <h4 style="color:var(--primary); text-align:center;">${d.refId}</h4>
            <div class="track-bar">
                <div class="track-line"><div class="track-line-fill" style="width:${pct}%"></div></div>
                ${stages.map((s, i) => `
                    <div class="dot ${i <= currentIdx ? 'active' : ''}">
                        ${i <= currentIdx ? '✓' : ''}
                        <div class="dot-label">${s}</div>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top:50px;">
                ${d.tracking.slice().reverse().map(t => `
                    <div class="timeline-card ${t.isFinal ? 'final' : ''}">
                        <div class="timeline-header">
                            <h4>${t.status}</h4>
                            <span>${t.time}</span>
                        </div>
                        <p style="font-size:13px;">${t.comment}</p>
                    </div>
                `).join('')}
            </div>
        </div>`;
    
    document.getElementById('track-result-box').innerHTML = html;
    document.getElementById('track-result-box').style.display = 'block';
}

function adminLogin() {
    if(document.getElementById('adm-user').value === 'admin' && document.getElementById('adm-pass').value === 'itws@2026') {
        localStorage.setItem('admin', 'true');
        window.location.href = 'admin.html';
    } else {
        Swal.fire("خطأ", "بيانات الدخول خاطئة", "error");
    }
}
