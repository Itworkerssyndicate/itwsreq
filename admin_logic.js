// نفس الـ config الخاص بك
firebase.initializeApp({apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq"});
const db = firebase.firestore();
const role = sessionStorage.getItem("role");
let currentDocId = null;

function loadData(type) {
    document.getElementById('del-header').style.display = (role == 'super' ? 'table-cell' : 'none');
    db.collection("Requests").where("type", "==", type).onSnapshot(snap => {
        let html = "";
        snap.forEach(doc => {
            const d = doc.data();
            html += `<tr>
                <td>${d.refId}</td>
                <td>${d.fullName}</td>
                <td><span class="status-pill" style="background:${d.status=='تم'?'#10b981':'#3b82f6'}">${d.status}</span></td>
                <td><button onclick="openTrack('${doc.id}')">إدارة</button></td>
                ${role == 'super' ? `<td><button class="del-btn" onclick="deleteDoc('${doc.id}')"><i class="fas fa-trash"></i></button></td>` : ''}
            </tr>`;
        });
        document.getElementById("table-body").innerHTML = html;
    });
}

function openTrack(id) {
    currentDocId = id;
    db.collection("Requests").doc(id).get().then(doc => {
        const d = doc.data();
        document.getElementById('modal-title').innerText = "تتبع: " + d.refId;
        let listHtml = "";
        d.tracking.forEach((step, index) => {
            const isLast = index === d.tracking.length - 1;
            listHtml += `<div style="margin-bottom:15px;">
                <i class="fas ${isLast ? 'fa-spinner fa-spin' : 'fa-check-circle'}" style="color:${isLast?'#0ea5e9':'#10b981'}"></i>
                <b>${step.stage}</b> <small>(${step.date})</small><br>
                <span style="color:#94a3b8; font-size:0.8rem">${step.comment || ''}</span>
            </div>`;
        });
        document.getElementById('track-list').innerHTML = listHtml;
        document.getElementById('track-modal').style.display = 'flex';
    });
}

async function addStage() {
    const stage = document.getElementById('new-stage').value;
    const comment = document.getElementById('stage-comment').value;
    if(!stage) return;

    const newStep = { stage, comment, date: new Date().toLocaleString('ar-EG') };
    await db.collection("Requests").doc(currentDocId).update({
        status: stage,
        tracking: firebase.firestore.FieldValue.arrayUnion(newStep)
    });
    openTrack(currentDocId);
}

async function markDone() {
    await db.collection("Requests").doc(currentDocId).update({
        status: "تم",
        tracking: firebase.firestore.FieldValue.arrayUnion({ stage: "تم", comment: "تم إغلاق الطلب بنجاح", date: new Date().toLocaleString('ar-EG') })
    });
    closeModal();
}

function closeModal() { document.getElementById('track-modal').style.display = 'none'; }
function deleteDoc(id) { if(confirm("حذف نهائي؟")) db.collection("Requests").doc(id).delete(); }

loadData('complaint'); // البداية بالشكاوى
