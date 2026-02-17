// ... Firebase Config (نفسه) ...
const db = firebase.firestore();

function showSec(s) {
    document.getElementById('sec-list').style.display = s==='list'?'block':'none';
    document.getElementById('sec-config').style.display = s==='config'?'block':'none';
}

function loadData() {
    db.collection("Requests").orderBy("createdAt", "desc").onSnapshot(snap => {
        let h = "";
        snap.forEach(doc => {
            const d = doc.data();
            h += `<tr>
                <td>${d.name}</td>
                <td>${d.refId}</td>
                <td>${d.status}</td>
                <td><button onclick="manage('${d.refId}')">إدارة</button></td>
            </tr>`;
        });
        document.getElementById('admin-tbody').innerHTML = h;
    });
}

async function saveSettings() {
    const n = document.getElementById('set-name').value;
    await db.collection("Settings").doc("general").set({presName: n}, {merge:true});
    alert("تم التحديث");
}

loadData();
