firebase.initializeApp({
    apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE",
    projectId: "itwsreq"
});
const db = firebase.firestore();
const role = sessionStorage.getItem("role");

if(!role) window.location.href = "index.html";

document.getElementById('role-badge').innerText = (role === 'super' ? 'الأدمن الرئيسي' : 'مدير نظام');

// 1. تبديل الشاشات
function showTab(type, btn) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    btn.classList.add('active');
    
    if(type === 'settings') {
        document.getElementById('table-container').style.display = 'none';
        document.getElementById('settings-view').style.display = 'block';
        loadSettings();
    } else {
        document.getElementById('table-container').style.display = 'block';
        document.getElementById('settings-view').style.display = 'none';
        loadRequests(type);
    }
}

// 2. تحميل البيانات
function loadRequests(type) {
    db.collection("Requests").where("type", "==", type).onSnapshot(snap => {
        let html = "";
        snap.forEach(doc => {
            const d = doc.data();
            html += `<tr class="animate__animated animate__fadeInUp">
                <td style="color: var(--primary); font-weight: bold;">${d.refId}</td>
                <td>${d.fullName}</td>
                <td><span style="color: ${d.status === 'تم' ? '#10b981' : '#0ea5e9'}">${d.status}</span></td>
                <td style="font-size: 0.8rem; color: #64748b;">${d.date}</td>
                <td>
                    <button class="btn-action btn-track" onclick="manageRequest('${doc.id}')">تتبع</button>
                    ${role === 'super' ? `<button class="btn-action btn-delete" onclick="deleteReq('${doc.id}')"><i class="fas fa-trash"></i></button>` : ''}
                </td>
            </tr>`;
        });
        document.getElementById('admin-table-body').innerHTML = html;
    });
}

// 3. نظام التتبع (Tracking System) في SweetAlert
async function manageRequest(id) {
    const doc = await db.collection("Requests").doc(id).get();
    const d = doc.data();
    
    let trackList = d.tracking.map(t => `
        <div style="text-align: right; border-right: 2px solid #0ea5e9; padding-right: 15px; margin-bottom: 10px;">
            <b style="color: #0ea5e9;">${t.stage}</b> <br>
            <small style="color: #94a3b8;">${t.comment} - ${t.date}</small>
        </div>
    `).join('');

    const { value: formValues } = await Swal.fire({
        title: 'إدارة مسار الطلب',
        html: `
            <div style="max-height: 200px; overflow-y: auto; margin-bottom: 20px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 10px;">
                ${trackList}
            </div>
            <input id="swal-stage" class="swal2-input" placeholder="اسم المرحلة الجديدة" style="font-family: Cairo; font-size: 0.9rem;">
            <textarea id="swal-comment" class="swal2-textarea" placeholder="ملاحظات للمرحلة السابقة" style="font-family: Cairo; font-size: 0.9rem;"></textarea>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'إضافة مرحلة',
        cancelButtonText: 'إغلاق الملف (تم)',
        cancelButtonColor: '#10b981',
        background: '#1e293b',
        color: '#fff',
        preConfirm: () => {
            return [
                document.getElementById('swal-stage').value,
                document.getElementById('swal-comment').value
            ]
        }
    });

    if (formValues && formValues[0]) {
        updateStage(id, formValues[0], formValues[1]);
    } else if (Swal.dismissReason === 'cancel') {
        // إذا ضغط على إغلاق الملف (تم)
        updateStage(id, "تم", "تمت معالجة الطلب بالكامل");
    }
}

async function updateStage(id, stage, comment) {
    const newStep = { stage, comment, date: new Date().toLocaleString('ar-EG') };
    await db.collection("Requests").doc(id).update({
        status: stage,
        tracking: firebase.firestore.FieldValue.arrayUnion(newStep)
    });
    Swal.fire({ icon: 'success', title: 'تم التحديث', background: '#1e293b', color: '#fff' });
}

// 4. إعدادات النظام
async function loadSettings() {
    const doc = await db.collection("SystemSettings").doc("mainConfig").get();
    if(doc.exists) {
        const d = doc.data();
        document.getElementById('set-union-name').value = d.unionName;
        document.getElementById('set-president-name').value = d.presidentName;
        document.getElementById('set-logo-url').value = d.logoURL;
    }
}

async function saveSettings() {
    await db.collection("SystemSettings").doc("mainConfig").set({
        unionName: document.getElementById('set-union-name').value,
        presidentName: document.getElementById('set-president-name').value,
        logoURL: document.getElementById('set-logo-url').value
    });
    Swal.fire({ icon: 'success', title: 'تم حفظ الإعدادات بنجاح', background: '#1e293b', color: '#fff' });
}

function deleteReq(id) {
    Swal.fire({
        title: 'هل أنت متأكد؟',
        text: "سيتم حذف السجل نهائياً!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'نعم، احذف!'
    }).then((result) => {
        if (result.isConfirmed) db.collection("Requests").doc(id).delete();
    });
}

function logout() { sessionStorage.clear(); window.location.href = "index.html"; }

loadRequests('complaint'); // البداية التلقائية
