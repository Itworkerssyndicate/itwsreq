const firebaseConfig = { apiKey: "AIzaSyC71PVDTouBkQ4hRTANelbwRo4AYI6LwnE", projectId: "itwsreq" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function loadView(type) {
    db.collection("Requests").orderBy("createdAt", "desc").onSnapshot(snap => {
        let h = "";
        snap.forEach(doc => {
            const d = doc.data();
            if(type === 'all' || d.type === type) {
                h += `<tr>
                    <td>${d.createdAt?.toDate().toLocaleDateString('ar-EG')}</td>
                    <td>${d.refId}</td>
                    <td>${d.name}</td>
                    <td><span class="btn-glam" style="padding:4px 10px; font-size:12px;">${d.status}</span></td>
                    <td>
                        <button class="btn-glam" onclick="manage('${doc.id}')">تحديث</button>
                        <button class="btn-glam btn-danger" onclick="del('${doc.id}')">حذف</button>
                    </td>
                </tr>`;
            }
        });
        document.getElementById('tbody').innerHTML = h;
    });
}

async function manage(id) {
    const { value: formValues } = await Swal.fire({
        title: 'تحديث الطلب',
        html: `
            <input id="sw-stage" class="swal2-input" placeholder="اسم المرحلة الجديدة">
            <textarea id="sw-comm" class="swal2-textarea" placeholder="التعليق أو القرار"></textarea>
            <div style="margin-top:10px">
                <input type="checkbox" id="sw-final"> <label for="sw-final">إغلاق الطلب بقرار نهائي؟</label>
            </div>`,
        showCancelButton: true,
        confirmButtonText: 'حفظ التحديث'
    });

    if (formValues) {
        const stage = document.getElementById('sw-stage').value;
        const comm = document.getElementById('sw-comm').value;
        const isFinal = document.getElementById('sw-final').checked;
        
        const updateData = {
            status: isFinal ? "تم الحل والإغلاق" : stage,
            tracking: firebase.firestore.FieldValue.arrayUnion({
                stage: isFinal ? "إغلاق الطلب" : stage,
                comment: comm,
                date: new Date().toLocaleString('ar-EG'),
                isFinal: isFinal
            })
        };
        await db.collection("Requests").doc(id).update(updateData);
    }
}
// ... دالة الحذف ...
loadView('all');
