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

// منع السكرين شوت (تحذير)
document.addEventListener('keyup', (e) => {
    if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('');
        alert('ممنوع تصوير الشاشة حفاظاً على خصوصية البيانات');
    }
});

async function handleSubmit() {
    const refId = "REQ-" + Math.floor(100000 + Math.random() * 900000);
    const name = document.getElementById('u-name').value;
    const nid = document.getElementById('u-nid').value;

    if(!name || !nid) return Swal.fire("خطأ", "اكمل البيانات", "error");

    const data = {
        refId, name, nid,
        status: "تم الاستلام",
        createdAt: new Date(),
        tracking: [{status: "تم الاستلام", comment: "تم استلام الطلب", time: new Date().toLocaleString('ar-EG')}]
    };

    await db.collection("Requests").doc(refId).set(data);

    // توليد التذكرة
    document.getElementById('t-name').innerText = name;
    document.getElementById('t-nid').innerText = nid;
    document.getElementById('t-ref').innerText = refId;

    html2canvas(document.querySelector("#ticket-template")).then(canvas => {
        let link = document.createElement('a');
        link.download = `Ticket-${refId}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });

    Swal.fire("تم الإرسال", "تم حفظ تذكرة المراجعة في جهازك", "success");
}

function switchView(v) {
    document.querySelectorAll('.view').forEach(s => s.style.display='none');
    document.getElementById('view-'+v).style.display='block';
}

function adminLogin() {
    if(document.getElementById('adm-pass').value === 'itws@2026') {
        window.location.href = 'admin.html';
    }
}
