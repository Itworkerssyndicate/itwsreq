// ... Firebase Config (نفسه) ...
const db = firebase.firestore();

function showSec(s, btn) {
    document.getElementById('sec-list').style.display = s==='list'?'block':'none';
    document.getElementById('sec-config').style.display = s==='config'?'block':'none';
    document.querySelectorAll('aside .btn-nav').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function loadData() {
    // استخدام onSnapshot لضمان ظهور الداتا فوراً
    db.collection("Requests").orderBy("createdAt", "desc").onSnapshot(snap => {
        let h = "";
        snap.forEach(doc => {
            const d = doc.data();
            h += `<tr style="border-bottom:1px solid var(--border)">
                <td style="padding:10px">${d.createdAt?.toDate().toLocaleDateString('ar-EG') || '--'}</td>
                <td>${d.name}</td>
                <td><span style="color:var(--primary)">${d.status}</span></td>
                <td><button onclick="manage('${d.refId}')" style="cursor:pointer">⚙️ إدارة</button></td>
            </tr>`;
        });
        document.getElementById('admin-tbody').innerHTML = h;
    });
}

async function saveSettings() {
    const pres = document.getElementById('set-pres').value;
    const logo = document.getElementById('set-logo').value;
    await db.collection("Settings").doc("general").set({presName: pres, logoUrl: logo}, {merge:true});
    alert("تم التحديث");
}

loadData();
