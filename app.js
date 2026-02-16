// إعدادات Firebase
const firebaseConfig = { 
    apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", 
    projectId: "itwsreq" 
};

// تهيئة Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// دالة تحميل البيانات عند فتح الصفحة
function loadData(type) {
    const tbody = document.getElementById('tbody');
    if (!tbody) return;

    db.collection("Requests")
      .where("type", "==", type)
      .onSnapshot((snap) => {
        let h = "";
        snap.forEach((doc) => {
            const d = doc.data();
            const role = sessionStorage.getItem("role");
            
            h += `<tr>
                <td>${d.refId || ''}</td>
                <td>${d.name || ''}</td>
                <td>${d.timestamp || ''}</td>
                <td>
                    <button class="btn-view" onclick="openCard('${doc.id}')">عرض</button>
                    ${role === 'super' ? `<button class="btn-delete" onclick="deleteDoc('${doc.id}')">حذف</button>` : ''}
                </td>
            </tr>`;
        });
        tbody.innerHTML = h;
    });
}

// دالة فتح تفاصيل الطلب
async function openCard(id) {
    const doc = await db.collection("Requests").doc(id).get();
    if (!doc.exists) return;
    
    const d = doc.data();
    
    Swal.fire({
        title: 'تفاصيل الطلب',
        background: '#0a1120',
        color: '#fff',
        html: `
            <div style="text-align:right; direction:rtl;">
                <p><b>الاسم:</b> ${d.name}</p>
                <p><b>القومي:</b> ${d.nationalId}</p>
                <p><b>الموضوع:</b> ${d.details}</p>
                <hr>
                <label>تحديث الحالة:</label>
                <select id="sw-status" class="swal2-input" style="color:#000">
                    <option value="تم الاستلام">تم الاستلام</option>
                    <option value="قيد المراجعة">قيد المراجعة</option>
                    <option value="جاري التنفيذ">جاري التنفيذ</option>
                    <option value="تم الحل">تم الحل</option>
                </select>
            </div>`,
        confirmButtonText: 'تحديث',
        showCancelButton: true,
        cancelButtonText: 'إغلاق'
    }).then((r) => {
        if (r.isConfirmed) {
            const newStatus = document.getElementById('sw-status').value;
            updateStage(id, newStatus);
        }
    });
}

// دالة حذف الطلب
async function deleteDoc(id) {
    const { value: pass } = await Swal.fire({
        title: 'كلمة السر',
        input: 'password',
        inputPlaceholder: 'أدخل كلمة سر الحذف'
    });

    if (pass === '11111@') {
        await db.collection("Requests").doc(id).delete();
        Swal.fire("تم الحذف", "", "success");
    } else if (pass) {
        Swal.fire("خطأ", "كلمة السر غير صحيحة", "error");
    }
}

// دالة تحديث الحالة
async function updateStage(id, status) {
    await db.collection("Requests").doc(id).update({ 
        status: status,
        lastUpdate: new Date().toLocaleString('ar-EG')
    });
    Swal.fire("تم التحديث", "", "success");
}

// تشغيل جلب البيانات الافتراضي (الشكاوى)
if (document.getElementById('tbody')) {
    loadData('complaint');
}
